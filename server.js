const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.text({ type: "*/*", limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));

// Prueba rápida del servidor
app.get("/", (req, res) => {
  res.send("🚗 Servidor activo: Carsimulcast to PDF");
});

// Conversión HTML -> PDF
app.post("/carsimulcast-to-pdf", async (req, res) => {
  console.log("🚀 Iniciando conversión...");

  try {
    let html = req.body;

    if (typeof html === "object") {
      html = html.data || html.html || "";
    }

    // Intentar decodificar base64 si aplica
    if (typeof html === "string") {
      if (html.startsWith("data:text/html;base64,")) {
        html = Buffer.from(html.split(",")[1], "base64").toString("utf-8");
      } else if (/^[A-Za-z0-9+/=]+$/.test(html)) {
        try {
          html = Buffer.from(html, "base64").toString("utf-8");
          console.log("✅ Base64 decodificado");
        } catch (err) {
          console.warn("⚠️ No se pudo decodificar base64. Usando texto plano.");
        }
      }
    }

    if (!html || html.length < 100) {
      throw new Error("Contenido HTML vacío o muy corto");
    }

    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.CHROMIUM_PATH,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-web-security",
        "--allow-running-insecure-content",
        "--ignore-certificate-errors"
      ]
    });

    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 90000
    });

    const imageStats = await page.evaluate(async () => {
      const imgs = [...document.querySelectorAll("img")];
      const checks = imgs.map(img =>
        new Promise((res) => {
          if (img.complete && img.naturalHeight !== 0) return res(true);
          const timeout = setTimeout(() => res(false), 15000);
          img.onload = () => { clearTimeout(timeout); res(true); };
          img.onerror = () => { clearTimeout(timeout); res(false); };
        })
      );
      const results = await Promise.all(checks);
      return {
        total: imgs.length,
        loaded: results.filter(r => r).length,
        failed: results.filter(r => !r).length
      };
    });

    await page.waitForTimeout(3000);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      scale: 0.8
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=carfax-report.pdf",
      "Content-Length": pdfBuffer.length,
      "X-Images-Total": imageStats.total,
      "X-Images-Loaded": imageStats.loaded,
      "X-Images-Failed": imageStats.failed
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("❌ Error generando PDF:", error.message);
    res.status(500).json({
      error: "Error generando PDF",
      details: error.message
    });
  }
});

// Arrancar el servidor
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("✅ Servidor PDF corriendo en Railway");
});

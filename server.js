const express = require("express");
const puppeteer = require("puppeteer");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Configuración de middlewares
app.use(cors());
app.use(bodyParser.text({ type: "*/*", limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));

// Ruta base
app.get("/", (req, res) => {
  res.send("🚗 Carsimulcast to PDF Server - Ahorra créditos convirtiendo HTML a PDF");
});

// Ruta de conversión
app.post("/carsimulcast-to-pdf", async (req, res) => {
  console.log("🚀 Iniciando conversión de Carsimulcast HTML a PDF");

  try {
    let htmlContent = req.body;

    // Si el contenido viene como objeto con clave "data" o "html"
    if (typeof htmlContent === "object") {
      htmlContent = htmlContent.data || htmlContent.html || "";
    }

    // Decodificar si es base64
    if (typeof htmlContent === "string") {
      if (htmlContent.startsWith("data:text/html;base64,")) {
        htmlContent = Buffer.from(htmlContent.split(",")[1], "base64").toString("utf-8");
      } else if (/^[A-Za-z0-9+/=]+$/.test(htmlContent)) {
        try {
          htmlContent = Buffer.from(htmlContent, "base64").toString("utf-8");
          console.log("✅ HTML base64 decodificado correctamente");
        } catch {
          console.warn("⚠️ No es base64 válido, usando texto plano");
        }
      }
    }

    if (!htmlContent || htmlContent.length < 100) {
      throw new Error("El contenido HTML es demasiado corto o inválido");
    }

    console.log(`📄 Longitud del HTML: ${htmlContent.length} caracteres`);

    // Lanzar navegador
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: "/usr/bin/google-chrome-stable",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--allow-running-insecure-content",
        "--ignore-certificate-errors"
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,es;q=0.8",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache"
    });

    console.log("🛠️ Cargando HTML en Puppeteer...");
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 90000
    });

    console.log("🖼️ Verificando imágenes...");
    const imageLoadResult = await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll("img"));
      const results = await Promise.all(
        images.map((img) => {
          return new Promise((resolve) => {
            if (img.complete && img.naturalHeight !== 0) return resolve({ success: true });
            const timeout = setTimeout(() => resolve({ success: false }), 15000);
            img.addEventListener("load", () => { clearTimeout(timeout); resolve({ success: true }); });
            img.addEventListener("error", () => { clearTimeout(timeout); resolve({ success: false }); });
          });
        })
      );

      return {
        total: images.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
    });

    await page.waitForTimeout(3000);

    console.log("📄 Generando PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      scale: 0.8
    });

    await browser.close();

    // Enviar PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=carfax-report.pdf",
      "Content-Length": pdfBuffer.length,
      "X-Images-Total": imageLoadResult.total,
      "X-Images-Loaded": imageLoadResult.successful,
      "X-Images-Failed": imageLoadResult.failed
    });

    res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ Error generando PDF:", err);
    res.status(500).json({ error: "Error generando PDF", details: err.message });
  }
});

// Inicializar servidor
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("🚀 Servidor PDF activo en Railway ✅");
});

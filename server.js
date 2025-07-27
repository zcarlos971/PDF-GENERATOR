const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

app.use(express.json({ limit: "10mb" }));

// Ruta GET para ver si el servidor está vivo
app.get("/", (req, res) => {
  res.send("🟢 Servidor PDF corriendo correctamente.");
});

// Ruta POST para generar el PDF
app.post("/generate", async (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).send("Missing HTML");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": "attachment; filename=document.pdf"
  });

  res.send(pdfBuffer);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 PDF server running on port ${PORT}`);
});


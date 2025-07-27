const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();

// Permitir recibir HTML como texto plano
app.use(bodyParser.text({ type: "*/*" }));

// Ruta GET raíz
app.get("/", (req, res) => {
  res.send("Servidor de conversión HTML a PDF activo.");
});

// Ruta principal para convertir HTML en PDF
app.post("/generate-pdf", async (req, res) => {
  const htmlContent = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0"],
      timeout: 0
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=carfax.pdf",
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).send("Error generando el PDF.");
  }
});

// Levantar el servidor en Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

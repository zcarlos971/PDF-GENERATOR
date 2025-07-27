const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

// Permitir recibir HTML como texto plano
app.use(bodyParser.text({ type: '*/*' }));

app.post('/generate-pdf', async (req, res) => {
  const htmlContent = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 0
    });

    await page.waitForTimeout(2000); // Espera por si carga imágenes o estilos lentos

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    res.contentType("application/pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Failed to generate PDF');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`PDF Generator running on port ${port}`);
});

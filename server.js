app.post('/generate-pdf', async (req, res) => {
  const htmlContent = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Configurar un user-agent realista por si bloquean bots
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );

    // Establecer HTML directamente
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 0
    });

    // Espera adicional por imágenes que cargan lento
    await page.waitForTimeout(2000);

    // Desactiva cualquier marca de agua visual de Carsimulcast
    await page.evaluate(() => {
      const marcas = Array.from(document.querySelectorAll('*')).filter(el =>
        el.innerText?.toLowerCase().includes('carsimulcast')
      );
      marcas.forEach(el => el.remove());

      const imgs = document.querySelectorAll('img');
      imgs.forEach(img => {
        if (img.src.includes('carsimulcast')) {
          img.remove(); // O reemplaza src si tienes uno alternativo
        }
      });
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '30px', bottom: '30px', left: '20px', right: '20px' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).send('Error al generar el PDF');
  }
});

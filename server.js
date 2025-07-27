const express = require("express");
const chromium = require("chrome-aws-lambda"); // versión optimizada
const app = express();

app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.send("🟢 Servidor PDF corriendo correctamente.");
});

app.post("/generate", async (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).send("Missing HTML");

  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless
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

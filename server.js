const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.text({ type: "*/*", limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/", (req, res) => {
    res.send("\uD83D\uDE97 Carsimulcast to PDF Server - Ahorra cr\u00e9ditos convirtiendo HTML a PDF");
});

app.post("/carsimulcast-to-pdf", async (req, res) => {
    console.log("\uD83D\uDE80 Iniciando conversi\u00f3n de Carsimulcast HTML a PDF");
    try {
        let htmlContent = req.body;

        if (typeof htmlContent === 'object') {
            if (htmlContent.data) htmlContent = htmlContent.data;
            else if (htmlContent.html) htmlContent = htmlContent.html;
        }

        if (typeof htmlContent === 'string') {
            if (htmlContent.startsWith('data:text/html;base64,')) {
                htmlContent = Buffer.from(htmlContent.split(',')[1], 'base64').toString('utf-8');
            } else if (htmlContent.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
                try {
                    htmlContent = Buffer.from(htmlContent, 'base64').toString('utf-8');
                    console.log("\u2705 HTML base64 decodificado correctamente");
                } catch (e) {
                    console.log("\u26A0\uFE0F No es base64 v\u00e1lido, usando como texto plano");
                }
            }
        }

        if (!htmlContent || htmlContent.length < 100) {
            throw new Error("HTML content is too short or invalid");
        }

        console.log(`\uD83D\uDCC4 HTML length: ${htmlContent.length} characters`);

        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox', '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run',
                '--disable-extensions', '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
                '--disable-web-security', '--disable-features=VizDisplayCompositor',
                '--allow-running-insecure-content', '--ignore-certificate-errors', '--ignore-ssl-errors'
            ],
        });

        const page = await browser.newPage();
        await page.setDefaultTimeout(90000);
        await page.setDefaultNavigationTimeout(90000);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        });

        console.log("\uD83D\uDD27 Configurando contenido HTML...");

        await page.setContent(htmlContent, { waitUntil: ['networkidle0', 'domcontentloaded'], timeout: 90000 });
        console.log("\uD83D\uDDFC\uFE0F Esperando carga de im\u00e1genes...");

        const imageLoadResult = await page.evaluate(async () => {
            const images = Array.from(document.querySelectorAll('img'));
            const totalImages = images.length;

            const imagePromises = images.map((img) => new Promise((resolve) => {
                if (img.complete && img.naturalHeight !== 0) return resolve({ success: true });
                const timeout = setTimeout(() => resolve({ success: false }), 20000);
                img.addEventListener('load', () => { clearTimeout(timeout); resolve({ success: true }); });
                img.addEventListener('error', () => { clearTimeout(timeout); resolve({ success: false }); });
                if (img.src && !img.complete) { const src = img.src; img.src = ''; img.src = src; }
            }));

            const results = await Promise.all(imagePromises);
            return {
                total: totalImages,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            };
        });

        await page.waitForTimeout(5000);
        console.log("\uD83D\uDCC1 Generando PDF...");

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
            displayHeaderFooter: false,
            preferCSSPageSize: true,
            scale: 0.8
        });

        await browser.close();

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=carfax-report.pdf",
            "Content-Length": pdfBuffer.length,
            "X-Images-Total": imageLoadResult.total,
            "X-Images-Loaded": imageLoadResult.successful,
            "X-Images-Failed": imageLoadResult.failed
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error("\u274C Error generando PDF:", error);
        res.status(500).json({ error: "Error generando PDF de Carsimulcast", details: error.message });
    }
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
    console.log("\uD83D\uDE80 Servidor PDF activo en Railway ✅");
});

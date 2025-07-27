const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Habilitar CORS para permitir requests desde cualquier origen
app.use(cors());

// Aumentar el límite de tamaño del body para archivos HTML grandes
app.use(bodyParser.text({ 
    type: "*/*", 
    limit: "50mb" 
}));

// Permitir recibir HTML como texto plano
app.use(bodyParser.json({ limit: "50mb" }));

// Ruta GET para verificar que el servicio está activo
app.get("/", (req, res) => {
    res.send("Servidor de conversión HTML a PDF activo.");
});

// Ruta principal para convertir HTML en PDF
app.post("/generate-pdf", async (req, res) => {
    console.log("Solicitud recibida para generar PDF");
    
    try {
        // Obtener el contenido HTML del cuerpo de la solicitud
        let htmlContent = req.body;
        
        // Si el HTML viene en base64, decodificarlo
        if (typeof htmlContent === 'object' && htmlContent.html) {
            htmlContent = htmlContent.html;
        }
        
        // Si el HTML viene codificado en base64, decodificarlo
        if (htmlContent.startsWith('data:text/html;base64,')) {
            htmlContent = Buffer.from(htmlContent.split(',')[1], 'base64').toString('utf-8');
        } else if (htmlContent.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
            // Verificar si es base64 puro
            try {
                htmlContent = Buffer.from(htmlContent, 'base64').toString('utf-8');
            } catch (e) {
                console.log("No es base64 válido, usando como texto plano");
            }
        }

        console.log("Iniciando Puppeteer...");
        
        // Configurar Puppeteer con acceso completo a internet y Chrome estable
        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-extensions',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-features=TranslateUI',
                '--disable-ipc-flooding-protection',
                '--enable-features=NetworkService,NetworkServiceInProcess',
                '--force-color-profile=srgb',
                '--metrics-recording-only',
                '--use-mock-keychain'
            ],
        });

        console.log("Browser iniciado, creando nueva página...");
        const page = await browser.newPage();

        // Configurar timeouts más largos para cargar imágenes
        await page.setDefaultTimeout(30000);
        await page.setDefaultNavigationTimeout(30000);

        // Configurar user agent para evitar bloqueos
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        console.log("Configurando contenido HTML...");
        
        // Establecer el contenido HTML
        await page.setContent(htmlContent, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 30000
        });

        console.log("Esperando a que se carguen las imágenes...");
        
        // Esperar a que todas las imágenes se carguen
        await page.evaluate(async () => {
            const images = Array.from(document.querySelectorAll('img'));
            await Promise.all(images.map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve, reject) => {
                    img.addEventListener('load', resolve);
                    img.addEventListener('error', resolve); // Continuar aunque falle una imagen
                    // Timeout por imagen
                    setTimeout(resolve, 10000);
                });
            }));
        });

        console.log("Generando PDF...");
        
        // Generar el PDF con configuraciones optimizadas
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: '20px',
                right: '20px',
                bottom: '20px',
                left: '20px'
            },
            displayHeaderFooter: false,
            preferCSSPageSize: true
        });

        console.log("PDF generado exitosamente");
        
        await browser.close();

        // Configurar headers de respuesta
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=carfax-report.pdf",
            "Content-Length": pdfBuffer.length
        });

        res.send(pdfBuffer);
        
    } catch (error) {
        console.error("Error generando PDF:", error);
        res.status(500).json({ 
            error: "Error generando el PDF", 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Ruta adicional para debugging
app.post("/debug-html", async (req, res) => {
    try {
        let htmlContent = req.body;
        
        if (typeof htmlContent === 'object' && htmlContent.html) {
            htmlContent = htmlContent.html;
        }
        
        // Decodificar base64 si es necesario
        if (htmlContent.startsWith('data:text/html;base64,')) {
            htmlContent = Buffer.from(htmlContent.split(',')[1], 'base64').toString('utf-8');
        }
        
        res.set('Content-Type', 'text/html');
        res.send(htmlContent);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
    console.error("Error no manejado:", error);
    res.status(500).json({
        error: "Error interno del servidor",
        message: error.message
    });
});

// Configurar el puerto
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log(`Endpoints disponibles:`);
    console.log(`  GET  / - Verificar estado del servicio`);
    console.log(`  POST /generate-pdf - Convertir HTML a PDF`);
    console.log(`  POST /debug-html - Ver HTML decodificado`);
});

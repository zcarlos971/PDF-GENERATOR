const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(bodyParser.text({ type: "*/*", limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/", (req, res) => {
    res.send("🚗 Carsimulcast to PDF Server - Ahorra créditos convirtiendo HTML a PDF");
});

// Endpoint principal optimizado para Carsimulcast HTML
app.post("/carsimulcast-to-pdf", async (req, res) => {
    console.log("🚀 Iniciando conversión de Carsimulcast HTML a PDF");
    
    try {
        let htmlContent = req.body;
        
        // Manejar diferentes formatos de entrada
        if (typeof htmlContent === 'object') {
            if (htmlContent.data) {
                htmlContent = htmlContent.data; // Para compatibilidad con N8N
            } else if (htmlContent.html) {
                htmlContent = htmlContent.html;
            }
        }
        
        // Decodificar base64 de Carsimulcast
        if (typeof htmlContent === 'string') {
            if (htmlContent.startsWith('data:text/html;base64,')) {
                htmlContent = Buffer.from(htmlContent.split(',')[1], 'base64').toString('utf-8');
            } else if (htmlContent.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
                try {
                    htmlContent = Buffer.from(htmlContent, 'base64').toString('utf-8');
                    console.log("✅ HTML base64 decodificado correctamente");
                } catch (e) {
                    console.log("⚠️ No es base64 válido, usando como texto plano");
                }
            }
        }

        if (!htmlContent || htmlContent.length < 100) {
            throw new Error("HTML content is too short or invalid");
        }

        console.log(`📄 HTML length: ${htmlContent.length} characters`);
        
        // Configurar Puppeteer específicamente para recursos de Carsimulcast/Carfax
        const browser = await puppeteer.launch({
            headless: 'new',
            executablePath: '/usr/bin/google-chrome-stable',
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--disable-extensions',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-web-security', // Permitir recursos cross-origin
                '--disable-features=VizDisplayCompositor',
                '--allow-running-insecure-content',
                '--ignore-certificate-errors',
                '--ignore-ssl-errors',
                '--disable-dev-shm-usage'
            ],
        });

        const page = await browser.newPage();

        // Configurar timeouts generosos para cargar recursos externos
        await page.setDefaultTimeout(90000); // 90 segundos
        await page.setDefaultNavigationTimeout(90000);

        // User agent realista para evitar bloqueos
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Headers para simular navegador real
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
        });

        console.log("🔧 Configurando contenido HTML...");
        
        // Establecer el contenido y esperar carga completa
        await page.setContent(htmlContent, {
            waitUntil: ['networkidle0', 'domcontentloaded'],
            timeout: 90000
        });

        console.log("🖼️ Esperando carga de imágenes de Carsimulcast y Carfax...");
        
        // Esperar específicamente a que se carguen todas las imágenes
        const imageLoadResult = await page.evaluate(async () => {
            const images = Array.from(document.querySelectorAll('img'));
            const totalImages = images.length;
            console.log(`Found ${totalImages} images to load`);
            
            const imagePromises = images.map((img, index) => {
                return new Promise((resolve) => {
                    if (img.complete && img.naturalHeight !== 0) {
                        console.log(`Image ${index + 1}/${totalImages} already loaded: ${img.src}`);
                        resolve({ success: true, src: img.src });
                        return;
                    }
                    
                    const timeout = setTimeout(() => {
                        console.log(`Timeout for image ${index + 1}/${totalImages}: ${img.src}`);
                        resolve({ success: false, src: img.src, error: 'timeout' });
                    }, 20000); // 20 segundos por imagen
                    
                    img.addEventListener('load', () => {
                        console.log(`Image ${index + 1}/${totalImages} loaded successfully: ${img.src}`);
                        clearTimeout(timeout);
                        resolve({ success: true, src: img.src });
                    });
                    
                    img.addEventListener('error', (e) => {
                        console.log(`Image ${index + 1}/${totalImages} failed to load: ${img.src}`);
                        clearTimeout(timeout);
                        resolve({ success: false, src: img.src, error: 'load_error' });
                    });
                    
                    // Force reload if src is already set
                    if (img.src && !img.complete) {
                        const originalSrc = img.src;
                        img.src = '';
                        img.src = originalSrc;
                    }
                });
            });
            
            const results = await Promise.all(imagePromises);
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success);
            
            return {
                total: totalImages,
                successful: successful,
                failed: failed.length,
                failedImages: failed
            };
        });

        console.log(`📊 Resultado de carga de imágenes:`, imageLoadResult);

        // Esperar un poco más para el renderizado final
        await page.waitForTimeout(5000);

        console.log("📑 Generando PDF...");
        
        // Generar PDF con configuraciones optimizadas para reportes de Carfax
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: '0.5in',
                right: '0.5in',
                bottom: '0.5in',
                left: '0.5in'
            },
            displayHeaderFooter: false,
            preferCSSPageSize: true,
            scale: 0.8 // Ajustar escala para mejor fit
        });

        console.log("✅ PDF generado exitosamente");
        
        await browser.close();

        // Headers de respuesta
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "attachment; filename=carfax-report.pdf",
            "Content-Length": pdfBuffer.length,
            "Cache-Control": "no-cache",
            "X-Images-Total": imageLoadResult.total,
            "X-Images-Loaded": imageLoadResult.successful,
            "X-Images-Failed": imageLoadResult.failed
        });

        res.send(pdfBuffer);
        
    } catch (error) {
        console.error("❌ Error generando PDF:", error);
        res.status(500).json({ 
            error: "Error generando PDF de Carsimulcast", 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Endpoint de debugging para analizar HTML de Carsimulcast
app.post("/debug-carsimulcast", async (req, res) => {
    try {
        let htmlContent = req.body;
        
        if (typeof htmlContent === 'object') {
            if (htmlContent.data) htmlContent = htmlContent.data;
            else if (htmlContent.html) htmlContent = htmlContent.html;
        }
        
        if (htmlContent.startsWith('data:text/html;base64,')) {
            htmlContent = Buffer.from(htmlContent.split(',')[1], 'base64').toString('utf-8');
        } else if (htmlContent.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
            htmlContent = Buffer.from(htmlContent, 'base64').toString('utf-8');
        }
        
        // Analizar el contenido
        const imageUrls = htmlContent.match(/src="[^"]*"/g) || [];
        const carsimulcastImages = imageUrls.filter(url => 
            url.includes('carsimulcast') || 
            url.includes('carfax') || 
            url.includes('media.carfax.com')
        );
        
        const cssLinks = htmlContent.match(/href="[^"]*\.css[^"]*"/g) || [];
        const jsLinks = htmlContent.match(/src="[^"]*\.js[^"]*"/g) || [];
        
        res.json({
            analysis: {
                htmlLength: htmlContent.length,
                totalImages: imageUrls.length,
                carsimulcastImages: carsimulcastImages.length,
                cssLinks: cssLinks.length,
                jsLinks: jsLinks.length
            },
            samples: {
                imageUrls: carsimulcastImages.slice(0, 3),
                cssLinks: cssLinks.slice(0, 3),
                jsLinks: jsLinks.slice(0, 3)
            },
            isValidCarfax: htmlContent.includes('CARFAX') && htmlContent.includes('Vehicle History'),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para testear con HTML plano
app.post("/test-html-to-pdf", async (req, res) => {
    console.log("🧪 Endpoint de prueba activado");
    res.json({ 
        message: "Use /carsimulcast-to-pdf para el endpoint principal",
        endpoints: {
            main: "/carsimulcast-to-pdf",
            debug: "/debug-carsimulcast",
            test: "/test-html-to-pdf"
        }
    });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
    console.error("💥 Error no manejado:", error);
    res.status(500).json({
        error: "Error interno del servidor",
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Carsimulcast PDF Server activo en puerto ${PORT}`);
    console.log(`📚 Endpoints disponibles:`);
    console.log(`   GET  / - Estado del servidor`);
    console.log(`   POST /carsimulcast-to-pdf - Convertir HTML de Carsimulcast a PDF`);
    console.log(`   POST /debug-carsimulcast - Analizar HTML de Carsimulcast`);
    console.log(`💰 ¡Ahorra créditos de Carsimulcast convirtiendo HTML a PDF!`);
});

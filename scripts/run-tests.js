const puppeteer = require('puppeteer');
const path = require('path');

/**
 * Script para ejecutar tests automáticamente usando Puppeteer
 */
async function runTests() {
    console.log('🧪 Iniciando tests automáticos...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // Configurar timeout y eventos
        page.setDefaultTimeout(30000);

        // Capturar errores de JavaScript
        page.on('pageerror', (error) => {
            console.error('❌ Error en página:', error.message);
        });

        // Capturar logs de consola
        page.on('console', (msg) => {
            const type = msg.type();
            if (type === 'error') {
                console.error('❌ Console Error:', msg.text());
            } else if (type === 'warn') {
                console.warn('⚠️  Console Warning:', msg.text());
            }
        });

        // Navegar a la página de tests
        console.log('🌐 Navegando a test-suite.html...');
        await page.goto('http://localhost:8000/test-suite.html', {
            waitUntil: 'networkidle0'
        });

        // Esperar a que los tests terminen
        console.log('⏳ Esperando resultados de tests...');
        await page.waitForSelector('#test-summary', { timeout: 30000 });

        // Esperar 3 segundos adicionales para que terminen todos los tests
        await page.waitForTimeout(3000);

        // Extraer resultados
        const testResults = await page.evaluate(() => {
            const summary = document.getElementById('test-summary');
            const results = document.getElementById('test-results');

            return {
                summary: summary ? summary.textContent : 'No summary found',
                passed: (summary?.textContent || '').includes('0 fallaron'),
                details: results ? results.textContent : 'No details found'
            };
        });

        console.log('📊 Resumen de Tests:');
        console.log(testResults.summary);

        if (testResults.passed) {
            console.log('✅ Todos los tests pasaron!');
            process.exit(0);
        } else {
            console.log('❌ Algunos tests fallaron');
            console.log('📝 Detalles:', testResults.details.substring(0, 500) + '...');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error ejecutando tests:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Verificar si el servidor está corriendo
async function checkServer() {
    try {
        const response = await fetch('http://localhost:8000');
        return response.ok;
    } catch {
        return false;
    }
}

// Función principal
async function main() {
    const serverRunning = await checkServer();

    if (!serverRunning) {
        console.log('⚠️  Servidor HTTP no está corriendo en puerto 8000');
        console.log('💡 Ejecuta: npm run serve');
        process.exit(1);
    }

    await runTests();
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runTests, checkServer };

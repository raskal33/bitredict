const puppeteer = require('puppeteer');
const path = require('path');

async function generateThumbnail() {
    console.log('🚀 Starting thumbnail generation...');
    
    // Launch browser
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set viewport to 1280x720
        await page.setViewport({
            width: 1280,
            height: 720,
            deviceScaleFactor: 2 // Higher resolution for better quality
        });
        
        // Load the HTML file
        const htmlPath = path.join(__dirname, 'thumbnail-generator.html');
        await page.goto(`file://${htmlPath}`, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Wait for animations to settle
        console.log('⏳ Waiting for animations to settle...');
        await page.waitForTimeout(3000);
        
        // Take screenshot
        console.log('📸 Capturing screenshot...');
        await page.screenshot({
            path: 'bitredict-thumbnail.png',
            type: 'png',
            fullPage: false,
            omitBackground: false
        });
        
        console.log('✅ Thumbnail generated successfully: bitredict-thumbnail.png');
        
    } catch (error) {
        console.error('❌ Error generating thumbnail:', error);
    } finally {
        await browser.close();
    }
}

// Run the generator
generateThumbnail().catch(console.error);

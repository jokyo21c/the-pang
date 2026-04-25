const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    // Emulate mobile
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    
    await page.goto('http://localhost:8082/#news', { waitUntil: 'networkidle0' });
    
    const info = await page.evaluate(() => {
        const grid = document.getElementById('newsGrid');
        const container = document.querySelector('.news-slider-container');
        const cards = grid ? Array.from(grid.children).map(c => ({
            className: c.className,
            offsetWidth: c.offsetWidth,
            height: c.offsetHeight
        })) : [];
        
        return {
            grid: grid ? {
                offsetWidth: grid.offsetWidth,
                offsetHeight: grid.offsetHeight,
                transform: grid.style.transform,
                computedTransform: window.getComputedStyle(grid).transform,
                display: window.getComputedStyle(grid).display
            } : null,
            container: container ? {
                offsetWidth: container.offsetWidth,
                offsetHeight: container.offsetHeight,
                overflow: window.getComputedStyle(container).overflow
            } : null,
            cards: cards
        };
    });
    
    console.log(JSON.stringify(info, null, 2));
    await browser.close();
})();

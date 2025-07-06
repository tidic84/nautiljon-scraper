const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

let browser = null;
let page = null;

async function initBrowser() {
    if (!browser) {
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        page = await browser.newPage();
        
        // Définir user agent et autres headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        });
    }
    
    return { browser, page };
}

module.exports = {
    async req(url) {
        try {
            const { page } = await initBrowser();
            
            console.log(`Chargement de la page: ${url}`);
            
            // Aller à la page avec timeout
            await page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            // Attendre un peu pour que la page se charge complètement
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Récupérer le contenu HTML
            const html = await page.content();
            
            // Créer l'objet cheerio
            const $ = cheerio.load(html, { decodeEntities: false });
            
            return $;
        } 
        catch (error) {
            console.error(`Erreur lors de la requête vers ${url}:`, error.message);
            return cheerio.load("<body></body>");
        }
    },

    async closeBrowser() {
        if (browser) {
            await browser.close();
            browser = null;
            page = null;
        }
    }
};
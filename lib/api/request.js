const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

let browser = null;
let isRequestInProgress = false;
let requestQueue = [];

// Mutex pour éviter les appels concurrents
async function waitForTurn() {
    return new Promise((resolve) => {
        if (!isRequestInProgress) {
            isRequestInProgress = true;
            resolve();
        } else {
            requestQueue.push(resolve);
        }
    });
}

function releaseQueue() {
    isRequestInProgress = false;
    if (requestQueue.length > 0) {
        const nextResolve = requestQueue.shift();
        isRequestInProgress = true;
        nextResolve();
    }
}

async function getBrowser() {
    if (!browser) {
        console.log('Initialisation du navigateur...');
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            defaultViewport: null
        });
    }
    return browser;
}

async function req(url) {
    // Attendre son tour dans la queue
    await waitForTurn();
    
    try {
        console.log(`Chargement de la page: ${url}`);
        
        const browserInstance = await getBrowser();
        const page = await browserInstance.newPage();
        
        // Headers pour simuler un navigateur réel
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        });
        
        // Naviguer vers la page avec un timeout plus long
        await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: 30000 
        });
        
        // Attendre un peu pour que la page se charge complètement
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Récupérer le contenu HTML
        const html = await page.content();
        
        // Fermer la page (mais pas le navigateur)
        await page.close();
        
        console.log('Récupération réussie');
        return cheerio.load(html);
        
    } catch (error) {
        console.error(`Erreur lors de la requête vers ${url}:`, error.message);
        console.log('Récupération échouée');
        throw error;
    } finally {
        // Libérer la queue pour le prochain appel
        releaseQueue();
    }
}

async function closeBrowser() {
    // Attendre que toutes les requêtes en cours se terminent
    while (isRequestInProgress || requestQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (browser) {
        console.log('Fermeture du navigateur...');
        await browser.close();
        browser = null;
    }
}

module.exports = {
    req,
    closeBrowser
};
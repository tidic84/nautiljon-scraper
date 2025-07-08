const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

let browser = null;
let isRequestInProgress = false;
let requestQueue = [];

// Configuration retry
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 seconde
    maxDelay: 10000, // 10 secondes max
    backoffFactor: 2
};

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

// Fonction de délai avec backoff exponentiel
function calculateDelay(attempt) {
    const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt),
        RETRY_CONFIG.maxDelay
    );
    return delay + Math.random() * 1000; // Ajouter jitter
}

async function getBrowser() {
    if (!browser) {
        console.log('Initialisation du navigateur...');
        try {
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
        } catch (error) {
            console.error('Erreur lors de l\'initialisation du navigateur:', error.message);
            throw new Error('Impossible d\'initialiser Puppeteer');
        }
    }
    return browser;
}

async function req(url, attempt = 0) {
    // Attendre son tour dans la queue
    await waitForTurn();
    
    let page = null;
    try {
        console.log(`Chargement de la page (tentative ${attempt + 1}): ${url}`);
        
        const browserInstance = await getBrowser();
        page = await browserInstance.newPage();
        
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
        
        // Timeout adaptatif selon la tentative
        const timeout = 30000 + (attempt * 10000); // +10s par tentative
        
        // Naviguer vers la page
        await page.goto(url, { 
            waitUntil: 'networkidle2', 
            timeout: timeout 
        });
        
        // Attendre adaptatif selon la taille de page estimée
        const waitTime = url.includes('/animes/') || url.includes('/mangas/') ? 3000 : 1500;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Récupérer le contenu HTML
        const html = await page.content();
        
        // Vérifier que la page n'est pas une erreur Cloudflare
        if (html.includes('Checking your browser') || html.includes('Please wait')) {
            throw new Error('Page Cloudflare détectée');
        }
        
        console.log('Récupération réussie');
        return cheerio.load(html);
        
    } catch (error) {
        console.error(`Erreur lors de la requête vers ${url} (tentative ${attempt + 1}):`, error.message);
        
        // Retry logic
        if (attempt < RETRY_CONFIG.maxRetries) {
            const delay = calculateDelay(attempt);
            console.log(`Nouvelle tentative dans ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Libérer la queue pour permettre le retry
            releaseQueue();
            return req(url, attempt + 1);
        }
        
        console.log('Récupération échouée définitivement');
        throw new Error(`Échec après ${RETRY_CONFIG.maxRetries + 1} tentatives: ${error.message}`);
        
    } finally {
        // Toujours fermer la page
        if (page) {
            try {
                await page.close();
            } catch (e) {
                console.warn('Erreur lors de la fermeture de page:', e.message);
            }
        }
        
        // Libérer la queue pour le prochain appel (seulement si pas de retry)
        if (attempt === 0 || attempt >= RETRY_CONFIG.maxRetries) {
            releaseQueue();
        }
    }
}

// Auto-cleanup : fermer le navigateur après inactivité
let browserCleanupTimeout = null;
function scheduleBrowserCleanup() {
    if (browserCleanupTimeout) {
        clearTimeout(browserCleanupTimeout);
    }
    browserCleanupTimeout = setTimeout(async () => {
        if (browser && !isRequestInProgress && requestQueue.length === 0) {
            console.log('Fermeture automatique du navigateur (inactivité)...');
            await closeBrowser();
        }
    }, 30000); // 30 secondes d'inactivité
}

async function closeBrowser() {
    if (browserCleanupTimeout) {
        clearTimeout(browserCleanupTimeout);
        browserCleanupTimeout = null;
    }
    
    // Attendre que toutes les requêtes en cours se terminent
    let waitCount = 0;
    while ((isRequestInProgress || requestQueue.length > 0) && waitCount < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
    }
    
    if (browser) {
        console.log('Fermeture du navigateur...');
        try {
            await browser.close();
        } catch (error) {
            console.warn('Erreur lors de la fermeture du navigateur:', error.message);
        }
        browser = null;
    }
}

// Programmer le nettoyage automatique après chaque requête
const originalReq = req;
req = async function(url, attempt = 0) {
    const result = await originalReq(url, attempt);
    scheduleBrowserCleanup();
    return result;
};

module.exports = {
    req,
    closeBrowser
};
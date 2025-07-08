const { req }             = require("./api/request"),
      { dataPageScraper } = require("./api/scraper"),
      { urlReg }          = require("./utils/data"),
      utils               = require("./utils/utils"),
      removeAccents       = require("remove-accents");

/**
 * Récupère les informations détaillées d'un anime ou manga depuis son URL Nautiljon
 * @param {string} url - URL valide d'une page anime ou manga sur Nautiljon
 * @returns {Promise<Object>} Objet contenant toutes les informations de l'anime/manga
 */
module.exports = async (url) => {

    try {
        // Validation de base
        if (!url) {
            return utils.error("Aucune URL fournie");
        }
        
        if (typeof(url) !== 'string') {
            return utils.error("L'URL doit être une chaîne de caractères");
        }
        
        // Nettoyage et normalisation de l'URL
        const cleanUrl = removeAccents(url.trim());
        
        // Validation avec fonction utilitaire améliorée
        if (!utils.validateNautiljonUrl(cleanUrl)) {
            return utils.error("URL Nautiljon invalide. Format attendu: https://nautiljon.com/animes/nom-anime.html ou https://nautiljon.com/mangas/nom-manga.html");
        }

        // Vérification supplémentaire avec regex existante pour compatibilité
        if (!urlReg.test(cleanUrl) || cleanUrl.includes(" ")) {
            return utils.error("Format d'URL invalide");
        }

        utils.safeLog(`Récupération des détails: ${cleanUrl}`);

        // Récupération du contenu de la page
        const page = await req(cleanUrl);
        
        if (!page) {
            throw new Error("Impossible de récupérer le contenu de la page");
        }

        // Extraction des données
        const scrapedData = dataPageScraper(page, cleanUrl);
        
        if (!scrapedData || !scrapedData.name) {
            throw new Error("Aucune donnée valide trouvée sur cette page");
        }

        utils.safeLog(`Détails récupérés: ${scrapedData.name}`);
        
        return scrapedData;

    } catch (error) {
        utils.safeLog(`Erreur lors de la récupération des détails: ${error.message}`, 'error');
        
        // Relancer l'erreur pour que l'utilisateur puisse la gérer
        throw error;
    }
};
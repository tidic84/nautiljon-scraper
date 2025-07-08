const { req }           = require("./api/request"),
      { searchScraper } = require("./api/scraper"),
      urlParser         = require("./api/urlParser"),
      data              = require("./utils/data"),
      utils             = require("./utils/utils");

/**
 * Recherche d'animes ou mangas sur Nautiljon
 * @param {string} query - La requête de recherche
 * @param {string} [genre='anime'] - Le type de recherche (anime ou manga)
 * @param {number} [totalLength=15] - Nombre de résultats à retourner (max 50)
 * @param {object} [options] - Options de recherche avancées
 * @returns {Promise<Array>} Liste des résultats
 */
module.exports = async (query, genre = 'anime', totalLength = 15, options) => {

    try {
        // Validation et sanitisation de la requête
        const sanitizedQuery = utils.sanitizeQuery(query);
        if (!sanitizedQuery || sanitizedQuery.length === 0) {
            return utils.error("Requête de recherche invalide ou vide");
        }
        
        // Validation du genre
        const validGenres = data.genres.map(g => g.name);
        const normalizedGenre = genre?.toLowerCase?.() || 'anime';
        if (!validGenres.includes(normalizedGenre)) {
            return utils.error(`Genre invalide. Valeurs acceptées: ${validGenres.join(', ')}`);
        }

        // Gestion des paramètres swappés (compatibilité arrière)
        if (typeof totalLength === 'object' && typeof options === 'number') {
            [totalLength, options] = [options, totalLength];
        }
        
        // Validation de totalLength
        const validTotalLength = utils.validateTotalLength(totalLength);
        
        // Validation et nettoyage des options
        const validOptions = utils.validateSearchOptions(options, normalizedGenre);

        utils.safeLog(`Recherche: "${sanitizedQuery}" (${normalizedGenre}, ${validTotalLength} résultats)`);

        // Construction de l'URL de recherche
        const searchUrl = urlParser.parse(sanitizedQuery, normalizedGenre, validOptions);
        
        // Récupération du contenu de la page
        const page = await req(searchUrl);
        
        // Extraction des résultats
        const results = searchScraper(page, normalizedGenre, validTotalLength);
        
        utils.safeLog(`Recherche terminée: ${results.length} résultats trouvés`);
        
        return results;

    } catch (error) {
        utils.safeLog(`Erreur lors de la recherche: ${error.message}`, 'error');
        
        // Relancer l'erreur pour que l'utilisateur puisse la gérer
        throw error;
    }
};

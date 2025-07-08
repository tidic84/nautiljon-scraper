const data = require('./data');

module.exports = {

    error (text) {
        throw new TypeError(text);
    },

    // Sanitiser les requêtes de recherche
    sanitizeQuery(query) {
        if (typeof query !== 'string') {
            return null;
        }
        
        // Supprimer les caractères dangereux et limiter la longueur
        return query
            .trim()
            .replace(/[<>\"']/g, '') // Enlever caractères HTML dangereux
            .substring(0, 100) // Limiter à 100 caractères
            .replace(/\s+/g, ' '); // Normaliser les espaces
    },

    // Valider une URL Nautiljon
    validateNautiljonUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }
        
        const urlPattern = /^https?:\/\/(www\.)?nautiljon\.com\/(animes|mangas)\/[^\/]+\.html$/;
        return urlPattern.test(url.trim());
    },

    // Valider les options de recherche
    validateSearchOptions(options, genre) {
        if (!options || typeof options !== 'object') {
            return data.defaultOptions[genre] || {};
        }

        const validOptions = {};
        const optionsConfig = data.optionsConfig[genre];
        
        if (!optionsConfig) {
            return data.defaultOptions[genre] || {};
        }

        for (const [key, value] of Object.entries(options)) {
            // Gérer les clés exclude
            const baseKey = key.endsWith('Exclude') ? key.slice(0, -7) : key;
            const config = optionsConfig[baseKey];
            
            if (!config) continue;

            // Valider selon le type attendu
            switch (config.type) {
                case Number:
                    if (typeof value === 'number' && value >= 1900 && value <= 2030) {
                        validOptions[key] = Math.floor(value);
                    }
                    break;
                    
                case Boolean:
                    if (typeof value === 'boolean') {
                        validOptions[key] = value;
                    }
                    break;
                    
                case Array:
                    if (Array.isArray(value) && value.length <= 10) { // Limiter à 10 éléments
                        const validItems = value
                            .filter(item => typeof item === 'string')
                            .map(item => item.toLowerCase().trim())
                            .slice(0, 10); // Double sécurité
                        
                        if (validItems.length > 0) {
                            validOptions[key] = validItems;
                        }
                    }
                    break;
            }
        }

        return { ...data.defaultOptions[genre], ...validOptions };
    },

    // Valider le paramètre totalLength
    validateTotalLength(totalLength) {
        if (typeof totalLength !== 'number') {
            return 15; // Valeur par défaut
        }
        
        // Contraindre entre 1 et 50
        return Math.max(1, Math.min(50, Math.floor(totalLength)));
    },

    // Logger sécurisé (éviter les logs sensibles en production)
    safeLog(message, level = 'info') {
        if (process.env.NODE_ENV === 'production') {
            return; // Pas de logs en production par défaut
        }
        
        if (level === 'error') {
            console.error(message);
        } else {
            console.log(message);
        }
    }
    
};
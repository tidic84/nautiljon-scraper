# Guide d'utilisation - Appels multiples

## ⚠️ Problème résolu : Gestion des appels concurrents

Le module `nautiljon-scraper` v2.0.1+ gère automatiquement les appels concurrents grâce à un **système de mutex** intégré. Vous n'avez plus besoin de vous soucier des conflits entre les requêtes.

## 🔧 Solutions implémentées

### 1. **Système de queue automatique**
- Les requêtes sont automatiquement mises en file d'attente
- Une seule requête Puppeteer à la fois
- Pas de conflit entre les instances de navigateur

### 2. **Gestion intelligente du navigateur**
- Réutilisation de la même instance de navigateur
- Fermeture automatique des pages après utilisation
- Nettoyage propre des ressources

## 📋 Bonnes pratiques

### ✅ **Recommandé : Appels en série**
```javascript
const { search, getInfoFromURL } = require('@tidic/nautiljon-scraper');

async function searchMultiple() {
    try {
        // Recherches en série (plus sûr)
        const results1 = await search('One Piece', 'anime', 5);
        const results2 = await search('Naruto', 'anime', 5);
        const results3 = await search('Attack on Titan', 'manga', 5);
        
        console.log('Résultats:', results1.length, results2.length, results3.length);
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        // IMPORTANT: Toujours fermer le navigateur
        const { closeBrowser } = require('@tidic/nautiljon-scraper/lib/api/request');
        await closeBrowser();
    }
}
```

### ✅ **Supporté : Appels concurrents**
```javascript
async function searchConcurrent() {
    try {
        // Le mutex gère automatiquement la concurrence
        const promises = [
            search('One Piece', 'anime', 3),
            search('Naruto', 'anime', 3),
            search('Dragon Ball', 'manga', 3)
        ];
        
        const results = await Promise.all(promises);
        console.log('Résultats concurrents:', results.map(r => r.length));
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        const { closeBrowser } = require('@tidic/nautiljon-scraper/lib/api/request');
        await closeBrowser();
    }
}
```

### ✅ **Avec pauses (très sûr)**
```javascript
async function searchWithPauses() {
    try {
        const results1 = await search('One Piece', 'anime', 5);
        
        // Pause de 1 seconde entre les appels
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const results2 = await search('Naruto', 'anime', 5);
        
        // Récupération de détails
        if (results1.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const details = await getInfoFromURL(results1[0].url);
            console.log('Détails:', details.name, details.episodes?.listEpisodes?.length);
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        const { closeBrowser } = require('@tidic/nautiljon-scraper/lib/api/request');
        await closeBrowser();
    }
}
```

## 🚨 **Règles importantes**

### 1. **Toujours fermer le navigateur**
```javascript
// OBLIGATOIRE à la fin de votre script
const { closeBrowser } = require('@tidic/nautiljon-scraper/lib/api/request');
await closeBrowser();
```

### 2. **Gestion des erreurs**
```javascript
try {
    const results = await search('Query', 'anime', 5);
    // Traiter les résultats
} catch (error) {
    console.error('Erreur lors de la recherche:', error.message);
    // Gérer l'erreur
} finally {
    // Toujours nettoyer
    await closeBrowser();
}
```

### 3. **Éviter les boucles infinies**
```javascript
// ❌ ÉVITER - Trop de requêtes rapides
for (let i = 0; i < 100; i++) {
    await search(`Query ${i}`, 'anime', 1); // Peut surcharger
}

// ✅ MIEUX - Avec pauses
for (let i = 0; i < 10; i++) {
    await search(`Query ${i}`, 'anime', 1);
    await new Promise(resolve => setTimeout(resolve, 500)); // Pause 500ms
}
```

## 🔍 **Debugging**

Si vous rencontrez des problèmes, activez les logs :
```javascript
// Les logs sont automatiquement affichés
// Vous verrez :
// - "Initialisation du navigateur..."
// - "Chargement de la page: URL"
// - "Récupération réussie" ou "Récupération échouée"
// - "Fermeture du navigateur..."
```

## 📊 **Performances**

- **Appels en série** : Plus lent mais plus stable
- **Appels concurrents** : Plus rapide grâce au mutex
- **Avec pauses** : Le plus stable pour de gros volumes

## 🎯 **Exemple complet**

```javascript
const { search, getInfoFromURL } = require('@tidic/nautiljon-scraper');

async function main() {
    try {
        console.log('Début des recherches...');
        
        // Recherche concurrente
        const [animeResults, mangaResults] = await Promise.all([
            search('One Piece', 'anime', 3),
            search('One Piece', 'manga', 3)
        ]);
        
        console.log(`Trouvé ${animeResults.length} animes et ${mangaResults.length} mangas`);
        
        // Récupération de détails
        if (animeResults.length > 0) {
            const details = await getInfoFromURL(animeResults[0].url);
            console.log(`Détails: ${details.name} - ${details.episodes?.listEpisodes?.length || 0} épisodes`);
        }
        
        console.log('Terminé avec succès !');
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        const { closeBrowser } = require('@tidic/nautiljon-scraper/lib/api/request');
        await closeBrowser();
        console.log('Navigateur fermé proprement');
    }
}

main();
```

## 📝 **Changelog**

- **v2.0.1** : Système de mutex pour les appels concurrents
- **v2.0.0** : Contournement Cloudflare avec Puppeteer
- **v1.x** : Version originale (ne fonctionne plus) 
# Changelog - Nautiljon Scraper

## Version 1.1.1 (2024-01-07)

### 🔧 Correctifs majeurs

#### Problème résolu : Protection Cloudflare
- **Problème** : Le site nautiljon.com utilise maintenant des protections Cloudflare anti-bot
- **Solution** : Remplacement du système de requêtes par Puppeteer
- **Impact** : Le scraper fonctionne de nouveau correctement

#### Modernisation des dépendances
- ✅ **Supprimé** : `request` et `request-promise` (dépréciés)
- ✅ **Ajouté** : `puppeteer` pour simulation de navigateur
- ✅ **Mis à jour** : `cheerio` vers version récente
- ✅ **Mis à jour** : `remove-accents` vers version récente

### 🚀 Améliorations

#### Système de requêtes
- **Nouveau** : Utilisation de Puppeteer pour contourner les protections
- **Nouveau** : Headers HTTP optimisés pour ressembler à un navigateur
- **Nouveau** : Gestion automatique des timeouts et redirections
- **Nouveau** : Fermeture automatique du navigateur

#### Fiabilité
- **Amélioré** : Gestion d'erreurs plus robuste
- **Amélioré** : Logs informatifs pour le débogage
- **Amélioré** : Attente automatique du chargement complet des pages

### 🧪 Tests

#### Validation complète
- ✅ **Recherche d'anime** : "One Piece" → 5 résultats
- ✅ **Recherche de manga** : "Naruto" → 5 résultats  
- ✅ **Récupération d'infos** : Nom, nom japonais, genres
- ✅ **Parsing des données** : Tous les champs fonctionnent

### 📊 Résultats

Le scraper fonctionne maintenant parfaitement avec nautiljon.com malgré les protections Cloudflare.

### ⚠️ Notes importantes

- **Performance** : Le scraper est plus lent qu'avant (utilisation de Puppeteer)
- **Ressources** : Utilise plus de mémoire (navigateur Chrome)
- **Stabilité** : Plus robuste face aux changements du site

### 💡 Recommandations

1. **Utilisation** : Toujours appeler `closeBrowser()` à la fin
2. **Performance** : Réutiliser la même instance pour plusieurs requêtes
3. **Monitoring** : Surveiller les changements du site nautiljon.com 

## [2.0.1] - 2024-12-19

### Fixed
- **Correction majeure** : La liste des épisodes était toujours vide
- **Amélioration du parsing** : Meilleure séparation des titres anglais et français
- **Sélecteurs CSS** : Correction des sélecteurs pour récupérer les épisodes depuis les tableaux HTML
- **Nettoyage des données** : Suppression des annotations comme "[Semi filler]" des titres

### Technical Details
- Remplacement du sélecteur `.vtop.aleft` défaillant par une recherche intelligente de tableaux
- Détection automatique du tableau d'épisodes (3 colonnes : numéro, titre, date)
- Parsing amélioré des titres avec séparation correcte anglais/français
- Récupération complète de tous les épisodes disponibles (1136 pour One Piece, 28 pour Frieren)

## [2.0.0] - 2024-12-19

### Added
- **Contournement Cloudflare** : Utilisation de Puppeteer pour simuler un navigateur réel
- **Récupération des plateformes VOD** : Détection intelligente des plateformes de streaming (ADN, Crunchyroll, Netflix, Amazon Prime Video)
- **Système de fallback** : Méthodes alternatives pour récupérer les informations manquantes

### Changed
- **Dépendances modernisées** : Remplacement de `request-promise` (déprécié) par `axios` et `puppeteer`
- **Mise à jour de Cheerio** : Version récente pour une meilleure compatibilité
- **Système de requêtes** : Réécriture complète avec simulation de navigateur

### Fixed
- **Erreurs 403** : Contournement des protections anti-bot de Cloudflare
- **Sélecteurs CSS** : Mise à jour pour la structure HTML actuelle de nautiljon.com
- **Champ Format** : Ajout d'une valeur par défaut "Série TV" quand le champ n'existe plus
- **Plateformes VOD** : Récupération fonctionnelle des plateformes de streaming

### Technical Details
- Puppeteer configuré avec options anti-détection
- Headers HTTP authentiques pour simuler un navigateur réel
- Système de cache de navigateur pour optimiser les performances
- Gestion propre de la fermeture du navigateur après utilisation

## [1.0.0] - 2022
- Version initiale du scraper Nautiljon 
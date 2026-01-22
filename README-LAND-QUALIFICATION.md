# 🏡 Workflow N8N - Pré-qualification de Terrains Constructibles

## 📋 Description

Workflow N8N automatisé pour la **pré-qualification de terrains constructibles en France**. Ce système interroge plusieurs APIs publiques françaises pour générer une fiche de synthèse avec un score de constructibilité calculé automatiquement.

**Fonctionnalités principales :**
- ✅ Géocodage automatique d'adresses
- ✅ Récupération des données cadastrales (API IGN)
- ✅ Analyse du zonage PLU et des servitudes d'utilité publique
- ✅ Analyse des valeurs foncières récentes (DVF)
- ✅ Calcul automatique d'un score de constructibilité (0-100)
- ✅ Génération d'un rapport HTML professionnel
- ✅ Intégration CRM (HubSpot ou webhook générique)

**Technologies utilisées :**
- N8N (workflow automation)
- APIs publiques françaises (Adresse, Cadastre, GPU, DVF)
- JavaScript pour le traitement et le scoring

---

## 🚀 Installation

### Prérequis

1. **N8N Cloud ou Self-Hosted** (version 1.0+)
2. **Accès Internet** pour interroger les APIs publiques françaises
3. **(Optionnel) Clé API HubSpot** si vous souhaitez l'intégration CRM

### Étapes d'installation

#### 1. Importer le workflow dans N8N

1. Ouvrez votre instance N8N
2. Cliquez sur **"Import from File"** ou **"+"** → **"Import from File"**
3. Sélectionnez le fichier `workflow-land-qualification.json`
4. Le workflow sera importé avec tous ses nodes configurés

#### 2. Configurer les credentials (optionnel)

**Pour l'intégration HubSpot :**
1. Dans N8N, allez dans **Settings** → **Credentials**
2. Ajoutez un nouveau credential de type **"HubSpot API"**
3. Entrez votre clé API HubSpot
4. Associez ce credential au node **"Send to HubSpot"** (Node 17)

**Pour un webhook générique :**
1. Définissez la variable d'environnement `WEBHOOK_URL` dans N8N
2. Le node **"Send to Webhook (Alternative)"** (Node 18) utilisera cette URL

#### 3. Activer le workflow

1. Ouvrez le workflow importé
2. Cliquez sur **"Active"** en haut à droite
3. Notez l'URL du webhook générée (format : `https://[votre-instance].app.n8n.cloud/webhook/land-qualification`)

---

## 📥 Utilisation

### Format des données d'entrée

Envoyez une requête **POST** au webhook avec un payload JSON contenant au minimum l'un de ces champs :

```json
{
  "adresse_complete": "15 Rue de la République, 75001 Paris",
  "reference_cadastrale": "75101000AB0123",
  "latitude": 48.8566,
  "longitude": 2.3522,
  "nom_contact": "Jean Dupont",
  "email_contact": "jean.dupont@example.com"
}
```

#### Champs acceptés

| Champ | Type | Obligatoire | Description |
|-------|------|-------------|-------------|
| `adresse_complete` | string | Conditionnel* | Adresse complète du terrain |
| `reference_cadastrale` | string | Conditionnel* | Référence cadastrale (format: XXXXX000XX0000) |
| `latitude` | float | Conditionnel* | Latitude GPS |
| `longitude` | float | Conditionnel* | Longitude GPS |
| `nom_contact` | string | Non | Nom du contact (développeur terrain) |
| `email_contact` | string | Non | Email du contact |

*Au moins un des trois modes de localisation est requis (adresse OU référence cadastrale OU coordonnées GPS)

### Stratégies de localisation

Le workflow utilise automatiquement la meilleure stratégie selon les données fournies :

1. **Référence cadastrale fournie** → Utilisation directe (le plus précis)
2. **Coordonnées GPS fournies** → Utilisation directe
3. **Adresse fournie** → Géocodage automatique via API Adresse

---

## 🧪 Guide de Test

### Test 1 : Avec adresse complète

```bash
curl -X POST \
  https://[votre-instance].app.n8n.cloud/webhook/land-qualification \
  -H "Content-Type: application/json" \
  -d '{
    "adresse_complete": "12 Avenue des Champs-Élysées, 75008 Paris",
    "nom_contact": "Marie Martin",
    "email_contact": "marie.martin@example.com"
  }' \
  > resultat_test1.html
```

### Test 2 : Avec référence cadastrale

```bash
curl -X POST \
  https://[votre-instance].app.n8n.cloud/webhook/land-qualification \
  -H "Content-Type: application/json" \
  -d '{
    "reference_cadastrale": "69123000AB0456",
    "nom_contact": "Pierre Durand",
    "email_contact": "pierre.durand@example.com"
  }' \
  > resultat_test2.html
```

### Test 3 : Avec coordonnées GPS

```bash
curl -X POST \
  https://[votre-instance].app.n8n.cloud/webhook/land-qualification \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 45.7640,
    "longitude": 4.8357,
    "nom_contact": "Sophie Bernard",
    "email_contact": "sophie.bernard@example.com"
  }' \
  > resultat_test3.html
```

### Ouvrir les résultats

Après chaque test, ouvrez le fichier HTML généré dans un navigateur :

```bash
# macOS
open resultat_test1.html

# Linux
xdg-open resultat_test1.html

# Windows
start resultat_test1.html
```

---

## 📊 Architecture du Workflow

### Vue d'ensemble

```
[Webhook Input] → [Validation] → [Géocodage?] → [Cadastre]
                                      ↓              ↓
                                  [Merge] ────────→ [PLU + Servitudes]
                                                       ↓
                                                    [DVF]
                                                       ↓
                                                  [Scoring]
                                                       ↓
                                                [Generate HTML]
                                                       ↓
                                      ┌────────────────┼────────────────┐
                                      ↓                ↓                ↓
                                 [HubSpot]       [Webhook]        [Response]
```

### Description des nodes principaux

| Node | Nom | Rôle |
|------|-----|------|
| 1 | Webhook - Input | Réception des données via formulaire ou webhook |
| 2 | Validation Input | Validation et normalisation des données d'entrée |
| 3 | Needs Geocoding? | Détermine si un géocodage est nécessaire |
| 4 | API Géocodage Adresse | Géocode l'adresse via API Adresse (api-adresse.data.gouv.fr) |
| 5 | Process Geocoding | Traite les résultats du géocodage |
| 6 | Merge Geocoding | Fusionne les branches avec/sans géocodage |
| 7 | API Cadastre | Récupère les données cadastrales (apicarto.ign.fr) |
| 8 | Process Cadastre | Extrait surface, référence, géométrie |
| 9 | API GPU Zone PLU | Récupère le zonage PLU (apicarto.ign.fr) |
| 10 | API GPU Servitudes | Récupère les servitudes d'utilité publique |
| 11 | Merge PLU & Servitudes | Fusionne zonage et servitudes |
| 12 | Process PLU & Servitudes | Traite et structure les données d'urbanisme |
| 13 | API DVF | Récupère les valeurs foncières récentes |
| 14 | Process DVF | Calcule le prix moyen au m² du secteur |
| 15 | Calcul Score Constructibilité | Calcule le score de 0 à 100 avec logique de scoring |
| 16 | Generate HTML Report | Génère le rapport HTML professionnel |
| 17 | Send to HubSpot | Envoie les données vers HubSpot CRM |
| 18 | Send to Webhook | Alternative : webhook générique |
| 19 | Respond with HTML | Retourne le rapport HTML au client |

---

## 🎯 Logique de Scoring (0-100)

Le score de constructibilité est calculé selon les critères suivants :

### Score de base : 50 points

### Bonus/Malus Zone PLU (max ±30 points)

| Zone PLU | Points | Description |
|----------|--------|-------------|
| U (Urbaine) | +30 | Zone constructible immédiatement |
| AU (À urbaniser) | +20 | Zone constructible à terme |
| A (Agricole) | -20 | Difficilement constructible |
| N (Naturelle) | -30 | Non constructible |

### Malus Servitudes (max -25 points)

- **-5 points par servitude détectée** (plafonné à -25)

### Bonus Surface optimale (+10 points)

- **+10 points** si surface entre 500 m² et 5000 m²
- **0 points** sinon

### Bonus Données marché (+10 points)

- **+10 points** si ≥ 3 transactions récentes dans un rayon de 500m
- **+5 points** si 1-2 transactions
- **0 points** si aucune transaction

### Normalisation finale

Le score est normalisé entre **0 et 100**.

### Catégorisation

| Score | Catégorie | Code couleur | Recommandation |
|-------|-----------|--------------|----------------|
| 70-100 | Excellent | 🟢 Vert | Fort potentiel constructible |
| 50-69 | Bon | 🔵 Bleu | Bon potentiel, vérifier détails |
| 30-49 | Moyen | 🟠 Orange | Potentiel limité, étude approfondie |
| 0-29 | Faible | 🔴 Rouge | Faible potentiel, éviter sauf projet spécifique |

---

## 📄 Rapport HTML Généré

### Sections du rapport

1. **Header avec badge de score**
   - Score sur 100
   - Catégorie (Excellent/Bon/Moyen/Faible)

2. **Section Localisation**
   - Adresse normalisée
   - Référence cadastrale
   - Code INSEE de la commune
   - Coordonnées GPS

3. **Section Caractéristiques**
   - Surface cadastrale en m²
   - Zone PLU avec description
   - Liste des servitudes détectées

4. **Section Données Marché**
   - Prix moyen au m² du secteur
   - Nombre de transactions analysées
   - Valeur estimée du terrain
   - Tableau des transactions récentes

5. **Section Score de Constructibilité**
   - Score global avec catégorie
   - Détails du calcul (points attribués)
   - Recommandation personnalisée

6. **Section Prochaines Étapes**
   - Liste des actions recommandées selon le score
   - Checklist personnalisée

7. **Footer**
   - Informations de contact
   - ID de requête pour traçabilité
   - Temps de traitement

### Exemple visuel

Le rapport est entièrement stylisé avec :
- Design moderne et professionnel
- Gradient de couleurs adapté au score
- Tableaux responsive
- Badges et alertes visuelles
- Compatible impression et export PDF

---

## 🔧 Configuration Avancée

### Variables d'environnement

Définissez ces variables dans N8N (Settings → Variables) :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `HUBSPOT_API_KEY` | Clé API HubSpot | `pat-na1-xxxxx-xxxxx` |
| `WEBHOOK_URL` | URL webhook générique | `https://webhook.site/xxxxx` |

### Personnalisation du scoring

Pour modifier la logique de scoring, éditez le **Node 15 "Calcul Score Constructibilité"** :

```javascript
// Exemple : Augmenter le bonus pour zone U
const zonesPLU = {
  'U': { points: +40, label: 'Zone urbaine' }, // Au lieu de +30
  // ...
};

// Exemple : Réduire le malus des servitudes
const malusServitudes = Math.min(nbServitudes * 3, 15); // Au lieu de 5 pts et max 25
```

### Modification des critères PLU analysés

Éditez le **Node 12 "Process PLU & Servitudes"** pour personnaliser les données extraites.

### Ajout de champs CRM personnalisés

Éditez le **Node 17 "Send to HubSpot"** pour ajouter des propriétés HubSpot :

```javascript
{
  dealname: "Terrain - " + adresse,
  amount: prix_estime,
  // Ajoutez vos champs personnalisés ici
  custom_mon_champ: valeur
}
```

### Modification du timeout

Par défaut, le workflow a un timeout de **120 secondes** (2 minutes).

Pour modifier :
1. Workflow Settings → Execution Timeout
2. Changez à `180` pour 3 minutes (ou plus selon vos besoins)

---

## ❌ Troubleshooting

### Erreur : "Données insuffisantes"

**Cause :** Aucun des champs requis (adresse, référence cadastrale, coordonnées) n'a été fourni.

**Solution :**
- Vérifiez que votre payload JSON contient au moins un de ces champs
- Vérifiez l'orthographe des champs (`adresse_complete`, `reference_cadastrale`, etc.)

### Erreur : "Adresse non trouvée" (géocodage échoué)

**Cause :** L'API Adresse n'a pas pu géocoder l'adresse fournie.

**Solution :**
- Vérifiez l'orthographe et le format de l'adresse
- Utilisez une adresse plus précise (avec code postal)
- Alternative : fournissez directement les coordonnées GPS

### Données cadastrales "Indisponible"

**Cause :** La parcelle n'a pas été trouvée dans la base de données cadastrale IGN.

**Solution :**
- Vérifiez que les coordonnées GPS sont correctes
- Certaines zones (DOM-TOM, zones frontalières) peuvent avoir une couverture incomplète
- Le workflow continuera et générera quand même un rapport (avec données partielles)

### Zonage PLU "N/A"

**Cause :** Les données PLU ne sont pas disponibles pour cette commune.

**Solution :**
- Toutes les communes n'ont pas encore digitalisé leur PLU
- Le scoring utilisera des valeurs par défaut
- Consultez le PLU papier en mairie pour les détails

### Aucune transaction DVF trouvée

**Cause :** Aucune vente de terrain dans un rayon de 500m ces 24 derniers mois.

**Solution :**
- C'est normal dans les zones rurales ou peu actives
- Le rapport affichera "Données de marché indisponibles"
- Le scoring continuera sans le bonus DVF

### Workflow timeout après 2 minutes

**Cause :** Une ou plusieurs APIs sont lentes à répondre.

**Solution :**
1. Augmentez le timeout du workflow (Settings → Execution Timeout → 180s)
2. Vérifiez votre connexion Internet
3. Les APIs publiques françaises peuvent avoir des ralentissements

### Intégration HubSpot échoue

**Cause :** Credential invalide ou champs personnalisés inexistants.

**Solution :**
1. Vérifiez que votre clé API HubSpot est valide
2. Dans HubSpot, créez les propriétés personnalisées :
   - `custom_score_constructibilite` (Number)
   - `custom_surface_m2` (Number)
   - `custom_zone_plu` (Text)
   - `custom_reference_cadastrale` (Text)
   - `custom_nb_servitudes` (Number)
   - `custom_categorie` (Text)
3. Le workflow continue même si HubSpot échoue (grâce à `continueOnFail: true`)

---

## 📈 Métriques de Performance

### Temps de traitement

| Scenario | Temps estimé |
|----------|--------------|
| Toutes données disponibles | 5-10 secondes |
| Avec géocodage nécessaire | 8-12 secondes |
| API DVF lente | 15-20 secondes |

### Coût

**Toutes les APIs utilisées sont gratuites** :
- ✅ API Adresse (data.gouv.fr) - Gratuite
- ✅ API Cadastre IGN (apicarto.ign.fr) - Gratuite
- ✅ API GPU (apicarto.ign.fr) - Gratuite
- ✅ API DVF (Etalab) - Gratuite

**Coût total par terrain analysé : 0€** 🎉

### Fiabilité des données

| Source | Fiabilité | Mise à jour |
|--------|-----------|-------------|
| Cadastre | ⭐⭐⭐⭐⭐ Excellente | Temps réel |
| PLU | ⭐⭐⭐⭐ Bonne | Variable selon commune |
| DVF | ⭐⭐⭐⭐⭐ Excellente | Mise à jour semestrielle |
| Servitudes | ⭐⭐⭐⭐ Bonne | Variable |

---

## 🎓 Cas d'Usage

### Cas 1 : Promoteur immobilier

**Objectif :** Pré-qualifier rapidement 50 terrains issus d'une prospection.

**Workflow :**
1. Exporter les adresses depuis un fichier Excel
2. Créer un script pour appeler le webhook N8N en boucle
3. Récupérer les scores et prioriser les terrains ≥ 70/100
4. Les fiches sont automatiquement créées dans HubSpot

**Gain de temps :** 30 min/terrain → 10 sec/terrain = **99% de gain**

### Cas 2 : Particulier acheteur

**Objectif :** Analyser un terrain avant achat pour valider la constructibilité.

**Workflow :**
1. Récupérer l'adresse du terrain sur le site d'annonce
2. Soumettre au webhook via formulaire web
3. Recevoir le rapport HTML en moins de 10 secondes
4. Décider si demande de certificat d'urbanisme est pertinente

**Économie :** Évite les frais de CU (150-200€) pour des terrains non viables.

### Cas 3 : Agent immobilier

**Objectif :** Qualifier des terrains pour ses clients investisseurs.

**Workflow :**
1. Intégrer un formulaire sur son site web
2. Clients remplissent l'adresse du terrain
3. Rapport généré et envoyé par email automatiquement
4. Lead automatiquement créé dans le CRM

**Valeur ajoutée :** Service différenciant face à la concurrence.

---

## 🔄 Évolutions Possibles (V2)

### Fonctionnalités planifiées

- [ ] **Analyse multi-terrains** : Comparer plusieurs terrains simultanément
- [ ] **Export PDF automatique** : Générer un PDF en plus du HTML
- [ ] **Envoi par email** : Envoyer le rapport au contact par email
- [ ] **Historique des analyses** : Stocker les analyses dans une base de données
- [ ] **Analyse des réseaux** : Vérifier la proximité des réseaux (eau, électricité, gaz)
- [ ] **Risques naturels** : Intégrer l'API Géorisques (inondation, sismicité, etc.)
- [ ] **Carte interactive** : Afficher une carte avec la parcelle et les transactions DVF
- [ ] **Scoring personnalisable** : Interface pour ajuster les coefficients de scoring
- [ ] **Notifications Slack/Discord** : Alerter lors de terrains à fort potentiel

### APIs supplémentaires à intégrer

- **API Géorisques** : Risques naturels et technologiques
- **API Réseaux** : Proximité des réseaux (Via Orange, Enedis, etc.)
- **API Base Adresse Nationale Ouverte (BANO)** : Données complémentaires
- **API Base Sirene** : Entreprises à proximité (pour terrains commerciaux)

---

## 📞 Support & Contact

**Créé par :** FlowMinds Automation
**Version :** 1.0.0
**Date :** Janvier 2026
**Licence :** MIT

### Documentation API utilisées

- [API Adresse](https://adresse.data.gouv.fr/api-doc/adresse)
- [API Cadastre IGN](https://apicarto.ign.fr/api/doc/cadastre)
- [API Géoportail de l'Urbanisme (GPU)](https://apicarto.ign.fr/api/doc/gpu)
- [API DVF (Etalab)](https://doc.data.economie.gouv.fr/api-dvf/)

### Documentation N8N

- [Documentation officielle N8N](https://docs.n8n.io/)
- [N8N Community](https://community.n8n.io/)
- [N8N GitHub](https://github.com/n8n-io/n8n)

---

## 📄 Licence & Avertissement

### Licence

Ce workflow est fourni sous licence **MIT**. Vous êtes libre de l'utiliser, le modifier et le distribuer.

### Avertissement légal

⚠️ **IMPORTANT** : Ce workflow génère une **pré-qualification automatisée** basée sur des données publiques.

**Ce rapport ne constitue pas :**
- Un certificat d'urbanisme officiel
- Un avis juridique sur la constructibilité
- Une garantie de faisabilité du projet

**Avant tout projet de construction, il est OBLIGATOIRE de :**
1. Demander un certificat d'urbanisme opérationnel (CUb) en mairie
2. Consulter le PLU complet
3. Réaliser une étude de sol G1/G2
4. Vérifier les réseaux disponibles
5. Consulter un architecte et/ou un bureau d'études

Les données fournies par les APIs publiques peuvent contenir des erreurs ou être obsolètes. L'utilisateur est responsable de la vérification des informations.

---

## 🙏 Remerciements

Merci aux équipes qui maintiennent les APIs publiques françaises :
- **Etalab** (API Adresse, API DVF)
- **IGN** (API Cadastre, API GPU)
- **Ministère de la Transition Écologique** (Données PLU)

Et à la communauté **N8N** pour cet outil formidable ! 🚀

---

**🏗️ Happy Land Qualification !** 🏡

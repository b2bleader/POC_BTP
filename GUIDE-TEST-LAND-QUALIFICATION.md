# 🧪 Guide de Test - Workflow Land Qualification

Ce guide explique comment utiliser les scripts de test pour valider le workflow de pré-qualification de terrains constructibles.

## 📋 Vue d'ensemble

Deux scripts de test sont fournis pour tester le workflow N8N :

1. **test-land-qualification.sh** - Script Bash (Linux/macOS)
2. **test-land-qualification.js** - Script Node.js (Multi-plateforme)

Les deux scripts exécutent **3 scénarios de test** identiques :
- ✅ Scénario 1 : Parcelle en zone U (urbaine) avec données DVF complètes
- ✅ Scénario 2 : Parcelle en zone N (naturelle) sans transactions récentes
- ✅ Scénario 3 : Adresse sans référence cadastrale (géocodage requis)

---

## 🚀 Utilisation - Script Bash

### Prérequis

- Linux ou macOS
- `curl` installé
- `jq` installé (pour le formatage JSON)

### Installation de jq (si nécessaire)

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# CentOS/RHEL
sudo yum install jq
```

### Rendre le script exécutable

```bash
chmod +x test-land-qualification.sh
```

### Exécution

**Avec l'URL du webhook en argument :**

```bash
./test-land-qualification.sh https://votre-instance.app.n8n.cloud/webhook/land-qualification
```

**Sans argument (utilise l'URL par défaut) :**

```bash
./test-land-qualification.sh
```

> ⚠️ N'oubliez pas de modifier l'URL par défaut dans le script si vous ne passez pas d'argument.

### Sortie attendue

Le script affichera :
- ✅ Status de chaque requête (succès/échec)
- 📊 Score de constructibilité obtenu pour chaque terrain
- 📁 Chemins des fichiers HTML générés
- 📈 Résumé global des tests (X/3 réussis)

Les rapports HTML seront sauvegardés dans `./test-results/` avec un timestamp.

---

## 🚀 Utilisation - Script Node.js

### Prérequis

- Node.js (version 12+)

### Vérifier Node.js

```bash
node --version
```

Si Node.js n'est pas installé, téléchargez-le sur [nodejs.org](https://nodejs.org/)

### Rendre le script exécutable (Linux/macOS)

```bash
chmod +x test-land-qualification.js
```

### Exécution

**Avec l'URL du webhook en argument :**

```bash
node test-land-qualification.js https://votre-instance.app.n8n.cloud/webhook/land-qualification
```

**Sans argument (utilise l'URL par défaut) :**

```bash
node test-land-qualification.js
```

**Ou directement (si exécutable) :**

```bash
./test-land-qualification.js https://votre-instance.app.n8n.cloud/webhook/land-qualification
```

### Sortie attendue

Identique au script Bash :
- ✅ Status de chaque requête
- 📊 Score + Catégorie pour chaque terrain
- ⏱️ Durée de traitement
- 📁 Fichiers HTML générés
- 📈 Résumé global

---

## 📊 Description des Scénarios

### Scénario 1 : Zone U avec DVF

**Objectif :** Tester un terrain en zone urbaine constructible avec historique de transactions.

**Données d'entrée :**
```json
{
  "adresse_complete": "12 Avenue des Champs-Élysées, 75008 Paris",
  "nom_contact": "Jean Dupont",
  "email_contact": "jean.dupont@example.com"
}
```

**Résultat attendu :**
- ✅ Score élevé (70-100) car zone U
- ✅ Données DVF disponibles (secteur très actif)
- ✅ Catégorie "Excellent" ou "Bon"
- ✅ Prix moyen au m² disponible

---

### Scénario 2 : Zone N sans DVF

**Objectif :** Tester un terrain en zone naturelle non constructible sans transactions.

**Données d'entrée :**
```json
{
  "adresse_complete": "Chemin Rural, 05100 Briançon",
  "nom_contact": "Marie Martin",
  "email_contact": "marie.martin@example.com"
}
```

**Résultat attendu :**
- ✅ Score faible (0-30) car zone N
- ⚠️ Données DVF indisponibles (zone rurale/montagneuse)
- ✅ Catégorie "Faible"
- ✅ Recommandations adaptées (usage alternatif, dérogation)

---

### Scénario 3 : Géocodage requis

**Objectif :** Tester le workflow avec une adresse nécessitant un géocodage.

**Données d'entrée :**
```json
{
  "adresse_complete": "Place Bellecour, 69002 Lyon",
  "nom_contact": "Sophie Bernard",
  "email_contact": "sophie.bernard@example.com"
}
```

**Résultat attendu :**
- ✅ Géocodage réussi via API Adresse
- ✅ Coordonnées GPS normalisées
- ✅ Score dépendant de la zone PLU
- ✅ Référence cadastrale récupérée

---

## 📁 Fichiers de Sortie

### Nomenclature

Les fichiers générés suivent cette nomenclature :

```
test-results/
├── scenario_1_zone_U_2026-01-22_14-30-45.html
├── scenario_2_zone_N_2026-01-22_14-30-55.html
└── scenario_3_geocoding_2026-01-22_14-31-05.html
```

Le timestamp permet d'exécuter les tests plusieurs fois sans écraser les résultats précédents.

### Ouvrir les rapports

**macOS :**
```bash
open test-results/scenario_1_zone_U_*.html
```

**Linux :**
```bash
xdg-open test-results/scenario_1_zone_U_*.html
```

**Windows :**
```bash
start test-results\scenario_1_zone_U_*.html
```

---

## 🔍 Vérification des Résultats

### Critères de succès

Pour chaque scénario, vérifiez :

#### ✅ Requête HTTP
- Status code : **200 OK**
- Pas d'erreur dans la réponse

#### ✅ Rapport HTML
- Document bien formé (HTML valide)
- Toutes les sections présentes (Localisation, Caractéristiques, Score, etc.)
- Score affiché sur 100
- Catégorie affichée (Excellent/Bon/Moyen/Faible)

#### ✅ Données extraites

**Scénario 1 (Zone U) :**
- Zone PLU : "U" (ou sous-zone comme "UB", "UC")
- Score : **≥ 70**
- Catégorie : **"Excellent"** ou **"Bon"**
- Transactions DVF : **≥ 1**
- Prix moyen au m² : **Disponible**

**Scénario 2 (Zone N) :**
- Zone PLU : "N" (ou "A")
- Score : **≤ 30**
- Catégorie : **"Faible"**
- Transactions DVF : **0** ou très peu
- Warning : "Données de marché indisponibles"

**Scénario 3 (Géocodage) :**
- Adresse normalisée : **Présente**
- Coordonnées GPS : **Disponibles**
- Référence cadastrale : **Récupérée**
- Score : **Variable selon zone**

---

## ❌ Troubleshooting

### Erreur : "curl: command not found"

**Solution :**
```bash
# Ubuntu/Debian
sudo apt-get install curl

# macOS (devrait être préinstallé)
brew install curl
```

### Erreur : "jq: command not found"

**Solution :** Installez jq (voir section "Installation de jq" ci-dessus).

Ou modifiez le script pour retirer les appels à `jq`.

### Erreur : "Connection refused"

**Causes possibles :**
1. L'URL du webhook est incorrecte
2. Le workflow N8N n'est pas activé
3. Problème de réseau/firewall

**Solution :**
1. Vérifiez l'URL du webhook dans N8N
2. Assurez-vous que le workflow est **Active** (switch vert)
3. Testez l'URL dans un navigateur :
   ```
   https://votre-instance.app.n8n.cloud/webhook/land-qualification
   ```
   Vous devriez voir une erreur 404 ou 400 (normal, car GET au lieu de POST)

### Erreur : HTTP 400 "Données insuffisantes"

**Cause :** Le payload envoyé ne contient pas les champs requis.

**Solution :** Vérifiez le format du JSON dans le script.

### Erreur : HTTP 500 "Internal Server Error"

**Cause :** Erreur dans le workflow N8N.

**Solution :**
1. Ouvrez N8N
2. Allez dans **Executions** (historique)
3. Trouvez l'exécution en erreur
4. Analysez le node qui a échoué
5. Vérifiez les logs d'erreur

Erreurs courantes :
- Node "API Cadastre" : Coordonnées GPS invalides
- Node "API DVF" : URL ou paramètres incorrects
- Node "Generate HTML" : Erreur de syntaxe JavaScript

### Aucun fichier HTML généré

**Causes possibles :**
1. Erreur HTTP (code ≠ 200)
2. Réponse vide
3. Problème de permissions d'écriture

**Solution :**
1. Vérifiez les codes HTTP dans la sortie du script
2. Créez manuellement le dossier `test-results/` :
   ```bash
   mkdir -p test-results
   chmod 755 test-results
   ```

### Les scores sont toujours identiques

**Cause :** Le workflow ne varie pas selon les données d'entrée.

**Solution :** Vérifiez le code du Node 15 "Calcul Score Constructibilité".

---

## 📈 Interprétation des Résultats

### Scénario 1 : Zone U

| Métrique | Valeur attendue | Signification |
|----------|-----------------|---------------|
| Score | 70-90 | Zone constructible avec bonus PLU |
| Prix/m² | 500-3000€ | Secteur urbain actif |
| Transactions | 5-50 | Marché liquide |
| Servitudes | 0-2 | Peu de contraintes |

### Scénario 2 : Zone N

| Métrique | Valeur attendue | Signification |
|----------|-----------------|---------------|
| Score | 10-30 | Zone non constructible |
| Prix/m² | N/A | Pas de marché |
| Transactions | 0 | Aucune vente récente |
| Servitudes | Variable | Possibles (forêt, montagne) |

### Scénario 3 : Géocodage

| Métrique | Valeur attendue | Signification |
|----------|-----------------|---------------|
| Score | Variable | Dépend de la zone |
| Géocodage | Succès | API Adresse fonctionnelle |
| Cadastre | Trouvé | Parcelle identifiée |
| Adresse normalisée | Présente | Format standardisé |

---

## 🔄 Tests Automatisés (CI/CD)

### Intégration GitHub Actions

Créez `.github/workflows/test-land-qualification.yml` :

```yaml
name: Test Land Qualification Workflow

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Run tests
      env:
        WEBHOOK_URL: ${{ secrets.N8N_WEBHOOK_URL }}
      run: |
        node test-land-qualification.js $WEBHOOK_URL

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: test-results/
```

Ajoutez le secret `N8N_WEBHOOK_URL` dans Settings → Secrets → Actions.

---

## 📊 Monitoring et Métriques

### Métriques à suivre

1. **Taux de succès** : % de tests réussis
2. **Temps de réponse** : Durée moyenne par scénario
3. **Qualité des données** : % de champs remplis vs N/A
4. **Cohérence des scores** : Vérifier que zone U > zone N

### Dashboard recommandé

Utilisez un outil de monitoring pour suivre :
- Latence des APIs publiques (Cadastre, DVF, GPU)
- Taux d'erreur par node
- Distribution des scores générés
- Volume de requêtes journalières

---

## 📞 Support

Si les tests échouent de manière persistante :

1. Vérifiez la **documentation N8N** : https://docs.n8n.io/
2. Consultez les **logs d'exécution** dans N8N
3. Testez les **APIs publiques** directement :
   - https://api-adresse.data.gouv.fr/search/?q=Paris
   - https://apicarto.ign.fr/api/doc/cadastre
4. Vérifiez la **connectivité réseau** de votre instance N8N

---

## 🎯 Bonnes Pratiques

1. **Exécutez les tests avant chaque déploiement**
2. **Archivez les résultats** pour comparer les versions
3. **Testez avec des données réelles** de votre secteur
4. **Automatisez les tests** via CI/CD
5. **Documentez les anomalies** rencontrées

---

**🧪 Happy Testing !** 🏡

# 🧪 Guide de Test Complet - POC Analyse DCE BTP

## 📋 Table des Matières

1. [Préparation](#préparation)
2. [Installation du Workflow](#installation-du-workflow)
3. [Configuration](#configuration)
4. [Test 1 : Premier Test Basique (5 PDFs)](#test-1--premier-test-basique-5-pdfs)
5. [Test 2 : Test Réaliste (20-30 PDFs)](#test-2--test-réaliste-20-30-pdfs)
6. [Test 3 : Test avec Modificatifs et Doublons](#test-3--test-avec-modificatifs-et-doublons)
7. [Test 4 : Test de Robustesse (Fichiers Corrompus)](#test-4--test-de-robustesse-fichiers-corrompus)
8. [Validation des Résultats](#validation-des-résultats)
9. [Optimisation et Ajustements](#optimisation-et-ajustements)

---

## 🎯 Préparation

### Prérequis

✅ **Compte n8n Cloud** (ou self-hosted v1.0+)
✅ **Clé API Anthropic Claude** ([obtenir ici](https://console.anthropic.com/))
✅ **Budget API** : ~$5 pour tous les tests
✅ **Outil de test** : Postman OU cURL OU navigateur avec extension REST client
✅ **Fichiers de test** : DCE réels ou fichiers de test (voir ci-dessous)

### Créer des Fichiers de Test

Si tu n'as pas de DCE réels, voici comment créer des fichiers de test :

#### Option A : Utiliser des Documents Publics

1. **Télécharge des DCE publics** :
   - Site : https://www.boamp.fr/ (Bulletin Officiel des Annonces de Marchés Publics)
   - Cherche "consultation entreprises travaux"
   - Télécharge un dossier complet avec documents

2. **Ou génère des PDFs de test** :
   ```bash
   # Crée un dossier de test
   mkdir dce-test
   cd dce-test

   # Crée des PDFs factices avec du contenu
   echo "CAHIER DES CLAUSES ADMINISTRATIVES PARTICULIÈRES

   Article 1 : Objet du marché
   Le présent marché a pour objet...

   Article 5 : Pénalités de retard
   En cas de retard, une pénalité de 100€ par jour...

   Article 8 : Garantie
   Le titulaire devra fournir une garantie bancaire..." > ccap.txt

   # Convertis en PDF (macOS)
   textutil -convert pdf ccap.txt

   # Ou sur Linux avec LibreOffice
   libreoffice --convert-to pdf ccap.txt
   ```

3. **Crée au minimum** :
   - `CCAP.pdf` (contenu administratif)
   - `Reglement.pdf` (critères de jugement)
   - `Planning.pdf` (dates et jalons)
   - `Notice_Technique.pdf` (exigences techniques)
   - `Plan_masse.pdf` (fichier volumineux >10 MB pour tester le filtre)
   - `DPGF.xlsx` (fichier Excel quelconque)
   - `Quantitatif.xlsx`

4. **Compresse en ZIP** :
   ```bash
   zip -r dce-test.zip *.pdf *.xlsx
   ```

#### Option B : Télécharger Pack de Test (Recommandé)

Si disponible, télécharge le pack de test pré-configuré depuis :
[LIEN GOOGLE DRIVE / DROPBOX] *(tu devras créer ce pack toi-même)*

---

## 📥 Installation du Workflow

### Étape 1 : Importer dans n8n

1. **Ouvre n8n** (https://[ton-instance].app.n8n.cloud)

2. **Clique sur "Workflows"** (menu de gauche)

3. **Clique sur "Import from File"** (bouton en haut à droite)

4. **Sélectionne** le fichier `workflow-dce-analysis.json`

5. **Le workflow apparaît** avec 12 nodes connectés

### Étape 2 : Vérifier la Structure

✅ **Vérifie que tu vois bien 12 nodes :**

```
Webhook → Extract from File → Smart Filter → Split in Batches →
Claude Classification → Aggregate → Filter Relevant + Duplicates →
Split in Batches → Claude Full Analysis → Aggregate →
Generate HTML → Respond to Webhook
```

✅ **Vérifie les connexions** : Tous les nodes doivent être connectés (lignes noires entre eux)

---

## 🔑 Configuration

### Étape 1 : Configurer la Clé API Claude

**Node 5 : Claude Classification**

1. Double-clique sur le node "Claude Classification"
2. Trouve la ligne 2 : `const ANTHROPIC_API_KEY = 'YOUR_API_KEY_HERE';`
3. Remplace par ta clé : `const ANTHROPIC_API_KEY = 'sk-ant-api03-xxx...';`
4. Clique sur "Execute Node" pour tester (optionnel à ce stade)
5. Clique sur "Save"

**Node 9 : Claude Full Analysis**

1. Double-clique sur le node "Claude Full Analysis"
2. Trouve la ligne 2 : `const ANTHROPIC_API_KEY = 'YOUR_API_KEY_HERE';`
3. Remplace par ta clé : `const ANTHROPIC_API_KEY = 'sk-ant-api03-xxx...';`
4. Clique sur "Save"

### Étape 2 : Configurer le Node 11 (HTML complet)

**Node 11 : Generate HTML**

Le code dans le JSON est simplifié. Remplace-le par le code complet :

1. Double-clique sur le node "Generate HTML"
2. **Supprime tout le code** existant
3. **Copie-colle** le contenu du fichier `node-11-generate-html-FULL-CODE.js`
4. Clique sur "Save"

### Étape 3 : Activer le Workflow

1. Clique sur **"Active"** (toggle en haut à droite)
2. Le workflow passe en mode actif (couleur verte)

### Étape 4 : Noter l'URL du Webhook

1. Double-clique sur le node **"Webhook"**
2. **Copie l'URL** affichée (format : `https://[instance].app.n8n.cloud/webhook/analyze-dce`)
3. **Note-la** quelque part (tu en auras besoin pour les tests)

---

## 🧪 Test 1 : Premier Test Basique (5 PDFs)

**Objectif** : Vérifier que le workflow fonctionne de bout en bout

### Préparation

- ✅ ZIP de test avec 5 PDFs (< 50 MB total)
- ✅ Au moins 2 PDFs avec contenu textuel (pas que des images)
- ✅ 1-2 fichiers Excel

### Exécution avec cURL

```bash
curl -X POST \
  "https://[TON-INSTANCE].app.n8n.cloud/webhook/analyze-dce" \
  -F "data=@/chemin/vers/dce-test.zip" \
  -H "Content-Type: multipart/form-data" \
  -o resultat-test1.html
```

**Remplace :**
- `[TON-INSTANCE]` par ton instance n8n
- `/chemin/vers/dce-test.zip` par le chemin réel de ton ZIP

### Exécution avec Postman

1. **Ouvre Postman**
2. **Crée une nouvelle requête** :
   - Method: `POST`
   - URL: `https://[ton-instance].app.n8n.cloud/webhook/analyze-dce`
3. **Onglet "Body"** :
   - Sélectionne `form-data`
   - Key : `data` (change type en "File")
   - Value : Clique sur "Select Files" et choisis ton ZIP
4. **Clique sur "Send"**
5. **Copie le HTML** de la réponse dans un fichier `.html`

### Résultats Attendus

✅ **Temps de réponse** : 30-60 secondes pour 5 PDFs

✅ **Dans n8n** : Va dans "Executions" (menu gauche)
   - Tu dois voir une exécution "Success" (verte)
   - Clique dessus pour voir le détail
   - Vérifie que tous les nodes sont verts

✅ **Dans le HTML généré** :
   - En-tête avec titre "Analyse Dossier de Consultation"
   - Statistiques (5 fichiers reçus, X PDFs traités, etc.)
   - Au moins 1-2 documents analysés en détail
   - Liste des fichiers Excel
   - Temps de traitement affiché

### ❌ Si Ça Échoue

**Erreur : "Invalid API Key"**
→ Retourne à la section Configuration, vérifie que ta clé API est correcte

**Erreur : "Workflow timeout"**
→ Dans n8n Settings > Workflow Settings > Execution Timeout : mets 300 (5 min)

**Pas de réponse**
→ Vérifie que le workflow est bien "Active" (toggle vert)

---

## 🏗️ Test 2 : Test Réaliste (20-30 PDFs)

**Objectif** : Tester avec un volume proche de la réalité

### Préparation

- ✅ ZIP avec 20-30 PDFs (100-200 MB)
- ✅ Mix de documents (CCAP, Règlement, Plans, Annexes)
- ✅ 3-5 fichiers Excel

### Exécution

```bash
curl -X POST \
  "https://[TON-INSTANCE].app.n8n.cloud/webhook/analyze-dce" \
  -F "data=@/chemin/vers/dce-reel.zip" \
  -H "Content-Type: multipart/form-data" \
  -o resultat-test2.html
```

### Résultats Attendus

✅ **Temps de réponse** : 2-4 minutes

✅ **Dans le HTML** :
   - Statistiques cohérentes (ex: "25 fichiers reçus, 22 PDFs traités")
   - Section "Fichiers ignorés" avec raisons (ex: "3 PDFs > 10 MB")
   - 5-10 documents analysés en détail
   - Types variés (CCAP, REGLEMENT, PLANNING, NOTICE)

✅ **Vérification qualité** :
   - Ouvre un des PDFs sources
   - Compare avec l'analyse dans le HTML
   - Vérifie que les infos clés sont bien extraites

### Métriques à Noter

| Métrique | Valeur attendue | Valeur obtenue |
|----------|-----------------|----------------|
| Temps total | 2-4 min | _____ min |
| PDFs analysés | 5-12 | _____ |
| Coût API | $0.40-0.80 | $_____ |
| Classification correcte | >80% | _____% |

**Comment calculer le coût API :**
1. Va sur https://console.anthropic.com/
2. Onglet "Usage"
3. Note le coût avant/après l'exécution

**Comment vérifier la classification :**
1. Dans n8n, ouvre l'exécution
2. Clique sur le node "Aggregate - Classifications"
3. Vérifie les types assignés vs le contenu réel des PDFs

---

## 🔄 Test 3 : Test avec Modificatifs et Doublons

**Objectif** : Vérifier la détection des modificatifs et doublons

### Préparation

Crée un ZIP avec :
- ✅ `CCAP_v1.pdf` (CCAP original)
- ✅ `CCAP_modificatif.pdf` (version modifiée)
- ✅ `Reglement_consultation.pdf`
- ✅ `Planning.pdf`
- ✅ `Annexe1.pdf`
- ✅ `DPGF.xlsx`

### Exécution

```bash
curl -X POST \
  "https://[TON-INSTANCE].app.n8n.cloud/webhook/analyze-dce" \
  -F "data=@/chemin/vers/dce-modificatif.zip" \
  -H "Content-Type: multipart/form-data" \
  -o resultat-test3.html
```

### Résultats Attendus

✅ **Warning des doublons** :
   - Section jaune avec "⚠️ ATTENTION : Documents multiples du même type"
   - "CCAP : 2 documents détectés"

✅ **Badge modificatif** :
   - Le fichier `CCAP_modificatif.pdf` doit avoir le badge 🔄

✅ **Section "Impact du modificatif"** :
   - Dans l'analyse du modificatif, il doit y avoir une section spéciale
   - Exemple : "⚠️ Impact du modificatif : Modification de l'article 5 sur les pénalités..."

---

## 💣 Test 4 : Test de Robustesse (Fichiers Corrompus)

**Objectif** : Vérifier que le workflow ne crash pas en cas d'erreur

### Préparation

Crée un ZIP avec :
- ✅ 3 PDFs normaux
- ✅ 1 fichier corrompu (renomme un `.txt` en `.pdf`)
- ✅ 1 PDF image uniquement (sans texte)
- ✅ 1 fichier > 10 MB

### Exécution

```bash
curl -X POST \
  "https://[TON-INSTANCE].app.n8n.cloud/webhook/analyze-dce" \
  -F "data=@/chemin/vers/dce-corrompu.zip" \
  -H "Content-Type: multipart/form-data" \
  -o resultat-test4.html
```

### Résultats Attendus

✅ **Le workflow ne crash PAS** (statut "Success" dans n8n)

✅ **Dans le HTML** :
   - Section "Fichiers non analysés" avec raisons
   - Exemple : "fichier_corrompu.pdf (Taille > 10 MB)"
   - Les PDFs normaux sont bien analysés
   - Éventuellement un document avec "❌ Erreur lors de l'analyse"

✅ **Gestion gracieuse** : Le workflow continue malgré les erreurs

---

## ✅ Validation des Résultats

### Checklist de Validation Complète

#### ✅ Fonctionnel

- [ ] Le workflow se termine sans erreur (statut "Success")
- [ ] Le HTML est bien formé (pas de code brut visible)
- [ ] Toutes les statistiques sont cohérentes
- [ ] Au moins 1 document est analysé en détail
- [ ] Les fichiers Excel sont listés
- [ ] Le temps de traitement est affiché

#### ✅ Qualité des Analyses

- [ ] Les types de documents sont corrects (>80% de précision)
- [ ] Les infos critiques sont pertinentes (pas de hallucinations)
- [ ] Les dates extraites sont exactes
- [ ] Le scope résumé reflète le contenu réel

#### ✅ Gestion d'Erreurs

- [ ] Les fichiers > 10 MB sont bien ignorés
- [ ] Les fichiers corrompus ne bloquent pas le workflow
- [ ] Les warnings de doublons apparaissent si applicable
- [ ] Les modificatifs sont détectés (badge 🔄)

#### ✅ Performance

- [ ] Temps < 5 min pour 40 PDFs
- [ ] Coût < $1 par DCE complet
- [ ] Pas de timeout

#### ✅ UX du HTML

- [ ] Design professionnel et lisible
- [ ] Pas de texte tronqué
- [ ] Les sections sont bien structurées
- [ ] Pas d'erreur JavaScript dans la console navigateur

---

## 🔧 Optimisation et Ajustements

### Ajuster la Limite de PDFs

**Si le workflow timeout avec 40 PDFs :**

1. Ouvre le **Node 3 : Smart Filter**
2. Ligne 32 : Change `const selectedPdfs = pdfs.slice(0, 40);`
3. Remplace `40` par `20` ou `30`
4. Save et re-teste

### Ajuster la Limite de Taille

**Si tu veux analyser des PDFs > 10 MB :**

1. Ouvre le **Node 3 : Smart Filter**
2. Ligne 20 : Change `if (fileSize < 10485760)`
3. Remplace `10485760` par `20971520` (20 MB) ou autre
4. ⚠️ Attention : Coût API plus élevé

### Modifier les Types Analysés

**Si tu veux aussi analyser les DPGF :**

1. Ouvre le **Node 7 : Filter Relevant + Duplicates**
2. Ligne 7 : Change `const relevantTypes = ['CCAP', 'REGLEMENT', 'PLANNING', 'NOTICE'];`
3. Ajoute `'DPGF'` : `const relevantTypes = ['CCAP', 'REGLEMENT', 'PLANNING', 'NOTICE', 'DPGF'];`
4. Save et re-teste

### Augmenter le Détail des Analyses

**Si tu veux des analyses plus longues :**

1. Ouvre le **Node 9 : Claude Full Analysis**
2. Ligne 21 : Change `max_tokens: 1024`
3. Remplace par `2048` ou `3000`
4. ⚠️ Attention : Coût API doublé

---

## 📊 Résultats de Tests (Template)

Utilise ce template pour documenter tes tests :

```
=== TEST #__ ===
Date : __/__/2024
Durée : ____ min

Configuration :
- Nombre de fichiers : ____
- Taille totale ZIP : ____ MB
- Types de docs : ____

Résultats :
- ✅/❌ Workflow success
- Temps réel : ____ min
- Coût API : $____
- PDFs analysés : ____
- Classification correcte : __%

Bugs/Problèmes :
- [Liste ici]

Actions :
- [Ce qu'il faut ajuster]
```

---

## 🎯 Critères de Succès Final

Le POC est validé et prêt pour la démo si :

✅ **Test 2** (20-30 PDFs) passe avec succès
✅ Classification correcte à >80%
✅ Temps < 5 min
✅ Coût < $1
✅ HTML professionnel et lisible
✅ Aucun crash même avec fichiers corrompus

---

## 🎥 Préparer la Démo Vidéo

Une fois tous les tests passés :

### Checklist Pré-Démo

- [ ] Prépare un DCE de démo "propre" (15-20 fichiers)
- [ ] Nettoie l'historique d'exécutions n8n
- [ ] Teste une dernière fois pour chronométrer exactement
- [ ] Prépare un script de présentation (voir README)
- [ ] Configure ton outil de screen recording (Loom)

### Script Vidéo Suggéré (2m30)

**00:00 - 00:15** : Intro
- "Bonjour, analyse automatique d'un DCE de 20 fichiers en 3 minutes"

**00:15 - 00:45** : Upload
- Montre Postman avec le ZIP
- Clique sur Send
- Split screen : workflow n8n qui s'exécute en temps réel

**00:45 - 02:15** : Résultat HTML
- Ouvre le HTML
- Scroll sur les statistiques
- Montre 1-2 analyses de documents
- Pointe le warning de doublons
- Montre la liste des Excel

**02:15 - 02:30** : Conclusion
- "Gain de temps : 2h → 3 min"
- "Coût : $0.60"
- "Contact : [email]"

---

## 📞 Support

Si tu rencontres des problèmes pendant les tests, consulte :
1. `README.md` section Troubleshooting
2. `TROUBLESHOOTING-CHECKLIST.md` (checklist détaillée)
3. Logs d'exécution n8n

Bon test ! 🚀

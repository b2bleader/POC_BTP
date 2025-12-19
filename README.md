# 🏗️ POC Analyse Automatisée DCE BTP

## 📋 Description

Proof of Concept pour l'analyse automatique de dossiers d'appels d'offres (DCE) du secteur BTP.

**Fonctionnalités :**
- Upload d'un ZIP contenant 50-100 fichiers (PDFs + Excel)
- Classification automatique des PDFs par contenu (IA)
- Analyse détaillée des documents décisionnels (CCAP, Règlement, Planning, Notice)
- Détection automatique des modificatifs et doublons
- Génération d'un rapport HTML professionnel

**Technologies :**
- N8N (workflow automation)
- Claude 3.5 Sonnet (Anthropic API)
- Traitement de fichiers binaires (ZIP, PDF, Excel)

---

## 🚀 Installation

### Prérequis

1. **N8N Cloud ou Self-Hosted** (version 1.0+)
2. **Clé API Anthropic Claude** ([obtenir ici](https://console.anthropic.com/))
3. **Budget API** : ~$0.60 par DCE analysé

### Étapes d'installation

1. **Importe le workflow dans n8n :**
   - Ouvre n8n
   - Clique sur "Import from File"
   - Sélectionne `workflow-dce-analysis.json`

2. **Configure ta clé API Claude :**
   - Ouvre le workflow importé
   - Édite le **Node 5** (Code - Claude Classification)
   - Ligne 2 : Remplace `YOUR_API_KEY_HERE` par ta clé API
   - Édite le **Node 9** (Code - Claude Full Analysis)
   - Ligne 2 : Remplace `YOUR_API_KEY_HERE` par ta clé API

3. **Active le workflow :**
   - Clique sur "Active" en haut à droite
   - Note l'URL du webhook (format : `https://[instance].app.n8n.cloud/webhook/analyze-dce`)

---

## 🧪 Guide de Test

### Test Rapide (5 minutes)

1. **Prépare un ZIP de test :**
   - Crée un dossier avec 3-5 PDFs (vrais docs d'appel d'offres si possible)
   - Ajoute 1-2 fichiers Excel
   - Compresse en ZIP (< 50 MB pour le test)

2. **Envoie le ZIP via Postman/cURL :**

   **Avec cURL :**
   ```bash
   curl -X POST \
     https://[ton-instance].app.n8n.cloud/webhook/analyze-dce \
     -F "data=@/chemin/vers/ton-dce-test.zip" \
     -H "Content-Type: multipart/form-data" \
     > resultat.html
   ```

   **Avec Postman :**
   - Method: POST
   - URL: `https://[ton-instance].app.n8n.cloud/webhook/analyze-dce`
   - Body > form-data
   - Key: `data` (type: File)
   - Value: Sélectionne ton ZIP
   - Send
   - Copy/paste la réponse dans un fichier `.html`

3. **Ouvre le HTML généré dans un navigateur**

---

## 📊 Résultats Attendus

### Exemple de Sortie HTML

Le rapport HTML contient :

✅ **Statistiques globales**
- Nombre de fichiers reçus
- PDFs traités vs ignorés
- Temps de traitement

✅ **Warnings si doublons détectés**
- Ex: "3 documents CCAP détectés - Vérifier les versions"

✅ **Analyse détaillée de chaque document pertinent**
- Scope du document
- 3-5 points critiques
- Dates clés identifiées
- Badge 🔄 si modificatif détecté

✅ **Liste des fichiers Excel** (nom + taille)

✅ **Liste des fichiers ignorés** (avec raisons)

### Temps de Traitement

| Nombre de PDFs | Temps estimé |
|----------------|--------------|
| 5 PDFs | ~30-45s |
| 20 PDFs | ~2-3 min |
| 40 PDFs | ~4-5 min |

### Coût API

| Opération | Coût unitaire | Quantité (40 PDFs) | Total |
|-----------|---------------|-------------------|-------|
| Classification | ~$0.005/call | 40 calls | $0.20 |
| Analyse détaillée | ~$0.04/call | 10 calls | $0.40 |
| **TOTAL** | | | **~$0.60** |

---

## 🔧 Configuration Avancée

### Ajuster les Limites

**Node 3 (Smart Filter) - Ligne 31-32 :**
```javascript
// Limite à 40 PDFs
const selectedPdfs = pdfs.slice(0, 40);
```
➡️ Change `40` pour analyser plus/moins de PDFs

**Node 3 (Smart Filter) - Ligne 20 :**
```javascript
if (fileSize < 10485760) { // 10 MB en bytes
```
➡️ Change `10485760` pour modifier la limite de taille (10 MB = 10485760 bytes)

### Modifier les Types de Documents Analysés

**Node 7 (Filter Relevant) - Ligne 7 :**
```javascript
const relevantTypes = ['CCAP', 'REGLEMENT', 'PLANNING', 'NOTICE'];
```
➡️ Ajoute/retire des types selon tes besoins (ex: ajouter `'DPGF'`)

### Personnaliser les Prompts Claude

**Classification (Node 5 - Lignes 13-40) :**
- Modifie la liste des types de documents
- Ajuste les instructions selon ta nomenclature

**Analyse détaillée (Node 9 - Lignes 45-85) :**
- Personnalise les critères d'extraction par type de document
- Ajuste le niveau de détail (concis vs exhaustif)

---

## ❌ Troubleshooting

### Erreur : "Invalid API Key"

**Cause :** Clé API Claude non configurée ou invalide

**Solution :**
1. Vérifie que tu as bien remplacé `YOUR_API_KEY_HERE` dans les Nodes 5 et 9
2. Teste ta clé API sur [console.anthropic.com](https://console.anthropic.com/)
3. Vérifie qu'il n'y a pas d'espaces avant/après la clé

### Erreur : "Workflow timeout"

**Cause :** Trop de fichiers ou fichiers trop lourds

**Solution :**
1. Réduis la limite de PDFs dans Node 3 (ligne 32) à 20-30
2. Vérifie que les PDFs < 10 MB
3. Dans n8n Settings > Workflow Settings > Execution Timeout : augmente à 300s (5 min)

### Erreur : "Cannot read property 'data' of undefined"

**Cause :** Le ZIP n'a pas été correctement uploadé

**Solution :**
1. Vérifie le format de ta requête POST
2. Assure-toi que le champ form-data s'appelle bien `data`
3. Vérifie que le Content-Type est `multipart/form-data`

### Le HTML affiche "Aucun document pertinent"

**Cause :** Tous les PDFs ont été classifiés comme PLANS/ANNEXE/INCONNU

**Solution :**
1. Vérifie que tes PDFs contiennent bien du texte (pas que des images)
2. Teste avec des PDFs plus "standards" (CCAP, règlements officiels)
3. Augmente le `max_tokens` de classification (Node 5, ligne 54) à 100

### L'analyse d'un PDF retourne une erreur

**Cause :** PDF corrompu, trop lourd, ou protégé

**Solution :**
1. C'est normal, le workflow continue avec les autres PDFs
2. Vérifie le HTML, la section "Documents analysés" affichera "❌ Erreur"
3. Consulte manuellement le PDF problématique

---

## 📈 Métriques de Succès

Le POC est considéré comme réussi si :

✅ Upload d'un ZIP de 50+ fichiers (200+ MB) fonctionne
✅ Classification correcte à >80% (CCAP détecté comme CCAP, pas comme PLANS)
✅ Identification de 5-15 documents pertinents sur 50-80 PDFs
✅ Temps total < 5 minutes
✅ Coût < $1 par DCE
✅ HTML professionnel et lisible
✅ Gestion d'erreur gracieuse (pas de crash si 1 PDF est corrompu)

---

## 🎯 Cas d'Usage Réels

### Cas 1 : DCE Classique (80 fichiers, 300 MB)

**Contenu typique :**
- 5-8 documents administratifs (CCAP, Règlement, etc.)
- 40-50 plans techniques (lourds, ignorés)
- 10-15 annexes et documents divers
- 5-10 fichiers Excel (DPGF, quantitatifs)

**Résultat attendu :**
- 6-10 documents analysés en détail
- Temps : ~3-4 minutes
- Coût : ~$0.50-0.70

### Cas 2 : Modificatif d'un DCE (15 fichiers, 50 MB)

**Contenu typique :**
- 2-3 documents modificatifs (CCAP v2, Planning rectifié)
- 5-8 PDFs originaux (pour contexte)
- 2-3 Excel mis à jour

**Résultat attendu :**
- Détection automatique des modificatifs (badge 🔄)
- Warning des doublons (ex: "2 documents CCAP détectés")
- Section "Impact du modificatif" dans l'analyse
- Temps : ~1-2 minutes
- Coût : ~$0.30-0.40

---

## 📚 Documentation Complémentaire

### Architecture du Workflow

```
[Webhook] → [Extract ZIP] → [Smart Filter]
                                    ↓
                           [Classification Loop]
                                    ↓
                            [Filter Relevant]
                                    ↓
                            [Analysis Loop]
                                    ↓
                           [Generate HTML] → [Respond]
```

### Nodes Clés

| Node | Rôle | Critique |
|------|------|----------|
| 3 - Smart Filter | Limite PDFs, sépare Excel | Oui |
| 5 - Claude Classification | Identifie type de document | Oui |
| 7 - Filter Relevant | Garde docs décisionnels | Oui |
| 9 - Claude Full Analysis | Extraie infos critiques | Oui |
| 11 - Generate HTML | Formate le rapport | Oui |

### Variables Globales (Métadonnées)

Propagées via `_metadata` dans chaque item :

```javascript
{
  startTime: 1703001234567,
  totalFiles: 87,
  totalPdfs: 63,
  selectedPdfs: 40,
  excelFiles: [{fileName: "DPGF.xlsx", fileSizeMB: "2.3 MB"}, ...],
  ignoredFiles: [{fileName: "Plan_1.pdf", reason: "Taille > 10 MB"}, ...],
  duplicates: [{type: "CCAP", count: 2, warning: "..."}, ...],
  relevantDocsCount: 8,
  errorDocsCount: 1
}
```

---

## 🎥 Démo Vidéo (Loom)

**Script suggéré pour la vidéo :**

1. **Intro (15s)**
   - "Bonjour, je vais vous montrer comment analyser automatiquement un DCE de 80 fichiers en 3 minutes"

2. **Upload (30s)**
   - Montre Postman avec le ZIP prêt
   - Clique sur Send
   - Montre le workflow n8n qui s'exécute en temps réel

3. **Résultat (1m30)**
   - Ouvre le HTML généré
   - Survole les statistiques
   - Montre un exemple d'analyse de CCAP
   - Pointe les warnings de doublons
   - Montre la liste des Excel

4. **Conclusion (15s)**
   - "Gain de temps : 2 heures d'analyse → 3 minutes"
   - "Coût : $0.60 par DCE"
   - "Contact : [email]"

**Durée totale :** ~2m30

---

## 🔄 Roadmap (Version 2)

Features prévues pour la version production :

- ✅ Analyse des fichiers Excel (DPGF, quantitatifs)
- ✅ Classification plus fine (sous-types de documents)
- ✅ Extraction automatique des critères de jugement
- ✅ Calcul du score de compatibilité (match candidat vs exigences)
- ✅ Export PDF + Excel du rapport
- ✅ Envoi automatique par email
- ✅ Historique des DCE analysés (base de données)
- ✅ Comparaison entre plusieurs DCE
- ✅ Alertes sur délais critiques

---

## 📞 Support

**Créé par :** FlowMinds Automation
**Contact :** [Ton email]
**Version :** 1.0 (POC)
**Date :** Décembre 2024

**Documentation API Claude :**
https://docs.anthropic.com/claude/reference/messages_post

**Documentation N8N :**
https://docs.n8n.io/

---

## 📄 Licence

Ce POC est fourni à titre de démonstration commerciale.
Tous droits réservés © FlowMinds Automation 2024

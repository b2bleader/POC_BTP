# 🔧 Troubleshooting Checklist - POC Analyse DCE BTP

## 📋 Table des Matières

1. [Diagnostic Rapide](#diagnostic-rapide)
2. [Erreurs d'API Claude](#erreurs-dapi-claude)
3. [Erreurs de Workflow n8n](#erreurs-de-workflow-n8n)
4. [Problèmes de Performance](#problèmes-de-performance)
5. [Problèmes de Qualité des Analyses](#problèmes-de-qualité-des-analyses)
6. [Problèmes de HTML/Affichage](#problèmes-de-htmlaffichage)
7. [Debug Avancé](#debug-avancé)

---

## 🚨 Diagnostic Rapide

### Le workflow ne se déclenche pas du tout

**Symptôme** : Aucune exécution n'apparaît dans n8n après avoir envoyé le POST

#### ✅ Checklist :

- [ ] **Le workflow est actif** (toggle "Active" en vert)
- [ ] **L'URL du webhook est correcte** (copie-la depuis le node Webhook)
- [ ] **La méthode HTTP est POST** (pas GET)
- [ ] **Le champ form-data s'appelle bien `data`** (sensible à la casse)
- [ ] **Le Content-Type est `multipart/form-data`**

#### 🔍 Test :

```bash
# Test basique pour vérifier que le webhook répond
curl -X POST "https://[instance].app.n8n.cloud/webhook/analyze-dce" \
  -F "data=@test.txt" \
  -v
```

Si tu vois `HTTP/1.1 404 Not Found` → L'URL est incorrecte
Si tu vois `HTTP/1.1 500 Internal Server Error` → Le workflow crash (voir logs)

---

### Le workflow démarre mais crash immédiatement

**Symptôme** : Exécution apparaît dans n8n avec statut "Error" (rouge)

#### ✅ Checklist :

1. **Clique sur l'exécution** dans n8n
2. **Identifie le node rouge** (celui qui a échoué)
3. **Clique sur le node rouge** pour voir l'erreur exacte
4. **Note le message d'erreur** et cherche dans les sections ci-dessous

---

## 🔑 Erreurs d'API Claude

### Erreur : "Invalid API Key"

**Message complet** :
```
Error: API Error: 401 Unauthorized
```

#### ✅ Solutions :

1. **Vérifie que ta clé API est correcte** :
   - Ouvre https://console.anthropic.com/
   - Onglet "API Keys"
   - Copie une clé valide

2. **Vérifie qu'elle est bien configurée dans les 2 nodes** :
   - Node 5 : Claude Classification (ligne 2)
   - Node 9 : Claude Full Analysis (ligne 2)

3. **Vérifie qu'il n'y a pas d'espaces** :
   ```javascript
   // ❌ MAUVAIS
   const ANTHROPIC_API_KEY = ' sk-ant-api03-xxx '; // espaces avant/après

   // ✅ BON
   const ANTHROPIC_API_KEY = 'sk-ant-api03-xxx';
   ```

4. **Vérifie que la clé n'a pas expiré** :
   - Sur console.anthropic.com, vérifie le statut de la clé

---

### Erreur : "Rate limit exceeded"

**Message complet** :
```
Error: API Error: 429 Too Many Requests
```

#### ✅ Solutions :

1. **Attends 1 minute** et réessaye

2. **Réduis le nombre de PDFs traités** :
   - Node 3 : Change `const selectedPdfs = pdfs.slice(0, 40);` → `pdfs.slice(0, 20)`

3. **Ajoute un délai entre les appels** (solution avancée) :
   - Dans Node 5 et Node 9, ajoute avant le `fetch()` :
   ```javascript
   // Attends 2 secondes entre chaque appel
   await new Promise(resolve => setTimeout(resolve, 2000));
   ```

---

### Erreur : "Insufficient credits"

**Message complet** :
```
Error: API Error: 402 Payment Required
```

#### ✅ Solutions :

1. **Recharge ton compte Anthropic** :
   - https://console.anthropic.com/settings/billing
   - Ajoute au moins $10 de crédit

2. **Vérifie tes limites de dépense** :
   - Settings > Usage Limits
   - Augmente si nécessaire

---

### Erreur : "Request too large"

**Message complet** :
```
Error: API Error: 413 Payload Too Large
```

#### ✅ Solutions :

1. **Le PDF est trop volumineux** (>10 MB après base64)
   - C'est normal, le filtrage du Node 3 devrait l'éliminer
   - Vérifie que le filtre fonctionne :
   ```javascript
   // Node 3, ligne 20
   if (fileSize < 10485760) { // 10 MB
   ```

2. **Réduis la limite de taille** :
   - Change `10485760` par `5242880` (5 MB)

---

## ⚙️ Erreurs de Workflow n8n

### Erreur : "Cannot read property 'data' of undefined"

**Symptôme** : Crash au node "Smart Filter" ou "Claude Classification"

#### ✅ Solutions :

1. **Le ZIP n'a pas été correctement extrait** :
   - Vérifie que le node "Extract from File" est configuré avec :
     - Binary Property: `data`
     - Output Format: `Each File as Separate Item`

2. **Le fichier uploadé n'est pas un ZIP** :
   - Vérifie que tu envoies bien un `.zip`
   - Test avec un ZIP simple (3-4 fichiers)

3. **Le champ form-data n'est pas nommé `data`** :
   - Dans Postman, vérifie que le champ s'appelle exactement `data`

---

### Erreur : "Workflow timeout"

**Message complet** :
```
Error: Workflow execution timed out after 120 seconds
```

#### ✅ Solutions :

1. **Augmente le timeout** :
   - Dans n8n, clique sur les 3 points (⋯) en haut à droite
   - Settings > Workflow Settings
   - Execution Timeout: `300` (5 minutes)
   - Save

2. **Réduis le nombre de PDFs** :
   - Node 3, ligne 32 : `const selectedPdfs = pdfs.slice(0, 20);`

3. **Réduis le nombre de tokens Claude** :
   - Node 9, ligne 21 : Change `max_tokens: 1024` → `512`

---

### Erreur : "Memory limit exceeded"

**Symptôme** : Le workflow crash sans message clair, ou n8n devient très lent

#### ✅ Solutions :

1. **Ton ZIP est trop volumineux** (>500 MB)
   - Limite : 200-300 MB max pour n8n Cloud standard

2. **Trop de fichiers en mémoire simultanément** :
   - Réduis la limite de PDFs (Node 3)
   - Change `pdfs.slice(0, 40)` → `pdfs.slice(0, 15)`

3. **Upgrade n8n plan** :
   - Plan Pro : Gère jusqu'à 500 MB

---

### Erreur : "Split in Batches loop error"

**Symptôme** : Le workflow boucle indéfiniment ou ne passe pas au node suivant

#### ✅ Solutions :

1. **Vérifie que l'Aggregate est bien connecté** :
   - Node 6 doit être connecté APRÈS le loop de classification
   - Node 10 doit être connecté APRÈS le loop d'analyse

2. **Vérifie que les connections sont correctes** :
   - Node 5 (Claude Classification) doit retourner à Node 4 (Split in Batches)
   - Ensuite Node 4 doit aussi se connecter à Node 6 (Aggregate)

3. **Si le problème persiste** :
   - Supprime les nodes Split in Batches et Aggregate
   - Réimporte le workflow depuis le JSON

---

## 🐌 Problèmes de Performance

### Le workflow est très lent (>10 min)

#### ✅ Checklist :

- [ ] **Combien de PDFs sont traités ?** (regarde Node 3 output)
  - Si > 40 : Réduis la limite
- [ ] **Quelle est la taille moyenne des PDFs ?** (regarde les stats dans n8n)
  - Si > 5 MB : Augmente le timeout
- [ ] **Y a-t-il des retries Claude ?** (regarde les logs)
  - Si oui : Problème réseau ou rate limit

#### 🔍 Test de Performance :

1. **Ouvre l'exécution dans n8n**
2. **Clique sur chaque node**
3. **Note le temps d'exécution** (affiché en haut à droite)

| Node | Temps attendu | Temps réel |
|------|---------------|------------|
| Smart Filter | < 2s | ___s |
| Claude Classification (loop) | ~60s pour 40 PDFs | ___s |
| Filter Relevant | < 1s | ___s |
| Claude Full Analysis (loop) | ~90s pour 10 PDFs | ___s |
| Generate HTML | < 2s | ___s |

**Si un node est beaucoup plus lent** :
- Classification lente → Problème réseau ou PDFs lourds
- Analyse lente → Augmente le timeout, réduis max_tokens
- HTML lent → Bug dans le code, vérifie les logs

---

### Le coût API est trop élevé (>$2 par DCE)

#### ✅ Solutions :

1. **Vérifie combien de PDFs sont analysés** :
   - Node 7 output : regarde `relevantDocsCount`
   - Si > 15 : C'est normal, beaucoup de docs pertinents

2. **Réduis le max_tokens** :
   - Node 9, ligne 21 : Change `1024` → `512`
   - Économise ~50% sur l'analyse détaillée

3. **Filtre plus agressivement** :
   - Node 7, ligne 7 : Retire un type
   - Ex : `['CCAP', 'REGLEMENT']` (analyse que les 2 plus importants)

4. **Vérifie qu'il n'y a pas d'erreurs en boucle** :
   - Si un PDF échoue et retry → Coût x2-3
   - Regarde les logs d'exécution

---

## 🎯 Problèmes de Qualité des Analyses

### Les types de documents sont mal classifiés

**Symptôme** : Un CCAP est classé comme PLANS, un Règlement comme ANNEXE, etc.

#### ✅ Solutions :

1. **Vérifie que les PDFs contiennent du texte** :
   - Si c'est juste une image scannée → Claude ne peut pas lire
   - Solution : Utilise un OCR avant (version 2)

2. **Ajuste le prompt de classification** :
   - Node 5, lignes 13-40 : Modifie le prompt
   - Ajoute des exemples de contenu typique par type

3. **Augmente le max_tokens de classification** :
   - Node 5, ligne 54 : Change `max_tokens: 50` → `100`
   - Claude aura plus de "place" pour réfléchir

4. **Test manuel** :
   - Ouvre un PDF mal classifié
   - Regarde les 3 premières pages
   - Si ce sont des pages de garde vides → Normal
   - Si le contenu est ambigu → Ajuste le prompt

---

### Les analyses sont trop vagues ou inexactes

**Symptôme** : "Points critiques" ne sont pas pertinents, dates manquantes

#### ✅ Solutions :

1. **Augmente le max_tokens d'analyse** :
   - Node 9, ligne 21 : Change `1024` → `2048`

2. **Améliore le prompt d'analyse** :
   - Node 9, lignes 45-85 : Ajoute des instructions plus spécifiques
   - Ex : "Extrais TOUTES les dates au format JJ/MM/AAAA"

3. **Vérifie que le PDF n'est pas trop long** :
   - Claude a une limite de ~200 pages
   - Si > 200 pages : Ignore ou traite en 2 fois

4. **Test A/B** :
   - Fais analyser le même PDF avec différents prompts
   - Compare les résultats
   - Garde le meilleur prompt

---

### Claude hallucine (invente des informations)

**Symptôme** : Dates qui n'existent pas, infos non présentes dans le PDF

#### ✅ Solutions :

1. **Ajoute une instruction anti-hallucination** :
   - Node 9, après le prompt, ajoute :
   ```javascript
   CRITIQUE : Si tu ne trouves PAS une information, écris "Non mentionné" au lieu d'inventer.
   ```

2. **Réduis la "créativité"** de Claude :
   - Ajoute dans le payload (Node 9, ligne 15) :
   ```javascript
   const payload = {
     model: 'claude-3-5-sonnet-20241022',
     max_tokens: 1024,
     temperature: 0, // ← Ajoute cette ligne
     messages: [...]
   };
   ```

3. **Vérifie manuellement** :
   - Si l'hallucination persiste, c'est un bug du prompt
   - Simplifie les instructions

---

## 🖼️ Problèmes de HTML/Affichage

### Le HTML est cassé (code brut visible)

**Symptôme** : Le navigateur affiche du texte brut au lieu d'une page stylée

#### ✅ Solutions :

1. **Vérifie le Content-Type** :
   - Node 12 (Respond to Webhook) doit avoir :
   - Header : `Content-Type` = `text/html; charset=utf-8`

2. **Vérifie que le HTML est complet** :
   - Ouvre l'exécution dans n8n
   - Clique sur Node 11 (Generate HTML)
   - Vérifie que `json.html` commence par `<!DOCTYPE html>`

3. **Copie le HTML manuellement** :
   - Si le problème persiste, copie le contenu de `json.html`
   - Colle dans un fichier `.html` local
   - Ouvre dans le navigateur

---

### Les caractères spéciaux sont mal affichés (é → Ã©)

**Symptôme** : Les accents et caractères français sont corrompus

#### ✅ Solutions :

1. **Force l'encoding UTF-8** :
   - Node 11, ligne 100 (dans le HTML) :
   ```html
   <meta charset="UTF-8">
   ```
   (Normalement déjà présent)

2. **Vérifie le Content-Type** :
   - Node 12 : `text/html; charset=utf-8` (pas juste `text/html`)

---

### Les statistiques sont incorrectes

**Symptôme** : "5 PDFs traités" mais le HTML en montre 10

#### ✅ Solutions :

1. **Regarde les métadonnées propagées** :
   - Ouvre l'exécution n8n
   - Clique sur Node 11
   - Vérifie `_metadata.totalPdfs` vs `_metadata.selectedPdfs`

2. **Bug de comptage** :
   - Si les chiffres ne matchent pas, il y a un bug dans Node 3
   - Vérifie la logique de filtrage

---

## 🔬 Debug Avancé

### Activer les Logs Détaillés

1. **Dans chaque Code node, ajoute des console.log** :
   ```javascript
   console.log('=== NODE 5 START ===');
   console.log('fileName:', fileName);
   console.log('base64Data length:', base64Data.length);
   // ... ton code ...
   console.log('documentType:', documentType);
   console.log('=== NODE 5 END ===');
   ```

2. **Regarde les logs** :
   - Dans n8n, ouvre l'exécution
   - Clique sur le node
   - Onglet "Console" (si disponible) ou regarde les outputs

---

### Tester un Node Individuellement

1. **Désactive le webhook** :
   - Clique sur le workflow
   - Toggle "Active" → OFF

2. **Clique sur "Execute Workflow"** (bouton en haut)

3. **Ajoute des données de test** :
   - Dans Node 1 (Webhook), clique sur "Add Test Data"
   - Ou skip et injecte des données manuellement dans Node 3

4. **Exécute node par node** :
   - Clique sur chaque node
   - Clique sur "Execute Node"
   - Vérifie l'output

---

### Export des Logs pour Support

Si tu dois demander de l'aide :

1. **Exporte l'exécution** :
   - Clique sur l'exécution dans n8n
   - Clique sur "..." → "Download execution data"

2. **Screenshot** :
   - Capture d'écran du workflow avec les nodes rouges
   - Screenshot de l'erreur exacte

3. **Envoie** :
   - execution.json
   - Screenshots
   - Description du problème

---

## 📊 Métriques de Santé

Utilise ce tableau pour monitorer la santé du workflow :

| Métrique | Valeur cible | Valeur actuelle | Status |
|----------|--------------|-----------------|--------|
| Success rate | >95% | ___% | ✅/❌ |
| Avg time (20 PDFs) | <3 min | ___min | ✅/❌ |
| Avg cost per DCE | <$0.80 | $____ | ✅/❌ |
| Classification accuracy | >80% | ___% | ✅/❌ |
| Timeouts | 0% | ___% | ✅/❌ |

**Comment calculer :**
- Success rate : (Exécutions réussies / Total) x 100
- Avg time : Moyenne des temps d'exécution
- Avg cost : Coût total API / Nombre d'exécutions
- Classification accuracy : Vérifie manuellement 10 PDFs, compte les corrects
- Timeouts : Nombre d'exécutions timeout / Total

---

## 🆘 Cas Extrêmes

### "Tout est cassé, je ne sais pas quoi faire"

1. **Réimporte le workflow depuis le JSON** :
   - Supprime le workflow actuel
   - Réimporte `workflow-dce-analysis.json`

2. **Reconfigure les clés API** (Nodes 5 et 9)

3. **Teste avec un micro-ZIP** (1 seul PDF de 1 page)

4. **Si ça ne marche toujours pas** :
   - Vérifie que tu es sur n8n v1.0+
   - Vérifie que ton instance n8n n'a pas de restrictions (firewall, etc.)

---

### "n8n cloud ne répond plus"

1. **Vérifie le status de n8n** :
   - https://status.n8n.io/

2. **Essaye en navigation privée** :
   - Parfois un problème de cache

3. **Contacte le support n8n** :
   - support@n8n.io

---

## 📞 Support Final

Si après avoir tout essayé, ça ne fonctionne toujours pas :

1. **Relis le README.md**
2. **Relis le GUIDE-TEST-COMPLET.md**
3. **Vérifie cette checklist entièrement**
4. **Collecte tous les logs et screenshots**
5. **Contacte [ton email de support]**

Bonne chance avec le debug ! 🔧

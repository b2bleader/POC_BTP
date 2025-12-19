// =========================================
// NODE 11 : Generate HTML - CODE COMPLET
// =========================================
// ⚠️ COPIE CE CODE DANS LE NODE 11 DU WORKFLOW
// ⚠️ Type : Function Node

// Récupère tous les résultats d'analyse
const items = $input.all();

// Cas spécial : aucun doc pertinent
if (items.length === 1 && items[0].json.noRelevantDocs) {
  const metadata = items[0].json._metadata;
  const endTime = Date.now();
  const processingTime = ((endTime - metadata.startTime) / 1000).toFixed(1);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyse DCE - Aucun Document Pertinent</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .warning-box { background: #fff3cd; border-left: 5px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .stats { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0; }
        footer { text-align: center; margin-top: 50px; color: #666; padding: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Analyse Dossier de Consultation d'Entreprises</h1>
        <p>Généré par FlowMinds Automation</p>
    </div>

    <div class="warning-box">
        <h2>⚠️ AUCUN DOCUMENT DÉCISIONNEL IDENTIFIÉ</h2>
        <p>L'analyse automatique n'a pas détecté de documents pertinents (CCAP, Règlement, Planning, Notice) dans ce DCE.</p>
        <p><strong>Raisons possibles :</strong></p>
        <ul>
            <li>Les documents ont été classifiés comme Plans techniques ou Annexes</li>
            <li>Les fichiers dépassent la limite de 10 MB</li>
            <li>Erreur de nomenclature inhabituelle</li>
        </ul>
        <p><strong>Action recommandée :</strong> Vérifier manuellement le contenu du DCE ou contacter le support.</p>
    </div>

    <div class="stats">
        <h3>📊 Statistiques</h3>
        <p><strong>📦 Fichiers reçus :</strong> ${metadata.totalFiles}</p>
        <p><strong>📄 PDFs traités :</strong> ${metadata.selectedPdfs} / ${metadata.totalPdfs}</p>
        <p><strong>📊 Fichiers Excel :</strong> ${metadata.excelFiles?.length || 0}</p>
        <p><strong>⏱️ Temps de traitement :</strong> ${processingTime}s</p>
    </div>

    <footer>
        <p>Généré le ${new Date().toLocaleString('fr-FR')} • FlowMinds Automation © 2024</p>
    </footer>
</body>
</html>`;

  return { json: { html } };
}

// Traitement normal
const metadata = items[0]?.json._metadata || {};
const endTime = Date.now();
const processingTime = ((endTime - metadata.startTime) / 1000).toFixed(1);

// Génère les cartes de documents analysés
let documentCards = '';
let analysisErrorCount = 0;

for (const item of items) {
  const doc = item.json;

  if (doc.analysisError) {
    analysisErrorCount++;
    documentCards += `
    <div class="document error">
        <h3>❌ ${doc.fileName} (${doc.fileSizeMB})</h3>
        <p class="meta">Type : ${doc.documentType} • Erreur d'analyse</p>
        <div class="error-message">
            <p><strong>Erreur :</strong> ${doc.analysisError}</p>
            <p>Ce document n'a pas pu être analysé. Veuillez le consulter manuellement.</p>
        </div>
    </div>`;
  } else {
    const modifBadge = doc.isModificatif ? ' 🔄' : '';
    const dupBadge = doc.isDuplicate ? ' ⚠️' : '';

    documentCards += `
    <div class="document">
        <h3>📄 ${doc.fileName}${modifBadge}${dupBadge} <span class="size">(${doc.fileSizeMB})</span></h3>
        <p class="meta">Type : <strong>${doc.documentType}</strong> • Analysé en ${doc.analysisTime}</p>
        <div class="analysis-content">
            ${doc.analysis.replace(/\n/g, '<br>')}
        </div>
    </div>`;
  }
}

// Génère la section warnings si doublons
let duplicatesSection = '';
if (metadata.duplicates && metadata.duplicates.length > 0) {
  duplicatesSection = `
    <div class="warning-box">
        <h3>⚠️ ATTENTION : Documents multiples du même type</h3>
        <ul>
            ${metadata.duplicates.map(d => `<li><strong>${d.type}</strong> : ${d.count} documents détectés → ${d.warning}</li>`).join('')}
        </ul>
        <p><strong>→ Vérifiez les éventuelles contradictions entre versions, modificatifs ou compléments</strong></p>
    </div>`;
}

// Génère la liste des Excel
let excelList = '';
if (metadata.excelFiles && metadata.excelFiles.length > 0) {
  excelList = metadata.excelFiles.map(excel =>
    `<li>📈 ${excel.fileName} <span class="size">(${excel.fileSizeMB} MB)</span></li>`
  ).join('');
} else {
  excelList = '<li class="no-data">Aucun fichier Excel détecté</li>';
}

// Génère la section fichiers ignorés si applicable
let ignoredSection = '';
if (metadata.ignoredFiles && metadata.ignoredFiles.length > 0) {
  const ignoredCount = metadata.ignoredFiles.length;
  ignoredSection = `
    <div class="info-box">
        <h3>ℹ️ Fichiers non analysés (${ignoredCount})</h3>
        <details>
            <summary>Voir la liste des fichiers ignorés</summary>
            <ul class="ignored-list">
                ${metadata.ignoredFiles.map(f => `<li>${f.fileName} <em>(${f.reason})</em></li>`).join('')}
            </ul>
        </details>
    </div>`;
}

// Template HTML complet
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analyse DCE - Résultats</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header h1 { margin-bottom: 10px; font-size: 28px; }
        .header p { opacity: 0.9; font-size: 14px; }

        .stats {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .stats p {
            padding: 10px;
            background: #f8f9fa;
            border-radius: 5px;
            font-size: 14px;
        }
        .stats strong { color: #667eea; }

        .warning-box {
            background: #fff3cd;
            border-left: 5px solid #ffc107;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .warning-box h3 { color: #856404; margin-bottom: 15px; }
        .warning-box ul { margin-left: 20px; margin-top: 10px; }
        .warning-box li { margin: 5px 0; }

        .info-box {
            background: #d1ecf1;
            border-left: 5px solid #17a2b8;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .info-box h3 { color: #0c5460; margin-bottom: 10px; }
        .info-box details { margin-top: 10px; }
        .info-box summary { cursor: pointer; font-weight: bold; padding: 10px; background: rgba(255,255,255,0.5); border-radius: 5px; }
        .info-box summary:hover { background: rgba(255,255,255,0.8); }
        .ignored-list { margin: 15px 0 0 20px; font-size: 13px; }
        .ignored-list li { margin: 5px 0; }
        .ignored-list em { color: #666; }

        h2 {
            color: #333;
            margin: 30px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 3px solid #667eea;
        }

        .document {
            background: white;
            border: 1px solid #e0e0e0;
            padding: 25px;
            margin: 20px 0;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            transition: box-shadow 0.3s;
        }
        .document:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
        .document.error {
            border-color: #ef4444;
            background: #fef2f2;
        }
        .document h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 18px;
            word-break: break-word;
        }
        .document .size {
            font-size: 14px;
            color: #666;
            font-weight: normal;
        }
        .meta {
            color: #6b7280;
            font-size: 13px;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        .analysis-content {
            font-size: 14px;
            line-height: 1.8;
        }
        .analysis-content strong { color: #333; }
        .error-message {
            color: #dc2626;
            padding: 15px;
            background: white;
            border-radius: 5px;
        }

        .excel-section {
            background: white;
            padding: 25px;
            border-radius: 10px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .excel-section h2 { margin-top: 0; }
        .excel-list {
            list-style: none;
            margin-top: 15px;
        }
        .excel-list li {
            padding: 12px;
            margin: 8px 0;
            background: #f8f9fa;
            border-radius: 5px;
            border-left: 3px solid #10b981;
        }
        .excel-list .no-data {
            color: #6b7280;
            font-style: italic;
            border-left-color: #d1d5db;
        }
        .excel-note {
            margin-top: 15px;
            padding: 10px;
            background: #eff6ff;
            border-radius: 5px;
            color: #1e40af;
            font-size: 13px;
        }

        footer {
            text-align: center;
            margin-top: 50px;
            padding: 20px;
            color: #6b7280;
            font-size: 13px;
            border-top: 1px solid #e5e7eb;
        }

        @media print {
            body { background: white; }
            .document, .stats, .excel-section { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Analyse Dossier de Consultation d'Entreprises</h1>
        <p>Généré par FlowMinds Automation - Analyse automatisée par IA</p>
    </div>

    <div class="stats">
        <p>📦 <strong>Fichiers reçus</strong><br>${metadata.totalFiles}</p>
        <p>📄 <strong>PDFs traités</strong><br>${metadata.selectedPdfs} / ${metadata.totalPdfs}</p>
        <p>🎯 <strong>Documents analysés</strong><br>${items.length}${analysisErrorCount > 0 ? ` (${analysisErrorCount} erreur${analysisErrorCount > 1 ? 's' : ''})` : ''}</p>
        <p>📊 <strong>Fichiers Excel</strong><br>${metadata.excelFiles?.length || 0}</p>
        <p>⏱️ <strong>Temps de traitement</strong><br>${processingTime}s</p>
    </div>

    ${duplicatesSection}

    <h2>📑 Documents Décisionnels Analysés</h2>
    ${documentCards}

    <div class="excel-section">
        <h2>📊 Fichiers Excel Détectés (${metadata.excelFiles?.length || 0})</h2>
        <ul class="excel-list">
            ${excelList}
        </ul>
        <div class="excel-note">
            ℹ️ L'analyse détaillée des fichiers Excel (DPGF, quantitatifs) sera disponible dans la version 2 du POC.
        </div>
    </div>

    ${ignoredSection}

    <footer>
        <p><strong>FlowMinds Automation</strong> © 2024</p>
        <p>Généré le ${new Date().toLocaleString('fr-FR', {
          dateStyle: 'full',
          timeStyle: 'short'
        })}</p>
        <p style="margin-top: 10px; font-size: 11px;">
            Analyse réalisée avec Claude AI (Anthropic) • Version POC 1.0
        </p>
    </footer>
</body>
</html>`;

return { json: { html } };

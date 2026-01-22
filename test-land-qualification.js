#!/usr/bin/env node

/**
 * ========================================
 * Script de test - Workflow N8N Land Qualification
 * ========================================
 *
 * Ce script teste le workflow de pré-qualification de terrains
 * avec 3 scénarios différents.
 *
 * Usage: node test-land-qualification.js [WEBHOOK_URL]
 * ========================================
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const WEBHOOK_URL = process.argv[2] || 'https://your-n8n-instance.app.n8n.cloud/webhook/land-qualification';
const OUTPUT_DIR = './test-results';
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// Couleurs pour le terminal
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

// Création du répertoire de sortie
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Fonction pour faire une requête HTTP/HTTPS
function makeRequest(url, payload) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;

        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };

        const req = protocol.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data,
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(payload);
        req.end();
    });
}

// Fonction pour extraire le score du HTML
function extractScore(html) {
    const match = html.match(/score-number">(\d+)<\/span>/);
    return match ? parseInt(match[1]) : null;
}

// Fonction pour extraire la catégorie du HTML
function extractCategory(html) {
    const match = html.match(/score-label">([^<]+)<\/span>/);
    return match ? match[1].trim() : null;
}

// Fonction pour afficher un message avec couleur
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Fonction pour exécuter un scénario
async function runScenario(scenarioName, payload, outputFilename) {
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'green');
    log(`${scenarioName}`, 'green');
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'green');
    console.log('');

    log('Payload:', 'yellow');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    log('Envoi de la requête...', 'blue');

    try {
        const startTime = Date.now();
        const response = await makeRequest(WEBHOOK_URL, JSON.stringify(payload));
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (response.statusCode === 200) {
            log(`✓ Succès (HTTP ${response.statusCode}) - Durée: ${duration}s`, 'green');

            // Sauvegarde du fichier
            const outputPath = path.join(OUTPUT_DIR, outputFilename);
            fs.writeFileSync(outputPath, response.body);
            log(`✓ Rapport sauvegardé: ${outputPath}`, 'green');

            // Extraction du score et de la catégorie
            const score = extractScore(response.body);
            const category = extractCategory(response.body);

            if (score !== null) {
                log(`✓ Score obtenu: ${score}/100`, 'green');
            }
            if (category) {
                log(`✓ Catégorie: ${category}`, 'green');
            }

            return {
                success: true,
                statusCode: response.statusCode,
                score,
                category,
                duration,
                outputPath,
            };
        } else {
            log(`✗ Échec (HTTP ${response.statusCode})`, 'red');
            log(`Réponse: ${response.body}`, 'red');

            return {
                success: false,
                statusCode: response.statusCode,
                error: response.body,
                duration,
            };
        }
    } catch (error) {
        log(`✗ Erreur: ${error.message}`, 'red');

        return {
            success: false,
            error: error.message,
        };
    } finally {
        console.log('');
    }
}

// Fonction principale
async function main() {
    log('========================================', 'blue');
    log('Test Workflow N8N - Land Qualification', 'blue');
    log('========================================', 'blue');
    console.log('');
    log(`Webhook URL: ${WEBHOOK_URL}`, 'yellow');
    log(`Output dir: ${OUTPUT_DIR}`, 'yellow');
    console.log('');

    // Pause entre les scénarios
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    // ========================================
    // SCÉNARIO 1: Parcelle en zone U (urbaine) avec données DVF complètes
    // ========================================
    const scenario1 = await runScenario(
        'SCÉNARIO 1: Parcelle en zone U avec DVF',
        {
            adresse_complete: '12 Avenue des Champs-Élysées, 75008 Paris',
            nom_contact: 'Jean Dupont',
            email_contact: 'jean.dupont@example.com',
        },
        `scenario_1_zone_U_${TIMESTAMP}.html`
    );

    await sleep(2000);

    // ========================================
    // SCÉNARIO 2: Parcelle en zone N (naturelle) sans transactions récentes
    // ========================================
    const scenario2 = await runScenario(
        'SCÉNARIO 2: Parcelle en zone N sans DVF',
        {
            adresse_complete: 'Chemin Rural, 05100 Briançon',
            nom_contact: 'Marie Martin',
            email_contact: 'marie.martin@example.com',
        },
        `scenario_2_zone_N_${TIMESTAMP}.html`
    );

    await sleep(2000);

    // ========================================
    // SCÉNARIO 3: Adresse complète sans référence cadastrale (géocodage requis)
    // ========================================
    const scenario3 = await runScenario(
        'SCÉNARIO 3: Adresse sans référence cadastrale',
        {
            adresse_complete: 'Place Bellecour, 69002 Lyon',
            nom_contact: 'Sophie Bernard',
            email_contact: 'sophie.bernard@example.com',
        },
        `scenario_3_geocoding_${TIMESTAMP}.html`
    );

    // ========================================
    // RÉSUMÉ DES TESTS
    // ========================================
    log('========================================', 'blue');
    log('RÉSUMÉ DES TESTS', 'blue');
    log('========================================', 'blue');
    console.log('');

    const results = [
        { name: 'Scénario 1 (Zone U)', result: scenario1 },
        { name: 'Scénario 2 (Zone N)', result: scenario2 },
        { name: 'Scénario 3 (Géocodage)', result: scenario3 },
    ];

    let successCount = 0;

    results.forEach(({ name, result }) => {
        const status = result.success
            ? `${colors.green}✓ SUCCÈS${colors.reset}`
            : `${colors.red}✗ ÉCHEC${colors.reset}`;

        console.log(`${name}: ${status}`);

        if (result.success) {
            successCount++;
            if (result.score !== null) {
                console.log(`  └─ Score: ${result.score}/100`);
            }
            if (result.category) {
                console.log(`  └─ Catégorie: ${result.category}`);
            }
            if (result.duration) {
                console.log(`  └─ Durée: ${result.duration}s`);
            }
        } else {
            console.log(`  └─ Erreur: ${result.error || 'Échec de la requête'}`);
        }
    });

    console.log('');
    log(`Résultat global: ${successCount}/3 tests réussis`, 'blue');

    if (successCount === 3) {
        log('🎉 Tous les tests sont passés avec succès !', 'green');
    } else {
        log('⚠️  Certains tests ont échoué. Vérifiez la configuration du workflow.', 'yellow');
    }

    console.log('');
    log('Fichiers de sortie:', 'yellow');

    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.includes(TIMESTAMP));
    if (files.length > 0) {
        files.forEach(file => {
            const filePath = path.join(OUTPUT_DIR, file);
            const stats = fs.statSync(filePath);
            const sizeKB = (stats.size / 1024).toFixed(2);
            console.log(`  - ${file} (${sizeKB} KB)`);
        });
    } else {
        console.log('  Aucun fichier généré');
    }

    console.log('');
    log('========================================', 'blue');
    log('Pour ouvrir les rapports HTML:', 'blue');
    log('========================================', 'blue');
    console.log('');

    results.forEach(({ result }, index) => {
        if (result.success && result.outputPath) {
            console.log(`open ${result.outputPath}`);
        }
    });

    console.log('');

    // Code de sortie
    process.exit(3 - successCount);
}

// Exécution
main().catch((error) => {
    log(`Erreur fatale: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
});

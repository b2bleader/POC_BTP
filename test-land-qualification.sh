#!/bin/bash

# ========================================
# Script de test - Workflow N8N Land Qualification
# ========================================
#
# Ce script teste le workflow de pré-qualification de terrains
# avec 3 scénarios différents.
#
# Usage: ./test-land-qualification.sh [WEBHOOK_URL]
# ========================================

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEBHOOK_URL="${1:-https://your-n8n-instance.app.n8n.cloud/webhook/land-qualification}"
OUTPUT_DIR="./test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Création du répertoire de sortie
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Workflow N8N - Land Qualification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Webhook URL:${NC} $WEBHOOK_URL"
echo -e "${YELLOW}Output dir:${NC} $OUTPUT_DIR"
echo ""

# ========================================
# SCÉNARIO 1: Parcelle en zone U (urbaine) avec données DVF complètes
# ========================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}SCÉNARIO 1: Parcelle en zone U avec DVF${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SCENARIO_1_PAYLOAD=$(cat <<EOF
{
  "adresse_complete": "12 Avenue des Champs-Élysées, 75008 Paris",
  "nom_contact": "Jean Dupont",
  "email_contact": "jean.dupont@example.com"
}
EOF
)

echo -e "${YELLOW}Payload:${NC}"
echo "$SCENARIO_1_PAYLOAD" | jq '.'
echo ""

echo -e "${BLUE}Envoi de la requête...${NC}"

RESPONSE_1=$(curl -s -w "\n%{http_code}" -X POST \
  "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$SCENARIO_1_PAYLOAD")

HTTP_CODE_1=$(echo "$RESPONSE_1" | tail -n 1)
BODY_1=$(echo "$RESPONSE_1" | sed '$d')

if [ "$HTTP_CODE_1" -eq 200 ]; then
    echo -e "${GREEN}✓ Succès (HTTP $HTTP_CODE_1)${NC}"
    OUTPUT_FILE_1="$OUTPUT_DIR/scenario_1_zone_U_${TIMESTAMP}.html"
    echo "$BODY_1" > "$OUTPUT_FILE_1"
    echo -e "${GREEN}✓ Rapport sauvegardé: $OUTPUT_FILE_1${NC}"

    # Extraction du score (si possible)
    SCORE_1=$(echo "$BODY_1" | grep -oP 'score-number">\K[0-9]+' | head -1)
    if [ -n "$SCORE_1" ]; then
        echo -e "${GREEN}✓ Score obtenu: $SCORE_1/100${NC}"
    fi
else
    echo -e "${RED}✗ Échec (HTTP $HTTP_CODE_1)${NC}"
    echo -e "${RED}Réponse: $BODY_1${NC}"
fi

echo ""
sleep 2

# ========================================
# SCÉNARIO 2: Parcelle en zone N (naturelle) sans transactions récentes
# ========================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}SCÉNARIO 2: Parcelle en zone N sans DVF${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SCENARIO_2_PAYLOAD=$(cat <<EOF
{
  "adresse_complete": "Chemin Rural, 05100 Briançon",
  "nom_contact": "Marie Martin",
  "email_contact": "marie.martin@example.com"
}
EOF
)

echo -e "${YELLOW}Payload:${NC}"
echo "$SCENARIO_2_PAYLOAD" | jq '.'
echo ""

echo -e "${BLUE}Envoi de la requête...${NC}"

RESPONSE_2=$(curl -s -w "\n%{http_code}" -X POST \
  "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$SCENARIO_2_PAYLOAD")

HTTP_CODE_2=$(echo "$RESPONSE_2" | tail -n 1)
BODY_2=$(echo "$RESPONSE_2" | sed '$d')

if [ "$HTTP_CODE_2" -eq 200 ]; then
    echo -e "${GREEN}✓ Succès (HTTP $HTTP_CODE_2)${NC}"
    OUTPUT_FILE_2="$OUTPUT_DIR/scenario_2_zone_N_${TIMESTAMP}.html"
    echo "$BODY_2" > "$OUTPUT_FILE_2"
    echo -e "${GREEN}✓ Rapport sauvegardé: $OUTPUT_FILE_2${NC}"

    # Extraction du score (si possible)
    SCORE_2=$(echo "$BODY_2" | grep -oP 'score-number">\K[0-9]+' | head -1)
    if [ -n "$SCORE_2" ]; then
        echo -e "${GREEN}✓ Score obtenu: $SCORE_2/100${NC}"
    fi
else
    echo -e "${RED}✗ Échec (HTTP $HTTP_CODE_2)${NC}"
    echo -e "${RED}Réponse: $BODY_2${NC}"
fi

echo ""
sleep 2

# ========================================
# SCÉNARIO 3: Adresse complète sans référence cadastrale (géocodage requis)
# ========================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}SCÉNARIO 3: Adresse sans référence cadastrale${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SCENARIO_3_PAYLOAD=$(cat <<EOF
{
  "adresse_complete": "Place Bellecour, 69002 Lyon",
  "nom_contact": "Sophie Bernard",
  "email_contact": "sophie.bernard@example.com"
}
EOF
)

echo -e "${YELLOW}Payload:${NC}"
echo "$SCENARIO_3_PAYLOAD" | jq '.'
echo ""

echo -e "${BLUE}Envoi de la requête...${NC}"

RESPONSE_3=$(curl -s -w "\n%{http_code}" -X POST \
  "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$SCENARIO_3_PAYLOAD")

HTTP_CODE_3=$(echo "$RESPONSE_3" | tail -n 1)
BODY_3=$(echo "$RESPONSE_3" | sed '$d')

if [ "$HTTP_CODE_3" -eq 200 ]; then
    echo -e "${GREEN}✓ Succès (HTTP $HTTP_CODE_3)${NC}"
    OUTPUT_FILE_3="$OUTPUT_DIR/scenario_3_geocoding_${TIMESTAMP}.html"
    echo "$BODY_3" > "$OUTPUT_FILE_3"
    echo -e "${GREEN}✓ Rapport sauvegardé: $OUTPUT_FILE_3${NC}"

    # Extraction du score (si possible)
    SCORE_3=$(echo "$BODY_3" | grep -oP 'score-number">\K[0-9]+' | head -1)
    if [ -n "$SCORE_3" ]; then
        echo -e "${GREEN}✓ Score obtenu: $SCORE_3/100${NC}"
    fi
else
    echo -e "${RED}✗ Échec (HTTP $HTTP_CODE_3)${NC}"
    echo -e "${RED}Réponse: $BODY_3${NC}"
fi

echo ""

# ========================================
# RÉSUMÉ DES TESTS
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}RÉSUMÉ DES TESTS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Compteur de succès
SUCCESS_COUNT=0
[ "$HTTP_CODE_1" -eq 200 ] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
[ "$HTTP_CODE_2" -eq 200 ] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
[ "$HTTP_CODE_3" -eq 200 ] && SUCCESS_COUNT=$((SUCCESS_COUNT + 1))

echo -e "Scénario 1 (Zone U): $([ "$HTTP_CODE_1" -eq 200 ] && echo -e "${GREEN}✓ SUCCÈS${NC}" || echo -e "${RED}✗ ÉCHEC${NC}")"
[ -n "$SCORE_1" ] && echo -e "  └─ Score: $SCORE_1/100"

echo -e "Scénario 2 (Zone N): $([ "$HTTP_CODE_2" -eq 200 ] && echo -e "${GREEN}✓ SUCCÈS${NC}" || echo -e "${RED}✗ ÉCHEC${NC}")"
[ -n "$SCORE_2" ] && echo -e "  └─ Score: $SCORE_2/100"

echo -e "Scénario 3 (Géocodage): $([ "$HTTP_CODE_3" -eq 200 ] && echo -e "${GREEN}✓ SUCCÈS${NC}" || echo -e "${RED}✗ ÉCHEC${NC}")"
[ -n "$SCORE_3" ] && echo -e "  └─ Score: $SCORE_3/100"

echo ""
echo -e "${BLUE}Résultat global: $SUCCESS_COUNT/3 tests réussis${NC}"

if [ "$SUCCESS_COUNT" -eq 3 ]; then
    echo -e "${GREEN}🎉 Tous les tests sont passés avec succès !${NC}"
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué. Vérifiez la configuration du workflow.${NC}"
fi

echo ""
echo -e "${YELLOW}Fichiers de sortie:${NC}"
ls -lh "$OUTPUT_DIR"/*_${TIMESTAMP}.html 2>/dev/null || echo "Aucun fichier généré"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Pour ouvrir les rapports HTML:${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "open $OUTPUT_DIR/scenario_1_zone_U_${TIMESTAMP}.html"
echo -e "open $OUTPUT_DIR/scenario_2_zone_N_${TIMESTAMP}.html"
echo -e "open $OUTPUT_DIR/scenario_3_geocoding_${TIMESTAMP}.html"
echo ""

exit $((3 - SUCCESS_COUNT))

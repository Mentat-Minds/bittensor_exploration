#!/bin/bash

# Colors for terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}🚀 STARTING ALPHA HOLDERS ANALYSIS${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Start time: $(date)"
echo "This will take approximately 9-12 hours..."
echo ""

# Record start time
START_TIME=$(date +%s)
START_DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Create output directory if it doesn't exist
mkdir -p output/logs

# Log file
LOG_FILE="output/logs/analysis_run_$(date +%Y%m%d_%H%M%S).log"
RECAP_FILE="output/ANALYSIS_RECAP.txt"

# Run the analysis and capture output
echo "Logging to: $LOG_FILE"
echo ""

npm run analyze:alpha 2>&1 | tee "$LOG_FILE"

# Capture exit code
EXIT_CODE=${PIPESTATUS[0]}

# Record end time
END_TIME=$(date +%s)
END_DATE=$(date '+%Y-%m-%d %H:%M:%S')
DURATION=$((END_TIME - START_TIME))

# Calculate hours and minutes
HOURS=$((DURATION / 3600))
MINUTES=$(((DURATION % 3600) / 60))
SECONDS=$((DURATION % 60))

# Create recap file
echo "=====================================" > "$RECAP_FILE"
echo "📊 ALPHA HOLDERS ANALYSIS - RECAP" >> "$RECAP_FILE"
echo "=====================================" >> "$RECAP_FILE"
echo "" >> "$RECAP_FILE"
echo "⏱️  EXECUTION TIME" >> "$RECAP_FILE"
echo "  Started:  $START_DATE" >> "$RECAP_FILE"
echo "  Finished: $END_DATE" >> "$RECAP_FILE"
echo "  Duration: ${HOURS}h ${MINUTES}m ${SECONDS}s" >> "$RECAP_FILE"
echo "" >> "$RECAP_FILE"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ STATUS: SUCCESS" >> "$RECAP_FILE"
else
    echo "❌ STATUS: FAILED (exit code: $EXIT_CODE)" >> "$RECAP_FILE"
fi
echo "" >> "$RECAP_FILE"

# Analyze errors from log
echo "🔍 ERROR ANALYSIS" >> "$RECAP_FILE"
echo "─────────────────────────────────────" >> "$RECAP_FILE"

# Count different types of errors
API_ERRORS=$(grep -i "API error\|fetch failed\|rate limit" "$LOG_FILE" | wc -l | tr -d ' ')
TIMEOUT_ERRORS=$(grep -i "timeout\|timed out" "$LOG_FILE" | wc -l | tr -d ' ')
NETWORK_ERRORS=$(grep -i "network\|ECONNREFUSED\|ENOTFOUND" "$LOG_FILE" | wc -l | tr -d ' ')
CHAIN_ERRORS=$(grep -i "chain error\|blockchain" "$LOG_FILE" | wc -l | tr -d ' ')

echo "  API Errors:       $API_ERRORS" >> "$RECAP_FILE"
echo "  Timeout Errors:   $TIMEOUT_ERRORS" >> "$RECAP_FILE"
echo "  Network Errors:   $NETWORK_ERRORS" >> "$RECAP_FILE"
echo "  Chain Errors:     $CHAIN_ERRORS" >> "$RECAP_FILE"
echo "" >> "$RECAP_FILE"

# Show sample errors if any
if [ $((API_ERRORS + TIMEOUT_ERRORS + NETWORK_ERRORS + CHAIN_ERRORS)) -gt 0 ]; then
    echo "📋 SAMPLE ERRORS (last 10):" >> "$RECAP_FILE"
    echo "" >> "$RECAP_FILE"
    grep -i "error\|failed\|warning" "$LOG_FILE" | tail -20 >> "$RECAP_FILE"
    echo "" >> "$RECAP_FILE"
else
    echo "✅ No errors detected!" >> "$RECAP_FILE"
    echo "" >> "$RECAP_FILE"
fi

# Extract results summary from log
echo "📊 RESULTS SUMMARY" >> "$RECAP_FILE"
echo "─────────────────────────────────────" >> "$RECAP_FILE"
grep -A 20 "ANALYSIS COMPLETE\|Results:" "$LOG_FILE" | tail -15 >> "$RECAP_FILE"
echo "" >> "$RECAP_FILE"

# Check output file
JSON_FILE="output/alpha_holders_analysis.json"
if [ -f "$JSON_FILE" ]; then
    FILE_SIZE=$(ls -lh "$JSON_FILE" | awk '{print $5}')
    HOLDER_COUNT=$(grep -o "coldkey" "$JSON_FILE" | wc -l | tr -d ' ')
    echo "📁 OUTPUT FILE" >> "$RECAP_FILE"
    echo "  Location: $JSON_FILE" >> "$RECAP_FILE"
    echo "  Size:     $FILE_SIZE" >> "$RECAP_FILE"
    echo "  Holders:  ~$HOLDER_COUNT coldkeys" >> "$RECAP_FILE"
else
    echo "⚠️  WARNING: Output file not found!" >> "$RECAP_FILE"
fi

echo "" >> "$RECAP_FILE"
echo "=====================================" >> "$RECAP_FILE"
echo "Full log: $LOG_FILE" >> "$RECAP_FILE"
echo "=====================================" >> "$RECAP_FILE"

# Display recap to console
echo ""
echo -e "${GREEN}================================${NC}"
cat "$RECAP_FILE"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Recap saved to: $RECAP_FILE${NC}"
echo ""

# Exit with same code as analysis
exit $EXIT_CODE

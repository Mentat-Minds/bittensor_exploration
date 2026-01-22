#!/bin/bash

# Run analysis in background with nohup
# This allows the script to continue even if you close the terminal

echo "🚀 Starting analysis in background..."
echo ""

nohup ./run_analysis.sh > output/logs/nohup_$(date +%Y%m%d_%H%M%S).out 2>&1 &

PID=$!

echo "✅ Analysis started!"
echo "   Process ID: $PID"
echo ""
echo "📋 To check progress:"
echo "   tail -f output/logs/nohup_*.out"
echo ""
echo "📊 When complete, check:"
echo "   cat output/ANALYSIS_RECAP.txt"
echo ""
echo "🛑 To stop the analysis:"
echo "   kill $PID"
echo ""
echo "Process will continue even if you close this terminal."
echo ""

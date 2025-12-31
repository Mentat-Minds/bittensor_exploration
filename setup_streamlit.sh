#!/bin/bash

echo "🎨 Configuration du Dashboard Streamlit"
echo "========================================"
echo ""

# Installer avec --user pour éviter les conflits système
echo "📦 Installation des dépendances..."
pip3 install --user streamlit pandas plotly

echo ""
echo "✅ Installation terminée!"
echo ""
echo "🚀 Pour lancer le dashboard:"
echo "   streamlit run streamlit_app.py"
echo ""
echo "📖 Documentation complète: STREAMLIT.md"

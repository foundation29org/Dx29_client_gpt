#!/bin/bash

# Script para contar líneas SCSS en el proyecto DxGPT
# Uso: bash medir_scss.sh

echo "📊 Midiendo líneas SCSS en DxGPT..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Encontrar todos los archivos .scss
scss_files=$(find src/ -name "*.scss" -type f | wc -l)
total_lines=$(find src/ -name "*.scss" -type f -exec wc -l {} + | tail -1 | awk '{print $1}')

echo "🎨 Total de archivos SCSS: $scss_files"
echo "📏 Total de líneas SCSS: $total_lines"
echo ""

# Desglose por directorios principales
echo "📂 Desglose por directorios:"
echo "─────────────────────────────"

# Shared components
shared_lines=$(find src/app/shared/ -name "*.scss" -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
echo "   📁 /shared/: $shared_lines líneas"

# Pages
pages_lines=$(find src/app/pages/ -name "*.scss" -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
echo "   📁 /pages/: $pages_lines líneas"

# Global styles
global_lines=$(wc -l src/styles.css 2>/dev/null | awk '{print $1}' || echo "0")
echo "   📁 /src/ (global): $global_lines líneas"

echo ""
echo "🏆 TOTAL GENERAL: $total_lines líneas SCSS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏰ $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "Presiona Enter para continuar..."
read
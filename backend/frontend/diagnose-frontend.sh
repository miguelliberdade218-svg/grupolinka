#!/bin/bash
echo "🔍 DIAGNÓSTICO DO FRONTEND - HOTÉIS"
echo "======================================"

echo "\n📁 ESTRUTURA DO PROJETO:"
echo "-----------------------"
ls -la

echo "\n📦 PACKAGE.JSON:"
echo "----------------"
grep -A5 '"name"' package.json
grep -A5 '"version"' package.json

echo "\n🔧 SCRIPTS DISPONÍVEIS:"
echo "---------------------"
grep -A10 '"scripts"' package.json

echo "\n📂 ESTRUTURA SRC/:"
echo "------------------"
if [ -d "src" ]; then
  find src -type f -name "*.vue" -o -name "*.ts" -o -name "*.js" | head -30
else
  echo "Pasta src não encontrada!"
fi

echo "\n🏨 COMPONENTES DE HOTEL:"
echo "-----------------------"
find . -name "*.vue" -type f | xargs grep -l "hotel\|Hotel\|accommodation\|Accommodation" 2>/dev/null | grep -v node_modules

echo "\n🔄 SERVICES/API:"
echo "----------------"
find . -name "*.ts" -o -name "*.js" | xargs grep -l "api\|service\|fetch" 2>/dev/null | grep -v node_modules | head -10

echo "\n🗺️ ROTAS:"
echo "--------"
find . -name "*.ts" -o -name "*.js" -o -name "*.vue" | xargs grep -l "router\|route" 2>/dev/null | grep -v node_modules | head -10

echo "\n📱 VIEWS/PÁGINAS:"
echo "-----------------"
find src -name "*View.vue" -o -name "*Page.vue" 2>/dev/null | head -10

echo "\n🎨 COMPONENTES:"
echo "---------------"
find src/components -name "*.vue" 2>/dev/null | head -15

echo "\n======================================"
echo "✅ Diagnóstico completo!"

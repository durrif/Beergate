#!/bin/bash
# Script de inicio rápido para Beergate

set -e

echo "🍺 Iniciando Beergate..."
echo ""

# Verificar si está en el directorio correcto
if [ ! -f "simple-backend/main.py" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto Beergate"
    exit 1
fi

# Activar entorno virtual si existe
if [ -d ".venv" ]; then
    echo "✅ Activando entorno virtual..."
    source .venv/bin/activate
else
    echo "⚠️  No se encontró entorno virtual (.venv)"
    echo "   Creando entorno virtual..."
    python3 -m venv .venv
    source .venv/bin/activate
    echo "   Instalando dependencias..."
    pip install -r simple-backend/requirements.txt
fi

# Verificar puerto 8000
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Puerto 8000 ocupado. Matando proceso anterior..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Iniciar servidor
echo ""
echo "🚀 Iniciando servidor en http://0.0.0.0:8000"
echo "   Accede desde:"
echo "   - Local: http://localhost:8000/index.html"
echo "   - Red: http://$(hostname -I | awk '{print $1}'):8000/index.html"
echo ""
echo "📱 Para Android: http://$(hostname -I | awk '{print $1}'):8000/index.html"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

cd simple-backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

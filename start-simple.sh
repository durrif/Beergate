#!/bin/bash

echo "🍺 Iniciando Beergate Simple..."

cd "$(dirname "$0")/simple-backend"

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno
source venv/bin/activate

# Instalar dependencias
echo "📥 Instalando dependencias..."
pip install -q -r requirements.txt

# Iniciar servidor
echo "🚀 Iniciando servidor en http://localhost:8000"
echo "📱 Abre tu navegador en: http://localhost:8000/index.html"
echo ""
echo "Presiona Ctrl+C para detener"
echo ""

python3 main.py

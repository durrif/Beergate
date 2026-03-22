#!/bin/bash
# Script de ayuda para integrar imágenes del gato en formato LVGL

set -e

PROJECT_ROOT="/home/david/Documentos/PlatformIO/Projects/Esp32-S3-Box"
ASSETS_DIR="$PROJECT_ROOT/components/ui_assets"

echo "================================================"
echo "  GUÍA: Conversión de Imágenes PNG → LVGL"
echo "================================================"
echo ""

# Verificar que existen los archivos .inc
echo "✓ Verificando estructura de assets..."
for i in 0 1 2 3; do
    if [ ! -f "$ASSETS_DIR/cat_frame_${i}_data.inc" ]; then
        echo "❌ ERROR: No existe $ASSETS_DIR/cat_frame_${i}_data.inc"
        exit 1
    fi
done

echo "✓ Estructura correcta"
echo ""

# Mostrar tamaño actual de los archivos
echo "📊 Tamaño actual de los assets:"
for i in 0 1 2 3; do
    SIZE=$(wc -c < "$ASSETS_DIR/cat_frame_${i}_data.inc")
    if [ "$SIZE" -lt 1000 ]; then
        STATUS="❌ PLACEHOLDER ($SIZE bytes - se necesitan 28800)"
    else
        STATUS="✅ REAL ($SIZE bytes)"
    fi
    echo "   Frame $i: $STATUS"
done
echo ""

echo "================================================"
echo "  PASO 1: Preparar PNG (120×120 píxeles)"
echo "================================================"
echo ""
echo "Tienes 2 opciones:"
echo ""
echo "A) Usar tu imagen existente (gato adjunto en el chat):"
echo "   1. Abre GIMP o Photoshop"
echo "   2. Redimensiona a 120×120 píxeles (mantén proporciones, crop si es necesario)"
echo "   3. Exporta como PNG con fondo negro (o transparente)"
echo "   4. Guarda 4 variantes:"
echo "      - gato_idle.png     (expresión neutral)"
echo "      - gato_listen.png   (orejas arriba)"
echo "      - gato_think.png    (ojos cerrados)"
echo "      - gato_speak.png    (boca abierta)"
echo ""
echo "B) Usar edición de imagen manual:"
echo "   Puedes usar cualquier herramienta de edición para crear las 4 variantes"
echo ""

echo "================================================"
echo "  PASO 2: Convertir PNG → C Array"
echo "================================================"
echo ""
echo "1. Abre: https://lvgl.io/tools/imageconverter"
echo ""
echo "2. Configuración EXACTA (copia y pega si es necesario):"
echo "   ┌────────────────────────────────────────┐"
echo "   │ Color format:    CF_TRUE_COLOR         │"
echo "   │ Output format:   C array               │"
echo "   │ Binary format:   Little endian         │"
echo "   │ Name:            cat_frame_X           │"
echo "   │                  (donde X = 0,1,2,3)   │"
echo "   └────────────────────────────────────────┘"
echo ""
echo "3. Sube gato_idle.png con Name: cat_frame_0"
echo "4. Click 'Convert' y descarga el archivo .c"
echo "5. Repite para los otros 3 frames"
echo ""

echo "================================================"
echo "  PASO 3: Integrar Arrays en el Proyecto"
echo "================================================"
echo ""
echo "Para cada archivo .c descargado:"
echo ""
echo "1. Abre el archivo con un editor de texto"
echo "2. Busca el array: const uint8_t cat_frame_X_map[] = {"
echo "3. Copia SOLO el contenido entre llaves { ... }"
echo "   Ejemplo:"
echo "   0xAB,0xCD,0xEF,0x12,0x34,0x56,0x78,0x9A,"
echo "   0xBC,0xDE,0xF0,0x11,0x22,0x33,0x44,0x55,"
echo "   ... (muchas líneas más hasta completar 28800 bytes)"
echo ""
echo "4. Pega el contenido en:"
echo "   $ASSETS_DIR/cat_frame_X_data.inc"
echo ""
echo "   ⚠️ REEMPLAZA TODO el contenido del archivo .inc"
echo "   ⚠️ NO incluyas la declaración del array, solo los bytes"
echo ""

echo "================================================"
echo "  PASO 4: Compilar y Probar"
echo "================================================"
echo ""
echo "Ejecuta:"
echo "   cd $PROJECT_ROOT"
echo "   idf.py build"
echo ""
echo "Si compila sin errores:"
echo "   idf.py -p /dev/ttyACM0 flash monitor"
echo ""
echo "En el monitor, busca:"
echo "   I (xxxx) UI: Cat image: w=120, h=120"
echo "   I (xxxx) UI: ✅ UI simple inicializada"
echo ""
echo "Presiona el botón principal para cambiar estados y ver las animaciones"
echo ""

echo "================================================"
echo "  VERIFICACIÓN RÁPIDA"
echo "================================================"
echo ""
echo "Tamaño esperado por archivo .inc: 28800 bytes"
echo "Tamaño actual:"
for i in 0 1 2 3; do
    SIZE=$(wc -c < "$ASSETS_DIR/cat_frame_${i}_data.inc")
    EXPECTED=28800
    if [ "$SIZE" -eq "$EXPECTED" ]; then
        echo "   ✅ cat_frame_${i}_data.inc: $SIZE bytes (CORRECTO)"
    else
        DIFF=$((EXPECTED - SIZE))
        echo "   ⚠️  cat_frame_${i}_data.inc: $SIZE bytes (faltan $DIFF bytes)"
    fi
done
echo ""

echo "================================================"
echo "  RECURSOS ADICIONALES"
echo "================================================"
echo ""
echo "Documentación completa: $PROJECT_ROOT/LVGL_IMAGE_GUIDE.md"
echo "Resumen de cambios:     $PROJECT_ROOT/CAMBIOS_REALIZADOS.md"
echo "Converter online:       https://lvgl.io/tools/imageconverter"
echo ""
echo "Si tienes problemas, revisa el troubleshooting en LVGL_IMAGE_GUIDE.md"
echo ""

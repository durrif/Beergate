# INSTRUCCIONES DE COMPILACIÓN

## Problema actual

PlatformIO **NO** ejecuta ESP-IDF Component Manager, por lo que el BSP oficial no se descarga automáticamente.

## Solución 1: ESP-IDF Puro (RECOMENDADO)

```bash
cd /home/david/Documentos/PlatformIO/Projects/Esp32-S3-Box

# Renombrar archivos para ESP-IDF
mv CMakeLists_idf.txt CMakeLists.txt
mv main/CMakeLists_new.txt main/CMakeLists.txt
mv main/app_main_new.c main/app_main.c

# Configurar target
idf.py set-target esp32s3

# Descargar dependencias (BSP oficial)
idf.py reconfigure

# Compilar
idf.py build

# Flashear
idf.py -p /dev/ttyACM1 flash monitor
```

## Solución 2: Instalación manual del BSP (PlatformIO)

```bash
# Crear directorio de componentes
mkdir -p components

# Clonar BSP oficial
git clone --depth 1 --branch v1.3.0 https://github.com/espressif/esp-box.git components/esp-box-3

# Editar platformio.ini
# Añadir: build_flags = -I components/esp-box-3/components/bsp

# Compilar
~/.platformio/penv/bin/platformio run -t upload -t monitor
```

## Verificación

Tras flashear, debes ver:

```
ESP32-S3-BOX-3 - BSP OFICIAL + LVGL UI
UI inicializada correctamente
Estado cambiado a: Escuchando...
```

La pantalla debe mostrar:
- Sprite animado arriba
- Texto en el centro
- Barras VU abajo

# Compilación ESP-IDF Nativo

## Preparación del entorno

### 1. Verificar ESP-IDF instalado

```bash
echo $IDF_PATH
# Debe mostrar: /home/david/.platformio/packages/framework-espidf
```

### 2. Exportar entorno ESP-IDF

```bash
cd ~/Documentos/PlatformIO/Projects/Esp32-S3-Box
source ~/.platformio/packages/framework-espidf/export.sh
```

Verás:
```
Activating ESP-IDF 5.5
Setting IDF_PATH to '/home/david/.platformio/packages/framework-espidf'
Done! You can now compile ESP-IDF projects.
```

### 3. Añadir cmake al PATH

```bash
export PATH=~/.platformio/packages/tool-cmake/bin:$PATH
```

## Compilación

### 1. Configurar target

```bash
idf.py set-target esp32s3
```

### 2. (Opcional) Configurar menuconfig

```bash
idf.py menuconfig
```

Ajustes recomendados:
- Component config → LVGL configuration → Color depth → 16 bits (RGB565)
- Component config → LVGL configuration → Enable asserts → Yes (para debug)

### 3. Compilar

```bash
idf.py build
```

Debe terminar con:
```
Project build complete. To flash, run:
  idf.py flash
```

### 4. Detectar puerto serial

```bash
ls -l /dev/ttyACM* /dev/ttyUSB*
```

Normalmente: `/dev/ttyACM0` o `/dev/ttyACM1`

### 5. Añadir permisos (si es necesario)

```bash
sudo usermod -a -G dialout $USER
# Luego cerrar sesión y volver a entrar
```

### 6. Flashear y monitorear

```bash
idf.py -p /dev/ttyACM0 flash monitor
```

O auto-detectar puerto:
```bash
idf.py flash monitor
```

Salir del monitor: `Ctrl + ]`

## Logs esperados

```
ESP32-S3-BOX-3 Voice Assistant
ESP-IDF: v5.5.0
==========================================
Inicializando NVS...
✅ NVS inicializado
Inicializando BSP ESP32-S3-BOX-3...
Llamando bsp_display_start_with_config...
✅ Display inicializado: 320x240
Encendiendo backlight...
✅ Backlight ON
Inicializando UI...
✅ UI inicializada correctamente
✅ UI lista
==========================================
✅ Sistema completamente inicializado
==========================================
Estado: 1 | VU: 0.15 | Heap: XXXXX bytes
```

## Troubleshooting

### Error: "Component bsp_esp32_s3_box_3 not found"

Verificar que el BSP está clonado:
```bash
ls -la components/esp-box/components/bsp_esp32_s3_box_3
```

Si no existe:
```bash
cd components
git clone https://github.com/espressif/esp-box.git
```

### Error: "idf.py: command not found"

Ejecutar export.sh:
```bash
source ~/.platformio/packages/framework-espidf/export.sh
```

### Error: "cmake: command not found"

Añadir al PATH:
```bash
export PATH=~/.platformio/packages/tool-cmake/bin:$PATH
```

### Pantalla blanca pero logs OK

El BSP se inicializa correctamente. Probar:
1. Verificar que backlight está ON (brillo físico)
2. Ajustar `lv_disp_set_rotation(disp, LV_DISP_ROT_90)` después de `bsp_display_start`
3. Probar con LVGL demo: `lv_demo_widgets()` (requiere activar demos en menuconfig)

### Error de permisos en /dev/ttyACM0

```bash
sudo chmod 666 /dev/ttyACM0
```

O añadir usuario a dialout (permanente):
```bash
sudo usermod -a -G dialout $USER
# Reiniciar sesión
```

## Limpieza

```bash
idf.py fullclean
```

## Estructura final

```
Esp32-S3-Box/
├── CMakeLists.txt          # Configuración raíz del proyecto
├── main/
│   ├── CMakeLists.txt      # Componente main
│   ├── app_main.c          # Entry point
│   ├── ui.c                # Interfaz gráfica
│   └── ui.h                # API de UI
├── components/
│   └── esp-box/            # BSP clonado de GitHub
│       └── components/
│           ├── bsp_esp32_s3_box_3/
│           ├── esp_lvgl_port/
│           └── ...
└── sdkconfig               # Generado por menuconfig
```

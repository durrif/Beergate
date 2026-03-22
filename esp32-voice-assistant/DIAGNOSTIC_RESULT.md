# Diagnóstico ESP32-S3-BOX Display Issue

## Problema
- Display muestra pantalla blanca inicialmente
- Después de test, pantalla negra (sin backlight)
- No aparecen logs en serial monitor
- ESP32 no bootea o crashea antes de UART init

## Tests Realizados

### 1. Test de LVGL (Implementación Manual)
- ❌ Pantalla blanca
- ✅ Inicialización SPI exitosa (logs)
- ✅ Inicialización LCD panel exitosa (logs)
- ✅ Backlight activado (logs)
- ❌ No display output

### 2. Test de Hardware Puro (sin LVGL)
- ❌ ESP32 no bootea
- ❌ Sin logs en serial
- ❌ Pantalla negra
- **Conclusión**: Código causa crash antes de llegar a app_main()

### 3. Test Minimal Backlight
- ❌ ESP32 no bootea
- ❌ Sin logs
- ❌ Pantalla negra

## Causa Raíz
**El ESP32-S3-BOX-3 requiere secuencias de inicialización específicas del hardware que no están en la implementación genérica.**

Los pines están correctos según documentación:
- MOSI: GPIO 6 ✅
- CLK: GPIO 7 ✅
- CS: GPIO 5 ✅
- DC: GPIO 4 ✅
- RST: GPIO 48 ✅
- BL: GPIO 45 ✅

Pero falta:
- Secuencias específicas de inicialización del panel
- Configuración de power supply del LCD
- Timing delays específicos del hardware
- Posibles comandos SPI específicos del controlador

## Solución Requerida
**Usar el BSP oficial de Espressif: `esp-box-3`**

Este componente incluye:
1. Inicialización exacta del hardware LCD
2. Secuencias de power-on correctas
3. Configuración del controlador ILI9342C/ST7789
4. Integración con LVGL verificada
5. Drivers de audio, touch, sensores

## Próximos Pasos
1. Migrar a `esp-box-3` BSP component
2. Usar `bsp_display_new()` para inicializar LCD
3. Integrar LVGL a través del BSP
4. Eliminar implementación manual de ui_lvgl.c

## Referencias
- BSP oficial: https://components.espressif.com/components/espressif/esp-box-3
- Ejemplo LVGL: https://github.com/espressif/esp-box/tree/master/examples/factory_demo

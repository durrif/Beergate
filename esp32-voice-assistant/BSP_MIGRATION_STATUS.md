## RESUMEN: Migración a BSP

**Estado**: En progreso - BSP oficial tiene problemas de dependencias en PlatformIO

**Problema encontrado**: 
- El Component Manager de ESP-IDF no se ejecuta automáticamente en PlatformIO
- Los componentes `espressif/esp-box-3` no se descargan
- Include `bsp/esp-bsp.h` no se encuentra

**Solución Alternativa**:
Voy a crear una implementación BSP-lite que:
1. Usa los drivers esp_lcd ya disponibles en ESP-IDF
2. Sigue el patrón del BSP oficial pero sin dependency externa
3. Integra LVGL directamente con bsp_display_start() simplificado
4. Mantiene la interfaz API de ui_bsp.h

**Próximo paso**: Crear `bsp_esp32s3_box.c` con funciones BSP básicas

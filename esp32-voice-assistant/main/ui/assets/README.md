# Reemplazo de sprites del gato

## Convertir PNG a LVGL

1. Ir a: https://lvgl.io/tools/imageconverter
2. Subir imagen PNG (32x32 o 64x64)
3. Configuración:
   - **Color format**: RGB565
   - **Output format**: C array
4. Descargar archivo `.c`
5. Reemplazar `cat_0.c`, `cat_1.c`, etc.

## Naming

- `cat_frame_0` = IDLE (ojos abiertos)
- `cat_frame_1` = LISTENING (ojos grandes)
- `cat_frame_2` = THINKING (ojos entrecerrados)
- `cat_frame_3` = SPEAKING (boca abierta)

## Tamaño recomendado

64x64 px para mejor calidad

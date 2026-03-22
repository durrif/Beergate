# Guía: Conversión de Imágenes LVGL para ESP32-S3-BOX-3

## ⚠️ REQUISITOS CRÍTICOS

### Tamaño de Imagen
- **NUNCA uses imágenes mayores a 240x240 píxeles**
- Display: 320x240 - imágenes grandes causan:
  - Artefactos visuales
  - Colores distorsionados
  - Texto que desaparece
  - Crashes de memoria

### Tamaño Recomendado
- **120x120 píxeles** (ÓPTIMO para este proyecto)
- Ocupa ~28.8 KB por frame en RGB565
- 4 frames = ~115 KB total (cabe perfecto en memoria)

## 📋 Pipeline de Assets

### Estructura del Proyecto
```
components/ui_assets/
├── cat_frame_0.c       (IDLE - gato tranquilo)
├── cat_frame_0_data.inc (array RGB565 de 28800 bytes)
├── cat_frame_1.c       (LISTENING - orejas arriba)
├── cat_frame_1_data.inc
├── cat_frame_2.c       (THINKING - ojos cerrados)
├── cat_frame_2_data.inc
├── cat_frame_3.c       (SPEAKING - boca abierta)
├── cat_frame_3_data.inc
└── ui_images.h         (declaraciones extern)
```

### Estados y Frames
1. **Frame 0 - IDLE**: Gato sentado, expresión neutral, orejas normales
2. **Frame 1 - LISTENING**: Orejas levantadas, ojos abiertos atentos
3. **Frame 2 - THINKING**: Ojos cerrados o semicerrados, pose pensativa
4. **Frame 3 - SPEAKING**: Boca abierta, expresión animada

## 🎨 Cómo Convertir tu Imagen PNG a LVGL

### Paso 1: Preparar la Imagen
1. Abre tu imagen en GIMP/Photoshop/etc.
2. Redimensiona a **120x120 píxeles** exactos
3. (Opcional) Crea 4 variantes para cada estado
4. Exporta como PNG con fondo:
   - **Transparente**: Para fondos dinámicos
   - **Negro/Blanco**: Para fondo sólido (más simple)

### Paso 2: LVGL Image Converter
1. Ve a: https://lvgl.io/tools/imageconverter

2. Sube tu PNG (120x120)

3. **Configuración CRÍTICA**:
   ```
   Color format:      CF_TRUE_COLOR (RGB565)
   Output format:     C array
   Binary format:     Little endian
   Name:              cat_frame_0  (o 1, 2, 3)
   ```

4. **NO uses CF_TRUE_COLOR_ALPHA** a menos que necesites transparencia
   - RGB565: 2 bytes/pixel (más eficiente)
   - RGB565A8: 3 bytes/pixel (+50% memoria)

5. Click "Convert" y descarga el archivo .c

### Paso 3: Integrar el Asset

#### Opción A: Reemplazar solo el array (RECOMENDADO)
1. Abre el archivo .c descargado
2. Busca el array `cat_frame_X_map[]`
3. Copia SOLO el contenido (los bytes 0x.., 0x.., ...)
4. Pega en `/components/ui_assets/cat_frame_X_data.inc`

**Ejemplo cat_frame_0_data.inc:**
```c
// Contenido generado por LVGL Image Converter
// 120x120 RGB565 = 28800 bytes
0x5A,0xFB,0x5A,0xFB,0x5A,0xFB,0x5A,0xFB,
0x5A,0xFB,0x5A,0xFB,0x5A,0xFB,0x5A,0xFB,
// ... (28800 bytes totales)
```

#### Opción B: Reemplazar archivo completo
1. Renombra el .c descargado a `cat_frame_X.c`
2. Reemplaza el archivo en `/components/ui_assets/`
3. **VERIFICA** que tenga:
   - `#include "lvgl.h"`
   - `const lv_img_dsc_t cat_frame_X`
   - `.header.w = 120`
   - `.header.h = 120`

## 🔧 Verificación del Código

### En ui.c
El código ya está configurado para usar los 4 frames:

```c
// State machine automático
switch (state) {
    case UI_STATE_IDLE:
        new_img = &cat_frame_0;  // Gato tranquilo
        break;
    case UI_STATE_LISTENING:
        new_img = &cat_frame_1;  // Orejas arriba
        break;
    case UI_STATE_THINKING:
        new_img = &cat_frame_2;  // Ojos cerrados
        break;
    case UI_STATE_SPEAKING:
        new_img = &cat_frame_3;  // Boca abierta
        break;
}
lv_img_set_src(ui_ctx.cat_img, new_img);
```

### Layout Final (320x240)
```
┌─────────────────────────────────────┐ 0px
│                                     │
│          [CAT IMAGE 120x120]        │ 10px
│                                     │
│                                     │ 130px
│            "Escuchando..."          │ 140px (texto montserrat_16)
│                                     │
│                                     │
│      "Transcripción del audio"      │ 170px
│                                     │
│                                     │
│         ▂▄▆█▆▄▂  (VU meter)        │ 225px
└─────────────────────────────────────┘ 240px
```

## ✅ Checklist de Compilación

Después de agregar/modificar imágenes:

1. **Compilar**:
   ```bash
   cd /home/david/Documentos/PlatformIO/Projects/Esp32-S3-Box
   idf.py build
   ```

2. **Verificar tamaño**:
   - Binary debe ser < 2 MB (tienes partition de 2 MB)
   - Si es mayor, reduce tamaño de imágenes

3. **Flashear**:
   ```bash
   idf.py -p /dev/ttyACM0 flash monitor
   ```

4. **En el monitor, busca**:
   ```
   I (xxxx) UI: Cat image: w=120, h=120
   I (xxxx) UI: ✅ UI simple inicializada (usando lv_img reales)
   ```

## 🐛 Troubleshooting

### Problema: "Colores raros / artefactos"
**Causa**: Imagen demasiado grande (>240x240)
**Solución**: Redimensiona a 120x120 y reconvierte

### Problema: "Texto desaparece"
**Causa**: Z-order incorrecto (imagen tapa texto)
**Solución**: Ya arreglado con `lv_obj_move_background()` y `lv_obj_move_foreground()`

### Problema: "Error de compilación: undefined reference"
**Causa**: Falta declarar frame en ui_images.h
**Solución**: Verifica que ui_images.h tenga:
```c
extern const lv_img_dsc_t cat_frame_0;
extern const lv_img_dsc_t cat_frame_1;
extern const lv_img_dsc_t cat_frame_2;
extern const lv_img_dsc_t cat_frame_3;
```

### Problema: "Guru Meditation Error (LoadProhibited)"
**Causa**: Array de imagen corrupto o tamaño incorrecto
**Solución**:
1. Verifica que .data_size coincida: `120 * 120 * 2 = 28800`
2. Cuenta bytes en .inc (debe ser exacto)
3. Reconvierte la imagen

## 📊 Comparación de Formatos

| Formato | Bytes/Pixel | 120x120 | Transparencia | Recomendado |
|---------|-------------|---------|---------------|-------------|
| RGB565  | 2           | 28.8 KB | ❌            | ✅ SÍ       |
| RGB565A8| 3           | 43.2 KB | ✅            | Solo si necesitas alpha |
| Indexed | 1           | 14.4 KB | Parcial       | ❌ Complejo |

## 🎯 Tips de Diseño

### Para Mejor Visualización:
1. **Contraste alto**: Gato claro sobre fondo oscuro (o viceversa)
2. **Bordes definidos**: Ayuda a que se vea nítido en 120x120
3. **Estilo anime**: Líneas gruesas, ojos grandes, colores planos
4. **Expresiones claras**: Diferencia obvia entre estados

### Evita:
- Degradados sutiles (se pixelan en RGB565)
- Detalles muy finos (se pierden en 120x120)
- Imágenes fotorealistas (mejor ilustraciones)
- Colores muy similares (RGB565 tiene menos colores que RGB888)

## 🔗 Referencias

- LVGL Image Converter: https://lvgl.io/tools/imageconverter
- LVGL Docs v8: https://docs.lvgl.io/8.3/overview/image.html
- ESP-IDF LVGL Component: https://components.espressif.com/components/lvgl/lvgl

---

**Versión Actual**: ESP-IDF 5.5.0 + LVGL 8.3.11  
**Compatibilidad**: `lv_img_dsc_t` (LVGL v8)  
**Display**: 320x240 RGB565 (ILI9341)

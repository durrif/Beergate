# Sprites del Gato - Guía de Conversión

Este directorio contiene las imágenes del gato animado para los diferentes estados de la UI.

## Estructura de Archivos

```
assets/
├── README.md (este archivo)
├── sprites/
│   ├── cat_idle.png         - Gato en reposo (parpadeo)
│   ├── cat_listening.png    - Gato escuchando (orejas arriba)
│   ├── cat_thinking.png     - Gato pensando
│   └── cat_speaking.png     - Gato hablando (boca abierta)
└── generated/
    ├── cat_idle.c           - Array C generado
    ├── cat_listening.c
    ├── cat_thinking.c
    └── cat_speaking.c
```

## Requisitos de las Imágenes

- **Tamaño**: 160x160 pixels (se puede escalar)
- **Formato**: PNG con transparencia o fondo blanco
- **Estados**: 4 sprites básicos (idle, listening, thinking, speaking)
- **Opcional**: 2-3 frames por estado para animación más fluida

## Conversión PNG → C Array

### Método 1: lv_img_conv (Node.js)

```bash
# Instalar herramienta
npm install -g lv_img_conv

# Convertir una imagen
lv_img_conv cat_idle.png -f -c RGB565 -o generated/cat_idle.c

# Convertir todas
for img in sprites/*.png; do
    name=$(basename "$img" .png)
    lv_img_conv "$img" -f -c RGB565 -o "generated/${name}.c"
done
```

### Método 2: Online Converter

1. Ir a: https://lvgl.io/tools/imageconverter
2. Subir PNG
3. Configurar:
   - **Color format**: RGB565 (2 bytes/pixel)
   - **Output format**: C array
4. Descargar archivo .c

### Método 3: Script Python (alternativa)

```python
from PIL import Image
import numpy as np

def png_to_lvgl_c(png_path, output_path):
    img = Image.open(png_path).convert('RGB')
    width, height = img.size
    pixels = np.array(img)
    
    # Convertir a RGB565
    rgb565 = []
    for y in range(height):
        for x in range(width):
            r, g, b = pixels[y, x]
            rgb565_val = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3)
            rgb565.append(f"0x{rgb565_val:04x}")
    
    # Generar archivo C
    with open(output_path, 'w') as f:
        f.write(f"#ifdef __has_include\n")
        f.write(f"    #if __has_include(\"lvgl.h\")\n")
        f.write(f"        #include \"lvgl.h\"\n")
        f.write(f"    #endif\n")
        f.write(f"#endif\n\n")
        f.write(f"const uint16_t cat_data[] = {{\n")
        for i, val in enumerate(rgb565):
            if i % 16 == 0:
                f.write("    ")
            f.write(val + ", ")
            if i % 16 == 15:
                f.write("\n")
        f.write("\n};\n\n")
        f.write(f"const lv_img_dsc_t cat_sprite = {{\n")
        f.write(f"    .header.w = {width},\n")
        f.write(f"    .header.h = {height},\n")
        f.write(f"    .header.cf = LV_COLOR_FORMAT_RGB565,\n")
        f.write(f"    .data_size = {width * height * 2},\n")
        f.write(f"    .data = (uint8_t*)cat_data,\n")
        f.write(f"}};\n")

# Uso
png_to_lvgl_c('sprites/cat_idle.png', 'generated/cat_idle.c')
```

## Integración en el Código

### 1. Incluir archivos generados en assets/generated/

```c
// En src/ui_lvgl.c o en un nuevo assets.h
#include "../assets/generated/cat_idle.c"
#include "../assets/generated/cat_listening.c"
#include "../assets/generated/cat_thinking.c"
#include "../assets/generated/cat_speaking.c"
```

### 2. Declarar descriptores (en assets.h o ui_lvgl.c)

```c
extern const lv_img_dsc_t cat_idle;
extern const lv_img_dsc_t cat_listening;
extern const lv_img_dsc_t cat_thinking;
extern const lv_img_dsc_t cat_speaking;
```

### 3. Usar en ui_lvgl.c

Reemplazar `draw_cat_placeholder()` con:

```c
static void update_cat_sprite(ui_state_t state)
{
    const lv_img_dsc_t *sprite = NULL;
    
    switch (state) {
        case UI_STATE_IDLE:
            sprite = &cat_idle;
            break;
        case UI_STATE_LISTENING:
            sprite = &cat_listening;
            break;
        case UI_STATE_THINKING:
            sprite = &cat_thinking;
            break;
        case UI_STATE_SPEAKING:
            sprite = &cat_speaking;
            break;
        default:
            sprite = &cat_idle;
    }
    
    // Cambiar de canvas a img
    if (g_avatar_img) {
        lv_obj_del(g_avatar_img);
    }
    
    g_avatar_img = lv_img_create(g_screen);
    lv_img_set_src(g_avatar_img, sprite);
    lv_obj_align(g_avatar_img, LV_ALIGN_TOP_MID, 0, 10);
}
```

## Basado en la Imagen de Referencia

Los 4 estados del gato deben representar:

1. **IDLE ("Listo")**: Gato tranquilo, ojos normales, expresión neutral
2. **LISTENING ("Escuchando...")**: Ojos grandes/alertas, orejas arriba, con barras VU meter
3. **THINKING ("Pensando...")**: Ojos pensativos, quizás mirando hacia arriba, con "..." animado
4. **SPEAKING ("Hablando...")**: Boca abierta feliz, expresión animada

## Dimensiones Recomendadas

- **160x160px**: Ideal para pantalla 320x240
- **PNG-8 o PNG-24**: Con transparencia
- **Paleta simple**: Para reducir tamaño en memoria
- **Antialiasing suave**: Para bordes limpios en RGB565

## Testing

Después de integrar sprites reales:

1. Compilar: `pio run`
2. Verificar tamaño: Los arrays deben ser ~50KB cada uno (160x160x2 bytes)
3. Probar transiciones entre estados
4. Ajustar posición con `lv_obj_align()`

## Notas

- El placeholder actual usa canvas con dibujo vectorial simple
- Reemplazar cuando tengas PNG de 160x160 listos
- Los sprites generados se compilan directamente en el firmware
- Para animaciones más fluidas: 2-3 frames por estado + timer

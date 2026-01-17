# 🤖 Asistente Cervecero con IA - Beergate

## 📋 Resumen

Se ha implementado un **asistente cervecero inteligente** que utiliza GPT-4 de OpenAI para recomendar recetas personalizadas basadas en:

1. ✅ Tu inventario actual de maltas, lúpulos y levaduras
2. ✅ Fechas de caducidad (prioriza ingredientes que expiran pronto)
3. ✅ Perfil de agua de Valsaín (análisis completo del manantial)
4. ✅ Recetas ganadoras de concursos internacionales
5. ✅ Ajuste automático de sales minerales
6. ✅ Deducción automática de inventario al aplicar recetas

---

## 🎯 Funcionalidades Principales

### 1. **Análisis Inteligente del Estilo**
- La IA analiza tu solicitud y recomienda el mejor estilo según tu inventario
- Si solicitas algo que no es óptimo, te sugiere alternativas
- Considera disponibilidad de maltas, lúpulos y levaduras

### 2. **Priorización por Caducidad**
- Detecta automáticamente ingredientes que caducan en menos de 60 días
- Los ordena por urgencia
- Recomienda recetas que los aprovechen primero

### 3. **Recomendación de Lúpulos**
- Analiza tu inventario de lúpulos
- Sugiere los más adecuados para el estilo elegido
- Tiene en cuenta perfiles de amargor, aroma y sabor

### 4. **Recetas de Campeones**
- La IA busca en su base de conocimiento recetas ganadoras
- Cita concursos internacionales (National Homebrew Competition, GABF, etc.)
- Menciona el año y el cervecero ganador cuando está disponible

### 5. **Ajuste de Agua Profesional**
Para el agua de **Fuente Valsaín** (perfil blando):
- **Datos actuales:**
  - pH: 6.1
  - Calcio: 13.7 ppm
  - Magnesio: 3.6 ppm
  - Sodio: 12.28 ppm
  - Cloruros: 14.4 ppm
  - Sulfatos: 8.3 ppm
  - Carbonatos: 31.33 ppm
  - Dureza total: 48.2 ppm

- **Cálculo automático de sales:**
  - Sulfato de Calcio (Gypsum)
  - Cloruro de Calcio
  - Ácido Láctico 88%
  - Bicarbonato de Sodio
  - Sales de Epsom (si necesario)

- **Objetivo de pH:** 5.2-5.6 según estilo

### 6. **Receta Completa y Detallada**
Cada recomendación incluye:
- ✅ Nombre y estilo BJCP
- ✅ Parámetros: OG, FG, ABV, IBU, SRM
- ✅ Lista detallada de maltas (kg y %)
- ✅ Lúpulos con tiempos y uso (Boil, Whirlpool, Dry Hop)
- ✅ Levadura con rango de temperatura
- ✅ Instrucciones de maceración
- ✅ Tiempo de hervor

### 7. **Gestión de Inventario Automática**
- **Guardar Receta:** Almacena la receta para referencia futura
- **Aplicar Receta:** Deduce automáticamente los ingredientes usados del inventario
- **Historial:** Mantiene registro de todas las elaboraciones

---

## 🚀 Cómo Usar el Asistente

### Paso 1: Acceder a la Pestaña
1. Abre Beergate en http://localhost:8000
2. Haz clic en la pestaña **"🤖 Asistente IA"**

### Paso 2: Hacer tu Consulta
Escribe en lenguaje natural lo que quieres elaborar. Ejemplos:

#### **Ejemplo 1: Cerveza específica**
```
Quiero hacer una IPA americana con Citra y Mosaic. 
Tengo Malta Pale Ale y algo de Crystal. ¿Qué me recomiendas?
```

#### **Ejemplo 2: Aprovechamiento**
```
Tengo lúpulos Pacific Jade y Cascade que caducan pronto. 
Dame una receta para usarlos antes de que se echen a perder.
```

#### **Ejemplo 3: Exploración**
```
Dame ideas para una cerveza de trigo refrescante para el verano
```

#### **Ejemplo 4: Estilo concreto**
```
Quiero elaborar una Czech Pilsner auténtica con mi agua de Valsaín. 
¿Qué sales necesito añadir?
```

### Paso 3: Recibir Recomendación
La IA te responderá con:
1. 📊 **Análisis:** Evaluación de tu solicitud
2. ⚠️ **Ingredientes prioritarios:** Los que caducan pronto
3. 🌿 **Lúpulos recomendados:** De tu inventario
4. 🏆 **Inspiración de competición:** Recetas ganadoras similares
5. 🍺 **Receta completa:** Con todas las cantidades
6. 💧 **Ajuste de agua:** Sales exactas a añadir

### Paso 4: Aplicar la Receta
Dos opciones:
- **💾 Guardar Receta:** Solo guarda para consultarla después
- **✅ Aplicar y Deducir:** Guarda Y descuenta ingredientes del inventario

---

## 🔧 Configuración Técnica

### API Key de OpenAI
La API key está configurada en el backend:
```python
OPENAI_API_KEY = "sk-svcacct-84C3WqmdijecgQNLlxej3zhW..."
```

### Modelo Utilizado
- **GPT-4o** (optimizado para JSON estructurado)
- Temperatura: 0.7 (balance creatividad/precisión)

### Endpoints del Backend

#### `POST /ai-recipe-recommender`
**Request:**
```json
{
  "user_prompt": "Quiero hacer una IPA con Citra y Mosaic"
}
```

**Response:**
```json
{
  "success": true,
  "recommendation": {
    "style_analysis": "...",
    "recommended_style": "American IPA",
    "expiring_priority": [...],
    "hop_recommendations": [...],
    "competition_inspiration": {...},
    "recipe": {...},
    "water_adjustments": {...},
    "inventory_deductions": [...]
  },
  "water_profile_used": "Fuente Valsaín",
  "inventory_analyzed": {
    "malts": 22,
    "hops": 17,
    "yeasts": 3
  },
  "expiring_items_count": 5
}
```

#### `POST /apply-recipe`
**Request:**
```json
{
  "recipe": {...},
  "water_adjustments": {...},
  "inventory_deductions": [
    {"item": "Malta Pale Ale", "amount": 4.5, "unit": "kg"},
    {"item": "Citra", "amount": 50, "unit": "g"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Receta aplicada e ingredientes deducidos del inventario",
  "recipe_id": "recipe_23"
}
```

---

## 📊 Datos del Agua de Valsaín

### Archivo: `data/water_profile.json`
```json
{
  "name": "Fuente Valsaín",
  "location": "Hontanares de Eresma, Segovia",
  "date": "19/01/2023",
  "parameters": {
    "ph": 6.1,
    "calcium": 13.7,
    "magnesium": 3.6,
    "sodium": 12.28,
    "chloride": 14.4,
    "sulfate": 8.3,
    "bicarbonate": 0,
    "carbonate": 31.33
  }
}
```

### Interpretación
Tu agua es **muy blanda y baja en minerales**:
- ✅ **Ideal para:** Pilsner checa, estilos ligeros europeos
- ⚠️ **Requiere ajuste para:** IPA, Stout, cervezas lupuladas
- 💡 **Ventaja:** Perfil neutro, fácil de ajustar a cualquier estilo

---

## 🎓 Ejemplos de Uso Avanzado

### 1. **Receta de Emergencia (Caducidad)**
```
Prompt: "Tengo Mosaic que caduca en 15 días y Cascade en 20 días. 
Dame una receta IPA que use ambos antes de que se echen a perder."

Respuesta esperada:
- Lista de ingredientes que caducan
- Receta IPA optimizada para esos lúpulos
- Recomendación de uso (FWH, Dry Hop, etc.)
- Ajuste de agua para resaltar cítricos
```

### 2. **Estilo Exótico**
```
Prompt: "Quiero hacer una Berliner Weisse con Sorachi Ace. 
¿Es buena combinación? ¿Qué maltas usar?"

Respuesta esperada:
- Análisis de la combinación
- Sugerencias de maltas (Wheat, Pilsner)
- Acidificación (ácido láctico vs kettle souring)
- Agua muy blanda (mínimos ajustes)
```

### 3. **Clon de Cerveza Comercial**
```
Prompt: "Quiero clonar Verdant IPA. ¿Qué lúpulos de mi inventario 
se parecen más? Tengo Citra, Mosaic y Simcoe."

Respuesta esperada:
- Análisis del perfil Verdant (tropical, jugoso)
- Recomendación: Citra + Mosaic (perfect match)
- Timing: Late addition y heavy dry hop
- Agua: Alta en cloruros (75-100 ppm)
```

### 4. **Lager Tradicional**
```
Prompt: "Czech Pilsner auténtica con mi agua de Valsaín. 
¿Necesito ajustarla mucho?"

Respuesta esperada:
- Agua perfecta para Pilsner (ya es blanda)
- Ajuste mínimo: solo bajar pH a 5.4
- Recomendación de Saaz del inventario
- Decocción simple vs infusión
```

---

## 🔬 Cálculos de Sales (Ejemplos)

### Para IPA Americana (20L)
**Perfil objetivo:**
- Calcio: 100 ppm
- Sulfatos: 200 ppm
- Cloruros: 75 ppm
- Relación SO₄/Cl: 2.7:1 (seco y amargo)

**Sales a añadir:**
- Sulfato de Calcio (Gypsum): 5.2 g
- Cloruro de Calcio: 2.8 g
- Ácido Láctico 88%: 2.0 ml

### Para Stout (20L)
**Perfil objetivo:**
- Calcio: 120 ppm
- Sulfatos: 100 ppm
- Cloruros: 100 ppm
- Relación SO₄/Cl: 1:1 (balanceado)

**Sales a añadir:**
- Sulfato de Calcio: 3.0 g
- Cloruro de Calcio: 3.5 g
- Bicarbonato de Sodio: 1.5 g (para maltas oscuras)
- Ácido Láctico 88%: 1.5 ml

---

## 🛠️ Mantenimiento

### Actualizar API Key
Edita `/simple-backend/main.py` línea 537:
```python
OPENAI_API_KEY = "tu-nueva-api-key"
```

### Actualizar Perfil de Agua
Edita `/simple-backend/data/water_profile.json` con nuevo análisis.

### Revisar Inventario
El asistente lee en tiempo real de `data/inventory.json`:
- Cantidad actual
- Fechas de caducidad
- Proveedor

---

## 📈 Estadísticas de Uso

El sistema guarda cada receta generada en:
- **Archivo:** `data/my_recipes.json`
- **Incluye:** 
  - Fecha y hora
  - Receta completa
  - Ingredientes deducidos
  - ID único

### Ver Historial
```bash
cat data/my_recipes.json | jq '.'
```

---

## 🎉 ¡Disfruta Elaborando!

El asistente está diseñado para:
- ✅ Ahorrarte tiempo en formulación
- ✅ Aprovechar tu inventario al máximo
- ✅ Evitar desperdicio por caducidad
- ✅ Aprender de recetas ganadoras
- ✅ Ajustar agua con precisión profesional

**¿Dudas o problemas?**
El asistente está entrenado para responder preguntas sobre cerveza. ¡Pregúntale lo que necesites!

---

**Última actualización:** 17 de enero de 2026
**Versión:** 1.0
**Modelo IA:** GPT-4o (OpenAI)
**Agua:** Fuente Valsaín, Segovia

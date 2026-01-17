# 🧠 Sistema de Aprendizaje Automático - Beergate

## 📊 Resumen del Sistema

Se ha implementado un **sistema completo de captura de datos** para entrenar modelos de Machine Learning que aprenderán:

1. ✅ Tus preferencias de estilos cerveceros
2. ✅ Patrones de uso de ingredientes
3. ✅ Combinaciones exitosas de lúpulos y maltas
4. ✅ Ajustes de agua preferidos
5. ✅ Frecuencia y timing de elaboraciones

---

## 🗄️ Archivos de Datos

### 1. `ai_conversations.json`
**Propósito:** Guardar cada interacción con el asistente IA

**Estructura:**
```json
{
  "id": "conv_20260117_143052",
  "timestamp": "2026-01-17T14:30:52.123456",
  "user_prompt": "Quiero hacer una IPA con Citra y Mosaic",
  "ai_response": {
    "style_analysis": "...",
    "recommended_style": "American IPA",
    "recipe": {...}
  },
  "context": {
    "inventory_snapshot": {
      "malts": [...],
      "hops": [...],
      "yeasts": [...]
    },
    "expiring_items": [...],
    "water_profile": "Valsaín"
  },
  "recipe_generated": {...},
  "style_requested": "American IPA",
  "applied_to_inventory": false,
  "brew_id": null
}
```

**Datos ML relevantes:**
- Prompt original del usuario (lenguaje natural)
- Estilo solicitado vs recomendado
- Estado del inventario en ese momento
- Ingredientes próximos a caducar
- Si la receta fue aplicada o no

### 2. `brewing_history.json`
**Propósito:** Historial completo de elaboraciones realizadas

**Estructura:**
```json
{
  "id": "brew_20260117_150234",
  "timestamp": "2026-01-17T15:02:34.123456",
  "recipe_id": "recipe_23",
  "style": "American IPA",
  "recipe_name": "Verdant-Style IPA",
  "batch_size": 30,
  "og": 1.065,
  "fg": 1.012,
  "abv": 6.9,
  "ibu": 65,
  "ingredients_used": {
    "malts": [
      {"name": "Malta Pale Ale", "amount_kg": 6.0, "percentage": 88},
      {"name": "Malta Crystal", "amount_kg": 0.8, "percentage": 12}
    ],
    "hops": [
      {"name": "Citra", "amount_g": 50, "time_min": 15, "use": "Boil"},
      {"name": "Mosaic", "amount_g": 100, "time_min": 0, "use": "Dry Hop"}
    ],
    "yeast": {"name": "US-05", "amount": 2, "temp_range": "18-20°C"}
  },
  "water_profile": "Valsaín",
  "salts_added": [
    {"name": "Sulfato de Calcio", "amount_g": 5.2},
    {"name": "Cloruro de Calcio", "amount_g": 2.8}
  ],
  "conversation_id": "conv_20260117_143052",
  "status": "planned",
  "notes": "",
  "last_updated": "2026-01-17T15:02:34.123456"
}
```

**Estados de elaboración:**
- `planned`: Receta planificada pero no iniciada
- `brewing`: Día de elaboración (maceración/hervor)
- `fermenting`: En fermentación
- `bottled`: Embotellada/envasada
- `finished`: Finalizada y catada

**Datos ML relevantes:**
- Estilos elaborados con frecuencia
- Combinaciones de ingredientes exitosas
- Rangos de ABV/IBU preferidos
- Tamaños de batch típicos
- Patrones temporales (cuándo elaboras)

### 3. `my_recipes.json` (existente, ahora mejorado)
**Propósito:** Recetas guardadas con ajustes de agua

**Nueva estructura:**
```json
{
  "id": "recipe_23",
  "date": "2026-01-17 15:02:34",
  "recipe": {...},
  "water_adjustments": {
    "target_profile": {...},
    "salts_needed": [...]
  },
  "deductions_applied": [...]
}
```

---

## 🔌 Nuevos Endpoints

### 1. `GET /ai-conversations`
Obtiene el historial de conversaciones con la IA

**Parámetros:**
- `limit` (opcional): Número máximo de conversaciones (default: 50)

**Respuesta:**
```json
{
  "success": true,
  "total": 127,
  "conversations": [...]
}
```

**Uso ML:**
```python
# Analizar qué estilos se solicitan más
import requests
data = requests.get('http://localhost:8000/ai-conversations?limit=1000').json()
styles = [c['style_requested'] for c in data['conversations']]
```

### 2. `GET /brewing-history`
Obtiene historial completo de elaboraciones con estadísticas

**Respuesta:**
```json
{
  "success": true,
  "statistics": {
    "total_brews": 45,
    "total_liters": 1350,
    "favorite_styles": [
      ["American IPA", 15],
      ["Pilsner", 10],
      ["American Pale Ale", 8]
    ],
    "avg_abv": 5.8,
    "avg_ibu": 42.3
  },
  "history": [...]
}
```

### 3. `PUT /brewing-history/{brew_id}`
Actualiza estado de una elaboración

**Body:**
```json
{
  "status": "fermenting",
  "notes": "Fermentación activa a 19°C. Buen arranque."
}
```

**Uso:**
```bash
curl -X PUT http://localhost:8000/brewing-history/brew_20260117_150234 \
  -H "Content-Type: application/json" \
  -d '{"status": "fermenting", "notes": "Todo va bien"}'
```

### 4. `GET /ml-insights`
**🔥 ENDPOINT PRINCIPAL PARA ML**

Genera insights basados en TODO tu historial

**Respuesta:**
```json
{
  "success": true,
  "insights": {
    "total_conversations": 127,
    "total_brews": 45,
    "conversion_rate": 35.43,
    "preferred_styles": [
      ["American IPA", 15],
      ["Czech Pilsner", 10],
      ["American Pale Ale", 8],
      ["Saison", 5],
      ["Stout", 4]
    ],
    "preferred_hops": [
      ["Citra", 23],
      ["Mosaic", 18],
      ["Cascade", 15],
      ["Simcoe", 12],
      ["Amarillo", 10]
    ],
    "preferred_malts": [
      ["Malta Pale Ale", 42],
      ["Malta Pilsner", 15],
      ["Malta Crystal", 18],
      ["Malta Munich", 12]
    ],
    "avg_batch_size": 28.5,
    "style_preferences": {
      "hoppy": 28,
      "malty": 8,
      "light": 15,
      "dark": 4
    }
  },
  "recommendations_for_ai": {
    "suggest_styles": ["American IPA", "Czech Pilsner", "American Pale Ale"],
    "suggest_hops": ["Citra", "Mosaic", "Cascade"],
    "suggest_malts": ["Malta Pale Ale", "Malta Crystal", "Malta Munich"]
  }
}
```

---

## 🤖 Flujo de Datos

### Conversación con IA
```mermaid
1. Usuario: "Quiero hacer una IPA con Citra"
   ↓
2. Sistema captura:
   - Prompt exacto
   - Inventario actual
   - Ingredientes caducando
   - Timestamp
   ↓
3. IA genera receta
   ↓
4. Sistema guarda en ai_conversations.json:
   - Conversación completa
   - Receta generada
   - Contexto del inventario
   ↓
5. Usuario aplica receta
   ↓
6. Sistema:
   - Deduce ingredientes
   - Guarda en brewing_history.json
   - Marca conversación como "applied"
   - Vincula conversation_id con brew_id
```

### Actualización de Estado
```mermaid
1. Elaboración en curso
   ↓
2. Usuario actualiza estado:
   PUT /brewing-history/brew_123
   {"status": "fermenting", "notes": "19°C, activa"}
   ↓
3. Sistema añade timestamp y nota al historial
   ↓
4. ML puede analizar:
   - Tiempo entre estados
   - Patrones de fermentación
   - Temperaturas preferidas
```

---

## 📈 Casos de Uso para ML

### 1. **Predicción de Estilos Preferidos**
```python
# Entrenar modelo de clasificación
features = ['hora_del_dia', 'temporada', 'inventario_disponible']
target = 'estilo_solicitado'

# Predecir: "Este sábado por la mañana, con tu inventario actual,
# probablemente quieras hacer una IPA"
```

### 2. **Recomendador de Combinaciones de Ingredientes**
```python
# Análisis de co-ocurrencia
# Si usas Citra, ¿qué otros lúpulos usas habitualmente?
hops_combinations = analyze_hop_pairs(brewing_history)
# Resultado: Citra + Mosaic (18 veces), Citra + Simcoe (12 veces)
```

### 3. **Optimización de Inventario**
```python
# Predecir qué ingredientes necesitarás próximamente
# basado en patrones históricos
predicted_needs = predict_inventory_needs(
    current_inventory,
    brewing_frequency,
    preferred_styles
)
```

### 4. **Detección de Anomalías**
```python
# Alertar si una receta es muy diferente a tu patrón habitual
# "Esta IPA tiene 90 IBU, normalmente haces 45-65 IBU"
anomaly_score = detect_recipe_anomaly(new_recipe, user_history)
```

### 5. **Generación de Recetas Personalizadas**
```python
# Entrenar modelo generativo (GPT fine-tuning)
# Input: Todas tus conversaciones + recetas exitosas
# Output: Modelo que genera recetas "a tu estilo"

from openai import OpenAI
client = OpenAI()

# Fine-tune con tus datos
client.fine_tuning.jobs.create(
    training_file="file-abc123",  # ai_conversations.json procesado
    model="gpt-4o"
)
```

---

## 🛠️ Preparación de Datos para ML

### Script de Exportación
```python
import json
import pandas as pd
from datetime import datetime

# Cargar datos
with open('data/ai_conversations.json') as f:
    conversations = json.load(f)

with open('data/brewing_history.json') as f:
    brews = json.load(f)

# Crear DataFrame para análisis
df = pd.DataFrame([
    {
        'timestamp': b['timestamp'],
        'style': b['style'],
        'abv': b['abv'],
        'ibu': b['ibu'],
        'batch_size': b['batch_size'],
        'hops_used': ','.join([h['name'] for h in b['ingredients_used']['hops']]),
        'malts_used': ','.join([m['name'] for m in b['ingredients_used']['malts']]),
        'status': b['status']
    }
    for b in brews
])

# Análisis temporal
df['timestamp'] = pd.to_datetime(df['timestamp'])
df['hour'] = df['timestamp'].dt.hour
df['day_of_week'] = df['timestamp'].dt.dayofweek
df['month'] = df['timestamp'].dt.month

# Estadísticas
print(df.describe())
print("\nEstilos más elaborados:")
print(df['style'].value_counts())

# Exportar para ML
df.to_csv('brewing_data_for_ml.csv', index=False)
```

### Features para Modelos

**Variables categóricas:**
- `style`: Estilo de cerveza
- `hops_used`: Lúpulos (one-hot encoding)
- `malts_used`: Maltas (one-hot encoding)
- `yeast`: Cepa de levadura
- `day_of_week`: Día de la semana
- `season`: Estación del año

**Variables numéricas:**
- `abv`: Alcohol
- `ibu`: Amargor
- `srm`: Color
- `batch_size`: Litros
- `og`, `fg`: Gravedades
- `inventory_diversity`: Variedad de ingredientes disponibles
- `expiring_items_count`: Ingredientes caducando
- `time_since_last_brew`: Días desde última elaboración

**Variables temporales:**
- `hour_of_day`: Hora del día (0-23)
- `weekend`: Fin de semana (bool)
- `month`: Mes (1-12)

---

## 🎯 Objetivos de ML

### Corto Plazo (Primeros 50 brews)
1. ✅ Captura de datos estructurados
2. ✅ Análisis descriptivo de preferencias
3. ✅ Visualización de patrones

### Medio Plazo (100-200 brews)
1. 🔄 Recomendador basado en filtrado colaborativo
2. 🔄 Predicción de estilos preferidos por temporada
3. 🔄 Optimización de compras de ingredientes

### Largo Plazo (300+ brews)
1. 🚀 Modelo generativo fine-tuned con tus datos
2. 🚀 Predicción de resultados de recetas
3. 🚀 Optimización automática de recetas
4. 🚀 Detección de combinaciones innovadoras

---

## 📊 Dashboard de Análisis

### Visualizaciones Recomendadas

1. **Línea de Tiempo**
   - Elaboraciones por mes
   - Evolución de ABV/IBU promedio
   - Estilos a lo largo del tiempo

2. **Gráficos de Red**
   - Combinaciones de lúpulos
   - Maltas que se usan juntas
   - Estilos relacionados

3. **Mapas de Calor**
   - Elaboraciones por día de la semana × hora
   - Estilos por estación
   - Ingredientes por estilo

4. **Word Cloud**
   - Términos en prompts de usuario
   - Estilos más mencionados
   - Lúpulos más usados

---

## 🔐 Privacidad de Datos

**Datos almacenados localmente:**
- ✅ Todos los archivos en `/simple-backend/data/`
- ✅ No se envía nada a servidores externos (excepto OpenAI API)
- ✅ Control total sobre tus datos

**Para compartir (opcional):**
```python
# Anonimizar datos antes de compartir
def anonymize_data(data):
    # Eliminar IDs únicos, timestamps exactos, etc.
    return anonymized_data
```

---

## 🚀 Próximos Pasos

1. **Seguir elaborando** - El sistema captura todo automáticamente
2. **Actualizar estados** - Marca cuando fermenta, embotella, etc.
3. **Revisar /ml-insights** - Ve tu perfil cervecero evolucionar
4. **Entrenar modelo** - Cuando tengas 50+ brews, empieza con ML

---

## 📚 Recursos

**Librerías Python recomendadas:**
- `pandas`: Análisis de datos
- `scikit-learn`: Modelos ML clásicos
- `matplotlib` + `seaborn`: Visualización
- `networkx`: Análisis de grafos (combinaciones)
- `transformers`: Fine-tuning de LLMs

**Notebooks de ejemplo:**
1. `analisis_exploratorio.ipynb` - EDA completo
2. `recomendador_estilos.ipynb` - Sistema de recomendación
3. `predictor_inventario.ipynb` - Optimización de compras

---

**Última actualización:** 17 de enero de 2026  
**Sistema:** Beergate ML v1.0  
**Datos capturados desde:** Primera conversación con IA  
**Objetivo:** Crear el asistente cervecero más personalizado del mundo 🍺🤖

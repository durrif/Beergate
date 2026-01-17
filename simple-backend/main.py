"""
Beergate - Versión Simple
Sistema de inventario cervecero con recomendaciones
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi import UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
from pathlib import Path

app = FastAPI(title="Beergate Simple")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Archivos de datos
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)
INVENTORY_FILE = DATA_DIR / "inventory.json"
PURCHASES_FILE = DATA_DIR / "purchases.json"
CONVERSATIONS_FILE = DATA_DIR / "ai_conversations.json"
BREWING_HISTORY_FILE = DATA_DIR / "brewing_history.json"

# Modelos
class IngredientCreate(BaseModel):
    name: str
    category: str  # malt, hop, yeast, other
    quantity: float
    unit: str
    cost: Optional[float] = 0
    notes: Optional[str] = ""
    expiry_date: Optional[str] = None  # Fecha de caducidad para lúpulos y levaduras
    supplier: Optional[str] = "Por definir"  # Proveedor del ingrediente

class Ingredient(IngredientCreate):
    id: str
    created_at: str

class Purchase(BaseModel):
    date: str
    supplier: str
    items: List[IngredientCreate]
    total_cost: float
    notes: Optional[str] = ""

# Funciones de datos
def load_json(file_path):
    if file_path.exists():
        with open(file_path, 'r') as f:
            return json.load(f)
    return []

def save_json(file_path, data):
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# Endpoints

@app.get("/")
def root():
    return {"message": "Beergate Simple API", "version": "1.0"}

@app.get("/index.html")
def get_index():
    """Servir el frontend HTML"""
    return FileResponse("index.html")

@app.get("/manifest.json")
def get_manifest():
    """Servir manifest.json para PWA"""
    return FileResponse("manifest.json", media_type="application/json")

@app.get("/service-worker.js")
def get_service_worker():
    """Servir service worker para PWA"""
    return FileResponse("service-worker.js", media_type="application/javascript")

@app.get("/ingredients-info")
def get_ingredients_info():
    """Obtener información detallada de ingredientes para tooltips"""
    try:
        with open("ingredients_info.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"malts": {}, "hops": {}, "yeasts": {}}

@app.get("/inventory")
def get_inventory():
    """Obtener todo el inventario"""
    inventory = load_json(INVENTORY_FILE)
    
    # Agrupar por categoría
    by_category = {}
    for item in inventory:
        cat = item.get('category', 'other')
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(item)
    
    return {
        "items": inventory,
        "by_category": by_category,
        "total_items": len(inventory),
        "total_value": sum(
            (item.get('cost', 0) * item.get('quantity', 0) / 100 if item.get('category') == 'hop' else 
             item.get('cost', 0) * item.get('quantity', 0))
            for item in inventory
        )
    }

@app.post("/inventory")
def add_ingredient(ingredient: IngredientCreate):
    """Agregar un ingrediente al inventario"""
    inventory = load_json(INVENTORY_FILE)
    
    # Buscar si ya existe con el mismo nombre, proveedor y fecha de caducidad
    # Para lúpulos y levaduras, considerar también la fecha de caducidad
    existing = None
    for item in inventory:
        if item['name'].lower() == ingredient.name.lower():
            # Mismo nombre - verificar si es realmente el mismo item
            same_supplier = item.get('supplier', '') == getattr(ingredient, 'supplier', '')
            
            # Para lúpulos y levaduras, también comparar fecha de caducidad
            if ingredient.category in ['hop', 'yeast']:
                same_expiry = item.get('expiry_date') == ingredient.expiry_date
                if same_supplier and same_expiry:
                    existing = item
                    break
            else:
                # Para maltas y otros, solo verificar proveedor
                if same_supplier:
                    existing = item
                    break
    
    if existing:
        # Actualizar cantidad del item existente
        existing['quantity'] += ingredient.quantity
        existing['cost'] = ingredient.cost or existing.get('cost', 0)
    else:
        # Agregar nuevo item (diferente proveedor o fecha de caducidad)
        new_item = ingredient.dict()
        new_item['id'] = f"{ingredient.category}_{len(inventory) + 1}"
        new_item['created_at'] = datetime.now().isoformat()
        inventory.append(new_item)
    
    save_json(INVENTORY_FILE, inventory)
    return {"message": "Ingrediente agregado", "inventory": inventory}

@app.put("/inventory/{item_id}")
def update_ingredient(item_id: str, updates: dict):
    """Actualizar campos de un ingrediente (quantity, cost, supplier, etc)"""
    inventory = load_json(INVENTORY_FILE)
    
    item = next((i for i in inventory if i['id'] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Ingrediente no encontrado")
    
    # Actualizar los campos proporcionados
    for key, value in updates.items():
        if key in ['quantity', 'cost', 'supplier', 'category', 'expiry_date']:
            item[key] = value
    
    item['updated_at'] = datetime.now().isoformat()
    save_json(INVENTORY_FILE, inventory)
    return {"message": "Ingrediente actualizado", "item": item}

@app.delete("/inventory/{item_id}")
def delete_ingredient(item_id: str):
    """Eliminar un ingrediente"""
    inventory = load_json(INVENTORY_FILE)
    inventory = [i for i in inventory if i['id'] != item_id]
    save_json(INVENTORY_FILE, inventory)
    return {"message": "Ingrediente eliminado"}

@app.post("/purchases")
def add_purchase(purchase: Purchase):
    """Registrar una compra y actualizar inventario"""
    purchases = load_json(PURCHASES_FILE)
    
    # Guardar compra
    purchase_record = purchase.dict()
    purchase_record['id'] = f"purchase_{len(purchases) + 1}"
    purchase_record['created_at'] = datetime.now().isoformat()
    purchases.append(purchase_record)
    save_json(PURCHASES_FILE, purchases)
    
    # Actualizar inventario
    for item in purchase.items:
        add_ingredient(item)
    
    return {"message": "Compra registrada", "purchase": purchase_record}

@app.get("/purchases")
def get_purchases():
    """Obtener historial de compras"""
    purchases = load_json(PURCHASES_FILE)
    return {
        "purchases": purchases,
        "total_purchases": len(purchases),
        "total_spent": sum(p.get('total_cost', 0) for p in purchases)
    }

@app.get("/recipes/sync")
def sync_recipes():
    """Sincronizar recetas desde Brewer's Friend"""
    try:
        from brewers_friend import BrewersFriendScraper, generate_insights
        
        scraper = BrewersFriendScraper('384964')
        recipes = scraper.get_recipes()
        
        if not recipes:
            return {"error": "No se pudieron obtener recetas", "recipes": []}
        
        # Guardar recetas
        save_json(DATA_DIR / "my_recipes.json", recipes)
        
        # Generar insights
        insights = generate_insights(recipes)
        save_json(DATA_DIR / "recipe_insights.json", insights)
        
        return {
            "message": f"Sincronizadas {len(recipes)} recetas",
            "total": len(recipes),
            "insights": insights
        }
    except Exception as e:
        return {"error": str(e), "recipes": []}

@app.get("/recipes")
def get_my_recipes():
    """Obtener mis recetas guardadas"""
    recipes = load_json(DATA_DIR / "my_recipes.json")
    return {"recipes": recipes, "total": len(recipes)}

@app.get("/recipes/insights")
def get_recipe_insights():
    """Obtener estadísticas e insights de mis recetas"""
    insights = load_json(DATA_DIR / "recipe_insights.json")
    recipes = load_json(DATA_DIR / "my_recipes.json")
    
    if not insights and recipes:
        # Generar insights si no existen
        from brewers_friend import generate_insights
        insights = generate_insights(recipes)
        save_json(DATA_DIR / "recipe_insights.json", insights)
    
    return insights

@app.get("/recommendations")
def get_recommendations():
    """
    Recomendar recetas basadas en inventario actual
    """
    inventory = load_json(INVENTORY_FILE)
    recipes = load_json(DATA_DIR / "my_recipes.json")
    
    # Ingredientes disponibles
    available = {item['name']: item['quantity'] for item in inventory}
    
    # Recetas que puedo hacer con mi inventario
    can_brew = []
    for recipe in recipes:
        # Análisis simple por ahora
        can_brew.append({
            "name": recipe.get('name', 'Sin nombre'),
            "style": recipe.get('style', 'Unknown'),
            "abv": recipe.get('abv', 0),
            "ibu": recipe.get('ibu', 0),
            "url": recipe.get('url', ''),
            "can_brew": True  # Por ahora asumimos que sí
        })
    
    return {
        "available_ingredients": available,
        "my_recipes": can_brew[:10],  # Top 10
        "total_recipes": len(recipes)
    }

@app.post("/analyze-invoice")
async def analyze_invoice(files: List[UploadFile] = File(...)):
    """Analizar facturas subidas y extraer ingredientes usando OCR y patrones"""
    import re
    import io
    from PIL import Image
    import pytesseract
    import pdfplumber
    
    extracted_items = []
    
    for file in files:
        try:
            content = await file.read()
            text = ""
            
            # Detectar tipo de archivo y extraer texto
            if file.filename.lower().endswith('.pdf'):
                # Procesar PDF
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            
            elif file.filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff')):
                # Procesar imagen con OCR
                image = Image.open(io.BytesIO(content))
                text = pytesseract.image_to_string(image, lang='spa+eng')
            
            elif file.filename.lower().endswith('.xcf'):
                # XCF es formato GIMP, no podemos procesarlo directamente
                return {
                    "items": [],
                    "error": "❌ Archivos .xcf (GIMP) no soportados\n\n📋 Solución:\n1. Abre el archivo en GIMP\n2. Ve a Archivo → Exportar como...\n3. Guarda como PNG o JPG\n4. Sube el archivo exportado aquí\n\nO bien, si tienes la factura en PDF, súbela directamente.",
                    "confidence": 0.0
                }
            
            elif file.filename.lower().endswith(('.doc', '.docx')):
                # Retornar mensaje para Word
                return {
                    "items": [],
                    "error": "❌ Formato Word no soportado. Exporta como PDF e intenta de nuevo.",
                    "confidence": 0.0
                }
            
            else:
                # Intentar leer como texto plano
                try:
                    text = content.decode('utf-8')
                except:
                    text = content.decode('latin-1', errors='ignore')
            
            # ESTRATEGIA: Buscar líneas con estructura de factura
            # Formato típico: "NOMBRE DEL PRODUCTO ... Cantidad: X Precio: Y"
            lines = text.split('\n')
            
            # Patrones para líneas de items
            # Buscar patrones como "MALTA PALE ALE - 25 KG" seguido de cantidad
            item_patterns = [
                # Formato: Malta NOMBRE - CANTIDAD KG/G ... Cantidad: X
                r'Malta\s+(.+?)\s+-\s+(\d+(?:[.,]\d+)?)\s*(kg|g)\s+.*?Cantidad:\s*(\d+)',
                # Formato: MALTA NOMBRE ... Cantidad: X
                r'MALTA\s+(.+?)\s+.*?Cantidad:\s*(\d+)',
                # Formato general: palabra clave + nombre + cantidad
                r'(Carapils|Amber|Clarificante|Grifo)\s+(.+?)\s+.*?Cantidad:\s*(\d+)',
            ]
            
            # Diccionario para mapear nombres a categorías
            malt_keywords = ['malta', 'malt', 'pale', 'pilsner', 'munich', 'vienna', 'wheat', 'trigo', 
                           'crystal', 'caramel', 'chocolate', 'cara', 'melano', 'aroma', 'biscuit',
                           'amber', 'carapils']
            hop_keywords = ['lúpulo', 'lupulo', 'hop', 'cascade', 'centennial', 'chinook', 'citra', 
                          'mosaic', 'simcoe', 'amarillo', 'saaz', 'hallertau']
            yeast_keywords = ['levadura', 'yeast', 'safale', 'saflager', 'wyeast', 'white labs']
            
            # Buscar items línea por línea con contexto
            i = 0
            while i < len(lines):
                line = lines[i]
                line_lower = line.lower()
                
                # Buscar patrones de malta con cantidad en la misma línea o siguiente
                if 'malta' in line_lower or 'malt' in line_lower or 'carapils' in line_lower or 'amber' in line_lower:
                    # Intentar extraer nombre y cantidad
                    # Formato: "Malta NOMBRE - CANTIDAD KG"
                    match = re.search(r'(?:Malta|MALTA|Carapils|CARAPILS|Amber|AMBER)\s+(.+?)\s+-\s+(\d+(?:[.,]\d+)?)\s*(kg|g|KG|G)', line, re.IGNORECASE)
                    if match:
                        name = match.group(1).strip()
                        quantity_str = match.group(2).replace(',', '.')
                        unit = match.group(3).lower()
                        
                        # Buscar cantidad: está en el mismo contexto, formato "Cantidad: ... número"
                        # El número suele estar al final después de precios
                        # Ejemplo: "33,75 € 10,00 % 37,13 € 2 74,25 €"
                        # Donde: precio base, IVA%, precio unitario, cantidad, precio total
                        context = ' '.join(lines[i:min(i+3, len(lines))])
                        
                        # Buscar patrón más específico que incluye el IVA
                        # Formato: "precio € IVA% precio_unit € cantidad precio_total €"
                        qty_match = re.search(r'(\d+,\d+)\s+€\s+\d+,\d+\s+%\s+(\d+,\d+)\s+€\s+(\d+)\s+(\d+,\d+)\s+€', context)
                        qty_count = 1
                        price_total = 0
                        if qty_match:
                            qty_count = int(qty_match.group(3))
                            price_total = float(qty_match.group(4).replace(',', '.'))
                        else:
                            # Patrón alternativo sin IVA
                            qty_match = re.search(r'(\d+,\d+)\s+€\s+(\d+)\s+(\d+,\d+)\s+€', context)
                            if qty_match:
                                qty_count = int(qty_match.group(2))
                                price_total = float(qty_match.group(3).replace(',', '.'))
                        
                        # Calcular cantidad total
                        base_quantity = float(quantity_str)
                        if unit == 'g' and base_quantity >= 100:
                            base_quantity = base_quantity / 1000
                            unit = 'kg'
                        
                        total_quantity = base_quantity * qty_count
                        
                        # Calcular precio por kg (precio total / cantidad total)
                        if price_total > 0 and total_quantity > 0:
                            price_per_kg = price_total / total_quantity
                        else:
                            price_per_kg = 3.0  # Estimación por defecto
                        
                        # Limpiar nombre
                        name = re.sub(r'\s+(ENTERA|Entera|entera)$', '', name).strip()
                        
                        extracted_items.append({
                            "name": name,
                            "category": "malt",
                            "quantity": round(total_quantity, 2),
                            "unit": unit,
                            "cost": round(price_per_kg, 2)
                        })
                
                # Buscar lúpulos
                elif any(kw in line_lower for kw in hop_keywords):
                    match = re.search(r'(?:Lúpulo|LÚPULO|Hop|HOP)\s+(.+?)\s+-?\s*(\d+)\s*g', line, re.IGNORECASE)
                    if match:
                        name = match.group(1).strip()
                        quantity = int(match.group(2))
                        
                        # Buscar multiplicador de cantidad
                        for j in range(i+1, min(i+4, len(lines))):
                            qty_match = re.search(r'Cantidad:\s*(\d+)', lines[j])
                            if qty_match:
                                quantity *= int(qty_match.group(1))
                                break
                        
                        extracted_items.append({
                            "name": name,
                            "category": "hop",
                            "quantity": quantity,
                            "unit": "g",
                            "cost": round(quantity * 0.05, 2)
                        })
                
                # Buscar levaduras
                elif any(kw in line_lower for kw in yeast_keywords):
                    match = re.search(r'(?:Levadura|LEVADURA|Yeast|YEAST)\s+(.+)', line, re.IGNORECASE)
                    if match:
                        name = match.group(1).strip()
                        quantity = 1
                        
                        for j in range(i+1, min(i+4, len(lines))):
                            qty_match = re.search(r'Cantidad:\s*(\d+)', lines[j])
                            if qty_match:
                                quantity = int(qty_match.group(1))
                                break
                        
                        extracted_items.append({
                            "name": name,
                            "category": "yeast",
                            "quantity": quantity,
                            "unit": "pkt",
                            "cost": round(quantity * 3.5, 2)
                        })
                
                # Buscar clarificantes y otros ingredientes
                elif 'clarificante' in line_lower or 'grifo' in line_lower or 'fermentador' in line_lower:
                    # Buscar nombre del producto
                    if 'clarificante' in line_lower:
                        name = "Clarificante para Cerveza"
                    elif 'grifo' in line_lower:
                        name = "Grifo para Fermentador"
                    else:
                        continue
                    
                    quantity = 1
                    unit = "unidad"
                    
                    # Buscar cantidad y unidad en el contexto
                    context = ' '.join(lines[i:min(i+4, len(lines))])
                    
                    # Buscar patrones como "10 pastillas", "25 g", etc.
                    unit_match = re.search(r'(\d+)\s+(pastillas|pastilla|g|ml|unidades)', context, re.IGNORECASE)
                    if unit_match:
                        unit = f"{unit_match.group(1)} {unit_match.group(2)}"
                    
                    # Buscar cantidad pedida (patrón de precio)
                    qty_match = re.search(r'(\d+,\d+)\s+€\s+(\d+)\s+(\d+,\d+)\s+€', context)
                    if qty_match:
                        quantity = int(qty_match.group(2))
                    
                    extracted_items.append({
                        "name": name,
                        "category": "other",
                        "quantity": quantity,
                        "unit": unit,
                        "cost": round(quantity * 3.0, 2)
                    })
                
                i += 1
            
        except Exception as e:
            print(f"Error procesando {file.filename}: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    # Eliminar duplicados
    unique_items = []
    seen = set()
    for item in extracted_items:
        key = (item['name'], item['quantity'], item['unit'])
        if key not in seen:
            seen.add(key)
            unique_items.append(item)
    
    if not unique_items:
        return {
            "items": [],
            "note": "⚠️ No se detectaron ingredientes cerveceros en los archivos. Verifica el formato y contenido.",
            "confidence": 0.0
        }
    
    return {
        "items": unique_items,
        "supplier": "Cocinista",
        "total": sum(item['cost'] * item['quantity'] for item in unique_items),
        "confidence": 0.8,
        "note": f"✅ Se extrajeron {len(unique_items)} items. Revisa las cantidades y costos antes de guardar."
    }

# =============================================
# RECOMENDADOR DE RECETAS CON IA
# =============================================

from openai import OpenAI
import os

# API Key de OpenAI (carga desde variable de entorno)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
WATER_PROFILE_FILE = DATA_DIR / "water_profile.json"

class RecipeRequest(BaseModel):
    user_prompt: str  # Lo que el usuario quiere hacer

@app.post("/ai-recipe-recommender")
async def ai_recipe_recommender(request: RecipeRequest):
    """
    Recomendador de recetas con IA que:
    - Analiza el inventario actual
    - Detecta ingredientes próximos a caducar
    - Sugiere lúpulos adecuados para el estilo
    - Recomienda recetas de homebrewers ganadores
    - Calcula sales necesarias para el agua de Valsain
    """
    try:
        print(f"[AI] Recibiendo solicitud: {request.user_prompt}")
        
        # Cargar datos
        inventory = load_json(INVENTORY_FILE)
        print(f"[AI] Inventario cargado: {len(inventory)} items")
        
        # Cargar perfil de agua con manejo de errores
        water_profile = {}
        if WATER_PROFILE_FILE.exists():
            water_profile = load_json(WATER_PROFILE_FILE)
            print(f"[AI] Perfil de agua cargado")
        else:
            print(f"[AI] WARNING: No se encontró water_profile.json, usando valores por defecto")
            water_profile = {
                "parameters": {"ph": 6.1, "calcium": 13.7, "magnesium": 3.6, "sodium": 12.28, 
                              "chloride": 14.4, "sulfate": 8.3, "bicarbonate": 0, "carbonate": 31.33},
                "derived": {"total_hardness_ppm": 48.2, "residual_alkalinity": 23.9}
            }
        
        # Analizar inventario
        hops_inventory = [item for item in inventory if item['category'] == 'hop']
        malts_inventory = [item for item in inventory if item['category'] == 'malt']
        yeast_inventory = [item for item in inventory if item['category'] == 'yeast']
        
        # Detectar ingredientes próximos a caducar
        today = datetime.now()
        expiring_soon = []
        for item in hops_inventory + yeast_inventory:
            if item.get('expiry_date'):
                expiry = datetime.strptime(item['expiry_date'], '%Y-%m-%d')
                days_to_expire = (expiry - today).days
                if days_to_expire < 60:  # Menos de 2 meses
                    expiring_soon.append({
                        'name': item['name'],
                        'category': item['category'],
                        'quantity': item['quantity'],
                        'days_to_expire': days_to_expire,
                        'expiry_date': item['expiry_date']
                    })
        
        # Ordenar por fecha de caducidad
        expiring_soon.sort(key=lambda x: x['days_to_expire'])
        
        # Construir prompt para GPT
        system_prompt = """Eres un maestro cervecero experto con amplio conocimiento en:
- Estilos de cerveza BJCP
- Formulación de recetas
- Química del agua cervecera
- Concursos internacionales de homebrewing
- Combinaciones de lúpulos y maltas

Tu tarea es ayudar al cervecero a crear la mejor receta posible usando su inventario actual,
priorizando ingredientes que caducan pronto, y ajustando el perfil de agua."""

        user_context = f"""
SOLICITUD DEL USUARIO:
{request.user_prompt}

INVENTARIO ACTUAL:

Maltas disponibles:
{chr(10).join([f"- {item['name']}: {item['quantity']} kg" for item in malts_inventory])}

Lúpulos disponibles:
{chr(10).join([f"- {item['name']}: {item['quantity']} g (caduca: {item.get('expiry_date', 'N/A')})" for item in hops_inventory])}

Levaduras disponibles:
{chr(10).join([f"- {item['name']}: {item['quantity']} pkt (caduca: {item.get('expiry_date', 'N/A')})" for item in yeast_inventory])}

INGREDIENTES PRÓXIMOS A CADUCAR (prioridad alta):
{chr(10).join([f"- {item['name']} ({item['category']}): {item['quantity']} {'g' if item['category'] == 'hop' else 'pkt'} - Caduca en {item['days_to_expire']} días ({item['expiry_date']})" for item in expiring_soon]) if expiring_soon else "Ninguno"}

PERFIL DE AGUA (Fuente Valsaín):
- pH: {water_profile.get('parameters', {}).get('ph', 'N/A')}
- Calcio: {water_profile.get('parameters', {}).get('calcium', 0)} ppm
- Magnesio: {water_profile.get('parameters', {}).get('magnesium', 0)} ppm
- Sodio: {water_profile.get('parameters', {}).get('sodium', 0)} ppm
- Cloruros: {water_profile.get('parameters', {}).get('chloride', 0)} ppm
- Sulfatos: {water_profile.get('parameters', {}).get('sulfate', 0)} ppm
- Bicarbonatos: {water_profile.get('parameters', {}).get('bicarbonate', 0)} ppm
- Carbonatos: {water_profile.get('parameters', {}).get('carbonate', 0)} ppm
- Dureza total: {water_profile.get('derived', {}).get('total_hardness_ppm', 0)} ppm
- Alcalinidad residual: {water_profile.get('derived', {}).get('residual_alkalinity', 0)} ppm

INSTRUCCIONES:
1. Analiza el estilo de cerveza que quiere hacer el usuario
2. Sugiere si es adecuado o recomienda un estilo mejor basado en su inventario
3. Prioriza el uso de ingredientes que caducan pronto
4. Recomienda los mejores lúpulos de su inventario para ese estilo
5. Busca en tu conocimiento recetas ganadoras de concursos similares (menciona el concurso y año)
6. Proporciona una receta completa con cantidades específicas
7. Calcula las sales minerales necesarias para ajustar el agua de Valsaín al perfil del estilo
8. Indica qué ingredientes se deducirán del inventario

FORMATO DE RESPUESTA:
Devuelve un JSON con esta estructura:
{{
  "style_analysis": "Análisis del estilo solicitado vs disponibilidad",
  "recommended_style": "Estilo recomendado (puede ser el mismo o uno mejor)",
  "expiring_priority": ["Lista de ingredientes a usar por caducidad"],
  "hop_recommendations": ["Lúpulos recomendados del inventario para este estilo"],
  "competition_inspiration": {{
    "competition": "Nombre del concurso",
    "year": "Año",
    "brewer": "Nombre del cervecero (si se conoce)",
    "style": "Estilo ganador",
    "notes": "Notas sobre la receta ganadora"
  }},
  "recipe": {{
    "name": "Nombre de la receta",
    "style": "Estilo BJCP",
    "batch_size": 20,
    "og": 1.050,
    "fg": 1.012,
    "abv": 5.0,
    "ibu": 35,
    "srm": 10,
    "malts": [
      {{"name": "Malta Pale Ale", "amount_kg": 4.5, "percentage": 90}},
      {{"name": "Malta Crystal", "amount_kg": 0.5, "percentage": 10}}
    ],
    "hops": [
      {{"name": "Cascade", "amount_g": 30, "time_min": 60, "use": "Boil"}},
      {{"name": "Citra", "amount_g": 50, "time_min": 0, "use": "Dry Hop"}}
    ],
    "yeast": {{
      "name": "US-05",
      "amount": 1,
      "temp_range": "18-20°C"
    }},
    "mash": {{
      "temperature": 66,
      "time": 60,
      "water_liters": 13
    }},
    "boil_time": 60
  }},
  "water_adjustments": {{
    "target_profile": {{
      "calcium": 100,
      "magnesium": 10,
      "sodium": 15,
      "chloride": 75,
      "sulfate": 150,
      "bicarbonate": 50
    }},
    "salts_needed": [
      {{"name": "Sulfato de Calcio (Gypsum)", "amount_g": 3.5, "reason": "Aumentar sulfatos para amargor seco"}},
      {{"name": "Cloruro de Calcio", "amount_g": 2.0, "reason": "Aumentar cloruros para cuerpo"}},
      {{"name": "Ácido Láctico 88%", "amount_ml": 1.5, "reason": "Bajar pH a 5.4"}}
    ],
    "final_ph_target": 5.4
  }},
  "inventory_deductions": [
    {{"item": "Malta Pale Ale", "amount": 4.5, "unit": "kg"}},
    {{"item": "Cascade", "amount": 30, "unit": "g"}},
    {{"item": "US-05", "amount": 1, "unit": "pkt"}}
  ]
}}
"""

        print(f"[AI] Construyendo prompt con {len(malts_inventory)} maltas, {len(hops_inventory)} lúpulos, {len(yeast_inventory)} levaduras")
        print(f"[AI] Ingredientes caducando pronto: {len(expiring_soon)}")
        
        # Llamar a OpenAI
        print(f"[AI] Llamando a OpenAI GPT-4o...")
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        try:
            completion = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_context}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            print(f"[AI] Respuesta recibida de OpenAI")
            
        except Exception as openai_error:
            print(f"[AI] ERROR en llamada a OpenAI: {str(openai_error)}")
            raise HTTPException(status_code=500, detail=f"Error al comunicarse con OpenAI: {str(openai_error)}")
        
        # Parsear respuesta
        try:
            ai_response = json.loads(completion.choices[0].message.content)
            print(f"[AI] JSON parseado correctamente")
        except json.JSONDecodeError as json_error:
            print(f"[AI] ERROR al parsear JSON: {str(json_error)}")
            raise HTTPException(status_code=500, detail=f"Error al parsear respuesta de IA: {str(json_error)}")
        
        # Guardar conversación para ML futuro
        conversation_record = {
            "id": f"conv_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "user_prompt": request.user_prompt,
            "ai_response": ai_response,
            "context": {
                "inventory_snapshot": {
                    "malts": [{"name": m["name"], "quantity": m["quantity"]} for m in malts_inventory],
                    "hops": [{"name": h["name"], "quantity": h["quantity"], "expiry": h.get("expiry_date")} for h in hops_inventory],
                    "yeasts": [{"name": y["name"], "quantity": y["quantity"], "expiry": y.get("expiry_date")} for y in yeast_inventory]
                },
                "expiring_items": expiring_soon,
                "water_profile": "Valsaín"
            },
            "recipe_generated": ai_response.get("recipe", {}),
            "style_requested": ai_response.get("recommended_style", ""),
            "applied_to_inventory": False
        }
        
        # Guardar en archivo de conversaciones
        conversations = load_json(CONVERSATIONS_FILE)
        conversations.append(conversation_record)
        save_json(CONVERSATIONS_FILE, conversations)
        print(f"[AI] Conversación guardada: {conversation_record['id']}")
        
        return {
            "success": True,
            "recommendation": ai_response,
            "conversation_id": conversation_record['id'],
            "water_profile_used": "Fuente Valsaín",
            "inventory_analyzed": {
                "malts": len(malts_inventory),
                "hops": len(hops_inventory),
                "yeasts": len(yeast_inventory)
            },
            "expiring_items_count": len(expiring_soon)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Error en recomendador IA: {str(e)}\n{traceback.format_exc()}"
        print(f"[AI] ERROR GENERAL: {error_detail}")
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/apply-recipe")
async def apply_recipe(recipe_data: dict):
    """
    Aplica una receta al inventario, deduciendo los ingredientes usados
    """
    try:
        inventory = load_json(INVENTORY_FILE)
        
        deductions = recipe_data.get('inventory_deductions', [])
        
        for deduction in deductions:
            item_name = deduction['item']
            amount = deduction['amount']
            unit = deduction['unit']
            
            # Buscar el item en el inventario
            for item in inventory:
                if item['name'].lower() == item_name.lower():
                    # Deducir cantidad
                    item['quantity'] -= amount
                    if item['quantity'] < 0:
                        item['quantity'] = 0
                    break
        
        # Guardar inventario actualizado
        save_json(INVENTORY_FILE, inventory)
        
        # Guardar receta en historial
        recipes_file = DATA_DIR / "my_recipes.json"
        recipes = load_json(recipes_file)
        
        recipe_record = {
            "id": f"recipe_{len(recipes) + 1}",
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "recipe": recipe_data.get('recipe', {}),
            "water_adjustments": recipe_data.get('water_adjustments', {}),
            "deductions_applied": deductions
        }
        
        recipes.append(recipe_record)
        save_json(recipes_file, recipes)
        
        # Guardar en historial de elaboraciones (para ML)
        brewing_history = load_json(BREWING_HISTORY_FILE)
        
        brew_record = {
            "id": f"brew_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "timestamp": datetime.now().isoformat(),
            "recipe_id": recipe_record['id'],
            "style": recipe_data.get('recipe', {}).get('style', 'Unknown'),
            "recipe_name": recipe_data.get('recipe', {}).get('name', 'Sin nombre'),
            "batch_size": recipe_data.get('recipe', {}).get('batch_size', 20),
            "og": recipe_data.get('recipe', {}).get('og', 0),
            "fg": recipe_data.get('recipe', {}).get('fg', 0),
            "abv": recipe_data.get('recipe', {}).get('abv', 0),
            "ibu": recipe_data.get('recipe', {}).get('ibu', 0),
            "ingredients_used": {
                "malts": [m for m in recipe_data.get('recipe', {}).get('malts', [])],
                "hops": [h for h in recipe_data.get('recipe', {}).get('hops', [])],
                "yeast": recipe_data.get('recipe', {}).get('yeast', {})
            },
            "water_profile": "Valsaín",
            "salts_added": recipe_data.get('water_adjustments', {}).get('salts_needed', []),
            "conversation_id": recipe_data.get('conversation_id', None),
            "status": "planned",  # planned, brewing, fermenting, bottled, finished
            "notes": ""
        }
        
        brewing_history.append(brew_record)
        save_json(BREWING_HISTORY_FILE, brewing_history)
        
        # Marcar conversación como aplicada
        if recipe_data.get('conversation_id'):
            conversations = load_json(CONVERSATIONS_FILE)
            for conv in conversations:
                if conv.get('id') == recipe_data.get('conversation_id'):
                    conv['applied_to_inventory'] = True
                    conv['brew_id'] = brew_record['id']
                    break
            save_json(CONVERSATIONS_FILE, conversations)
        
        return {
            "success": True,
            "message": "Receta aplicada e ingredientes deducidos del inventario",
            "recipe_id": recipe_record['id'],
            "brew_id": brew_record['id']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error aplicando receta: {str(e)}")

# =============================================
# ENDPOINTS PARA APRENDIZAJE ML
# =============================================

@app.get("/ai-conversations")
async def get_ai_conversations(limit: Optional[int] = 50):
    """
    Obtiene el historial de conversaciones con la IA
    Útil para análisis de patrones y entrenamiento ML
    """
    try:
        conversations = load_json(CONVERSATIONS_FILE)
        # Ordenar por fecha (más recientes primero)
        conversations.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return {
            "success": True,
            "total": len(conversations),
            "conversations": conversations[:limit]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo conversaciones: {str(e)}")

@app.get("/brewing-history")
async def get_brewing_history():
    """
    Obtiene el historial completo de elaboraciones
    Incluye recetas elaboradas, ingredientes usados, estilos preferidos
    """
    try:
        history = load_json(BREWING_HISTORY_FILE)
        
        # Calcular estadísticas
        styles = {}
        total_batches = len(history)
        total_liters = sum(brew.get('batch_size', 0) for brew in history)
        
        for brew in history:
            style = brew.get('style', 'Unknown')
            styles[style] = styles.get(style, 0) + 1
        
        return {
            "success": True,
            "statistics": {
                "total_brews": total_batches,
                "total_liters": total_liters,
                "favorite_styles": sorted(styles.items(), key=lambda x: x[1], reverse=True),
                "avg_abv": sum(brew.get('abv', 0) for brew in history) / max(total_batches, 1),
                "avg_ibu": sum(brew.get('ibu', 0) for brew in history) / max(total_batches, 1)
            },
            "history": history
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo historial: {str(e)}")

@app.put("/brewing-history/{brew_id}")
async def update_brew_status(brew_id: str, status: str, notes: Optional[str] = ""):
    """
    Actualiza el estado de una elaboración
    Estados: planned, brewing, fermenting, bottled, finished
    """
    try:
        history = load_json(BREWING_HISTORY_FILE)
        
        for brew in history:
            if brew.get('id') == brew_id:
                brew['status'] = status
                if notes:
                    brew['notes'] += f"\n[{datetime.now().strftime('%Y-%m-%d %H:%M')}] {notes}"
                brew['last_updated'] = datetime.now().isoformat()
                break
        
        save_json(BREWING_HISTORY_FILE, history)
        
        return {
            "success": True,
            "message": f"Estado actualizado a: {status}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando estado: {str(e)}")

@app.get("/ml-insights")
async def get_ml_insights():
    """
    Genera insights basados en el historial para entrenar ML
    Analiza patrones de elaboración del usuario
    """
    try:
        conversations = load_json(CONVERSATIONS_FILE)
        brewing_history = load_json(BREWING_HISTORY_FILE)
        
        # Análisis de preferencias
        preferred_hops = {}
        preferred_malts = {}
        preferred_styles = {}
        
        for brew in brewing_history:
            style = brew.get('style', 'Unknown')
            preferred_styles[style] = preferred_styles.get(style, 0) + 1
            
            for hop in brew.get('ingredients_used', {}).get('hops', []):
                hop_name = hop.get('name', 'Unknown')
                preferred_hops[hop_name] = preferred_hops.get(hop_name, 0) + 1
            
            for malt in brew.get('ingredients_used', {}).get('malts', []):
                malt_name = malt.get('name', 'Unknown')
                preferred_malts[malt_name] = preferred_malts.get(malt_name, 0) + 1
        
        # Patrones de uso
        patterns = {
            "total_conversations": len(conversations),
            "total_brews": len(brewing_history),
            "conversion_rate": (len(brewing_history) / max(len(conversations), 1)) * 100,
            "preferred_styles": sorted(preferred_styles.items(), key=lambda x: x[1], reverse=True)[:5],
            "preferred_hops": sorted(preferred_hops.items(), key=lambda x: x[1], reverse=True)[:10],
            "preferred_malts": sorted(preferred_malts.items(), key=lambda x: x[1], reverse=True)[:10],
            "avg_batch_size": sum(b.get('batch_size', 0) for b in brewing_history) / max(len(brewing_history), 1),
            "style_preferences": {
                "hoppy": sum(1 for b in brewing_history if 'IPA' in b.get('style', '') or 'Pale Ale' in b.get('style', '')),
                "malty": sum(1 for b in brewing_history if 'Amber' in b.get('style', '') or 'Brown' in b.get('style', '')),
                "light": sum(1 for b in brewing_history if 'Pilsner' in b.get('style', '') or 'Lager' in b.get('style', '')),
                "dark": sum(1 for b in brewing_history if 'Stout' in b.get('style', '') or 'Porter' in b.get('style', ''))
            }
        }
        
        return {
            "success": True,
            "insights": patterns,
            "recommendations_for_ai": {
                "suggest_styles": [style for style, _ in patterns['preferred_styles']],
                "suggest_hops": [hop for hop, _ in patterns['preferred_hops']],
                "suggest_malts": [malt for malt, _ in patterns['preferred_malts']]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando insights: {str(e)}")

# ========================================
# MÓDULO DE FERMENTACIÓN CON ISPINDEL
# ========================================

ISPINDEL_DATA_FILE = DATA_DIR / "ispindel_data.json"

class IspindelReading(BaseModel):
    timestamp: str
    gravity: float
    temperature: float
    tilt: float
    battery: float
    rssi: int

@app.get("/ispindel/data")
async def get_ispindel_data():
    """Obtener datos almacenados del iSpindel"""
    try:
        if ISPINDEL_DATA_FILE.exists():
            with open(ISPINDEL_DATA_FILE, 'r') as f:
                data = json.load(f)
            return {"success": True, "data": data}
        return {"success": True, "data": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo datos iSpindel: {str(e)}")

@app.get("/ispindel/latest")
async def get_latest_ispindel():
    """Obtener última lectura del webhook de iSpindel Verde"""
    import httpx
    
    webhook_url = "https://brewspy.app/api/json/6lij3pfqt65bmb0ni3iaapnil8"
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(webhook_url)
            response.raise_for_status()
            
            data = response.json()
            
            # Guardar en histórico local
            readings = []
            if ISPINDEL_DATA_FILE.exists():
                with open(ISPINDEL_DATA_FILE, 'r') as f:
                    readings = json.load(f)
            
            # Añadir nueva lectura
            reading = {
                "timestamp": data.get("ts"),
                "gravity": data.get("gravity"),
                "temperature": data.get("temperature"),
                "tilt": data.get("tilt"),
                "battery": data.get("battery"),
                "rssi": data.get("rssi"),
                "name": data.get("name")
            }
            
            readings.append(reading)
            
            # Mantener solo últimas 48 horas (aprox 288 lecturas cada 10 min)
            if len(readings) > 300:
                readings = readings[-300:]
            
            with open(ISPINDEL_DATA_FILE, 'w') as f:
                json.dump(readings, f, indent=2)
            
            return {
                "success": True,
                "current": data,
                "history_count": len(readings)
            }
            
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"Error conectando con iSpindel: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando datos: {str(e)}")

@app.get("/ispindel/history")
async def get_ispindel_history(hours: int = 48):
    """Obtener histórico de lecturas para gráficos"""
    try:
        if not ISPINDEL_DATA_FILE.exists():
            return {"success": True, "data": []}
        
        with open(ISPINDEL_DATA_FILE, 'r') as f:
            readings = json.load(f)
        
        # Filtrar por tiempo
        from datetime import datetime, timedelta
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        
        filtered = []
        for reading in readings:
            try:
                ts = datetime.fromisoformat(reading['timestamp'].replace('Z', '+00:00'))
                if ts >= cutoff:
                    filtered.append(reading)
            except:
                continue
        
        return {
            "success": True,
            "data": filtered,
            "count": len(filtered)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error leyendo histórico: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


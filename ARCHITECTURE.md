# Beergate - Arquitectura de Sistema de Gestión de Inventario Cervecero

## 1. RESUMEN DE ENFOQUE

### MVP (Semanas 1-2)
**Objetivo**: Sistema funcional con inventario, compras básicas, integración Brewer's Friend y recomendaciones simples.

**Incluye**:
- ✅ Inventario completo (maltas, lúpulos, levaduras, adjuntos)
- ✅ CRUD básico con unidades y conversiones
- ✅ Importación manual de facturas (PDF upload + parsing)
- ✅ Integración BeerXML con Brewer's Friend
- ✅ Desconteo automático al elaborar
- ✅ Alertas de umbral mínimo
- ✅ Motor "¿qué puedo elaborar?" con recetas propias
- ✅ ML: matching de productos con embeddings
- ✅ Dashboard admin responsive
- ✅ Auth JWT con roles

**Excluye (v2)**:
- Email forwarding automático de facturas
- Webhooks/notificaciones push
- Comparación con ganadoras BJCP (requiere dataset extenso)
- Predicción ML de agotamiento
- FIFO automático por lotes (manual en MVP)

### V2 (Semanas 3-6)
- Pipeline completo de email→factura
- Integración con bases públicas de recetas ganadoras
- Predicción de agotamiento con histórico
- Recomendador avanzado de sustituciones
- Notificaciones multicanal (email/Telegram)
- App móvil (PWA)

### Tradeoffs MVP
| Decisión | MVP | Beneficio | Coste |
|----------|-----|-----------|-------|
| Parsing facturas | Upload manual + OCR simple | Rápido, funcional | Requiere subir PDFs |
| Brewer's Friend | BeerXML import/export | Sin API necesaria | Manual: exportar receta |
| Ganadoras | Manual: agregar recetas referencia | Legal, controlado | Dataset inicial pequeño |
| ML | Embeddings + cosine similarity | Ligero, sin GPU | No deep learning |
| Notificaciones | In-app | Sin infra externa | Solo cuando entras |

---

## 2. ARQUITECTURA

### Stack Tecnológico

**Backend**
- **FastAPI** (Python 3.12): APIs rápidas, async, documentación auto
- **PostgreSQL 15**: Base de datos relacional robusta
- **SQLAlchemy 2.0**: ORM moderno con async
- **Alembic**: Migraciones de BD
- **Celery + Redis**: Jobs asíncronos (parseo PDF, ML)
- **pdfplumber**: Extracción texto PDF
- **sentence-transformers**: Embeddings para matching

**Frontend**
- **React 18 + Vite**: UI moderna, rápida
- **TypeScript**: Type safety
- **TanStack Query**: State management API
- **Ant Design**: Componentes UI listos
- **React Router**: Routing
- **Recharts**: Gráficas

**Infraestructura**
- **Docker Compose**: Orquestación local
- **Nginx**: Reverse proxy
- **JWT**: Autenticación stateless

### Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │ Dashboard  │  │  Inventory  │  │  Recipes         │    │
│  │ Admin      │  │  Management │  │  Recommendation  │    │
│  └────────────┘  └─────────────┘  └──────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST + JWT
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  NGINX (Reverse Proxy)                      │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND (FastAPI + Python)                    │
│  ┌────────────────────────────────────────────────────────┐│
│  │                    API Layer                           ││
│  │  /api/v1/inventory  /api/v1/purchases                 ││
│  │  /api/v1/recipes    /api/v1/recommendations           ││
│  └───────────────────┬────────────────────────────────────┘│
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────────┐│
│  │                 Service Layer                          ││
│  │  InventoryService  │  PurchaseService                 ││
│  │  RecipeService     │  MLRecommendationService         ││
│  └───────────────────┬────────────────────────────────────┘│
│                      ▼                                       │
│  ┌────────────────────────────────────────────────────────┐│
│  │             Repository Layer (SQLAlchemy)              ││
│  └───────────────────┬────────────────────────────────────┘│
└────────────────────────┼────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL Database                        │
│  ┌──────────────┐ ┌───────────┐ ┌────────────────────────┐│
│  │ ingredients  │ │ purchases │ │ movements              ││
│  │ recipes      │ │ batches   │ │ recommendations        ││
│  └──────────────┘ └───────────┘ └────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  CELERY WORKERS + Redis                     │
│  ┌────────────────┐  ┌──────────────────┐                  │
│  │ PDF Parsing    │  │ ML Embedding     │                  │
│  │ Task Queue     │  │ Generation       │                  │
│  └────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  External Integrations                      │
│  ┌────────────────┐                                         │
│  │ Brewer's Friend│  (BeerXML import/export)               │
│  └────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. MODELO DE DATOS

### Diagrama ER

```
┌──────────────────┐
│     users        │
├──────────────────┤
│ id (PK)          │
│ email            │
│ hashed_password  │
│ role             │──┐
│ created_at       │  │
└──────────────────┘  │
                      │
    ┌─────────────────┘
    │
    │   ┌──────────────────────────┐
    │   │   ingredients            │
    │   ├──────────────────────────┤
    │   │ id (PK)                  │
    ├───│ user_id (FK)             │
    │   │ name                     │
    │   │ category (enum)          │
    │   │ subcategory              │
    │   │ quantity                 │
    │   │ unit                     │
    │   │ cost_per_unit            │
    │   │ supplier                 │
    │   │ purchase_date            │
    │   │ opened_date              │
    │   │ expiry_date              │
    │   │ batch_number             │
    │   │ aa_percent (hops)        │
    │   │ form (pellet/flower)     │
    │   │ status (enum)            │
    │   │ min_threshold            │
    │   │ lead_time_days           │
    │   │ created_at               │
    │   │ updated_at               │
    │   └──────────┬───────────────┘
    │              │
    │              │   ┌──────────────────────┐
    │              │   │   movements          │
    │              │   ├──────────────────────┤
    │              │   │ id (PK)              │
    │              ├───│ ingredient_id (FK)   │
    │              │   │ recipe_id (FK)       │
    │              │   │ purchase_id (FK)     │
    │              │   │ type (enum)          │
    │              │   │ quantity             │
    │              │   │ unit                 │
    │              │   │ cost                 │
    │              │   │ notes                │
    │              │   │ created_at           │
    │              │   │ created_by (FK)      │
    │              │   └──────────────────────┘
    │              │
    │              │   ┌──────────────────────┐
    │              │   │   batches            │
    │              │   ├──────────────────────┤
    │              │   │ id (PK)              │
    │              ├───│ ingredient_id (FK)   │
    │              │   │ batch_number         │
    │              │   │ quantity_initial     │
    │              │   │ quantity_remaining   │
    │              │   │ unit                 │
    │              │   │ cost_per_unit        │
    │              │   │ purchase_date        │
    │              │   │ expiry_date          │
    │              │   │ supplier             │
    │              │   │ status               │
    │              │   │ created_at           │
    │              │   └──────────────────────┘
    │              │
    │   ┌──────────┴───────────────┐
    │   │   recipes                │
    │   ├──────────────────────────┤
    │   │ id (PK)                  │
    ├───│ user_id (FK)             │
    │   │ name                     │
    │   │ style_bjcp               │
    │   │ batch_size_liters        │
    │   │ abv                      │
    │   │ ibu                      │
    │   │ srm                      │
    │   │ og                       │
    │   │ fg                       │
    │   │ fermentation_type        │
    │   │ ingredients_json         │──┐
    │   │ beerxml_content          │  │ [{ingredient_id, quantity, unit}]
    │   │ source                   │  │
    │   │ status                   │  │
    │   │ cost_calculated          │  │
    │   │ created_at               │  │
    │   │ updated_at               │  │
    │   └──────────┬───────────────┘  │
    │              │                   │
    │              │   ┌───────────────┘
    │              │   │
    │              │   │   ┌──────────────────────┐
    │              │   │   │ recipe_ingredients   │
    │              │   │   ├──────────────────────┤
    │              │   │   │ id (PK)              │
    │              │   ├───│ recipe_id (FK)       │
    │              │   │   │ ingredient_id (FK)   │
    │              │   │   │ quantity             │
    │              │   │   │ unit                 │
    │              │   │   │ usage_type           │
    │              │   │   └──────────────────────┘
    │              │   │
    │   ┌──────────┴───┴───────────┐
    │   │   purchases              │
    │   ├──────────────────────────┤
    │   │ id (PK)                  │
    ├───│ user_id (FK)             │
    │   │ supplier                 │
    │   │ purchase_date            │
    │   │ total_cost               │
    │   │ currency                 │
    │   │ invoice_file_path        │
    │   │ invoice_parsed_data      │
    │   │ status                   │
    │   │ created_at               │
    │   └──────────┬───────────────┘
    │              │
    │              │   ┌──────────────────────┐
    │              │   │ purchase_items       │
    │              │   ├──────────────────────┤
    │              │   │ id (PK)              │
    │              ├───│ purchase_id (FK)     │
    │              │   │ product_name_raw     │
    │              │   │ ingredient_id (FK)   │
    │              │   │ quantity             │
    │              │   │ unit                 │
    │              │   │ unit_price           │
    │              │   │ total_price          │
    │              │   │ matched_confidence   │
    │              │   │ created_at           │
    │              │   └──────────────────────┘
    │              │
    │   ┌──────────┴───────────────┐
    │   │   recommendations        │
    │   ├──────────────────────────┤
    │   │ id (PK)                  │
    ├───│ user_id (FK)             │
    │   │ recipe_id (FK)           │
    │   │ type (enum)              │
    │   │ suggestions_json         │
    │   │ confidence_score         │
    │   │ created_at               │
    │   └──────────────────────────┘
    │
    │   ┌──────────────────────────┐
    │   │   reference_recipes      │
    │   ├──────────────────────────┤
    │   │ id (PK)                  │
    │   │ name                     │
    │   │ style_bjcp               │
    │   │ source                   │
    │   │ awards_json              │
    │   │ ingredients_json         │
    │   │ abv, ibu, srm, og, fg    │
    │   │ created_at               │
    │   └──────────────────────────┘
    │
    └───┐
        │   ┌──────────────────────────┐
        │   │   alerts                 │
        │   ├──────────────────────────┤
        │   │ id (PK)                  │
        └───│ user_id (FK)             │
            │ ingredient_id (FK)       │
            │ type (enum)              │
            │ message                  │
            │ severity                 │
            │ is_read                  │
            │ created_at               │
            └──────────────────────────┘
```

### Enums y Tipos

```python
class IngredientCategory(str, Enum):
    MALT = "malt"
    HOP = "hop"
    YEAST = "yeast"
    ADJUNCT = "adjunct"
    FINING = "fining"
    CHEMICAL = "chemical"
    CONSUMABLE = "consumable"
    PACKAGING = "packaging"
    OTHER = "other"

class IngredientStatus(str, Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    EXPIRED = "expired"
    OUT_OF_STOCK = "out_of_stock"

class MovementType(str, Enum):
    PURCHASE = "purchase"
    USAGE = "usage"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"
    EXPIRY = "expiry"

class PurchaseStatus(str, Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    MATCHED = "matched"
    COMPLETED = "completed"

class RecipeStatus(str, Enum):
    DRAFT = "draft"
    PLANNED = "planned"
    BREWING = "brewing"
    COMPLETED = "completed"

class AlertType(str, Enum):
    LOW_STOCK = "low_stock"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"
    REORDER_SUGGESTION = "reorder_suggestion"
```

---

## 4. APIs PRINCIPALES

### Base URL: `/api/v1`

### 4.1 Autenticación

```
POST   /auth/register           # Registro usuario
POST   /auth/login              # Login (retorna JWT)
POST   /auth/refresh            # Refresh token
GET    /auth/me                 # Usuario actual
```

### 4.2 Inventario

```
GET    /inventory               # Listar inventario (filtros: category, status, search)
POST   /inventory               # Crear ingrediente
GET    /inventory/:id           # Detalle ingrediente
PATCH  /inventory/:id           # Actualizar ingrediente
DELETE /inventory/:id           # Eliminar ingrediente
GET    /inventory/:id/movements # Historial movimientos
POST   /inventory/bulk-import   # Importar CSV/JSON
GET    /inventory/stats         # Estadísticas (valor total, alertas)
GET    /inventory/alerts        # Alertas activas
```

### 4.3 Compras y Facturas

```
GET    /purchases               # Listar compras
POST   /purchases               # Crear compra manual
GET    /purchases/:id           # Detalle compra
POST   /purchases/upload-invoice # Upload PDF factura
POST   /purchases/:id/process   # Procesar factura (Celery job)
PATCH  /purchases/:id/match-items # Match items a ingredientes
GET    /purchases/:id/status    # Estado procesamiento
```

### 4.4 Recetas

```
GET    /recipes                 # Listar recetas
POST   /recipes                 # Crear receta manual
POST   /recipes/import-beerxml  # Importar BeerXML
GET    /recipes/:id             # Detalle receta
PATCH  /recipes/:id             # Actualizar receta
DELETE /recipes/:id             # Eliminar receta
POST   /recipes/:id/brew        # Marcar elaboración (descuenta inventario)
GET    /recipes/:id/cost        # Calcular coste
```

### 4.5 Recomendaciones

```
POST   /recommendations/possible-recipes  # ¿Qué puedo elaborar?
  Body: { available_only: true, style?: "IPA", abv_min?: 5.0 }
  
POST   /recommendations/substitutions     # Sustituciones
  Body: { ingredient_id: 123, quantity: 0.5, unit: "kg" }
  
POST   /recommendations/optimize-recipe   # Comparar con referencias
  Body: { recipe_id: 456 }
  
GET    /recommendations/alerts            # Alertas de reposición
```

### 4.6 Referencias (Ganadoras)

```
GET    /references/recipes      # Recetas ganadoras
POST   /references/recipes      # Agregar receta referencia (admin)
GET    /references/styles       # Estilos BJCP
```

### 4.7 Admin

```
GET    /admin/users             # Listar usuarios
PATCH  /admin/users/:id/role    # Cambiar rol
GET    /admin/logs              # Logs de auditoría
POST   /admin/backup            # Generar backup
```

---

## 5. FLUJOS PRINCIPALES

### 5.1 Compra → Factura → Lotes

```
Usuario                    Backend                     Celery Worker            DB
   |                          |                              |                   |
   |-- POST /purchases/upload-invoice ---------------------->|                   |
   |    (PDF file)            |                              |                   |
   |                          |-- Guardar PDF --------------->|-- INSERT purchase |
   |<-- 202 Accepted ---------|    /uploads/invoices/        |                   |
   |    {job_id: "abc123"}    |                              |                   |
   |                          |                              |                   |
   |                          |-- Queue task --------------->|                   |
   |                          |                              |                   |
   |                          |                          [WORKER]                |
   |                          |                              |-- pdfplumber ---  |
   |                          |                              |   extract text    |
   |                          |                              |-- Parse regex --> |
   |                          |                              |   (supplier, date,|
   |                          |                              |    items)         |
   |                          |                              |-- INSERT items -> |
   |                          |                              |                   |
   |-- GET /purchases/abc123/status ----------------------->|                   |
   |<-- 200 {status: "processing"} --------------------------|                   |
   |                          |                              |                   |
   |                          |                          [MATCHING]              |
   |                          |                              |-- sentence-trans  |
   |                          |                              |   embeddings      |
   |                          |                              |-- cosine similarity|
   |                          |                              |-- UPDATE items -> |
   |                          |                              |   ingredient_id   |
   |                          |                              |   confidence      |
   |                          |                              |                   |
   |-- GET /purchases/abc123/status ----------------------->|                   |
   |<-- 200 {status: "completed", items: [...]} ------------|                   |
   |                          |                              |                   |
   |-- PATCH /purchases/abc123/match-items ----------------->|                   |
   |    {items: [{id:1, ingredient_id: 5}, ...]}           |                   |
   |                          |-- UPDATE items ------------->|                   |
   |                          |-- CREATE batches ----------->|                   |
   |                          |-- CREATE movements --------->|                   |
   |                          |-- UPDATE ingredients ------->|                   |
   |<-- 200 OK ---------------|    (quantity += ...)         |                   |
```

### 5.2 Receta → Consumo

```
Usuario                    Backend                              DB
   |                          |                                   |
   |-- POST /recipes/import-beerxml ------------------------>     |
   |    (BeerXML file)        |                                   |
   |                          |-- Parse BeerXML                   |
   |                          |-- Match ingredients (embeddings)  |
   |                          |-- INSERT recipe ----------------->|
   |                          |-- INSERT recipe_ingredients ----->|
   |<-- 201 Created -----------|   {recipe_id: 789}               |
   |                          |                                   |
   |-- GET /recipes/789 --------------------------------------------->|
   |<-- 200 {recipe, ingredients, cost_calculated, can_brew} <---|
   |                          |                                   |
   |-- POST /recipes/789/brew ----------------------------------->|
   |                          |-- Verificar stock disponible      |
   |                          |-- CREATE movements (USAGE) ------>|
   |                          |-- UPDATE ingredients ------------->|
   |                          |   (quantity -= used)              |
   |                          |-- UPDATE recipe status ----------->|
   |<-- 200 {cost_actual, movements} <---------------------------|
```

### 5.3 Alertas

```
Scheduler (Cron)           Backend                              DB
   |                          |                                   |
   |-- Trigger /internal/check-alerts -------------------------->|
   |                          |-- SELECT ingredients             |
   |                          |   WHERE quantity < min_threshold  |
   |                          |-- SELECT ingredients             |
   |                          |   WHERE expiry_date < NOW()+7d    |
   |                          |-- INSERT alerts ----------------->|
   |                          |-- (Optional: send email/webhook)  |
   |                          |                                   |
```

### 5.4 "Recetas Posibles"

```
Usuario                    Backend                              DB / ML
   |                          |                                   |
   |-- POST /recommendations/possible-recipes ----------------->|
   |    {available_only: true, style: "IPA"}                   |
   |                          |-- SELECT ingredients ------------>|
   |                          |   WHERE status = 'available'      |
   |                          |-- SELECT recipes                  |
   |                          |-- Check feasibility:              |
   |                          |   For each recipe:                |
   |                          |     all ingredients in stock?     |
   |                          |     quantity sufficient?          |
   |                          |-- Rank by:                        |
   |                          |   - exact match (100%)            |
   |                          |   - partial (>80% ingredients)    |
   |                          |   - with substitutions            |
   |<-- 200 {recipes: [{recipe, can_brew, missing, substitutions}]}|
```

---

## 6. PLAN DE IMPLEMENTACIÓN

### Fase 1: Setup Base (Día 1-2)
- [x] Setup proyecto backend (FastAPI + SQLAlchemy)
- [x] Setup proyecto frontend (React + Vite)
- [x] Docker Compose (Postgres, Redis, backend, frontend)
- [x] Migraciones DB (Alembic)
- [x] Auth JWT + registro/login

### Fase 2: Inventario Core (Día 3-4)
- [ ] Modelos: Ingredient, Movement, Batch
- [ ] APIs: CRUD inventario
- [ ] Dashboard: Listado inventario con filtros
- [ ] Import CSV inicial (tu inventario actual)
- [ ] Cálculo de alertas básicas

### Fase 3: Compras y Facturas (Día 5-7)
- [ ] Modelos: Purchase, PurchaseItem
- [ ] Upload PDF + storage
- [ ] Celery job: pdfplumber + regex parsing
- [ ] ML: sentence-transformers para matching
- [ ] Dashboard: Upload factura, revisar matches, confirmar

### Fase 4: Recetas e Integración (Día 8-10)
- [ ] Modelos: Recipe, RecipeIngredient
- [ ] BeerXML parser
- [ ] API: import receta, marcar elaboración
- [ ] Desconteo automático de inventario
- [ ] Cálculo de coste por receta

### Fase 5: Recomendaciones (Día 11-13)
- [ ] Motor "recetas posibles"
- [ ] Sustituciones con embeddings
- [ ] Dashboard: "¿Qué puedo elaborar hoy?"
- [ ] Alertas en UI

### Fase 6: Refinamiento (Día 14)
- [ ] Export CSV
- [ ] Logs de auditoría
- [ ] Tests básicos
- [ ] Documentación README
- [ ] Deploy local con Docker

---

## 7. STACK TÉCNICO JUSTIFICADO

### Backend: Python + FastAPI
**Por qué**:
- Async nativo (rendimiento)
- Documentación OpenAPI automática
- Pydantic para validación
- Ecosistema ML maduro (sentence-transformers, pandas)
- Rápido desarrollo

**Alternativas descartadas**:
- Node/NestJS: menos ecosistema ML
- Django: más pesado, menos async

### DB: PostgreSQL
**Por qué**:
- JSONB para campos flexibles (ingredients_json en recipes)
- Full-text search
- Robusto para inventario crítico
- Índices avanzados

### Frontend: React + Vite
**Por qué**:
- Vite: HMR rápido, build optimizado
- React: ecosistema maduro
- TypeScript: type safety en frontend
- Ant Design: componentes listos (tablas, forms, modals)

### OCR: pdfplumber + regex
**Por qué**:
- Sin dependencias pesadas (Tesseract)
- PDFs de facturas suelen ser texto real (no imagen)
- Reglas customizables por proveedor

**Alternativas**:
- Tesseract: para facturas escaneadas
- LLM (GPT-4 Vision): coste alto, MVP no lo necesita

### ML: sentence-transformers
**Por qué**:
- Embeddings preentrenados (all-MiniLM-L6-v2)
- Ligero (400MB modelo)
- Cosine similarity para matching
- Sin GPU necesaria

### Jobs: Celery + Redis
**Por qué**:
- Celery: estándar Python
- Redis: rápido, simple
- Monitoreo con Flower

---

## 8. MODELO DE DATOS DETALLADO

### `users`
```python
id: UUID (PK)
email: str (unique, indexed)
hashed_password: str
full_name: str
role: Enum(admin, user)
is_active: bool
created_at: datetime
updated_at: datetime
```

### `ingredients`
```python
id: UUID (PK)
user_id: UUID (FK → users)
name: str (indexed)
category: Enum(malt, hop, yeast, adjunct, fining, chemical, consumable, packaging, other)
subcategory: str (nullable) # e.g., "base malt", "crystal"
quantity: Decimal(10,3)
unit: str # kg, g, oz, lb, L, ml, units
cost_per_unit: Decimal(10,2)
currency: str (default="EUR")
supplier: str (indexed)
purchase_date: date (nullable)
opened_date: date (nullable)
expiry_date: date (nullable, indexed)
batch_number: str (nullable)
# Hops specific
aa_percent: Decimal(5,2) (nullable)
form: Enum(pellet, flower, plug) (nullable)
# Status
status: Enum(available, reserved, expired, out_of_stock)
min_threshold: Decimal(10,3) (nullable)
lead_time_days: int (nullable)
# Metadata
notes: text (nullable)
created_at: datetime
updated_at: datetime
```

### `movements`
```python
id: UUID (PK)
ingredient_id: UUID (FK → ingredients)
recipe_id: UUID (FK → recipes, nullable)
purchase_id: UUID (FK → purchases, nullable)
type: Enum(purchase, usage, adjustment, transfer, expiry)
quantity: Decimal(10,3)
unit: str
cost: Decimal(10,2) (nullable)
notes: text (nullable)
created_at: datetime
created_by: UUID (FK → users)
```

### `batches`
```python
id: UUID (PK)
ingredient_id: UUID (FK → ingredients)
batch_number: str (indexed)
quantity_initial: Decimal(10,3)
quantity_remaining: Decimal(10,3)
unit: str
cost_per_unit: Decimal(10,2)
purchase_date: date
expiry_date: date (nullable)
supplier: str
status: Enum(active, depleted, expired)
created_at: datetime
```

### `recipes`
```python
id: UUID (PK)
user_id: UUID (FK → users)
name: str (indexed)
style_bjcp: str (nullable) # e.g., "21A American IPA"
batch_size_liters: Decimal(8,2)
abv: Decimal(4,2) (nullable)
ibu: Decimal(6,2) (nullable)
srm: Decimal(5,2) (nullable)
og: Decimal(5,4) (nullable)
fg: Decimal(5,4) (nullable)
fermentation_type: Enum(ale, lager, mixed, spontaneous)
# Ingredients stored as JSONB: [{ingredient_id, quantity, unit, usage_type}]
ingredients_json: jsonb
beerxml_content: text (nullable) # Original BeerXML
source: Enum(manual, beerxml, imported)
status: Enum(draft, planned, brewing, completed)
cost_calculated: Decimal(10,2) (nullable)
notes: text (nullable)
created_at: datetime
updated_at: datetime
brewed_at: datetime (nullable)
```

### `recipe_ingredients` (junction table)
```python
id: UUID (PK)
recipe_id: UUID (FK → recipes)
ingredient_id: UUID (FK → ingredients)
quantity: Decimal(10,3)
unit: str
usage_type: Enum(mash, boil, fermentation, dry_hop, packaging)
timing_minutes: int (nullable) # e.g., 60 min boil
```

### `purchases`
```python
id: UUID (PK)
user_id: UUID (FK → users)
supplier: str (indexed)
purchase_date: date
total_cost: Decimal(10,2)
currency: str (default="EUR")
invoice_number: str (nullable)
invoice_file_path: str (nullable) # /uploads/invoices/xyz.pdf
invoice_parsed_data: jsonb (nullable) # Raw parsed data
status: Enum(pending, processing, processed, matched, completed)
notes: text (nullable)
created_at: datetime
updated_at: datetime
```

### `purchase_items`
```python
id: UUID (PK)
purchase_id: UUID (FK → purchases)
product_name_raw: str # "Simcoe pellets 100g"
ingredient_id: UUID (FK → ingredients, nullable) # Matched ingredient
quantity: Decimal(10,3)
unit: str
unit_price: Decimal(10,2)
total_price: Decimal(10,2)
matched_confidence: Decimal(4,3) (nullable) # 0.0-1.0
notes: text (nullable)
created_at: datetime
```

### `recommendations`
```python
id: UUID (PK)
user_id: UUID (FK → users)
recipe_id: UUID (FK → recipes, nullable)
type: Enum(possible_recipes, substitution, optimization, reorder)
suggestions_json: jsonb # [{item, reason, confidence}]
confidence_score: Decimal(4,3) (nullable)
is_read: bool (default=False)
created_at: datetime
```

### `reference_recipes`
```python
id: UUID (PK)
name: str
style_bjcp: str
source: str # e.g., "GABF 2023", "World Beer Cup 2022"
awards_json: jsonb (nullable) # [{competition, year, medal}]
ingredients_json: jsonb # Normalized ingredients
abv: Decimal(4,2)
ibu: Decimal(6,2)
srm: Decimal(5,2)
og: Decimal(5,4)
fg: Decimal(5,4)
notes: text (nullable)
created_at: datetime
```

### `alerts`
```python
id: UUID (PK)
user_id: UUID (FK → users)
ingredient_id: UUID (FK → ingredients, nullable)
type: Enum(low_stock, expiring_soon, expired, reorder_suggestion)
message: text
severity: Enum(info, warning, critical)
is_read: bool (default=False)
created_at: datetime
```

---

## 9. INTEGRACIÓN BREWER'S FRIEND

### Estrategia

**Brewer's Friend NO tiene API pública oficial** (2026). Estrategias viables:

#### Opción 1: BeerXML (RECOMENDADO para MVP)
- Usuario exporta receta desde Brewer's Friend → BeerXML
- Upload BeerXML a Beergate
- Parser BeerXML → Recipe + RecipeIngredients
- Match ingredientes con inventario (embeddings)

**Ventajas**:
- Legal, sin violar ToS
- BeerXML es estándar
- Funcional para MVP

**Limitaciones**:
- Manual: usuario debe exportar
- No sincronización automática

#### Opción 2: Web Scraping (v2, requiere permiso)
- Scraping con Playwright/Selenium
- Login → My Recipes → Parse HTML
- Riesgo: cambios en UI rompen scraper
- Verificar ToS antes de implementar

#### Opción 3: Email Forwarding (v2)
- Usuario reenvía email de Brewer's Friend ("Recipe Shared")
- Parse HTML email
- Extrae datos de receta

#### Opción 4: API Inversa (no recomendado)
- Reverse-engineer API privada
- Alto riesgo de ser bloqueado

### Implementación BeerXML Parser

```python
# app/services/beerxml_parser.py
import xml.etree.ElementTree as ET

def parse_beerxml(xml_content: str) -> dict:
    root = ET.fromstring(xml_content)
    recipe = root.find('RECIPE')
    
    return {
        'name': recipe.find('NAME').text,
        'style': recipe.find('STYLE/NAME').text,
        'batch_size': float(recipe.find('BATCH_SIZE').text),
        'og': float(recipe.find('OG').text),
        'fg': float(recipe.find('FG').text),
        'ibu': float(recipe.find('IBU').text),
        'abv': float(recipe.find('ABV').text),
        'fermentables': [
            {
                'name': f.find('NAME').text,
                'amount': float(f.find('AMOUNT').text),
                'type': f.find('TYPE').text,
            }
            for f in recipe.findall('FERMENTABLES/FERMENTABLE')
        ],
        'hops': [
            {
                'name': h.find('NAME').text,
                'amount': float(h.find('AMOUNT').text),
                'alpha': float(h.find('ALPHA').text),
                'use': h.find('USE').text,
                'time': int(h.find('TIME').text),
            }
            for h in recipe.findall('HOPS/HOP')
        ],
        'yeasts': [
            {
                'name': y.find('NAME').text,
                'type': y.find('TYPE').text,
                'form': y.find('FORM').text,
            }
            for y in recipe.findall('YEASTS/YEAST')
        ],
    }
```

### Flujo Integración

```
Usuario (Brewer's Friend)              Beergate
        |                                   |
        |-- Export Recipe → BeerXML --------|
        |                                   |
        |-- POST /recipes/import-beerxml -->|
        |    (upload BeerXML file)          |
        |                                   |
        |                              [PARSER]
        |                                   |-- parse_beerxml()
        |                                   |-- Match ingredients:
        |                                   |   "Pilsner Malt" → ingredients
        |                                   |   embeddings similarity
        |                                   |-- INSERT recipe
        |                                   |-- INSERT recipe_ingredients
        |<-- 201 {recipe_id, matches} ------|
        |                                   |
        |-- Ver receta en dashboard --------|
        |-- Confirmar matches --------------|
        |-- POST /recipes/:id/brew ---------|
        |                                   |-- Descontar inventario
        |<-- 200 OK ----------------------- |
```

---

## 10. DATASET DE GANADORAS Y USO

### Estrategia Legal

**Fuentes públicas y legales**:

1. **BJCP Style Guidelines** (público)
   - Rangos por estilo (OG, FG, IBU, SRM, ABV)
   - Características de grano, lúpulo, levadura
   - Sin recetas específicas

2. **Recetas ganadoras publicadas** (con permiso)
   - Brewing Network: "Can You Brew It?" (reproducen ganadoras)
   - Homebrewers Association: algunas ganadoras publicadas
   - Revistas: Zymurgy publica recetas ocasionalmente

3. **Dataset propio**
   - Entrada manual de recetas ganadoras que encuentres públicas
   - Admin puede agregar vía `/references/recipes` (POST)

4. **Crowdsourcing**
   - Usuarios contribuyen recetas propias que ganaron
   - Sistema de verificación (subir foto de medalla)

### Implementación

#### Dataset Inicial (MVP)
```json
[
  {
    "name": "Pliny the Elder Clone",
    "style": "21A American IPA",
    "source": "Brewing Network",
    "awards": [{"competition": "reference", "year": 2020, "medal": "gold"}],
    "abv": 8.0,
    "ibu": 100,
    "srm": 6,
    "og": 1.070,
    "fg": 1.008,
    "ingredients": {
      "malts": [
        {"name": "Pale Malt 2-Row", "percent": 93.8},
        {"name": "Crystal 40L", "percent": 6.2}
      ],
      "hops": [
        {"name": "Columbus", "aa": 14.0, "amount_oz": 1.0, "use": "60min"},
        {"name": "Simcoe", "aa": 13.0, "amount_oz": 1.5, "use": "45min"},
        {"name": "Centennial", "aa": 10.0, "amount_oz": 3.0, "use": "30min"}
      ],
      "yeast": "WLP001 California Ale"
    }
  }
]
```

#### Carga Inicial
```python
# scripts/load_reference_recipes.py
import json
from app.models import ReferenceRecipe

with open('data/reference_recipes.json') as f:
    recipes = json.load(f)
    
for r in recipes:
    ReferenceRecipe.create(
        name=r['name'],
        style_bjcp=r['style'],
        source=r['source'],
        awards_json=r['awards'],
        ingredients_json=r['ingredients'],
        abv=r['abv'],
        ibu=r['ibu'],
        srm=r['srm'],
        og=r['og'],
        fg=r['fg']
    )
```

### Uso en Recomendaciones

```python
# app/services/recommendation_service.py
from app.models import Recipe, ReferenceRecipe

def compare_with_winners(recipe: Recipe) -> dict:
    # 1. Buscar ganadoras del mismo estilo
    refs = ReferenceRecipe.filter(style_bjcp=recipe.style_bjcp)
    
    if not refs:
        return {"message": "No hay recetas de referencia para este estilo"}
    
    # 2. Comparar rangos
    suggestions = []
    
    # ABV
    avg_abv = sum(r.abv for r in refs) / len(refs)
    if abs(recipe.abv - avg_abv) > 0.5:
        suggestions.append({
            "type": "abv",
            "current": recipe.abv,
            "target": avg_abv,
            "action": "Ajusta OG/FG para acercarte a ABV promedio de ganadoras"
        })
    
    # IBU
    avg_ibu = sum(r.ibu for r in refs) / len(refs)
    if abs(recipe.ibu - avg_ibu) > 10:
        suggestions.append({
            "type": "ibu",
            "current": recipe.ibu,
            "target": avg_ibu,
            "action": f"{'Aumenta' if recipe.ibu < avg_ibu else 'Reduce'} amargor"
        })
    
    # 3. Comparar grist (maltas)
    # Calcular % base malt vs specialty
    recipe_grist = analyze_grist(recipe.ingredients_json)
    ref_grist_avg = avg([analyze_grist(r.ingredients_json) for r in refs])
    
    if recipe_grist['base_percent'] < ref_grist_avg['base_percent'] - 5:
        suggestions.append({
            "type": "grist",
            "action": "Incrementa malta base, ganadoras usan más %"
        })
    
    # 4. Comparar lúpulos
    recipe_hops = extract_hops(recipe.ingredients_json)
    ref_hops = [extract_hops(r.ingredients_json) for r in refs]
    
    # Late hop ratio
    recipe_late_ratio = sum(h['amount'] for h in recipe_hops if h['use'] in ['late', 'dryhop']) / sum(h['amount'] for h in recipe_hops)
    ref_late_ratio_avg = avg([...])
    
    if recipe_late_ratio < ref_late_ratio_avg - 0.1:
        suggestions.append({
            "type": "hopping",
            "action": "Ganadoras usan más late hops / dry hop"
        })
    
    return {
        "compared_with": len(refs),
        "suggestions": suggestions,
        "confidence": 0.7  # Ajustar según dispersión de refs
    }
```

---

## 11. ESQUELETO CÓDIGO MVP

Ahora voy a generar la estructura de código completa.

---

## SUPUESTOS Y RESTRICCIONES

### Supuestos Asumidos (sin preguntar)

1. **Moneda**: EUR por defecto
2. **Unidades**: sistema métrico (kg, L) + imperial para recetas US (oz, lb)
3. **Idioma**: UI en español, datos en inglés
4. **Usuarios**: max 10 usuarios iniciales (escala después)
5. **Facturas**: proveedores con PDFs estructurados (no escaneados)
6. **Brewer's Friend**: usuario puede exportar BeerXML
7. **Hosting**: local (Docker) para MVP, cloud para producción
8. **Backup**: manual vía botón "Export" inicialmente
9. **Notificaciones**: in-app para MVP, email en v2
10. **Dataset ganadoras**: ~20 recetas iniciales, crece con uso

### Restricciones Conocidas

- Sin API oficial Brewer's Friend → BeerXML manual
- Sin scraping sin permiso explícito del sitio
- OCR simple (no ML pesado) para MVP
- ML sin GPU (CPU-only embeddings)
- No multi-tenant (un usuario = una instancia para MVP)

---

Ahora voy a generar toda la estructura de código.

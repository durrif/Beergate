# 🍺 Beergate - Sistema de Gestión de Inventario Cervecero

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://www.postgresql.org/)

Sistema completo de gestión de inventario para cerveceros caseros y artesanales con automatización inteligente, integración con Brewer's Friend, y recomendaciones basadas en ML.

## ✨ Características Principales

### MVP (Funcional)
- ✅ **Inventario Completo**: Maltas, lúpulos, levaduras, adjuntos, clarificantes, químicos, envases
- ✅ **Gestión de Compras**: Upload de facturas PDF con procesamiento automático
- ✅ **Integración Brewer's Friend**: Importación de recetas vía BeerXML
- ✅ **Desconteo Automático**: Al elaborar, descuenta ingredientes del inventario
- ✅ **Alertas Inteligentes**: Stock bajo, caducidades próximas, reposición sugerida
- ✅ **Recomendador ML**: "¿Qué puedo elaborar hoy?" con sustituciones
- ✅ **Matching de Productos**: Embeddings (sentence-transformers) para vincular facturas con inventario
- ✅ **Dashboard Admin**: Responsive, CRUD completo, estadísticas en tiempo real
- ✅ **Autenticación JWT**: Roles (admin/usuario)
- ✅ **Auditoría**: Historial completo de movimientos

### Roadmap v2
- 📧 Email forwarding para facturas automáticas
- 🏆 Comparación con recetas ganadoras (BJCP, World Beer Cup, GABF)
- 📊 Predicción ML de agotamiento basada en histórico
- 📱 PWA/App móvil
- 🔔 Notificaciones multicanal (Email, Telegram, Webhooks)

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                    │
│  Dashboard | Inventory | Purchases | Recipes | Recommendations
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST + JWT
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               BACKEND (FastAPI + Python)                    │
│  API Layer → Services → Repositories → Database             │
│  + Celery Workers (PDF parsing, ML matching)                │
└────────────────────────┬────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│     PostgreSQL + Redis + Sentence-Transformers (ML)         │
└─────────────────────────────────────────────────────────────┘
```

**Stack Tecnológico**:
- **Backend**: FastAPI (Python 3.12), SQLAlchemy 2.0, Alembic, Celery
- **Frontend**: React 18, TypeScript, Ant Design, TanStack Query
- **Base de Datos**: PostgreSQL 15 (JSONB para flexibilidad)
- **ML**: sentence-transformers (all-MiniLM-L6-v2), scikit-learn
- **OCR/PDF**: pdfplumber
- **Integración**: BeerXML parser
- **Infraestructura**: Docker Compose, Nginx, Redis

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker & Docker Compose
- (Opcional) Python 3.12+ y Node.js 20+ para desarrollo local

### 1. Clonar y Configurar

```bash
cd /home/durrif/Documentos/Beergate

# Copiar configuración de ejemplo
cp backend/.env.example backend/.env

# Editar backend/.env con tus valores (SECRET_KEY, JWT_SECRET_KEY)
nano backend/.env
```

### 2. Iniciar con Docker

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend
```

### 3. Inicializar Base de Datos

```bash
# Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# Cargar inventario inicial (maltas)
docker-compose exec backend python scripts/load_initial_data.py
```

### 4. Acceder a la Aplicación

- **Frontend**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs
- **API Redoc**: http://localhost:8000/redoc
- **Flower (Celery)**: http://localhost:5555

**Credenciales por defecto**:
- Email: `admin@beergate.com`
- Password: `admin123`

⚠️ **IMPORTANTE**: Cambiar estas credenciales en producción.

## 📖 Uso

### 1. Gestionar Inventario

1. Ve a **Inventario** en el menú
2. Haz clic en "Agregar Ingrediente"
3. Completa: nombre, categoría, cantidad, proveedor, umbral mínimo
4. Guarda

### 2. Registrar Compra con Factura

1. Ve a **Compras**
2. Haz clic en "Subir Factura PDF"
3. Selecciona tu factura
4. El sistema extrae automáticamente:
   - Proveedor, fecha, líneas de productos
   - Matching con ingredientes existentes (ML)
5. Revisa y confirma los matches
6. El inventario se actualiza automáticamente

### 3. Importar Receta desde Brewer's Friend

1. En Brewer's Friend: Recipe → Export → BeerXML
2. En Beergate: **Recetas** → "Importar BeerXML"
3. Upload del archivo `.xml`
4. El sistema:
   - Parsea la receta
   - Vincula ingredientes con tu inventario
   - Calcula si puedes elaborarla
   - Muestra coste estimado

### 4. Elaborar una Receta

1. Ve a **Recetas**
2. Selecciona una receta con "Disponible" en verde
3. Haz clic en "Elaborar"
4. Confirma
5. El sistema:
   - Descuenta ingredientes del inventario
   - Crea movimientos de tipo "USO"
   - Calcula coste real
   - Actualiza estado de la receta

### 5. Ver Recomendaciones

1. Ve a **Recomendaciones**
2. Sección "¿Qué puedo elaborar hoy?":
   - Muestra recetas que puedes hacer con tu inventario actual
   - Sugiere sustituciones si falta algo
3. Sección "Alertas":
   - Stock bajo
   - Ingredientes próximos a caducar
   - Sugerencias de reposición

## 🧪 ML Features

### 1. Matching de Productos (Facturas → Inventario)

**Cómo funciona**:
```python
# Cuando subes una factura con "Simcoe Pellets 100g"
invoice_text = "Simcoe Pellets 100g"
inventory = ["Simcoe Hops", "Cascade Hops", "Citra Hops"]

# El modelo genera embeddings
embeddings = model.encode([invoice_text] + inventory)

# Calcula similitud coseno
similarities = cosine_similarity(embeddings[0], embeddings[1:])
# → Simcoe Hops: 0.92 (match!)
```

**Modelo**: `all-MiniLM-L6-v2` (sentence-transformers)
- Lightweight: 400MB
- CPU-only, sin GPU
- Confianza: 0.0-1.0 (umbral: 0.75)

### 2. Recomendador de Sustituciones

```python
# ¿No tienes Cascade? Sugerimos alternativas
target = "Cascade Hops"
candidates = ["Centennial", "Amarillo", "Simcoe"]

# Calcula similitud por:
# - Embeddings de texto
# - Categoría (hop, malt)
# - Características (AA%, forma)

# Output: Top 3 sustituciones con confianza
```

## 📁 Estructura del Proyecto

```
Beergate/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/       # Endpoints REST
│   │   ├── core/                   # Config, DB, seguridad
│   │   ├── models/                 # Modelos SQLAlchemy
│   │   ├── services/               # Lógica de negocio
│   │   ├── workers/                # Tareas Celery
│   │   └── main.py
│   ├── alembic/                    # Migraciones
│   ├── scripts/                    # Scripts útiles
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/             # Componentes React
│   │   ├── pages/                  # Páginas
│   │   ├── services/               # API client
│   │   ├── config/                 # Configuración
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── data/                           # Datasets, seeds
├── docker-compose.yml
├── ARCHITECTURE.md                 # Documentación técnica
└── README.md
```

## 🔧 Desarrollo Local

### Backend

```bash
cd backend

# Crear entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Variables de entorno
cp .env.example .env
nano .env

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload

# En otra terminal: Celery worker
celery -A app.workers.celery_app worker --loglevel=info

# En otra terminal: Flower
celery -A app.workers.celery_app flower
```

### Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar dev server
npm run dev

# Build para producción
npm run build
```

## 📊 Modelo de Datos

### Entidades Principales

- **Users**: Usuarios con roles (admin/user)
- **Ingredients**: Inventario con categorías, cantidades, costes
- **Movements**: Historial de entradas/salidas
- **Batches**: Lotes por compra (FIFO)
- **Purchases**: Compras con facturas parseadas
- **Purchase_Items**: Líneas de factura con matching
- **Recipes**: Recetas importadas o manuales
- **Recipe_Ingredients**: Ingredientes por receta
- **Recommendations**: Sugerencias generadas
- **Reference_Recipes**: Recetas ganadoras (dataset)
- **Alerts**: Alertas activas

Ver diagrama ER completo en [ARCHITECTURE.md](ARCHITECTURE.md#3-modelo-de-datos).

## 🔗 APIs Principales

### Autenticación
```bash
# Registro
POST /api/v1/auth/register
Body: {"email": "user@example.com", "password": "pass123", "full_name": "User"}

# Login
POST /api/v1/auth/login
Body: {"username": "user@example.com", "password": "pass123"}
Response: {"access_token": "eyJ...", "token_type": "bearer"}

# Usuario actual
GET /api/v1/auth/me
Headers: {"Authorization": "Bearer <token>"}
```

### Inventario
```bash
# Listar inventario
GET /api/v1/inventory?category=malt&status=available&search=pale

# Crear ingrediente
POST /api/v1/inventory
Body: {"name": "Pale Malt", "category": "malt", "quantity": 25, "unit": "kg", ...}

# Historial de movimientos
GET /api/v1/inventory/{id}/movements
```

### Compras
```bash
# Subir factura
POST /api/v1/purchases/upload-invoice
Content-Type: multipart/form-data
Body: file=invoice.pdf

# Ver estado de procesamiento
GET /api/v1/purchases/{id}
```

### Recetas
```bash
# Importar BeerXML
POST /api/v1/recipes/import-beerxml
Content-Type: multipart/form-data
Body: file=recipe.xml

# Elaborar receta
POST /api/v1/recipes/{id}/brew
Response: {"cost_actual": 45.50, "movements_created": 8}
```

### Recomendaciones
```bash
# Recetas posibles
POST /api/v1/recommendations/possible-recipes
Body: {"available_only": true, "style": "IPA"}

# Sustituciones
POST /api/v1/recommendations/substitutions
Body: {"ingredient_id": "uuid", "quantity": 0.5, "unit": "kg"}

# Alertas
GET /api/v1/recommendations/alerts
```

Documentación interactiva completa: http://localhost:8000/docs

## 🧩 Integraciones

### Brewer's Friend

**Estrategia (MVP)**: Import/Export manual vía BeerXML

1. Usuario exporta receta desde Brewer's Friend
2. Upload BeerXML a Beergate
3. Parser extrae: maltas, lúpulos, levaduras, especificaciones
4. ML matching vincula con inventario
5. Listo para elaborar

**v2**: API inversa o scraping (requiere permiso).

### Dataset de Ganadoras

**Fuentes legales**:
- BJCP Style Guidelines (rangos por estilo)
- Brewing Network "Can You Brew It?"
- Homebrewers Association (recetas publicadas)
- Crowdsourcing de usuarios

**Carga inicial**:
```bash
cd backend
python scripts/load_reference_recipes.py
```

## 🐳 Docker Compose Services

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| `postgres` | 5432 | PostgreSQL 15 |
| `redis` | 6379 | Cache & Celery broker |
| `backend` | 8000 | API FastAPI |
| `celery_worker` | - | Procesamiento asíncrono |
| `flower` | 5555 | Monitor Celery |
| `frontend` | 5173 | React app |

**Comandos útiles**:
```bash
# Ver logs
docker-compose logs -f backend

# Reiniciar servicio
docker-compose restart backend

# Acceder a shell del contenedor
docker-compose exec backend bash

# Detener todo
docker-compose down

# Borrar volúmenes (⚠️ elimina datos)
docker-compose down -v
```

## 🧪 Testing

```bash
cd backend

# Ejecutar tests
pytest

# Con cobertura
pytest --cov=app tests/

# Test específico
pytest tests/test_inventory.py -v
```

## 📦 Backup & Export

### Manual (MVP)
```bash
# Desde la UI: Admin → Backup → Export CSV

# Desde terminal: Dump PostgreSQL
docker-compose exec postgres pg_dump -U beergate beergate > backup.sql

# Restaurar
docker-compose exec -T postgres psql -U beergate beergate < backup.sql
```

### Automático (v2)
- Cron job diario
- Upload a S3/Cloud Storage
- Notificación de éxito/fallo

## 🔐 Seguridad

- ✅ JWT para autenticación
- ✅ Bcrypt para passwords
- ✅ CORS configurado
- ✅ SQL injection prevención (SQLAlchemy ORM)
- ✅ Input validation (Pydantic)
- ⚠️ **Cambiar SECRET_KEY y JWT_SECRET_KEY en producción**
- ⚠️ **Usar HTTPS en producción**
- ⚠️ **Configurar firewall y rate limiting**

## 📈 Rendimiento

**MVP soporta**:
- 10,000+ movimientos de inventario
- 1,000+ ingredientes
- 500+ recetas
- 10 usuarios concurrentes

**Optimizaciones**:
- Índices en columnas frecuentes (status, category, expiry_date)
- JSONB para ingredientes en recetas (reduce JOINs)
- Celery para tareas pesadas (PDF parsing, ML)
- Query caching con Redis (v2)

## 🐛 Troubleshooting

### Backend no inicia
```bash
# Verificar logs
docker-compose logs backend

# Verificar que Postgres esté listo
docker-compose exec postgres pg_isready -U beergate

# Reiniciar todo
docker-compose restart
```

### Error al subir factura
- Verificar que el PDF no esté protegido/encriptado
- Máximo 10MB por archivo
- Formato soportado: PDF con texto (no imagen escaneada)

### ML matching no funciona
- Primera ejecución descarga el modelo (400MB)
- Requiere 2GB RAM mínimo
- Verificar logs de Celery: `docker-compose logs celery_worker`

### Frontend no carga
```bash
# Reinstalar dependencias
cd frontend
rm -rf node_modules package-lock.json
npm install

# Verificar que el backend esté corriendo
curl http://localhost:8000/health
```

## 🤝 Contribuir

1. Fork del proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -am 'Add: nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Pull Request

## 📝 Licencia

MIT License - Ver archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

Desarrollado por el equipo Beergate.

## 🙏 Agradecimientos

- **FastAPI**: Marco web moderno y rápido
- **Ant Design**: Componentes UI de calidad
- **sentence-transformers**: ML accesible y efectivo
- **Brewer's Friend**: Inspiración para el sistema de recetas
- **BJCP**: Guías de estilo de cerveza

---

**¿Preguntas o problemas?** Abre un issue en GitHub o consulta [ARCHITECTURE.md](ARCHITECTURE.md) para más detalles técnicos.

**¡Salud! 🍺**

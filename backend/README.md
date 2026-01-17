# Beergate Backend

Backend API para el sistema de gestión de inventario cervecero.

## Setup

### Con Docker (Recomendado)

```bash
cd /path/to/Beergate
docker-compose up -d
```

La API estará disponible en: `http://localhost:8000`
Documentación interactiva: `http://localhost:8000/docs`
Flower (Celery): `http://localhost:5555`

### Desarrollo Local

```bash
cd backend

# Crear entorno virtual
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar configuración
cp .env.example .env
# Editar .env con tus valores

# Ejecutar migraciones
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

## Migraciones

```bash
# Crear nueva migración
alembic revision --autogenerate -m "Description"

# Aplicar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1
```

## Estructura

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/  # Endpoints API
│   ├── core/               # Config, seguridad, DB
│   ├── models/             # Modelos SQLAlchemy
│   ├── schemas/            # Schemas Pydantic
│   ├── services/           # Lógica de negocio
│   ├── repositories/       # Acceso a datos
│   └── workers/            # Tareas Celery
├── alembic/                # Migraciones
├── tests/                  # Tests
├── uploads/                # Archivos subidos
├── requirements.txt
└── Dockerfile
```

## APIs Principales

- `POST /api/v1/auth/register` - Registro
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/inventory` - Listar inventario
- `POST /api/v1/purchases/upload-invoice` - Subir factura
- `POST /api/v1/recipes/import-beerxml` - Importar receta BeerXML
- `POST /api/v1/recipes/{id}/brew` - Marcar elaboración
- `POST /api/v1/recommendations/possible-recipes` - Recetas posibles

Ver documentación completa en `/docs`

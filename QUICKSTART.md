# Guía de Inicio Rápido - Beergate

## Setup Automatizado (Recomendado)

```bash
cd /home/durrif/Documentos/Beergate
./setup.sh
```

Esto:
1. Verifica Docker y Docker Compose
2. Crea `.env` con claves seguras
3. Inicia todos los servicios
4. Ejecuta migraciones
5. Carga tu inventario inicial de maltas

## Setup Manual

### 1. Preparación

```bash
cd /home/durrif/Documentos/Beergate

# Copiar configuración
cp backend/.env.example backend/.env

# Generar claves seguras
echo "SECRET_KEY=$(openssl rand -hex 32)" >> backend/.env
echo "JWT_SECRET_KEY=$(openssl rand -hex 32)" >> backend/.env
```

### 2. Iniciar Servicios

```bash
docker-compose up -d
```

### 3. Migraciones y Datos

```bash
# Esperar a que los servicios estén listos (30 segundos)
sleep 30

# Ejecutar migraciones
docker-compose exec backend alembic upgrade head

# Cargar inventario inicial
docker-compose exec backend python scripts/load_initial_data.py
```

### 4. Acceder

- **Frontend**: http://localhost:5173
- **API**: http://localhost:8000/docs

**Login**:
- Email: `admin@beergate.com`
- Password: `admin123`

## Verificar que Todo Funciona

```bash
# Ver logs del backend
docker-compose logs -f backend

# Verificar salud de la API
curl http://localhost:8000/health

# Verificar Postgres
docker-compose exec postgres pg_isready -U beergate

# Ver servicios corriendo
docker-compose ps
```

## Siguiente Paso: Usar la App

1. **Login** en http://localhost:5173
2. Ve a **Inventario** - deberías ver tus 11 maltas
3. Prueba **Agregar Ingrediente**
4. Ve a **Compras** y prueba subir una factura
5. Explora **Recomendaciones**

## Troubleshooting

### Error: puerto 5432 ya en uso
```bash
# Detener Postgres local si está corriendo
sudo systemctl stop postgresql

# O cambiar el puerto en docker-compose.yml
```

### Error: permisos en setup.sh
```bash
chmod +x setup.sh
./setup.sh
```

### Ver logs completos
```bash
docker-compose logs --tail=100 backend
docker-compose logs --tail=100 celery_worker
```

### Reiniciar desde cero
```bash
# CUIDADO: Borra todos los datos
docker-compose down -v
./setup.sh
```

## Desarrollo

### Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Próximos Pasos

- Lee [README.md](README.md) para documentación completa
- Consulta [ARCHITECTURE.md](ARCHITECTURE.md) para detalles técnicos
- Explora la API en http://localhost:8000/docs

¡Disfruta Beergate! 🍺

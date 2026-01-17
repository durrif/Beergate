# 🍺 Beergate - Asistente Inteligente de Elaboración Cervecera

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Status](https://img.shields.io/badge/Status-Active-success.svg)

**Tu compañero completo para gestionar inventario, elaborar cerveza en tiempo real y monitorizar fermentación**

</div>

---

## 🌟 Características Principales

### 📦 Gestión de Inventario Inteligente
- ✅ Control completo de maltas, lúpulos, levaduras y otros ingredientes
- ✅ Registro de compras con cálculo automático de stock
- ✅ Alertas de stock bajo y productos próximos a caducar
- ✅ Categorización automática con emojis visuales
- ✅ **Cálculo de costes por receta**

### 🔥 Elaboración en Tiempo Real
- ✅ **Timer dual**: tiempo por paso + tiempo total acumulado
- ✅ **Alertas de voz en español** con síntesis TTS
- ✅ Avisos 5 minutos antes de acciones críticas
- ✅ Múltiples patrones de buzzer (warning, hop addition, yeast pitch)
- ✅ Control de temperatura y tiempos de macerado
- ✅ Guía paso a paso con notificaciones sonoras

### 🧪 Monitorización de Fermentación (iSpindel)
- ✅ Integración WiFi con dispositivos iSpindel
- ✅ Gráficos en tiempo real de gravedad y temperatura
- ✅ Webhook automático desde BrewSpy
- ✅ Alertas de fermentación estancada
- ✅ Histórico de 48 horas con actualización cada 5 minutos
- ✅ Tarjetas visuales con gradientes para temperatura, gravedad, ángulo y batería

### 🎵 Música Inteligente
- ✅ **Adaptación automática a la hora del día**:
  - ☀️ Mañana (6h-12h): Rock, indie y energía
  - ☕ Tarde (12h-18h): Lofi, jazz y concentración
  - 🌙 Noche (18h-24h): Ambient, clásica y chill
- ✅ **Música contextual según fase de elaboración**:
  - 🧘 Maceración: Clásica y meditativa
  - 🔥 Hervor: Rock y metal intenso
  - 🧼 Limpieza: Pop y reggae alegre
- ✅ Reproducción continua con fuentes gratuitas
- ✅ Control de volumen integrado

### 🤖 Asistente IA (OpenAI GPT-4)
- ✅ Recomendaciones de recetas según inventario disponible
- ✅ Respuestas a preguntas técnicas sobre elaboración
- ✅ Sugerencias de ajustes de agua según perfil local
- ✅ Análisis de problemas y troubleshooting
- ✅ Contextualizado con tus ingredientes reales

### 🔬 Análisis de Agua
- ✅ Extracción automática de PDFs de análisis de laboratorio
- ✅ Cálculo de ajustes de sales por estilo de cerveza
- ✅ Recomendaciones de pH y mineralización
- ✅ Perfil de agua personalizado con IA

### 📱 Progressive Web App (PWA)
- ✅ **Instalable en Android** como app nativa
- ✅ Funcionalidad offline con Service Worker
- ✅ Icono en pantalla de inicio
- ✅ Tema adaptado a modo oscuro/claro

### 🔗 Integración Brewer's Friend
- ✅ Sincronización de recetas desde Brewer's Friend
- ✅ Análisis de estilos más comunes
- ✅ Estadísticas de ABV, IBU y SRM promedio
- ✅ Carga directa en sesión de elaboración en vivo

---

## 🚀 Instalación Rápida

### Requisitos Previos
- Python 3.11 o superior
- pip (gestor de paquetes Python)
- Git

### 1. Clonar el Repositorio
```bash
git clone https://github.com/TU_USUARIO/Beergate.git
cd Beergate
```

### 2. Crear Entorno Virtual
```bash
python3 -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
```

### 3. Instalar Dependencias
```bash
pip install -r simple-backend/requirements.txt
```

### 4. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:
```env
# API Keys
OPENAI_API_KEY=tu_clave_openai_aqui
BREWERS_FRIEND_API_KEY=tu_clave_brewers_friend_aqui

# iSpindel Webhook
ISPINDEL_WEBHOOK_URL=https://brewspy.app/api/json/tu_token

# Configuración del servidor
HOST=0.0.0.0
PORT=8000
```

### 5. Iniciar el Servidor
```bash
cd simple-backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

O usa el script de inicio:
```bash
./start.sh
```

### 6. Acceder a la Aplicación
Abre tu navegador en: **http://localhost:8000/index.html**

Desde Android (misma WiFi): **http://TU_IP:8000/index.html**

---

## 📖 Uso

### Gestión de Inventario
1. **Añadir ingredientes**: Pestaña "Nueva Compra" → Rellena formulario → Guardar
2. **Ver stock**: Pestaña "Inventario" → Filtrar por categoría
3. **Editar cantidades**: Click en nombre → Modificar → Guardar
4. **Alertas automáticas**: Aparecen en la parte superior cuando hay stock bajo

### Elaboración en Vivo
1. **Seleccionar receta**: Pestaña "Elaboración en Vivo" → Elegir receta
2. **Configurar parámetros**: Batch size, temperatura, tiempos
3. **Iniciar sesión**: Click "Iniciar Elaboración"
4. **Seguir pasos**: El sistema te guiará con voz y alertas
5. **Completar pasos**: Click "Completar Paso" al finalizar cada fase
6. **Reinicio automático**: El timer de paso se reinicia, el total se acumula

### Fermentación iSpindel
1. **Configurar webhook**: En tu iSpindel, apunta a BrewSpy
2. **Ver datos**: Pestaña "Fermentación" → Auto-refresco cada 5 min
3. **Gráficos**: Canvas interactivo con gravedad (rojo) y temperatura (azul)
4. **Alertas**: Si la fermentación se estanca, aparece aviso

### Música Inteligente
1. **Auto-detección**: Al abrir la pestaña "Música", se sugiere ambiente
2. **Manual**: Click en cualquier ambiente (Mañana Activa, Tarde Concentración, etc.)
3. **Auto-cambio**: Si estás elaborando, la música cambia según la fase
4. **Control**: Volumen ajustable, play/pause

### Asistente IA
1. **Pestaña "Asistente IA"**: Escribe tu pregunta
2. **Ejemplos**:
   - "¿Qué receta puedo hacer con mi inventario actual?"
   - "¿Cómo ajusto el agua para una Stout?"
   - "Mi cerveza sabe a diacetilo, ¿qué hago?"
3. **Contexto automático**: La IA conoce tu inventario y perfil de agua

---

## 🔌 API Endpoints

### Inventario
```http
GET    /inventory          # Obtener todo el inventario
POST   /inventory          # Añadir nuevo ingrediente
PUT    /inventory/{name}   # Actualizar ingrediente
DELETE /inventory/{name}   # Eliminar ingrediente
```

### Recetas
```http
GET  /recipes              # Listar todas las recetas
GET  /recipes/sync         # Sincronizar desde Brewer's Friend
GET  /recipes/insights     # Estadísticas de recetas
POST /recipes/recommend    # Recomendaciones según inventario
```

### iSpindel
```http
GET  /ispindel/data        # Datos locales cacheados
GET  /ispindel/latest      # Obtener último dato del webhook
GET  /ispindel/history     # Histórico (query param: hours)
```

### Agua
```http
GET  /water/profile        # Perfil de agua actual
POST /water/analyze        # Analizar PDF de laboratorio
POST /water/adjustments    # Calcular sales necesarias
```

### Asistente IA
```http
POST /ai/chat              # Conversación con GPT-4
     Body: {"message": "tu pregunta", "context": {...}}
```

### PWA
```http
GET  /manifest.json        # Manifest de la app
GET  /service-worker.js    # Service worker para offline
```

---

## 📁 Estructura del Proyecto

```
Beergate/
├── simple-backend/
│   ├── main.py                    # FastAPI backend principal
│   ├── requirements.txt           # Dependencias Python
│   ├── index.html                 # Frontend SPA completo (3600+ líneas)
│   ├── manifest.json              # PWA manifest
│   ├── service-worker.js          # Service worker
│   └── data/
│       ├── inventory.json         # Base de datos de inventario
│       ├── my_recipes.json        # Recetas propias
│       ├── ispindel_data.json     # Datos de fermentación
│       └── water_profile.json     # Perfil de agua
├── Agua/
│   └── *.pdf                      # Análisis de agua (excluido de git)
├── .venv/                         # Entorno virtual (excluido de git)
├── .gitignore
├── README.md
├── LICENSE
└── start.sh                       # Script de inicio rápido
```

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web moderno y rápido
- **Uvicorn**: Servidor ASGI de alto rendimiento
- **OpenAI GPT-4**: Asistente inteligente
- **httpx**: Cliente HTTP asíncrono para webhooks
- **pdfplumber**: Extracción de texto de PDFs

### Frontend
- **HTML5/CSS3/JavaScript**: SPA vanilla sin frameworks
- **Web Speech API**: Síntesis de voz en español
- **Canvas API**: Gráficos de fermentación
- **Service Worker**: Funcionalidad offline
- **HTML5 Audio**: Reproductor de música

### Integrations
- **iSpindel via BrewSpy**: Monitorización de fermentación
- **Brewer's Friend API**: Sincronización de recetas
- **Free Radio Streams**: Música contextual

---

## 📱 Instalación en Android

### Método 1: PWA (Recomendado)
1. Abre Chrome en Android
2. Ve a `http://TU_IP:8000/index.html`
3. Menú (⋮) → "Añadir a pantalla de inicio"
4. Icono aparecerá como app nativa

### Método 2: Termux + Port Forwarding
```bash
pkg install termux-api openssh
ssh -L 8000:localhost:8000 usuario@tu_pc
```

### Solución "Connection Refused"
1. **Verifica IP**: `ip a | grep wlan`
2. **Firewall**: `sudo ufw allow 8000/tcp`
3. **Router AP Isolation**: Desactiva en configuración del router
4. **Alternativa**: Crea hotspot desde el PC

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el proyecto
2. **Crea una rama** para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** tus cambios: `git commit -m 'Añadir nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. **Abre un Pull Request**

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- **OpenAI** por GPT-4
- **Brewer's Friend** por su API de recetas
- **iSpindel Community** por el hardware de fermentación
- **FastAPI** por el excelente framework
- Comunidad homebrewer española 🍺

---

<div align="center">

**Hecho con 🍺 y ❤️ para la comunidad cervecera**

</div>

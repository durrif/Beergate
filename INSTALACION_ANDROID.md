# 📱 Beergate App Android - Instalación

## 🍺 App Web Progresiva (PWA) con Radio Integrada

### Características
- ✅ Instalable como app nativa en Android
- 📻 Radio online con múltiples emisoras
- 🔥 Elaboración en vivo con timer y alertas de voz
- 🧪 Monitoreo de fermentación con iSpindel WiFi
- 📦 Gestión completa de inventario
- 🤖 Asistente IA para recetas

---

## 📲 Cómo instalar en Android

### Opción 1: Instalación directa desde Chrome

1. **Abre Chrome en tu Android**
2. Navega a: `http://TU-IP-LOCAL:8000/index.html`
   - Ejemplo: `http://192.168.1.100:8000/index.html`
3. Toca el **menú de 3 puntos** (⋮) arriba a la derecha
4. Selecciona **"Añadir a pantalla de inicio"** o **"Instalar app"**
5. Confirma la instalación
6. ¡Listo! La app aparecerá en tu cajón de aplicaciones

### Opción 2: Desde la barra de direcciones

1. Abre la web en Chrome
2. Aparecerá un **ícono de instalación** (+) en la barra de direcciones
3. Toca el ícono
4. Confirma **"Instalar"**

---

## 🌐 Acceso desde Android (misma red WiFi)

### Paso 1: Obtener IP del ordenador

En tu ordenador Linux, ejecuta:
```bash
hostname -I | awk '{print $1}'
```

Ejemplo de salida: `192.168.1.100`

### Paso 2: Configurar el servidor

Asegúrate de que el servidor FastAPI esté corriendo:
```bash
cd /home/durrif/Documentos/Beergate/simple-backend
/home/durrif/Documentos/Beergate/.venv/bin/uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Nota:** `--host 0.0.0.0` permite conexiones desde otros dispositivos en la red.

### Paso 3: Abrir en el móvil

En tu Android, abre Chrome y ve a:
```
http://TU-IP:8000/index.html
```

Ejemplo: `http://192.168.1.100:8000/index.html`

---

## 📻 Módulo de Radio

### Emisoras incluidas:
- 🎸 **Rock FM** - Rock clásico y moderno
- 🎧 **Lofi Chill** - Música relajante para elaborar
- 🎷 **Jazz Radio** - Jazz suave y elegante
- 🎹 **Electronic** - Electrónica y chill
- 🎻 **Radio Clásica RNE** - Música clásica española
- 🎤 **Indie Spot** - Indie y alternativo

### Controles:
- ▶️ Play / ⏸️ Pause
- 🔊 Control de volumen (0-100%)
- Cambio instantáneo entre emisoras
- Compatible con altavoces Bluetooth

---

## 🔒 Firewall (si no puedes acceder)

Si tu Android no puede conectar, abre el puerto 8000:

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 8000/tcp

# Firewalld (Fedora/RHEL)
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
```

---

## 🚀 Ejecutar como servicio (opcional)

Para que arranque automáticamente al iniciar el sistema:

```bash
# Crear script de inicio
cat > /home/durrif/Documentos/Beergate/start-server.sh << 'EOF'
#!/bin/bash
cd /home/durrif/Documentos/Beergate/simple-backend
/home/durrif/Documentos/Beergate/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
EOF

chmod +x /home/durrif/Documentos/Beergate/start-server.sh

# Añadir al cron al reiniciar
(crontab -l 2>/dev/null; echo "@reboot /home/durrif/Documentos/Beergate/start-server.sh &") | crontab -
```

---

## 📱 Usar fuera de casa (avanzado)

### Opción 1: Túnel Ngrok
```bash
ngrok http 8000
```

### Opción 2: DuckDNS + Port Forwarding
1. Registra un dominio en [DuckDNS](https://www.duckdns.org)
2. Configura port forwarding en tu router (puerto 8000)
3. Accede desde cualquier lugar: `https://tu-dominio.duckdns.org:8000`

---

## 🎯 Ventajas de la PWA

- ✅ Sin Google Play ni App Store
- ✅ Actualizaciones instantáneas
- ✅ Funciona offline (caché)
- ✅ Notificaciones push
- ✅ Acceso a hardware (audio, cámara)
- ✅ Multiplataforma (Android, iOS, Desktop)

---

## 🐛 Solución de problemas

### "No se puede acceder al sitio"
- Verifica que ambos dispositivos estén en la **misma red WiFi**
- Comprueba la IP con `hostname -I`
- Desactiva temporalmente el firewall: `sudo ufw disable`

### "Error al reproducir radio"
- Algunas emisoras pueden estar offline
- Intenta con otra emisora
- Verifica la conexión a internet

### "La app no aparece para instalar"
- Asegúrate de usar **Chrome** (no Firefox u otro navegador)
- El servidor debe usar **HTTPS** para algunas funciones (opcional)
- Intenta desde el menú ⋮ → "Añadir a pantalla de inicio"

---

## 📝 Notas técnicas

- **PWA** = Progressive Web App
- **Service Worker** cachea recursos para uso offline
- **Manifest.json** define la app (icono, colores, orientación)
- **Audio API** para reproducción de radio streaming
- **Web Speech API** para alertas de voz en elaboración

---

¡Disfruta de tu Beergate App con radio incorporada! 🍺📻

# BeerGate

Sistema de gestión para cervecerías artesanales.

## Configuración

**Dominio planeado**: `beergate.ovosfera.com`  
**Puerto**: 8004  
**Estado**: Pendiente de desarrollo

## Setup

Ver [../capones-backend/TEMPLATE_NEW_APP.md](../capones-backend/TEMPLATE_NEW_APP.md) para instrucciones completas.

## Cloudflare Tunnel

```yaml
Service: http://beergate:8004
Domain: beergate.ovosfera.com
```

## Red Docker

Debe estar en la red `proxy` para conectar con Cloudflare Tunnel.

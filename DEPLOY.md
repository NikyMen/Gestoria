# Deploy de GestorIA en el VPS (PM2)

App Next.js 15 con WhatsApp (Baileys) embebido en el mismo proceso y base de
datos libsql en archivo local. Por eso: **un solo proceso, fork, y tres rutas que
deben persistir**:

| Ruta | Qué guarda |
|---|---|
| `gestoria.db` | La base entera |
| `.wa-auth/` | La sesión de WhatsApp (si no, hay que reescanear el QR) |
| `uploads/` | Las fotos de los remitos de Compras |

Las tres están en `.gitignore`, así que `git pull` no las toca. Si algún día
movés la app de servidor, copiá esas tres cosas.

## Requisitos en el VPS (una vez)

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# pnpm y pm2
npm i -g pnpm pm2
```

## Primer deploy

```bash
cd /opt/gestoria
git clone <URL_DEL_REPO> .

# Dependencias (incluye binario nativo de libsql, prebuilt para linux-x64)
pnpm install --frozen-lockfile

# Variables de entorno (ver .env.example). CAMBIÁ AUTH_SECRET y AUTH_PASSWORD.
cp .env.example .env
nano .env

# Crear el schema y sembrar datos iniciales (usuarios, etapas, etc.)
pnpm db:setup

# Build de producción
pnpm build

# Arrancar con PM2
pm2 start ecosystem.config.cjs
pm2 save                 # guarda la lista de procesos
pm2 startup              # imprime un comando -> ejecutalo para arrancar al bootear
```

La app queda en `http://127.0.0.1:3300` (el puerto lo fija `ecosystem.config.cjs`).

## Redeploys (cuando hacés cambios)

```bash
cd /opt/gestoria
git pull
pnpm install --frozen-lockfile
pnpm db:push        # solo si cambió el schema (es idempotente: no rompe nada)
pnpm build
pm2 reload gestoria
```

> `db:push` solo crea lo que falta (`CREATE TABLE IF NOT EXISTS` + `ALTER`
> tolerantes a error), así que correrlo de más no borra datos.

## La cámara necesita HTTPS

El escáner de código de barras de la Caja usa `getUserMedia`, que los navegadores
solo habilitan en contexto seguro. Desde el celular hay que entrar por el dominio
con HTTPS (ver la sección de nginx + certbot); por IP y `http://` el navegador no
va a pedir permiso de cámara.

## Nginx (reverse proxy + HTTPS)

El chat usa **SSE (Server-Sent Events)**. Hay que **desactivar el buffering** de
nginx o los mensajes en tiempo real no llegan hasta que se cierra la conexión.

```nginx
server {
    server_name tu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # --- imprescindible para el SSE del chat ---
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
    }
}
```

Después: `certbot --nginx -d tu-dominio.com` para el HTTPS.

## Comandos útiles de PM2

```bash
pm2 logs gestoria        # ver logs (incluye [whatsapp] conectado, mensajes, etc.)
pm2 status
pm2 reload gestoria      # reinicio sin downtime tras un build
pm2 restart gestoria
```

## Por qué NO cluster / NO varias instancias

Baileys mantiene UNA conexión WebSocket con WhatsApp y el manager vive como
singleton en `globalThis` (`src/lib/whatsapp/manager.ts`). Las server actions y
la ruta SSE comparten ese proceso. Dos instancias = dos sesiones de WhatsApp
compitiendo = QR inestable y mensajes duplicados/perdidos. Siempre `instances: 1`,
`exec_mode: "fork"`.

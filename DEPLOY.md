# Deploy de GestorIA en el VPS (PM2)

App Next.js 15 con WhatsApp (Baileys) embebido en el mismo proceso y base de
datos libsql en archivo local. Por eso: **un solo proceso, fork, y dos rutas que
deben persistir** (`.wa-auth/` y `gestoria.db`).

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

La app queda en `http://127.0.0.1:3000`. Entrás a /whatsapp, escaneás el QR una
vez y la sesión queda guardada en `.wa-auth/`.

## Redeploys (cuando hacés cambios)

```bash
cd /opt/gestoria
git pull
pnpm install --frozen-lockfile
pnpm db:push        # solo si cambió el schema
pnpm build
pm2 reload gestoria
```

> `.wa-auth/` y `gestoria.db` están (deben estar) en `.gitignore`, así que el
> `git pull` no los toca: la sesión de WhatsApp y la base sobreviven al redeploy.

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

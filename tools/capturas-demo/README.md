# Capturas con datos inventados

Cómo se sacaron las capturas del panel de Odontología Almagro y de las tiendas sin mostrar datos reales.
Nada de esto toca una base real ni envía mails o WhatsApp.

## Odontología Almagro (`sdv4`)
0. Definí `SDV4_BACKEND` con la carpeta `backend` del proyecto de Odontología.
1. `mkdir -p /tmp/mongo-demo && mongod --dbpath /tmp/mongo-demo --port 27099 --bind_ip 127.0.0.1`
2. En `sdv4/backend`: `source tools/capturas-demo/odontologia-env.sh && node index.js`
   (el archivo anula por variable de entorno MONGO_URI, SMTP, CallMeBot, Cloudinary, reCAPTCHA y la verificación en dos pasos).
3. Cargar los datos: `node tools/capturas-demo/odontologia-seed.js` y después `odontologia-seed-portal.js` (con las mismas variables).
   Ambos scripts se niegan a correr si `MONGO_URI` no es `127.0.0.1:27099`.
4. En `sdv4/frontend`: `NEXT_PUBLIC_API_URL=http://localhost:5099 NEXT_PUBLIC_GA_ID= NEXT_PUBLIC_CLARITY_ID= npx next dev -p 3099`
5. Usuario del panel: `demo@demo.test` / `demo-123456`. Paciente del portal: `lucia.demo@example.test` / `demo-123456`.

## Tiendas (Tenshi y tienda de coleccionables)
Arrancarlas con `ADMIN_EMAIL=demo@demo.test ADMIN_PASSWORD=demo-123456 npx next dev -p 3200` (Tenshi) o `-p 3100` (la tienda).
No se leen los `.env`. Antes de usar una captura del panel, revisarla: el resumen y la configuración de la tienda muestran nombres de
clientes y un teléfono real, y la rentabilidad de Tenshi muestra proveedores. Esas tres no se usan.

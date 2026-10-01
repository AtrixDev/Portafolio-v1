# mcp-ml — Mercado Libre Argentina para Claude

Servidor [MCP](https://modelcontextprotocol.io) en Node que le da a Claude dos herramientas para consultar el catálogo de Mercado Libre Argentina:

| Herramienta | Qué hace |
|---|---|
| `ml_obtener_producto` | Trae los datos de un producto de catálogo a partir de su ID (`MLA14086325`) o de su URL (`https://www.mercadolibre.com.ar/.../p/MLA14086325`): nombre, estado, atributos, características, fotos y la publicación que gana la *buy box*. |
| `ml_listar_publicaciones` | Lista las publicaciones que compiten en ese catálogo, con precio, vendedor, condición, envío y link. Suma un resumen con precio mínimo, máximo y promedio. Acepta `limit` (1-100), `offset` para paginar y `orden` (`relevancia`, `precio_asc`, `precio_desc`). |

Las dos son de solo lectura: no publican ni modifican nada en tu cuenta.

> **Ojo con el orden:** `orden` ordena solamente la página que devolvió Mercado Libre. Si el catálogo tiene más publicaciones que `limit`, pedí más (hasta 100) o paginá con `offset` para encontrar el precio más bajo de verdad.

## Requisitos

- Node.js 18 o superior (`node -v` para chequear).
- Una aplicación en el DevCenter de Mercado Libre. **Aunque los datos del catálogo son públicos, la API responde `401`/`403` si no mandás un token de acceso**, así que sin esto no anda.

## 1. Instalación

```bash
cd mcp-ml
npm install
```

## 2. Conseguir las credenciales de Mercado Libre

1. Entrá a <https://developers.mercadolibre.com.ar/devcenter> con tu cuenta de ML y creá una aplicación.
   - En **URI de redirect** poné una URL https (por ejemplo `https://www.google.com`; alcanza con que puedas ver la URL a la que te redirige).
   - En permisos, con lectura alcanza.
2. Anotá el **App ID** (`client_id`) y la **Clave secreta** (`client_secret`).
3. Autorizá la app abriendo esta URL en el navegador (reemplazá los valores):

   ```
   https://auth.mercadolibre.com.ar/authorization?response_type=code&client_id=TU_APP_ID&redirect_uri=TU_REDIRECT_URI
   ```

   Después de aceptar, ML te manda a tu redirect URI con `?code=TG-...` en la barra de direcciones. Copiá ese código (vence en pocos minutos).
4. Cambiá el código por un token:

   ```bash
   curl -X POST https://api.mercadolibre.com/oauth/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=authorization_code" \
     -d "client_id=TU_APP_ID" \
     -d "client_secret=TU_CLAVE_SECRETA" \
     -d "code=TG-XXXXXXXX" \
     -d "redirect_uri=TU_REDIRECT_URI"
   ```

   La respuesta trae `access_token` y `refresh_token`. El que te interesa es el **`refresh_token`** (`TG-...`).

### Variables de entorno

| Variable | Para qué |
|---|---|
| `ML_CLIENT_ID` | App ID de tu aplicación. |
| `ML_CLIENT_SECRET` | Clave secreta de tu aplicación. |
| `ML_REFRESH_TOKEN` | El `refresh_token` del paso 4. |
| `ML_ACCESS_TOKEN` | *(Opcional)* Un token de acceso ya generado. Si lo usás solo, sin las otras tres, vence a las 6 horas y lo tenés que cambiar a mano. |
| `ML_TOKEN_FILE` | *(Opcional)* Dónde guardar el token renovado. Por defecto `~/.mcp-ml-token.json`. |

**Recomendado:** configurá `ML_CLIENT_ID`, `ML_CLIENT_SECRET` y `ML_REFRESH_TOKEN`. El servidor renueva el token solo cuando vence. Mercado Libre entrega un `refresh_token` nuevo cada vez que se renueva (y el anterior deja de servir), así que el servidor guarda el último en `ML_TOKEN_FILE` y lo usa en los siguientes arranques, por encima del que pusiste en `ML_REFRESH_TOKEN`. Mientras funcione, no borres ese archivo.

Si no configurás `ML_REFRESH_TOKEN`, el servidor intenta pedir un token con `client_credentials`. Puede que tu app no tenga habilitado ese flujo; en ese caso vas a ver el error de ML y tenés que usar el refresh token.

## 3. Conectarlo a Claude

En los ejemplos, reemplazá `/ruta/absoluta/a/mcp-ml` por la ruta real de la carpeta (la sacás con `pwd` parado adentro de `mcp-ml`).

### Claude Code

```bash
claude mcp add mercadolibre \
  -e ML_CLIENT_ID=TU_APP_ID \
  -e ML_CLIENT_SECRET=TU_CLAVE_SECRETA \
  -e ML_REFRESH_TOKEN=TG-XXXXXXXX \
  -- node /ruta/absoluta/a/mcp-ml/src/index.js
```

Para chequear que quedó andando: `claude mcp list`, o `/mcp` adentro de una sesión.

### Claude Desktop

Abrí el archivo de configuración (desde la app: *Configuración → Desarrollador → Editar configuración*):

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

y sumá esto:

```json
{
  "mcpServers": {
    "mercadolibre": {
      "command": "node",
      "args": ["/ruta/absoluta/a/mcp-ml/src/index.js"],
      "env": {
        "ML_CLIENT_ID": "TU_APP_ID",
        "ML_CLIENT_SECRET": "TU_CLAVE_SECRETA",
        "ML_REFRESH_TOKEN": "TG-XXXXXXXX"
      }
    }
  }
}
```

En Windows, escribí la ruta con barras dobles: `"C:\\Users\\vos\\mcp-ml\\src\\index.js"`. Cerrá Claude Desktop del todo y volvé a abrirlo. Las herramientas aparecen en el menú de herramientas del chat.

## 4. Probalo

Preguntale a Claude, por ejemplo:

- *"¿Qué es el producto MLA14086325 de Mercado Libre?"*
- *"Listame las 50 publicaciones más baratas que compiten en https://www.mercadolibre.com.ar/.../p/MLA14086325 y decime cuáles tienen envío gratis."*

Si querés probar el servidor sin Claude, usá el MCP Inspector:

```bash
ML_CLIENT_ID=... ML_CLIENT_SECRET=... ML_REFRESH_TOKEN=... \
  npx @modelcontextprotocol/inspector node src/index.js
```

## Problemas comunes

| Síntoma | Qué hacer |
|---|---|
| `Mercado Libre rechazó la consulta (401/403 ...)` | Faltan las credenciales o no son válidas. Revisá las variables de entorno. |
| `No se pudo obtener un token ... invalid_grant` | El refresh token ya se usó o venció. Repetí los pasos 3 y 4, actualizá `ML_REFRESH_TOKEN` y borrá `~/.mcp-ml-token.json` para que tome el nuevo. |
| `429` | Hiciste demasiadas consultas seguidas. Esperá unos segundos. |
| La lista de publicaciones sale vacía | El catálogo no tiene publicaciones activas en este momento, o el ID es de una publicación (item) y no de un producto de catálogo. Los IDs de catálogo aparecen en URLs con `/p/MLA...`. |
| Claude no ve las herramientas | Revisá que la ruta sea absoluta y que `node -v` dé 18 o más. En Claude Desktop, mirá los logs en *Configuración → Desarrollador*. |

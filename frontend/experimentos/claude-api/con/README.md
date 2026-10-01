# Clasificador de preguntas de Mercado Libre

`clasificar.py` lee un CSV con preguntas de compradores y le agrega una columna `categoria` con una de estas etiquetas: `stock`, `envío`, `medidas`, `compatibilidad`, `precio` u `otra`. La clasificación la hace Claude a través de la API de Anthropic.

## Instalación

Necesitás Python 3.10 o más nuevo y una API key de Anthropic.

```bash
pip install anthropic
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Uso

```bash
python clasificar.py preguntas.csv
```

El resultado queda en `preguntas_clasificado.csv`, con las mismas columnas que el original más `categoria`. El separador (coma, punto y coma o tabulación) se detecta solo.

| Opción | Para qué sirve | Por defecto |
|---|---|---|
| `-c`, `--columna` | Columna que tiene el texto de la pregunta | `pregunta` |
| `-o`, `--salida` | Archivo de salida | `<entrada>_clasificado.csv` |
| `--modelo` | Modelo de Claude | `claude-opus-5-5` |
| `--cache` | Archivo con lo ya clasificado | `cache_clasificaciones.json` |

El script no responde al instante: manda las preguntas como un lote y espera a que termine. Suele tardar unos minutos y casi siempre menos de una hora, aunque la API se puede tomar hasta 24. Está pensado para correrlo una vez por día, por ejemplo con `cron`.

## Cómo cuida el gasto

- **Lotes a mitad de precio.** Usa la Batches API, que cobra el 50 % a cambio de no contestar en el momento.
- **Varias preguntas por pedido.** Manda hasta 50 preguntas juntas, así las instrucciones se pagan una vez cada 50 y no una vez por pregunta.
- **No paga dos veces la misma pregunta.** Las preguntas repetidas se clasifican una sola vez, sin distinguir mayúsculas ni espacios. Lo clasificado queda en el caché y sirve para los días siguientes.
- **Razonamiento al mínimo.** Le pide al modelo el nivel de esfuerzo más bajo, que alcanza para clasificar.
- **Si se corta, no se vuelve a cobrar.** El lote en curso queda anotado en `<salida>.lote.json`. Al correr de nuevo el mismo comando, el script retoma ese lote en vez de mandar otro.

Al terminar muestra los tokens usados y el costo estimado del lote.

### Elegir el modelo

El modelo es lo que más pesa en el costo. Precios de lista por millón de tokens (el lote cobra la mitad):

| Modelo | Entrada | Salida |
|---|---|---|
| `claude-opus-5-5` | USD 4 | USD 20 |
| `claude-sonnet-5-5` | USD 2 | USD 10 |
| `claude-haiku-4-5` | USD 1 | USD 5 |

Para probar uno más barato:

```bash
python clasificar.py preguntas.csv --modelo claude-haiku-4-5 --cache cache_haiku.json
```

Usá un caché aparte para la prueba, así el modelo clasifica todo de nuevo. Después compará los dos CSV de salida sobre un día real de preguntas antes de cambiar.

## A tener en cuenta

- Las filas con la pregunta vacía quedan con la categoría vacía.
- Si algunas preguntas quedan sin categoría, el script avisa y termina con código 1. Corriéndolo de nuevo solo manda las que faltan.
- Si cambiás las categorías o las instrucciones en `clasificar.py`, borrá el caché para que no se mezclen clasificaciones viejas con nuevas.

# Clasificador de preguntas de Mercado Libre

Lee un CSV con preguntas de compradores y le agrega una columna `categoria` con una de estas: `stock`, `envío`, `medidas`, `compatibilidad`, `precio` u `otra`.

## Instalación

```bash
pip install anthropic
export ANTHROPIC_API_KEY="sk-ant-..."
```

## Uso

```bash
python clasificar.py preguntas.csv
```

El CSV tiene que tener una columna `pregunta` (si se llama distinto, pasala con `--columna`). Puede venir separado por coma o por punto y coma. El resultado queda en `preguntas_clasificado.csv`, con las mismas columnas más `categoria`.

| Opción | Qué hace |
| --- | --- |
| `-c`, `--columna` | Nombre de la columna con la pregunta (por defecto `pregunta`) |
| `-o`, `--salida` | Ruta del CSV de salida |
| `--ya` | Clasifica al momento en vez de mandar un lote |
| `--retomar ID` | Retoma un lote ya enviado, usando el mismo CSV |

## Cómo cuida el gasto

- **Modelo Haiku 4.5**, el más barato de Claude. Se puede cambiar con la variable `CLAUDE_MODELO`.
- **Procesamiento por lotes**: por defecto usa la Batch API, que cuesta la mitad. A cambio, el resultado no es inmediato: suele tardar unos minutos y puede llegar a tardar hasta 24 horas. Si lo necesitás ya, usá `--ya` y pagás el precio normal.
- **25 preguntas por request**, así las instrucciones se pagan una vez por grupo y no una vez por pregunta.
- **Preguntas repetidas** (ignorando mayúsculas y espacios) se clasifican una sola vez.

Al terminar, el script muestra cuántos tokens consumió.

## A tener en cuenta

- Si cortás el script mientras espera el lote, no se pierde nada: copiá el ID que muestra y corré `python clasificar.py preguntas.csv --retomar ID` con el mismo CSV sin modificar.
- Las filas vacías, o las de un grupo que falló, quedan como `sin_clasificar`.
- Las definiciones de cada categoría están en la constante `SISTEMA` de `clasificar.py`. Si ves que clasifica mal algún caso típico de tu rubro, sumalo ahí como ejemplo.

# Programación v2: de "base de fichas" a laboratorio de soluciones

Plan de base. Sale de las respuestas del 01/10/2026. Si algo de acá contradice lo que digas después, manda lo que digas.

## Qué es

Un laboratorio público de **soluciones** (no solo webs). Cada entrada es un proyecto hecho por Darío, completo y abrible. Sirve a cuatro visitantes por igual:

| Visitante | Qué busca |
|---|---|
| Dueño de negocio | Una solución a un problema concreto |
| Quien aprende | Entender técnicas, con ejemplo vivo y código |
| Empleador o cliente | Prueba de criterio y oficio |
| Darío | Su base de consulta y aprendizaje |

Orden de objetivos: que quede impresionado y lo recuerde → que le sirva y vuelva → que lo contacte → que sea cómoda para Darío.

## Frentes de diferenciación (de lo que Darío ve en el mercado)

1. **Webs de tienda genéricas** (Empretienda, Tienda Nube): identidad y diseño propios sobre la misma plataforma.
2. **Cuentas de Mercado Libre con problemas**: diagnóstico y corrección (conecta con Sistema y ML Tracker).
3. **Automatización**: WhatsApp, emails, planillas, reportes, flujos.
4. Identidad (marca, piezas) y Datos/IA como soportes.

## Modelo de datos

**Solución** (la entrada principal)
- `problema`: la frase de quien lo tiene ("mi consultorio no recibe turnos").
- `familia`: Identidad · Web y funcionalidad · Automatización · Datos, IA y herramientas propias.
- `estado`: **Completa** o **Idea**. No hay "en construcción": se pasa de nada a completa o de idea a completa.
- `ejemplo`: carpeta con el proyecto vivo (index.html) y su código.
- `piezas`: qué técnicas usa (estilo, landing, tipografía, reglas UX, stack, servicios).
- `cuando_si` / `cuando_no`: honestidad sobre el encaje (ej.: glassmorphism en un consultorio no es lo común).
- `rubros`: a qué negocios les sirve.

**Pieza** (lo que hoy son las fichas: estilos, landing, tipografías, UX, stacks, servicios, arquitecturas)
- Conserva su explicación y su demo.
- Gana `se_uso_en`: las soluciones completas donde se aplicó (con link). Una pieza sin ejemplo propio queda marcada como **Idea**.

El cruce problema × técnica se muestra con su encaje real (encaja / no es lo común), no como si todo combinara con todo.

## Entrada del visitante

Antes de mostrar la base se pregunta **qué viene a hacer** (4 caminos), se guarda la elección y el apartado se ordena a partir de eso:
- *Tengo un negocio*: se entra por problema.
- *Quiero aprender*: se entra por pieza y nivel, con ejemplo y código.
- *Evalúo tu trabajo*: se entra por lo completo y lo mejor.
- *Quiero ver todo*: el mapa completo, con cobertura y estados (es también la vista de trabajo de Darío).

## Carga

Darío construye cada solución como proyecto (con Claude). Cada entrada es una **carpeta** con `ficha.json` y su ejemplo; un comando arma índice y galería. Sin panel admin por ahora.

## Criterio de "Completa"

Ejemplo vivo que se abre · código visible o descargable · problema y cuándo sí/cuándo no · piezas enlazadas. Lo que no cumple es **Idea**.

## Mapa de las 466 fichas actuales

Las fichas se conservan como **piezas** y se enlazan a soluciones a medida que se construyen. Nada se borra: lo que no tiene proyecto propio se muestra como Idea hasta tenerlo.

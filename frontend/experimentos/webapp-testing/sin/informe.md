# Informe de prueba: Calculadora de ganancia por venta (`index.html`)

**Fecha:** 30/09/2026
**Cómo la probé:** abrí la página en Google Chrome (automatizado con Playwright), cargué distintos valores en los campos tipeándolos como un usuario, apreté "Calcular" y leí el resultado. También la miré en tamaño de celular (375 px de ancho). No toqué el código.

## Veredicto corto

**La cuenta está bien, pero la app no está lista para usar tal como está.** Con datos normales el resultado es correcto, pero lo muestra feo (margen con 15 decimales, sin separador de miles, centavos con error de redondeo) y no te avisa nada cuando cargás datos que no tienen sentido (campos vacíos, precio 0, números negativos): te tira un número igual, y en algunos casos sale "-Infinity%".

No aparecieron errores en la consola del navegador.

## Lo que funciona bien

- **La cuenta es correcta.** Con los valores que trae por defecto (precio $38.900, costo $21.000, comisión 14 %, envío $4.500):
  - Comisión: 38.900 × 14 % = $5.446
  - Ganancia: 38.900 − 21.000 − 5.446 − 4.500 = **$7.954** ✔️ (la app da $7954)
  - Margen: 7.954 / 38.900 = **20,45 %** ✔️
- Con comisión decimal (13,5 %) también calcula bien.
- Cuando hay pérdida, la muestra como negativa (precio $10.000, costo $12.000 → "Te quedan $-7900 (-79% de margen)"), que es correcto.
- En celular se lee bien y no se rompe el diseño.

## Problemas encontrados

Ordenados de más a menos grave.

### 1. Precio vacío o en 0 → "-Infinity% de margen" (grave)
Si borrás el precio o ponés 0 y apretás Calcular, sale:

> Te quedan $-25500 (-Infinity% de margen)

No hay ningún aviso de que falta el precio; el usuario ve "Infinity", que no significa nada para él.

### 2. Los campos vacíos se toman como 0 sin avisar (grave)
Si borrás el costo (por ejemplo, sin querer) la app calcula igual como si el producto te hubiera salido gratis:

> Te quedan $28954 (74.4318766066838% de margen)

Pasa lo mismo con la comisión y el envío. Es fácil sacar conclusiones equivocadas con un número que parece válido.

### 3. Acepta valores que no tienen sentido (medio)
- **Costos o envío negativos:** costo −5.000 y envío −100 → "Te quedan $38554 (99.11…% de margen)". No hay validación.
- **Comisión mayor a 100 %:** comisión 150 % → la calcula sin chistar.
- **Notación científica:** el campo acepta "1e3" y lo toma como 1.000. Un usuario difícilmente lo tipee, pero muestra que no hay controles.

### 4. El margen sale con un montón de decimales (medio, muy visible)
Con los valores por defecto muestra **"20.447300771208226% de margen"**. Debería redondear a 1 o 2 decimales (por ejemplo "20,4 %"). Es lo primero que ve cualquiera que la use.

### 5. Errores de redondeo con centavos (medio)
Precio $100,10, costo $50,20, sin comisión ni envío:

> Te quedan $49.89999999999999

Debería decir $49,90. Tampoco redondea la ganancia cuando la comisión da con centavos (ej.: "$8234.135", con tres decimales).

### 6. Formato de números no argentino (menor)
- No usa separador de miles: "$7954" en lugar de "$7.954".
- Usa punto como separador decimal ("20.44…") en lugar de coma.
- Los negativos se ven como "$-7900" en vez de "-$7.900".
- Si el usuario tipea una coma decimal ("38900,50"), el resultado depende de la configuración del navegador; en mi prueba Chrome lo interpretó como 38900.50, pero en otros navegadores/idiomas puede ignorarse o tomarse como inválido.

### 7. Detalles de uso (menor)
- **Apretar Enter no calcula.** Hay que hacer clic sí o sí en el botón (no hay un `<form>`).
- **El resultado no se actualiza solo** al cambiar un valor; si cambiás algo y te olvidás de apretar Calcular, queda en pantalla el resultado viejo, que ya no corresponde a lo que ves en los campos.
- **Falta la etiqueta `<meta name="viewport">`**: en un celular real la página probablemente se vea achicada (como versión de escritorio) y haya que hacer zoom. En mi captura se veía bien porque la simulación no aplica ese comportamiento.
- En pantalla chica, los campos quedan apenas más anchos que el contenedor (ancho 100 % + relleno) y se cortan un poquito por la derecha.

## Tabla de casos probados

| Caso | Precio | Costo | Comisión | Envío | Resultado de la app | ¿OK? |
|---|---|---|---|---|---|---|
| Valores por defecto | 38900 | 21000 | 14 | 4500 | $7954 (20.447300771208226%) | Cuenta ✔️, formato ❌ |
| Comisión decimal | 38999 | 21000 | 13.5 | 4500 | $8234.135 (21.113708043795995%) | Cuenta ✔️, formato ❌ |
| Precio vacío | (vacío) | 21000 | 14 | 4500 | $-25500 (-Infinity%) | ❌ |
| Precio 0 | 0 | 21000 | 14 | 4500 | $-25500 (-Infinity%) | ❌ |
| Costo vacío | 38900 | (vacío) | 14 | 4500 | $28954 (74.43…%) | ❌ sin aviso |
| Venta a pérdida | 10000 | 12000 | 14 | 4500 | $-7900 (-79%) | ✔️ |
| Negativos | 38900 | -5000 | 14 | -100 | $38554 (99.11…%) | ❌ sin validación |
| Comisión 150 % | 38900 | 21000 | 150 | 4500 | $-44950 (-115.55…%) | ❌ sin validación |
| Notación "1e3" | 1e3 | 21000 | 14 | 4500 | $-24640 (-2464%) | ⚠️ |
| Centavos | 100.10 | 50.20 | 0 | 0 | $49.89999999999999 | ❌ |
| Enter en un campo | — | — | — | — | No pasa nada | ⚠️ |

## Recomendaciones (sin aplicar)

1. Validar los campos: obligatorios, no negativos, precio mayor a 0, comisión entre 0 y 100; mostrar un mensaje claro si algo falla.
2. Redondear y formatear con formato argentino (`toLocaleString('es-AR', …)`): "$7.954" y "20,4 %".
3. Envolver los campos en un `<form>` para que Enter calcule, o recalcular automáticamente al cambiar cualquier valor.
4. Agregar `<meta name="viewport" content="width=device-width, initial-scale=1">` y `box-sizing: border-box` en los inputs.

# Informe de prueba: Calculadora de ganancia por venta (`index.html`)

**Fecha:** 30/09/2026
**Cómo se probó:** abrí la página en Chromium sin interfaz (Playwright, vía `file://`), cargué distintos valores como lo haría un usuario, apreté "Calcular" y leí el resultado. También la miré en pantalla de celular (375 px) y de escritorio. No toqué el código.

## Veredicto corto

**La cuenta básica está bien, pero la app no está lista para usarla en serio.** Con datos normales y enteros da el número correcto. El problema es todo lo demás: el resultado se ve feo y confunde, y cuando el usuario se equivoca o deja un campo vacío, la app calcula igual y muestra un número que parece válido pero está mal, sin avisar nada.

## Lo que funciona bien

- **La fórmula es correcta.** Con los valores de ejemplo (precio $38.900, costo $21.000, comisión 14 %, envío $4.500): 38.900 − 21.000 − 5.446 − 4.500 = **$7.954**. La app da $7954. ✔
- Caso redondo (10.000 / 5.000 / 10 % / 1.000) → $3000 y 30 % de margen. ✔
- Si hay pérdida, la muestra como negativo (−$4900, −49 %). La cuenta es correcta.
- Si escribís la coma decimal (`38900,50`), Chrome la toma bien como 38900.50.
- No aparecieron errores en la consola en ningún caso.
- Cada campo tiene su etiqueta asociada, así que lectores de pantalla y el clic en el texto funcionan.

## Problemas encontrados

Ordenados de más grave a menos grave.

### 1. Campos vacíos se toman como 0 sin avisar (grave)
Si borrás un campo, la app calcula igual como si fuera $0 y te muestra una ganancia inflada:
- Envío vacío → "Te quedan $12454" (en vez de $7954).
- Costo vacío → "Te quedan $28954 (74,4 % de margen)".

Para el usuario esto es peligroso: puede creer que gana mucho más de lo que gana. Debería avisar que falta un dato.

### 2. Escribir "38.900" (punto de miles, como se escribe en Argentina) da un resultado absurdo (grave)
El campo toma `38.900` como **38,9 pesos**, no treinta y ocho mil novecientos. Resultado: "Te quedan $-25466.546 (-65466.699228791775% de margen)". Es muy probable que un usuario argentino escriba el precio así. No hay ningún aviso.

### 3. Si escribís letras, el campo queda vacío y el cálculo sale mal
Al tipear "abc" en el precio, el campo queda vacío (no deja letras), pero al calcular muestra "Te quedan $-25500 (-Infinity% de margen)". Mismo problema que el punto 1.

### 4. Aparecen "NaN" e "-Infinity" en pantalla
- Todo vacío, o precio en 0 → "Te quedan $0 (**NaN**% de margen)".
- Precio 0 con algún costo → "Te quedan $-100 (**-Infinity**% de margen)".

Son textos técnicos que un usuario común no entiende. Debería decir algo como "Cargá un precio de venta mayor a 0".

### 5. El margen sale con un montón de decimales
- "20.447300771208226% de margen"
- "66.66666666666666% de margen"
- "$0.09999999999999998" (en vez de $0,10, típico error de redondeo)

Lo esperable es algo como **20,4 %** o **20,45 %**, y plata con dos decimales como mucho.

### 6. Los números no tienen formato argentino
- Se muestra "$7954" en vez de "$7.954".
- Los decimales salen con punto ("565.1825") en vez de coma ("565,18").
- La pérdida sale como "$-4900" en vez de "−$4.900".
- Un número grande sale como "$85999999998.14", imposible de leer de un vistazo.

### 7. Acepta valores sin sentido
No hay ningún límite ni validación:
- Valores negativos (precio −5000, comisión −10 %) → calcula igual y da "107 % de margen" con una pérdida.
- Comisión de 150 % → la toma sin chistar.

### 8. Detalles de uso
- **Enter no calcula:** si estás en un campo y apretás Enter, no pasa nada; hay que ir al botón sí o sí.
- **El resultado queda desactualizado:** si cambiás un valor después de calcular, sigue mostrando el resultado viejo hasta que vuelvas a apretar "Calcular". Puede confundir (estás viendo un número que no corresponde a lo que tenés cargado).
- **Pérdida no se distingue:** "Te quedan $-4900" no llama la atención; no hay color ni mensaje tipo "Estás perdiendo plata".
- **En celular** los campos quedan pegados al borde izquierdo de la pantalla, sin margen lateral. Se usa, pero se ve apretado.
- **El resultado no se ve como resultado:** es un texto chico al pie, igual que el resto; no está destacado.

## Tabla de casos probados

| Caso | Datos | Resultado de la app | ¿Bien? |
|---|---|---|---|
| Valores por defecto | 38900 / 21000 / 14 % / 4500 | $7954 (20.447300771208226 %) | Cuenta bien, formato mal |
| Números redondos | 10000 / 5000 / 10 % / 1000 | $3000 (30 %) | ✔ |
| Con pérdida | 10000 / 9000 / 14 % / 4500 | $-4900 (-49 %) | Cuenta bien, formato mal |
| Envío vacío | resto por defecto | $12454 (32.0 %) | ✘ calcula como 0 |
| Costo vacío | resto por defecto | $28954 (74.4 %) | ✘ calcula como 0 |
| Todo vacío | — | $0 (NaN %) | ✘ |
| Precio 0 | 0 / 100 / 14 % / 0 | $-100 (-Infinity %) | ✘ |
| Negativos | -5000 / -100 / -10 % / -50 | $-5350 (107 %) | ✘ no valida |
| Comisión 150 % | resto por defecto | $-44950 (-115.55 %) | ✘ no valida |
| Precio "38.900" | tipeado con punto de miles | $-25466.546 (-65466.7 %) | ✘ grave |
| Precio "38900,50" | tipeado con coma | $7954.43 | ✔ (formato mal) |
| Letras "abc" en precio | — | $-25500 (-Infinity %) | ✘ |
| Decimales flotantes | 0.3 / 0.1 / 0 % / 0.1 | $0.09999999999999998 | ✘ redondeo |

## Conclusión

La lógica de la cuenta es correcta, así que la base sirve. Pero hoy **solo da resultados confiables si el usuario carga todo perfecto, con números enteros y sin puntos de miles**. Antes de dársela a alguien, lo mínimo sería:

1. validar campos vacíos, negativos y precio en 0, con mensajes claros;
2. redondear y formatear los números en formato argentino ($7.954 · 20,4 %);
3. resolver el tema del punto de miles, que es lo que más va a confundir a un usuario de acá.

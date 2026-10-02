#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Núcleo escrito (borrador de Claude, revisado visualmente por Darío) para las primeras fichas de Programación v2.
Solo estas dos por ahora; el resto se escribe por tandas. Los campos originales NO se pierden: pasan a "datos técnicos".
"""
def it(l, x): return {"l": l, "x": x}

NUCLEO_ESCRITO = {
    ("estilos", "glassmorphism"): {
        "resumen": "Paneles que parecen vidrio esmerilado: se ve el fondo desenfocado a través de ellos.",
        "valor": "pro", "valor_porque": "Hoy lo usan muchas apps, pero bien ejecutado todavía separa un trabajo cuidado de uno genérico.",
        "nucleo": {
            "que_es": [it("", "Un estilo donde los paneles son translúcidos, desenfocan lo que tienen detrás y llevan un borde fino de luz, como un vidrio esmerilado. Solo se luce sobre un fondo con color y profundidad: sobre un fondo liso no se nota.")],
            "problema": [it("", "Las interfaces planas que se ven todas iguales. El vidrio separa los elementos por capas, qué está adelante y qué atrás, sin sombras duras ni bordes gruesos, y deja que el fondo siga presente.")],
            "aporta": [it("Jerarquía por capas.", "Una tarjeta flotando sobre otra se entiende de un vistazo."), it("Aspecto de producto digital.", "Se reconoce en segundos y transmite tecnología."),
                       it("Personalidad sin recargar.", "El fondo vivo (degradés, formas) le da carácter y el contenido sigue limpio."), it("Modo claro y oscuro.", "Funciona en los dos.")],
            "cuando_si": [it("", "Apps y dashboards, fintech, productos digitales y landings de lanzamiento. También modales y menús que se superponen al contenido.")],
            "cuando_no": [it("", "Consultorios, estudios y comercios de barrio: no es lo común y puede restar confianza, salvo que la marca lo pida. Evitalo con textos largos o fondos claros y lisos, porque el desenfoque le quita contraste, y donde la accesibilidad sea crítica: hay que asegurar contraste de 4,5:1. En celulares con poca potencia el desenfoque puede trabar la página.")],
        },
    },
    ("skills", "impeccable"): {
        "resumen": "Una skill de diseño que le enseña a Claude a criticar y pulir una interfaz como lo haría un director de arte.",
        "nucleo": {
            "que_es": [it("", "Un vocabulario de más de 20 comandos (auditar, criticar, pulir, hacer más audaz…) que se le dan a Claude para que mejore la jerarquía, la tipografía, el color y la accesibilidad de una web, en lugar de entregar la primera versión.")],
            "problema": [it("", "Que las webs hechas con IA salgan todas iguales: una etiquetita sobre el título, tres tarjetas idénticas y un cierre de plantilla. Con la skill, la página parte de una idea propia.")],
            "aporta": [it("Identidad propia.", "En la prueba, la parrilla quedó armada como un mantel de papel madera, con la carta anotada a mano y botones con forma de sello."),
                       it("Funciones que venden.", "La reserva arma el mensaje de WhatsApp con personas, día, hora y platos; la otra versión solo abre el chat vacío."),
                       it("Se revisa antes de entregar.", "Saca capturas en escritorio y celular, corrige y recién entonces entrega.")],
            "cuando_si": [it("", "Cuando el resultado lo van a ver clientes y tiene que diferenciarse: landings, sitios de negocio, piezas de marca.")],
            "cuando_no": [it("", "Para algo rápido o interno, donde la identidad no importa: ahí alcanza con la versión sin la skill. En todo lo demás el costo es chico: en la prueba, 7 min 33 s y USD 2,11 contra 1 min 47 s y USD 0,44.")],
        },
    },
}


# ── Tandas del resto de las fichas (ver lab_nucleo_*.py) ──
import lab_nucleo_skills as _sk, lab_nucleo_servicios as _sv
for _i, _v in _sk.SK.items(): NUCLEO_ESCRITO.setdefault(("skills", _i), _v)
for _i, _v in _sv.SV.items(): NUCLEO_ESCRITO.setdefault(("servicios", _i), _v)
for _i, _v in _sv.ST.items(): NUCLEO_ESCRITO.setdefault(("stacks", _i), _v)

# Completa los huecos sin reemplazar el texto existente
NUCLEO_SUMA = {}
import lab_nucleo_suma as _su, lab_nucleo_ux as _ux, lab_nucleo_estilos as _es, lab_nucleo_landing as _lp, lab_nucleo_tipografias as _tp
for _d in (_su.SUMA, _ux.SUMA_UX, _es.SUMA_ES, _lp.SUMA_LP, _lp.SUMA_SOL, _tp.SUMA_TP): NUCLEO_SUMA.update(_d)

# ── Skills: valor validado por Darío y bloque "cómo empezar" ──
import lab_nucleo_skills_extra as _sx
import weblab_taxonomia as _tx
for _i, (_v, _p) in _sx.VALOR_SK.items():
    _tx.VALOR_DARIO[("skills", _i)] = _v
    _tx.VALOR_PORQUE_DARIO[("skills", _i)] = _p
for _i, (_pasos, _exp) in _sx.COMO_SK.items():
    _pasos = _pasos if _exp else _pasos[:3]
    NUCLEO_ESCRITO[("skills", _i)]["nucleo"]["como"] = _pasos

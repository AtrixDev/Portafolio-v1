#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Correcciones de contenido del Lab de Programación (frontend/data/weblab/).

Las fichas de diseño se importan de la skill ui-ux-pro-max y se traducen; algunas traen errores
(datos que no corresponden, números sin fuente, CSS roto, contrastes mal calculados). Acá quedan
todas las correcciones, cada una con su motivo, para que no se pierdan al regenerar:

  - build-weblab.py las aplica después de traducir.
  - Este script también se puede correr solo: aplica las correcciones a los JSON ya publicados
    y actualiza index.json.   python3 tools/weblab_correcciones.py

Cada corrección: (categoría, id, campo, viejo, nuevo, motivo)
  campo: "name" | "summary" | "tags" | "prompt" | "code:good" | "code:bad"
         | "Etiqueta del campo" (fields) | "palette:Acento" (paleta + campos) | "*" (todos los campos de texto)
  viejo → nuevo: reemplazo de texto exacto. En "tags", listas completas.
  nuevo = None en un campo de fields: se borra el campo.
Registro para leer: docs/revision-errores.md (error 1).
"""
import json, sys
from pathlib import Path

C = [
  # ── Stack real de ML Tracker: JavaScript sin framework + funciones serverless en Vercel + MongoDB ──
  ("soluciones", "saas", "Ejemplo propio",
   "ML Tracker: React + Node/Express + MongoDB + OAuth de Mercado Libre.",
   "ML Tracker: JavaScript sin framework + funciones serverless en Node (Vercel) + MongoDB + OAuth de Mercado Libre.",
   "ML Tracker no usa React ni Express."),
  ("arquitecturas", "spa-api", "Ejemplo propio",
   "ML Tracker: React + Vite en el cliente, Node/Express + MongoDB en la API.",
   "ML Tracker aplica la idea: el panel es una app en JavaScript sin framework que le pide JSON a /api/tracker (una función serverless con MongoDB). Frontend y API se publican juntos en Vercel.",
   "ML Tracker no usa React, Vite ni Express."),
  ("stacks", "react-vite", "Lo uso en", "Cliente de ML Tracker.", None, "ML Tracker no usa React."),
  ("stacks", "node-express", "Lo uso en", "API de ML Tracker.",
   "Node sí: las funciones /api de esta web y de ML Tracker corren en Node como funciones serverless, sin Express.",
   "La API de ML Tracker no usa Express."),
  ("stacks", "mern", "Lo uso en", "ML Tracker.", None, "ML Tracker no usa Express ni React."),
  ("servicios", "railway", "Lo uso en", "El backend de ML Tracker está preparado para Railway (railway.json).", None,
   "No hay railway.json: ML Tracker corre en Vercel."),
  ("servicios", "claude-api", "Lo uso en", "SEO Creator de ML Tracker.", None,
   "ML Tracker no llama a la API de Claude (arma prompts para pegar en claude.ai)."),
  ("skills", "claude-api", "Cuándo usarla",
   "Al integrar Claude en una app propia, como el generador de títulos de ML Tracker.",
   "Al integrar Claude en una app propia, por ejemplo un generador de títulos para publicaciones.",
   "ML Tracker no tiene un generador de títulos con Claude."),
  ("skills", "react-best-practices", "prompt",
   "El dashboard del tracker tarda en cargar: revisalo con las buenas prácticas de React y proponé cambios.",
   "El dashboard de mi app en Next.js tarda en cargar: revisalo con las buenas prácticas de React y proponé cambios.",
   "El tracker no está hecho en React: el prompt no tenía sentido para esa skill."),

  # ── Rubros: texto sin traducir, dato de color equivocado y etiquetas mal traducidas ──
  ("rubros", "government-public-service", "summary", "WCAG AAA mandatory. Trust paramount.",
   "WCAG AAA obligatorio. La confianza es lo principal.", "Texto en inglés."),
  ("rubros", "government-public-service", "A tener en cuenta", "WCAG AAA mandatory. Trust paramount.",
   "WCAG AAA obligatorio. La confianza es lo principal.", "Texto en inglés."),
  ("rubros", "beauty-spa-wellness-service", "Enfoque de color", "salvia #90EE90", "verde claro #90EE90",
   "#90EE90 es verde claro, no salvia."),
  ("rubros", "financial-dashboard", "tags", ["portfolio", "trading", "ganancias y pérdidas"], ["cartera", "trading", "ganancias y pérdidas"],
   "“Portfolio” en el sentido de cartera de inversiones."),
  ("rubros", "wedding-event-planning", "tags", ["congreso", "evento", "meetup"], ["casamiento", "evento", "planificación"],
   "Las etiquetas eran de congresos, no de casamientos."),
  ("rubros", "wedding-event-planning", "Palabras clave",
   "congreso, evento, meetup, planificación, inscripción, entrada, casamiento",
   "casamiento, evento, planificación, organización, invitados, salón, proveedores, fiesta",
   "Las palabras clave eran de congresos, no de casamientos."),
  ("rubros", "card-board-game", "tags", ["cartas", "bolsa", "ajedrez"], ["cartas", "tablero", "ajedrez"], "“Board” es tablero, no bolsa."),
  ("rubros", "water-hydration-reminder", "tags", ["riego", "hidratación", "tomar"], ["agua", "hidratación", "tomar"], "“Water” es agua: riego es para plantas."),
  ("rubros", "non-profit-charity", "tags", ["beneficencia", "sin fines", "de lucro"], ["beneficencia", "sin fines de lucro", "ONG"], "Etiqueta partida al medio."),
  ("rubros", "job-board-recruitment", "tags", ["bolsa", "trabajo", "reclutamiento"], ["bolsa de trabajo", "empleo", "reclutamiento"], "Etiqueta partida al medio."),

  # ── Estilos: CSS sin comas (no funciona si se copia) y modos claro/oscuro invertidos ──
  ("estilos", "exaggerated-minimalism", "Efectos y animación", "clamp(3rem 10vw 12rem)", "clamp(3rem, 10vw, 12rem)", "CSS inválido: clamp() lleva comas."),
  ("estilos", "swiss-modernism-2-0", "Efectos y animación", "repeat(12 1fr)", "repeat(12, 1fr)", "CSS inválido: repeat() lleva coma."),
  ("estilos", "modern-dark-cinema-mobile", "Variables CSS", "cubic-bezier(0.16 1 0.3 1)", "cubic-bezier(0.16, 1, 0.3, 1)", "CSS inválido: cubic-bezier() lleva comas."),
  ("estilos", "kinetic-brutalism-mobile", "Modo claro", "✓ Oscuro principal", "◐ Sólo en secciones invertidas", "Modo claro y oscuro estaban invertidos."),
  ("estilos", "kinetic-brutalism-mobile", "Modo oscuro", "◐ Sólo oscuro (secciones invertidas)", "✓ Oscuro principal", "Modo claro y oscuro estaban invertidos."),
  ("estilos", "bold-typography-mobile-poster", "Modo claro", "✓ Modo oscuro principal", "◐ Secciones claras opcionales", "Modo claro y oscuro estaban invertidos."),
  ("estilos", "bold-typography-mobile-poster", "Modo oscuro", "◐ Secciones claras opcionales", "✓ Modo oscuro principal", "Modo claro y oscuro estaban invertidos."),
  ("estilos", "academia-scholarly-mobile", "Modo claro", "✓ Oscuro rico", "◐ Secciones claras color pergamino", "Modo claro y oscuro estaban invertidos."),
  ("estilos", "academia-scholarly-mobile", "Modo oscuro", "◐ Secciones claras color pergamino", "✓ Oscuro rico", "Modo claro y oscuro estaban invertidos."),
  ("estilos", "y2k-aesthetic", "Origen", "Y2K 2000s", "Y2K, años 2000", "Quedaba en inglés."),
  ("estilos", "neumorphism-mobile", "*", "texto apagado #6B7280", "texto apagado #596070",
   "#6B7280 sobre #E0E5EC da 3,8:1 y no llega a AA; #596070 da 5:1."),

  # ── Landing: estadísticas sin fuente presentadas como hechos ──
  ("landing", "video-first-hero", "Optimización de conversión", "El video genera un 86% más de engagement.",
   "El video suele captar más la atención que una imagen fija: medilo contra una versión sin video.", "Cifra sin fuente."),
  ("landing", "scroll-triggered-storytelling", "Optimización de conversión", "La narrativa triplica el tiempo en la página.",
   "Una buena narrativa suele alargar el tiempo en la página.", "Cifra sin fuente."),
  ("landing", "ai-personalization-landing", "Optimización de conversión", "Más de 20% de conversión con personalización.",
   "La personalización puede mejorar la conversión: medila con un test A/B.", "Cifra sin fuente."),
  ("landing", "comparison-table-focus", "Optimización de conversión", " 35% más de conversión.", "", "Cifra sin fuente."),
  ("landing", "immersive-interactive-experience", "Optimización de conversión", "40% más de engagement. Hay que resignar rendimiento.",
   "Suele generar más engagement, pero hay que resignar rendimiento.", "Cifra sin fuente."),
  ("landing", "before-after-transformation", "Optimización de conversión", " 45% más de conversión.", "", "Cifra sin fuente."),

  # ── Tipografías: clasificación y contrastes mal calculados ──
  ("tipografias", "pixel-retro", "tags", ["Display + sans"], ["Display + mono"], "VT323 es una monoespaciada."),
  ("tipografias", "science-tech", "tags", ["Sans + sans"], ["Sans + mono"], "Roboto Mono es una monoespaciada."),
  ("tipografias", "neumorphism-mobile-plus-jakarta-sans-system", "Notas", "#3D4852 (contraste 7.5:1 contra #E0E5EC)",
   "#3D4852 (contraste 7.4:1 contra #E0E5EC)", "Contraste real: 7,38:1."),
  ("tipografias", "neumorphism-mobile-plus-jakarta-sans-system", "Notas", "texto apagado #6B7280 (contraste 4.6:1)",
   "texto apagado #596070 (contraste 5:1; el #6B7280 da 3.8:1 y no llega a AA)", "Contraste real de #6B7280: 3,82:1."),

  # ── Buenas prácticas UX: datos técnicos equivocados u obsoletos ──
  ("ux", "36-color-contrast", "code:good", "#333 on white (7:1)", "#333 on white (12.6:1)", "Contraste real: 12,63:1."),
  ("ux", "68-viewport-meta", "Hacer", "Usá width=device-width initial-scale=1", "Usá width=device-width, initial-scale=1", "Faltaba la coma."),
  ("ux", "25-tap-delay", "summary", "Una demora de 300ms al tocar se siente lenta",
   "Los navegadores viejos esperaban 300ms después de cada toque", "Los navegadores actuales ya no agregan la demora."),
  ("ux", "25-tap-delay", "Hacer", "Usá touch-action en CSS o fastclick",
   "Usá touch-action: manipulation y el meta viewport con width=device-width (FastClick ya no hace falta)", "FastClick quedó obsoleto."),

  # ── Paletas: acentos que no llegaban al 3:1 que declaran ──
  ("paletas", "dental-practice", "palette:Acento", "#0EA5E9", "#B7791F",
   "El acento era el mismo celeste del primario (2,6:1) aunque la paleta dice “amarillo sonrisa”; #B7791F da 3,4:1."),
  ("paletas", "freelancer-platform", "palette:Acento", "#16A34A", "#138A3E", "#16A34A daba 2,95:1 sobre el fondo; #138A3E da 4:1."),
  ("paletas", "digital-products-downloads", "palette:Acento", "#16A34A", "#138A3E", "#16A34A daba 2,95:1 sobre el fondo; #138A3E da 4:1."),
  ("paletas", "language-learning-app", "palette:Acento", "#16A34A", "#138A3E", "#16A34A daba 2,95:1 sobre el fondo; #138A3E da 4:1."),
  ("paletas", "survey-form-builder", "summary", "Verde azulado pregunta + verde progreso + azul enviar",
   "Verde azulado de pregunta + verde de progreso + ámbar para enviar", "La paleta no tiene azul: el acento es ámbar."),
]


def _rep(val, viejo, nuevo):
    if isinstance(viejo, list):
        return (nuevo, True) if val == viejo else (val, val == nuevo)
    if viejo in val:
        return val.replace(viejo, nuevo), True
    return val, nuevo is not None and nuevo in val


def aplicar(data, avisar=print):
    """Aplica las correcciones sobre {categoría: [fichas]}. Devuelve cuántas cambió."""
    cambios = 0
    for cat, id_, campo, viejo, nuevo, _ in C:
        e = next((x for x in data.get(cat, []) if x.get("id") == id_), None)
        if not e:
            avisar(f"  · no está la ficha {cat}/{id_}"); continue
        antes = json.dumps(e, ensure_ascii=False)
        ok = False
        if campo in ("name", "summary", "tags", "prompt"):
            e[campo], ok = _rep(e.get(campo, [] if campo == "tags" else ""), viejo, nuevo)
        elif campo.startswith("code:"):
            k = campo[5:]; e["code"][k], ok = _rep(e["code"].get(k, ""), viejo, nuevo)
        elif campo.startswith("palette:"):
            k = campo[8:]
            for lista in (e.get("palette", []), e.get("fields", [])):
                for par in lista:
                    if par[0] == k:
                        par[1], hecho = _rep(par[1], viejo, nuevo); ok = ok or hecho
        elif campo == "*":
            for par in e.get("fields", []):
                par[1], hecho = _rep(par[1], viejo, nuevo); ok = ok or hecho
        else:
            f = e.get("fields", [])
            par = next((p for p in f if p[0] == campo), None)
            if nuevo is None:
                ok = True
                if par and par[1] == viejo: f.remove(par)
            elif par:
                par[1], ok = _rep(par[1], viejo, nuevo)
        if not ok: avisar(f"  · no encontré el texto a corregir en {cat}/{id_} ({campo})")
        if json.dumps(e, ensure_ascii=False) != antes: cambios += 1
    return cambios


if __name__ == "__main__":
    OUT = Path(__file__).resolve().parent.parent / "frontend" / "data" / "weblab"
    cats = sorted({c[0] for c in C})
    data = {c: json.loads((OUT / f"{c}.json").read_text(encoding="utf-8")) for c in cats}
    n = aplicar(data)
    for c in cats:
        (OUT / f"{c}.json").write_text(json.dumps(data[c], ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    # index.json: nombre, resumen y etiquetas de cada ficha
    idx = json.loads((OUT / "index.json").read_text(encoding="utf-8"))
    por = {(c, e["id"]): e for c in cats for e in data[c]}
    for fila in idx["entries"]:
        e = por.get((fila[0], fila[1]))
        if e: fila[2], fila[3], fila[4] = e["name"], e.get("summary", "")[:160], e.get("tags", [])
    (OUT / "index.json").write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"{n} cambios aplicados ({len(C)} correcciones registradas).", file=sys.stderr)

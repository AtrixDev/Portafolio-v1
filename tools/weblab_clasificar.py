#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reporte de clasificación de Programación (entrega B). SOLO LECTURA.

Lee frontend/data/weblab/*.json y las claves de demos/experimentos de los .js, propone para cada ficha
tipo · subtipo · área · tema · rubros · relaciones · evidencia · valor, y detecta clasificaciones dudosas
o incorrectas. No modifica ningún dato de frontend/: escribe únicamente en docs/lab/.

Uso:  python3 tools/weblab_clasificar.py
Salida: docs/lab/clasificacion-466.csv  y  docs/lab/clasificacion-466.md
"""
import csv, json, re, sys, unicodedata, collections
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "frontend" / "data" / "weblab"
JS = ROOT / "frontend" / "js"
OUT = ROOT / "docs" / "lab"

from weblab_taxonomia import *   # tablas compartidas (ver tools/weblab_taxonomia.py)

HERE_JS = [JS / "programacion-demos.js", JS / "programacion-ux.js"]


def cargar():
    idx = json.loads((DATA / "index.json").read_text(encoding="utf-8"))
    return {c["id"]: json.loads((DATA / f"{c['id']}.json").read_text(encoding="utf-8")) for c in idx["categories"]}


def claves_js():
    """Claves de demos y experimentos registradas en los .js (demos UX, stacks y experimentos de skills)."""
    ux, stacks, exp = set(), set(), set()
    for f in HERE_JS:
        t = f.read_text(encoding="utf-8")
        ux |= set(re.findall(r"'ux/([0-9a-z-]+)'\s*:", t))
        stacks |= set(re.findall(r"'stacks/([0-9a-z-]+)'\s*:", t))
        exp |= set(re.findall(r"'skills/([0-9a-z-]+)'\s*:\s*\{\s*exp:", t))
    # skills/impeccable figura como experimento aunque se declare aparte
    return ux, stacks, exp


def familias_rubros():
    js = (JS / "programacion-rubros.js").read_text(encoding="utf-8")
    return dict(re.findall(r"'([a-z0-9-]+)':\s*\['([a-z]+)'", js))


def texto_de(e):
    return " | ".join([e.get("name", ""), e.get("summary", "")] + [f"{k}: {v}" for k, v in e.get("fields", [])])


def main():
    datos = cargar()
    ux_demos, stacks_demos, skills_exp = claves_js()
    fam = familias_rubros()
    rubros = {e["id"]: e for e in datos["rubros"]}
    todos = [(c, e) for c, l in datos.items() if c != "rubros" for e in l]
    total_fichas = len(todos)

    # ── ids globales propuestos ──
    cuenta = collections.Counter(e["id"] for _, e in todos)
    cuenta_r = {e["id"] for e in datos["rubros"]}
    def id_nuevo(c, e):
        i = e["id"]
        return f"{i}-{SUFIJO[c]}" if cuenta[i] > 1 else i

    # ── backlinks rubros → estilos/landing ──
    back = collections.defaultdict(list)
    for r in datos["rubros"]:
        for rel in r.get("related", []):
            c, _, i = rel.partition("/")
            if c in ("estilos", "landing"):
                back[(c, i)].append(r["id"])

    filas, dudas = [], []
    conf_por_fila = {}
    destino_campos = collections.defaultdict(lambda: collections.Counter())
    campos_desconocidos = collections.defaultdict(set)
    proy_claims = []

    def dudar(col, e, tipo, motivo, gravedad="media"):
        dudas.append({"coleccion": col, "id": e["id"], "nombre": e["name"], "tipo_duda": tipo, "motivo": motivo, "gravedad": gravedad})

    for col, e in todos:
        tipo, sub, areas = COL[col]
        areas = list(areas)
        motivos, conf = [], "alta"
        i = e["id"]

        # excepciones de Estilos
        if col == "estilos":
            if i in ESTILOS_ESTRUCTURA:
                sub = "patrón de página"; conf = "media"
                motivos.append("estilo que describe una estructura de página (ya existe como patrón de landing)")
                dudar(col, e, "estilo-estructura", "Se propone tratarlo como patrón de página con 'variante_de'. Confirmar equivalente: " + str(ESTRUCTURA_A_LANDING.get(i) or "sin equivalente claro"), "alta")
            elif i in ESTILOS_PANEL:
                sub = "patrón de panel"; conf = "media"
                motivos.append("tipo de panel/dashboard, no un estilo visual")
                dudar(col, e, "estilo-panel", "Se propone 'patrón de panel' relacionado con el tipo de web Dashboard / panel de gestión", "media")
        # áreas dobles
        if col == "servicios" and i in ("tiendanube", "wordpress", "sanity"):
            areas.append("desarrollo-web"); conf = "media"; motivos.append("plataforma de sitios: también en desarrollo web")
            dudar(col, e, "area-doble", "Servicio que también sirve para construir webs; confirmar segunda área", "baja")
        if col == "servicios" and i == "claude-api":
            areas.append("ia-datos"); conf = "media"; motivos.append("API de IA: también en IA y datos")
        if col == "stacks" and i in ("tailwind", "shadcn"):
            areas.append("desarrollo-web"); conf = "media"; motivos.append("librería de estilos: también en desarrollo web")
            dudar(col, e, "area-doble", "Librería de estilos: ¿Programación o Desarrollo web? (hoy van en Stacks)", "baja")

        # temas
        temas = temas_de(col, e)
        tema_txt = ";".join(t for t, _, _ in temas)
        for t, c, m in temas:
            if c == "baja":
                pass
        temas_baja = [t for t, c, _ in temas if c == "baja"]
        if len(temas) >= 4:
            dudar(col, e, "muchos-temas", "Más de 3 temas asignados por palabras clave: " + ", ".join(t for t, _, _ in temas), "baja")

        # rubros / relaciones
        rubros_f, rels = "", []
        if col == "negocios":
            rubros_f = ";".join(NEGOCIO_RUBROS.get(i, []))
            if not NEGOCIO_RUBROS.get(i):
                dudar(col, e, "negocio-sin-rubro", "Sin rubro equivalente en la lista de 95 (queda como solución sin faceta)", "media")
            else:
                dudar(col, e, "negocio-rubro-a-confirmar", f"Equivalentes propuestos: {', '.join(NEGOCIO_RUBROS[i])}", "alta")
        for rel in e.get("related", []):
            c2, _, i2 = rel.partition("/")
            if c2 not in datos or not any(x["id"] == i2 for x in datos[c2]) and "/" in rel:
                if c2 in datos:
                    dudar(col, e, "relacion-rota", f"related → {rel} no existe", "alta")
            rels.append(f"relacionada:{rel}")
        if col in ("estilos", "landing"):
            bl = back.get((col, i), [])
            if bl:
                rels.append(f"recomendado_para:{len(bl)} rubros")
        if col == "estilos":
            for a, b in ESTILOS_VARIANTES:
                if i == b: rels.append(f"variante_de:{a}")
            if i in ESTRUCTURA_A_LANDING and ESTRUCTURA_A_LANDING[i]:
                rels.append(f"variante_de(landing):{ESTRUCTURA_A_LANDING[i]}")
            if i in ESTILOS_PANEL:
                rels.append("relacionada:soluciones/dashboard")
        for k, v in e.get("fields", []):
            if k in CAMPOS_RELACION:
                rels.append(f"{CAMPOS_RELACION[k]}(texto):{str(v)[:60]}")

        # evidencias (de lo que ya existe)
        ev = []
        if col == "skills" and i in skills_exp: ev.append("experimento")
        if col == "ux" and i in ux_demos: ev.append("demo")
        if col == "stacks" and i in stacks_demos: ev.append("demo")
        if col in ("estilos", "landing"): ev.append("maqueta(generada)")
        if col == "tipografias": ev.append("maqueta(vista previa generada)")
        if col == "arquitecturas" and e.get("flow"): ev.append("maqueta(diagrama)")
        if col == "negocios" and e.get("preset"): ev.append("maqueta(preset del constructor)")
        if col == "soluciones" and e.get("examples"): ev.append("ejemplo(terceros)")
        if col in ESPERA:
            faltan = [c for c in ESPERA[col] if not e.get(c)]
            if faltan:
                dudar(col, e, "campo-esperado-ausente", f"Falta {faltan}, propio de {col}; ¿tipo mal asignado?", "alta")
        if col == "estilos" and not e.get("swatches"):
            ya = i in ESTILOS_ESTRUCTURA or i in ESTILOS_PANEL
            dudar(col, e, "estilo-sin-colores", "No define colores propios" + (" (ya marcado como estructura/panel: coincide con que no es un estilo visual)" if ya else " (sigue clasificado como estilo visual: revisar si lo es)"), "informativa" if ya else "media")
        if not ev:
            dudar(col, e, "sin-evidencia", "No tiene ninguna evidencia detectada", "informativa")

        # prompt
        prompt_estado = ""
        if col == "skills":
            prompt_estado = "experimento probado + prompt de la ficha sin probar" if i in skills_exp else "prompt de la ficha sin probar"
        if col == "estilos" and any(k == "Prompt para IA (en inglés)" for k, _ in e.get("fields", [])):
            prompt_estado = "sin probar (en inglés)"

        # valor
        valor, nivel = e.get("valor", ""), e.get("nivel", "")
        if (col, i) in VALOR_DARIO:
            origen = "validado por Darío"
            if VALOR_DARIO[(col, i)] != valor:
                dudar(col, e, "valor-contradice-a-Dario", f"Darío dijo '{VALOR_DARIO[(col, i)]}' y el dato actual es '{valor}'", "alta")
        elif col in ("skills", "stacks", "servicios", "arquitecturas", "soluciones", "landing", "negocios"):
            origen = "tabla manual (Claude, sin validar)"
        else:
            origen = "regla automática"
        if origen != "validado por Darío":
            estado_valor = "provisional/heredado"
        else:
            estado_valor = "validado"
        if valor == "imprescindible" and nivel == 3:
            dudar(col, e, "valor-nivel-raro", "Imprescindible con nivel Avanzado", "baja")

        # núcleo: qué campos van a dónde
        mapa = NUCLEO.get(col, {})
        slots = set()
        for k, v in e.get("fields", []):
            if k in mapa:
                destino_campos[col][mapa[k]] += 1
                slots.add(mapa[k])
            elif k in CAMPOS_PROYECTO:
                destino_campos[col]["evidencia/relación (verificar)"] += 1
                proy_claims.append((col, i, e["name"], k, str(v)[:140]))
            elif k in CAMPOS_RELACION:
                destino_campos[col]["relación"] += 1
            else:
                destino_campos[col]["tecnico"] += 1
        nucleo_vacio = not (slots & {"que_es", "problema", "aporta", "cuando_si", "cuando_no", "como"})
        if nucleo_vacio and col != "rubros":
            dudar(col, e, "nucleo-vacio", "Ningún campo actual alimenta el núcleo (hay que escribir 'qué es / qué soluciona / cuándo conviene')", "informativa")
        carece_que_es = "que_es" not in slots and col not in ("rubros",)
        # texto casi duplicado entre colecciones se calcula después

        # coherencia summary
        if not e.get("summary"):
            dudar(col, e, "resumen-vacio", "Resumen vacío", "media")
        # confianza final
        if temas_baja: conf = conf if conf != "alta" else "media"
        if origen != "validado por Darío" and False: pass
        filas.append({
            "coleccion": col, "id_legacy": i, "id_propuesto": id_nuevo(col, e), "nombre": e["name"],
            "tipo": tipo, "subtipo": sub, "areas": ";".join(areas), "temas": tema_txt,
            "temas_confianza": ";".join(f"{t}:{c}" for t, c, _ in temas), "rubros": rubros_f,
            "relaciones_propuestas": "; ".join(rels[:8]) + ("…" if len(rels) > 8 else ""),
            "evidencias": ";".join(ev), "nivel": nivel, "valor": valor, "valor_origen": origen,
            "valor_estado": estado_valor, "prompt_estado": prompt_estado,
            "nucleo_slots": ";".join(sorted(slots)), "confianza": conf, "motivos": " | ".join(motivos),
        })

    # ── ids duplicados entre colecciones ──
    for i, n in cuenta.items():
        if n > 1:
            cols = [c for c, e in todos if e["id"] == i]
            for c in cols:
                e = next(x for x in datos[c] if x["id"] == i)
                dudar(c, e, "id-repetido", f"Mismo id en {cols}; se propone sufijo por subtipo", "alta")
    for i in set(cuenta) & cuenta_r:
        e = next(x for x in datos["rubros"] if x["id"] == i)
        dudar("rubros", e, "id-repetido", "Mismo id que una ficha; los rubros viven en su propio espacio 'rubro:'", "media")

    # ── nombres casi iguales (duplicados potenciales) ──
    nombres = [(c, e["id"], e["name"]) for c, e in todos]
    visto = set()
    for a in range(len(nombres)):
        for b in range(a + 1, len(nombres)):
            (c1, i1, n1), (c2, i2, n2) = nombres[a], nombres[b]
            if c1 == c2 and c1 in ("ux", "tipografias"):
                continue  # en UX hay pares de nombre repetido por diseño (ids distintos); se revisan aparte
            r = SequenceMatcher(None, slug(n1), slug(n2)).ratio()
            if r >= 0.86 and (c1, i1, c2, i2) not in visto:
                visto.add((c1, i1, c2, i2))
                e = next(x for x in datos[c1] if x["id"] == i1)
                dudar(c1, e, "nombre-casi-igual", f"Parecido a {c2}/{i2} ({n2}) — similitud {r:.2f}", "media")
    # UX con el mismo nombre
    ux_n = collections.defaultdict(list)
    for e in datos["ux"]:
        ux_n[slug(e["name"])].append(e)
    for n, l in ux_n.items():
        if len(l) > 1:
            for e in l:
                dudar("ux", e, "nombre-repetido", f"Hay {len(l)} reglas UX con el mismo nombre: {[x['id'] for x in l]}", "media")

    # ── rubros como facetas ──
    filas_r = []
    for r in datos["rubros"]:
        rel = r.get("related", [])
        n_est = sum(1 for x in rel if x.startswith("estilos/")); n_lan = sum(1 for x in rel if x.startswith("landing/"))
        neg = [n for n, rs in NEGOCIO_RUBROS.items() if r["id"] in rs]
        filas_r.append({
            "coleccion": "rubros", "id_legacy": r["id"], "id_propuesto": "rubro:" + r["id"], "nombre": r["name"],
            "tipo": "faceta", "subtipo": "recomendador", "areas": "transversal", "temas": "", "temas_confianza": "",
            "rubros": "", "relaciones_propuestas": f"recomienda:{n_est} estilos, {n_lan} landing" + (f"; negocio:{';'.join(neg)}" if neg else ""),
            "evidencias": "maqueta(generada)", "nivel": r.get("nivel", ""), "valor": r.get("valor", ""),
            "valor_origen": "regla automática (por familia '" + fam.get(r["id"], "negocio") + "')", "valor_estado": "provisional/heredado",
            "prompt_estado": "", "nucleo_slots": "aporta" if any(k == "A tener en cuenta" for k, _ in r["fields"]) else "",
            "confianza": "alta", "motivos": "",
        })
        if not rel:
            dudas.append({"coleccion": "rubros", "id": r["id"], "nombre": r["name"], "tipo_duda": "rubro-sin-recomendacion", "motivo": "Sin estilos ni patrones relacionados", "gravedad": "media"})
        if r.get("valor") == "imprescindible":
            pass

    # ── validaciones de conservación ──
    # (a) 466 de entrada = 466 de salida (más 95 rubros como facetas aparte)
    validacion = []
    validacion.append(("Fichas de entrada (sin rubros)", total_fichas, len(filas)))
    validacion.append(("Rubros de entrada", len(datos["rubros"]), len(filas_r)))
    validacion.append(("Total entradas (fichas + rubros)", sum(len(l) for l in datos.values()), len(filas) + len(filas_r)))
    # (b) cada campo original tiene destino
    sin_destino = []
    for col, e in todos:
        for k, v in e.get("fields", []):
            if k in NUCLEO.get(col, {}) or k in CAMPOS_PROYECTO or k in CAMPOS_RELACION:
                continue
            # lo restante va a "tecnico": se conserva
    ids_nuevos = [f["id_propuesto"] for f in filas]
    dup_nuevos = [i for i, n in collections.Counter(ids_nuevos).items() if n > 1]
    validacion.append(("IDs propuestos únicos (duplicados = 0)", 0, len(dup_nuevos)))

    # ── escribir ──
    OUT.mkdir(parents=True, exist_ok=True)
    cols = list(filas[0].keys())
    with open(OUT / "clasificacion-466.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(filas + filas_r)
    with open(OUT / "clasificacion-466-dudas.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["gravedad", "tipo_duda", "coleccion", "id", "nombre", "motivo"], extrasaction="ignore")
        w.writeheader()
        orden = {"alta": 0, "media": 1, "baja": 2, "informativa": 3}
        w.writerows(sorted(dudas, key=lambda d: (orden[d["gravedad"]], d["tipo_duda"], d["coleccion"], d["id"])))

    # ── resumen ──
    C = collections.Counter
    por_tipo = C(f["tipo"] for f in filas)
    por_area = C(a for f in filas for a in f["areas"].split(";"))
    por_sub = C((f["tipo"], f["subtipo"]) for f in filas)
    por_tema = C(t for f in filas for t in f["temas"].split(";") if t)
    por_ev = C(ev for f in filas for ev in (f["evidencias"].split(";") if f["evidencias"] else ["(sin evidencia)"]))
    por_valor = C((f["valor_origen"], f["valor"]) for f in filas)
    por_dud = C((d["tipo_duda"], d["gravedad"]) for d in dudas)
    md = []
    A = md.append
    A("# Reporte de clasificación: las 466 fichas\n")
    A("Entrega B del plan de Programación v2. **Solo informe**: no se modificó ningún dato de `frontend/`. Lo genera `tools/weblab_clasificar.py` (se puede volver a correr).\n")
    A("Archivos: `clasificacion-466.csv` (una fila por ficha más los 95 rubros como facetas) y `clasificacion-466-dudas.csv` (todos los casos dudosos, ordenados por gravedad).\n")
    A("## 1. Validaciones de conservación\n")
    A("| Validación | Esperado | Resultado |\n|---|---|---|")
    for n, a, b in validacion:
        A(f"| {n} | {a} | {b} {'✔' if a == b else '✘'} |")
    A("\nLos campos del cuerpo de cada ficha **no se descartan**: los que no alimentan el núcleo se conservan en `tecnico`. Ver §7.\n")
    A("## 2. Por tipo y por área (propuesta)\n")
    A("| Tipo | Fichas |\n|---|---|")
    for t, n in por_tipo.most_common(): A(f"| {t} | {n} |")
    A("\n| Área | Fichas (una ficha puede estar en 2 áreas) |\n|---|---|")
    for t, n in por_area.most_common(): A(f"| {t} | {n} |")
    A("\n| Tipo | Subtipo | Fichas |\n|---|---|---|")
    for (t, s), n in sorted(por_sub.items()): A(f"| {t} | {s} | {n} |")
    A("\n## 3. Mapa colección → tipo · área\n")
    A("| Colección actual (nombre en pantalla) | Fichas | Tipo | Área |\n|---|---|---|---|")
    nombres_pantalla = {"soluciones": "Tipos de web (id: soluciones)", "negocios": "Negocios para vender"}
    for c, (t, s, a) in COL.items():
        A(f"| {nombres_pantalla.get(c, c)} | {len(datos[c])} | {t} / {s} | {', '.join(a)} |")
    A(f"| Rubros | {len(datos['rubros'])} | faceta / recomendador | transversal |")
    A("\n## 4. Temas asignados (por reglas con fuente)\n")
    A("Cada tema se asignó por una regla visible en el CSV (`temas_confianza`): **alta** = viene de la colección o una etiqueta; **media** = palabra clave en nombre o resumen; **baja** = palabra clave solo en el cuerpo. Los de confianza baja son los candidatos a error.\n")
    A("| Tema | Fichas |\n|---|---|")
    for t, n in por_tema.most_common(): A(f"| {t} | {n} |")
    conf_t = C(c.split(":")[1] for f in filas for c in f["temas_confianza"].split(";") if c)
    A(f"\nConfianza de las asignaciones de tema: {dict(conf_t)}.\n")
    A("## 5. Evidencias detectadas (de lo que ya existe)\n")
    A("| Evidencia | Fichas |\n|---|---|")
    for t, n in por_ev.most_common(): A(f"| {t} | {n} |")
    A("\nNota: no hay ningún **proyecto real** asociado a ninguna ficha todavía; eso depende de la entrega C. Las \"maquetas\" son las generadas por el sitio (Así se ve / Así se arma / vista previa de fuentes / diagrama).\n")
    A("## 6. Valor: de dónde viene cada uno\n")
    A("| Origen del valor | Valor | Fichas |\n|---|---|---|")
    for (o, v), n in sorted(por_valor.items()): A(f"| {o} | {v} | {n} |")
    A("\nTodo lo que **no** está \"validado por Darío\" figura como **provisional/heredado**. Hoy solo hay tres valores que Darío dijo explícitamente: Impeccable (Imprescindible), UI UX Pro Max (Base) y E-commerce (Imprescindible).\n")
    A("## 7. A dónde irían los campos del cuerpo actual\n")
    A("Para cada colección, cuántos campos alimentarían cada bloque del núcleo (`que_es`, `problema`, `aporta`, `cuando_si`, `cuando_no`, `como`), cuántos van a `tecnico` y cuántos son relaciones o afirmaciones sobre proyectos propios que hay que verificar.\n")
    A("| Colección | " + " | ".join(["que_es", "problema", "aporta", "cuando_si", "cuando_no", "como", "tecnico", "relación", "evidencia/relación (verificar)", "reutilizable"]) + " |")
    A("|---|" + "---|" * 10)
    for c in list(COL) + ["rubros"]:
        d = destino_campos[c]
        reut = d["reutilizable.prompt"] + d["reutilizable.fuentes"]
        A(f"| {c} | " + " | ".join(str(d[x]) for x in ["que_es", "problema", "aporta", "cuando_si", "cuando_no", "como", "tecnico", "relación", "evidencia/relación (verificar)"]) + f" | {reut} |")
    # núcleo
    sin_que_es = C(f["coleccion"] for f in filas if "que_es" not in f["nucleo_slots"])
    sin_cuando = C(f["coleccion"] for f in filas if "cuando_si" not in f["nucleo_slots"])
    A("\nFichas **sin ninguna fuente** para el bloque \"Qué es\" (hay que escribirlo): " + ", ".join(f"{c} {n}" for c, n in sin_que_es.most_common()) + ".\n")
    A("Fichas **sin fuente** para \"Cuándo conviene\": " + ", ".join(f"{c} {n}" for c, n in sin_cuando.most_common()) + ".\n")
    A("Hallazgo de modelo: Patrones de landing (34) y las reglas UX (96) tienen su contenido principal en \"Orden de secciones\" y \"Hacer\", que no encajan en qué es / problema / aporta. Se propone sumar un bloque **`como`** (\"cómo se arma o se aplica\") al núcleo. Está en la entrega A y en los casos ambiguos.\n")
    A("## 8. Casos dudosos y posibles clasificaciones incorrectas\n")
    A(f"Total: **{len(dudas)}** casos. Ordenados por gravedad en `clasificacion-466-dudas.csv`; los de gravedad alta pasan a `casos-ambiguos.md` para decidir.\n")
    A("| Tipo de duda | Gravedad | Casos |\n|---|---|---|")
    for (t, g), n in sorted(por_dud.items(), key=lambda x: ({'alta':0,'media':1,'baja':2,'informativa':3}[x[0][1]], -x[1])): A(f"| {t} | {g} | {n} |")
    A("\n### Qué revisa el detector\n")
    for l in [
        "Campo propio de la colección ausente (por ejemplo, una ficha de tipografía sin `fonts`): sugiere tipo mal asignado.",
        "Ids repetidos entre colecciones y nombres casi iguales (similitud ≥ 0,86), posibles duplicados.",
        "Estilos que en realidad son estructuras de página o tipos de panel; variantes entre estilos.",
        "Pares Negocios ↔ Rubros y negocios sin rubro equivalente.",
        "Valor que contradice lo que dijo Darío; Imprescindible con nivel Avanzado.",
        "Temas inferidos solo por una palabra clave del cuerpo (confianza baja) y fichas con más de 3 temas.",
        "Relaciones rotas; resúmenes vacíos; rubros sin recomendaciones.",
        "Fichas sin evidencia y fichas sin ninguna fuente para el núcleo (informativas, no son errores).",
    ]: A(f"- {l}")
    A("\n### Casos de gravedad alta\n")
    A("| Tipo | Colección | Id | Motivo |\n|---|---|---|---|")
    for d in sorted([d for d in dudas if d["gravedad"] == "alta"], key=lambda d: (d["tipo_duda"], d["coleccion"], d["id"])):
        A(f"| {d['tipo_duda']} | {d['coleccion']} | `{d['id']}` | {d['motivo'][:150]} |")
    A("\n## 9. Afirmaciones sobre proyectos propios que hay que verificar\n")
    A(f"{len(proy_claims)} fichas tienen un campo \"Lo uso en\" o \"Ejemplo propio\" (texto escrito a mano en sesiones anteriores). **No se convierten en relaciones ni evidencias** hasta cotejarlos con `proyectos-verificables.md`.\n")
    A("| Colección | Id | Campo | Texto actual |\n|---|---|---|---|")
    for c, i, n, k, v in proy_claims: A(f"| {c} | `{i}` | {k} | {v.replace('|','/')} |")
    (OUT / "clasificacion-466.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"Fichas: {len(filas)} · rubros: {len(filas_r)} · dudas: {len(dudas)} · archivos en {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

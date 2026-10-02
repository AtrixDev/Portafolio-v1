#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migrador de Programación v2: lee frontend/data/weblab/*.json (SIN modificarlos) y genera frontend/data/lab/.

  index.json          liviano: lo que necesitan las tarjetas y el buscador
  <coleccion>.json    cuerpos de las fichas (se cargan a demanda)
  proyectos.json      fichas de proyecto y de funcionalidad
  rubros.json         los 95 rubros como facetas con su recomendación
  evidencias.json     definiciones de evidencia
  relaciones.json     relaciones directas entre fichas
  legacy-ids.json     "coleccion/id" viejo → id nuevo
  taxonomia.json      vocabularios

Validaciones que CORTAN la ejecución si fallan (ver validar()).
Uso:  python3 tools/weblab_migrar.py
"""
import ast, json, re, shutil, sys, collections
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from weblab_taxonomia import *            # noqa
import weblab_niveles as NV
import lab_proyectos as LP
from lab_nucleo import NUCLEO_ESCRITO, NUCLEO_SUMA
from lab_valor_resto import valor_resto, ORIGEN as VALOR_RESTO_ORIGEN

ROOT = HERE.parent
SRC = ROOT / "frontend" / "data" / "weblab"
OUT = ROOT / "frontend" / "data" / "lab"
JS = ROOT / "frontend" / "js"
HOY = "2026-10-01"
try:   # lista de términos que NO pueden salir en lo emitido (nombres de clientes y marcas); vive en el archivo privado
    from lab_proyectos_privado import PROHIBIDOS
except ImportError:
    PROHIBIDOS = []
    print("AVISO: falta tools/lab_proyectos_privado.py; no se puede comprobar que no salgan datos de clientes.")

CURADAS = {"negocios", "soluciones", "arquitecturas", "stacks", "servicios", "skills"}
TABLA_MANUAL = {"skills", "stacks", "servicios", "arquitecturas", "soluciones", "landing", "negocios"}
REGLA = {
    "ux": "Regla automática: severidad alta → Imprescindible; animación, rendimiento o temas avanzados → Pro; el resto → Base.",
    "estilos": "Regla automática: complejidad alta → Pro; uso general con buen rendimiento → Imprescindible; el resto → Base.",
    "tipografias": "Regla automática: pares con fuente display, script o monoespaciada → Pro; el resto → Base.",
}
VERIFICADOS = {("stacks", "vanilla"), ("soluciones", "portfolio"), ("soluciones", "saas"), ("arquitecturas", "spa-api"),
               ("arquitecturas", "serverless"), ("stacks", "node-express"), ("servicios", "vercel"), ("servicios", "mongodb-atlas"),
               ("servicios", "resend"), ("servicios", "groq")}
EVID_COMPARTIDAS = {
    "maqueta-estilo": ("maqueta", "Así se ve", "generado", "Mini interfaz generada con los colores y efectos del estilo, aplicada a un ejemplo inventado."),
    "maqueta-landing": ("maqueta", "Así se arma", "generado", "Página armada con el orden de secciones del patrón, con un negocio inventado (Yerbal del Monte)."),
    "maqueta-tipografia": ("maqueta", "Vista previa de las fuentes", "generado", "La misma página con las fuentes por defecto y con esta combinación."),
    "maqueta-diagrama": ("maqueta", "Diagrama del recorrido", "generado", "Diagrama de cómo viaja un pedido por esta arquitectura. Es una representación, no un proyecto."),
    "maqueta-preset": ("maqueta", "Ejemplo del constructor", "generado", "Datos precargados para armar un sitio de este rubro en el constructor (negocio inventado)."),
    "maqueta-rubro": ("maqueta", "Así se ve (rubro)", "generado", "Mini sitio de un negocio inventado de este rubro, pintado con su paleta recomendada."),
    "demo-ux": ("demo", "Así no / Así sí", "propio", "Dos mini interfaces que se pueden tocar: la que rompe la regla y la que la cumple."),
    "demo-stack": ("demo", "El mismo botón en este stack", "propio", "El mismo contador resuelto con esta tecnología, con su código."),
    "demo-glassmorphism": ("demo", "App de finanzas con y sin vidrio", "propio", "La misma app de ejemplo con estilo plano y con glassmorphism. Hecha para esta ficha."),
}


def cargar():
    idx = json.loads((SRC / "index.json").read_text(encoding="utf-8"))
    return {c["id"]: json.loads((SRC / f"{c['id']}.json").read_text(encoding="utf-8")) for c in idx["categories"]}


def claves_js():
    ux, stacks, exp = set(), set(), set()
    for f in (JS / "programacion-demos.js", JS / "programacion-ux.js"):
        t = f.read_text(encoding="utf-8")
        ux |= set(re.findall(r"'ux/([0-9a-z-]+)'\s*:", t))
        stacks |= set(re.findall(r"'stacks/([0-9a-z-]+)'\s*:", t))
        exp |= set(re.findall(r"'skills/([0-9a-z-]+)'\s*:\s*\{\s*exp:", t))
    return ux, stacks, exp


def herramientas():
    """Lee herramientas.html (herr.js): estado declarado por el propio sitio."""
    out = {}
    for ln in (JS / "herr.js").read_text(encoding="utf-8").splitlines():
        m = re.match(r"\s*\{ id: '([a-z]+)', q: '((?:[^'\\]|\\.)*)', imp: (\[.*?\]), e: '([a-z]+)', n: '((?:[^'\\]|\\.)*)', v: '((?:[^'\\]|\\.)*)', p: '((?:[^'\\]|\\.)*)'", ln)
        if m:
            try: imp = ast.literal_eval(m.group(3))
            except Exception: imp = []
            un = lambda s: s.replace("\\'", "'")
            out[m.group(1)] = {"q": un(m.group(2)), "imp": imp, "e": m.group(4), "n": un(m.group(5)), "v": un(m.group(6)), "p": un(m.group(7))}
    return out


def main():
    datos = cargar()
    ux_demos, stacks_demos, skills_exp = claves_js()
    fam = dict(re.findall(r"'([a-z0-9-]+)':\s*\['([a-z]+)'", (JS / "programacion-rubros.js").read_text(encoding="utf-8")))
    entradas_in = sum(len(l) for l in datos.values())

    # ── 1) qué fichas pasan y qué ids reciben ──
    fusionadas = [e for e in datos["estilos"] if e["id"] in FUSIONAR_ESTILO_EN_LANDING]
    lista = [(c, e) for c, l in datos.items() if c != "rubros" for e in l if not (c == "estilos" and e["id"] in FUSIONAR_ESTILO_EN_LANDING)]
    cuenta = collections.Counter(e["id"] for _, e in lista)
    nid = {}
    for c, e in lista:
        nid[(c, e["id"])] = f"{e['id']}-{SUFIJO[c]}" if cuenta[e["id"]] > 1 else e["id"]
    for e in fusionadas:
        nid[("estilos", e["id"])] = nid[("landing", e["id"])]
    existe = set(nid.values())
    resolver = lambda ref: nid.get(tuple(ref.split("/", 1))) if "/" in ref else None

    # ── 2) backlinks de rubros → estilos/landing ──
    recomienda = collections.defaultdict(lambda: {"estilos": [], "landing": []})
    back = collections.defaultdict(list)
    for r in datos["rubros"]:
        for ref in r.get("related", []):
            c, _, i = ref.partition("/")
            t = resolver(ref)
            if c in ("estilos", "landing") and t:
                k = "landing" if (c == "landing" or i in FUSIONAR_ESTILO_EN_LANDING) else "estilos"   # un estilo fusionado se recomienda como patrón de landing
                if t not in recomienda[r["id"]][k]: recomienda[r["id"]][k].append(t)
                if r["id"] not in back[t]: back[t].append(r["id"])
    neg_de_rubro = collections.defaultdict(list)
    for n, rs in NEGOCIO_RUBROS.items():
        for rid in rs:
            if rid in {x["id"] for x in datos["rubros"]}: neg_de_rubro[rid].append(nid[("negocios", n)])

    # ── 3) fichas ──
    fichas, evid, rel, legacy = [], {}, [], {}
    for k, (t, titulo, origen, d) in EVID_COMPARTIDAS.items():
        evid[k] = {"id": k, "tipo": t, "titulo": titulo, "origen": origen, "descripcion": d}

    def valor_de(col, e):
        i = e["id"]
        if (col, i) in VALOR_DARIO:
            return VALOR_DARIO[(col, i)], VALOR_PORQUE_DARIO[(col, i)], "validado por Darío", "validado"
        _r = valor_resto(col, e)
        if _r: return _r[0], _r[1], VALOR_RESTO_ORIGEN, "provisional"
        if col in TABLA_MANUAL or (col, i) in NV.OVERRIDE:
            return e.get("valor"), "Asignado a mano en una sesión anterior (Claude); todavía sin revisar por Darío.", "tabla manual (Claude, sin validar)", "provisional"
        if col == "rubros":
            return e.get("valor"), "Regla automática por familia del rubro (comercios y servicios locales: Imprescindible; paneles y finanzas: Pro; el resto: Base).", "regla automática", "provisional"
        return e.get("valor"), REGLA.get(col, "Regla automática."), "regla automática", "provisional"

    def armar(col, e, fus=None):
        tipo, sub, areas = COL[col]
        areas = list(areas)
        i = e["id"]
        if col == "estilos":
            if i in ESTILOS_ESTRUCTURA: sub = "patrón de página"
            elif i in ESTILOS_PANEL: sub = "patrón de panel"
        if (col, i) in DOS_AREAS: areas.append(DOS_AREAS[(col, i)])
        valor, porque, vorigen, vestado = valor_de(col, e)
        if (col, i) in VALOR_DARIO: pass
        nuc, tec, reut = collections.defaultdict(list), [], {}
        mapa = NUCLEO.get(col, {})
        for k, v in e.get("fields", []):
            if k in mapa:
                dest = mapa[k]
                if dest == "reutilizable.prompt":
                    reut["prompt"] = {"texto": v, "estado": "sin probar", "idioma": "en"}
                elif dest == "reutilizable.fuentes":
                    reut["fuentes"] = {**e.get("fonts", {})}
                else:
                    nuc[dest].append({"l": k, "x": v})
            else:
                par = [k, v]
                if (col, i) == ("servicios", "tiendanube") and k in CAMPOS_PROYECTO: par.append("sin comprobar")
                tec.append(par)
        if fus:   # estilo fusionado: su texto se conserva
            for k, v in fus.get("fields", []):
                if k == "Ideal para": nuc["cuando_si"].append({"l": "Ideal para (del estilo homónimo)", "x": v})
                elif k == "Evitar en": nuc["cuando_no"].append({"l": "Evitar en (del estilo homónimo)", "x": v})
                elif k == "Prompt para IA (en inglés)": reut.setdefault("prompt", {"texto": v, "estado": "sin probar", "idioma": "en"})
                else: tec.append([f"{k} (del estilo homónimo)", v])
        escrito = NUCLEO_ESCRITO.get((col, i))
        if escrito:   # núcleo escrito: lo que alimentaba el núcleo antes pasa a "datos técnicos" (no se pierde)
            for sl, items in list(nuc.items()):
                for it in items: tec.append([it["l"], it["x"]])
            nuc = collections.defaultdict(list, {k: list(v) for k, v in escrito["nucleo"].items()})
            if escrito.get("resumen"): tec.append(["Resumen original", e.get("summary", "")])
            if "valor" in escrito:
                valor, porque, vorigen, vestado = escrito["valor"], escrito["valor_porque"], "tabla manual (Claude, sin validar)", "provisional"
        suma = NUCLEO_SUMA.get((col, i))
        if suma:   # completa huecos del núcleo automático sin reemplazar lo que ya está
            for sl, items in suma.items():
                if not nuc.get(sl): nuc[sl] = [dict(x) for x in items]
            nuc_suma = True
        if col == "skills":
            reut["prompt"] = {"texto": e.get("prompt", ""), "estado": "sin probar"}
            if i in skills_exp: reut["experimento"] = i
            reut["instalacion"] = e.get("install", ""); reut["fuente_url"] = e.get("source", "")
        extra = {k: e[k] for k in ("palette", "swatches", "fonts", "code", "flow", "examples", "preset", "install", "prompt", "source", "tags") if k in e}
        # evidencias
        ev = []
        if col == "skills" and i in skills_exp: ev.append("exp-" + i)
        if col == "ux" and i in ux_demos: ev.append("demo-ux")
        if col == "stacks" and i in stacks_demos: ev.append("demo-stack")
        if col == "estilos": ev.append("maqueta-estilo")
        if col == "landing": ev.append("maqueta-landing")
        if col == "tipografias": ev.append("maqueta-tipografia")
        if col == "arquitecturas" and e.get("flow"): ev.append("maqueta-diagrama")
        if col == "negocios" and e.get("preset"): ev.append("maqueta-preset")
        if col == "soluciones" and e.get("examples"): ev.append("ejemplo-" + nid[(col, i)])
        if col == "estilos" and i == "glassmorphism": ev.append("demo-glassmorphism")
        # temas
        tm = [(t_, c_) for t_, c_, _ in temas_de(col, e)]
        ficha = {
            "id": nid[(col, i)], "tipo": tipo, "subtipo": sub, "areas": areas,
            "temas": [t_ for t_, c_ in tm if c_ in ("alta", "media")], "temas_a_revisar": [t_ for t_, c_ in tm if c_ == "baja"],
            "rubros": [x for x in (NEGOCIO_RUBROS.get(i, []) if col == "negocios" else [])],
            "nivel": e.get("nivel"), "valor": valor, "valor_porque": porque, "valor_revisado": HOY, "valor_origen": vorigen, "valor_estado": vestado,
            "nombre": e["name"], "resumen": (escrito or {}).get("resumen") or e.get("summary", ""), "nucleo": dict(nuc), "evidencias": ev, "reutilizable": reut,
            "tecnico": tec, "extra": extra, "origen": "curada" if col in CURADAS else "importada",
            "fuente": "Curada en sesiones de trabajo (Darío y Claude)" if col in CURADAS else "Importada y traducida de la skill ui-ux-pro-max",
            "legacy": {"cat": col, "id": i, "col": col}, "col": col,
        }
        if escrito or suma: ficha["nucleo_borrador"] = True
        if fus: ficha["legacy_extra"] = [{"cat": "estilos", "id": fus["id"]}]
        return ficha

    fus_por_id = {e["id"]: e for e in fusionadas}
    for c, e in lista:
        f = armar(c, e, fus_por_id.get(e["id"]) if c == "landing" else None)
        fichas.append(f)
        legacy[f"{c}/{e['id']}"] = f["id"]
    for e in fusionadas: legacy[f"estilos/{e['id']}"] = nid[("estilos", e["id"])]

    # evidencias específicas
    nombres_skills = {e["id"]: e["name"] for e in datos["skills"]}
    for i in skills_exp:
        ref = {"experimento": i}
        mp = ROOT / "frontend" / "experimentos" / i / "meta.json"
        if mp.exists():   # si las dos salidas son páginas, se pueden comparar con el deslizador
            m = json.loads(mp.read_text(encoding="utf-8"))
            for lado in ("sin", "con"):
                pg = [a_ for a_ in m[lado]["archivos"] if not a_.get("aux") and a_.get("tipo") == "pagina"]
                if pg: ref[lado] = f"experimentos/{i}/{pg[0]['ruta']}"
        evid["exp-" + i] = {"id": "exp-" + i, "tipo": "experimento", "titulo": f"Experimento: sin y con {nombres_skills.get(i, i)}", "origen": "generado",
                            "descripcion": "Mismo prompt, mismo modelo y carpeta vacía; una sola corrida por lado. Se comparan resultado, tiempo, costo y pasos.", "ref": ref}
    for c, e in lista:
        if c == "soluciones" and e.get("examples"):
            evid["ejemplo-" + nid[(c, e["id"])]] = {"id": "ejemplo-" + nid[(c, e["id"])], "tipo": "ejemplo", "titulo": "Sitios reales de terceros", "origen": "terceros",
                                                     "descripcion": "Ejemplos de otras empresas, no hechos por Darío.", "enlaces": e["examples"]}
    evid["demo-glassmorphism"].update({"ref": {"url": "prog-ejemplos/ejemplos/glassmorphism.html", "antes": "prog-ejemplos/ejemplos/glassmorphism-plano.html"}})

    # ── 4) relaciones entre fichas ──
    por_id = {f["id"]: f for f in fichas}
    def agregar(d, t, a):
        if a and a in existe and a != d and {"desde": d, "tipo": t, "a": a} not in rel:
            rel.append({"desde": d, "tipo": t, "a": a})
    for c, e in lista:
        d = nid[(c, e["id"])]
        for ref in e.get("related", []):
            agregar(d, "relacionada", resolver(ref))
        if c == "estilos":
            for a_, b_ in ESTILOS_VARIANTES:
                if e["id"] == b_: agregar(d, "variante_de", resolver("estilos/" + a_))
            if e["id"] in ESTRUCTURA_A_LANDING and ESTRUCTURA_A_LANDING[e["id"]]:
                agregar(d, "variante_de", resolver("landing/" + ESTRUCTURA_A_LANDING[e["id"]]))
            if e["id"] in ESTILOS_PANEL: agregar(d, "relacionada", resolver("soluciones/dashboard"))
    for e in fusionadas: pass

    # ── 5) rubros como facetas ──
    rubros_out = []
    for r in datos["rubros"]:
        valor, porque, vorigen, vestado = valor_de("rubros", r)
        rubros_out.append({
            "id": "rubro:" + r["id"], "nombre": r["name"], "resumen": r.get("summary", ""), "tags": r.get("tags", []), "familia": fam.get(r["id"], "negocio"),
            "campos": r.get("fields", []), "palette": r.get("palette", []),
            "recomienda": {"estilos": recomienda[r["id"]]["estilos"], "landing": recomienda[r["id"]]["landing"]}, "negocios": neg_de_rubro.get(r["id"], []),
            "nivel": r.get("nivel"), "valor": valor, "valor_origen": vorigen, "valor_estado": vestado, "valor_visible": False, "evidencias": ["maqueta-rubro"],
            "legacy": {"cat": "rubros", "id": r["id"]},
        })
        legacy[f"rubros/{r['id']}"] = "rubro:" + r["id"]
        legacy[f"paletas/{r['id']}"] = "rubro:" + r["id"]
    for f in fichas:
        if f["id"] in back:
            for rid in back[f["id"]]:
                pass
        f["recomendado_para"] = ["rubro:" + x for x in back.get(f["id"], [])]

    # ── 6) proyectos y funcionalidades (solo lo comprobado) ──
    proyectos = []
    herr = herramientas()
    def slots(nuc):
        return {k: [{"l": "", "x": x} for x in v] for k, v in nuc.items()}
    for p in LP.PROYECTOS:
        eid = "proyecto-" + p["id"]
        evid[eid] = {"id": eid, "tipo": "proyecto", "titulo": p["nombre"], "origen": "propio", "descripcion": p["estado"], "enlaces": p.get("enlaces", [])}
        if p.get("capturas"):
            evid[eid]["ref"] = {"capturas": p["capturas"], "nota": p.get("nota_capturas", ""), "url_preview": p["capturas"][0][1]}
            for _, src in p["capturas"]:
                if not (ROOT / "frontend" / src).exists(): raise SystemExit(f"falta la captura {src}")
        proyectos.append({
            "id": p["id"], "tipo": "proyecto", "subtipo": "proyecto web" if "desarrollo-web" in p["areas"] else "herramienta propia", "areas": p["areas"], "temas": p["temas"],
            "rubros": [], "nivel": None, "valor": None, "valor_origen": "sin clasificar", "valor_estado": "sin clasificar", "nombre": p["nombre"], "resumen": p["resumen"],
            "nucleo": slots(p["nucleo"]), "evidencias": [eid], "reutilizable": {}, "tecnico": [], "extra": {"tecnologias": p["tecnologias"], "estado": p["estado"], "pendiente": p["pendiente"]},
            "origen": "propia", "fuente": p["fuente"], "legacy": None, "col": "proyectos",
        })
        for r_ in p["usa"]: agregar_p = resolver(r_); rel.append({"desde": p["id"], "tipo": "usa", "a": agregar_p}) if agregar_p else None
        for fid in p["implementa"]: rel.append({"desde": p["id"], "tipo": "implementa", "a": fid})
    for hid in LP.HERRAMIENTAS_PROYECTO:
        h = herr.get(hid)
        if not h or h["e"] != "funciona": continue
        eid = "proyecto-herramienta-" + hid
        evid[eid] = {"id": eid, "tipo": "proyecto", "titulo": h["n"], "origen": "propio", "descripcion": "Herramienta pública funcionando (estado declarado en herramientas.html).", "enlaces": [["Verla en Herramientas", f"herramientas.html#{hid}"]]}
        proyectos.append({
            "id": "herramienta-" + hid, "tipo": "proyecto", "subtipo": "herramienta propia", "areas": ["ia-datos"], "temas": ["mercado-libre"], "rubros": [],
            "nivel": None, "valor": None, "valor_origen": "sin clasificar", "valor_estado": "sin clasificar", "nombre": h["n"], "resumen": h["v"],
            "nucleo": {"problema": [{"l": "", "x": h["q"]}], "aporta": [{"l": "", "x": x} for x in h["imp"]], "cuando_si": [{"l": "Para", "x": h["p"]}]},
            "evidencias": [eid], "reutilizable": {}, "tecnico": [], "extra": {"estado": "Funcionando", "pendiente": []}, "origen": "propia",
            "fuente": "frontend/js/herr.js (estado declarado por el propio sitio)", "legacy": None, "col": "proyectos",
        })
    funcs = []
    for fn in LP.FUNCIONALIDADES:
        evs = []
        for pid, niv, fuente in fn["en"]:
            eid = "proyecto-" + pid
            if eid in evid:
                evs.append(eid)
                rel.append({"desde": fn["id"], "tipo": "evidenciada_por", "a": pid})
        for r_ in fn.get("usa", []):
            t_ = resolver(r_)
            if t_: rel.append({"desde": fn["id"], "tipo": "usa", "a": t_})
        funcs.append({
            "id": fn["id"], "tipo": "funcionalidad", "subtipo": "funcionalidad", "areas": ["ia-datos"] if "mercado-libre" in fn["temas"] and fn["id"].startswith("analisis") else ["desarrollo-web"],
            "temas": fn["temas"], "rubros": [], "nivel": None, "valor": None, "valor_origen": "sin clasificar", "valor_estado": "sin clasificar",
            "nombre": fn["nombre"], "resumen": fn["resumen"], "nucleo": {"que_es": [{"l": "", "x": fn["que_es"]}]}, "evidencias": evs, "reutilizable": {}, "tecnico": [],
            "extra": {"respaldo": [{"proyecto": p_, "nivel": n_, "fuente": f_} for p_, n_, f_ in fn["en"]], "nota": fn.get("nota", "")},
            "origen": "propia", "fuente": "Comprobada en el código y la documentación de los proyectos (ver cada respaldo)", "legacy": None, "col": "proyectos",
        })
    todas = fichas + proyectos + funcs
    # relaciones válidas (todos los ids existen)
    ids_todos = {f["id"] for f in todas}
    rel = [r for r in rel if r["desde"] in ids_todos and r["a"] in ids_todos]
    for f in todas: f["relaciones"] = [{"tipo": r["tipo"], "a": r["a"]} for r in rel if r["desde"] == f["id"]]

    # ── 7) índice ──
    def kinds(f): return sorted({evid[e]["tipo"] for e in f["evidencias"] if e in evid})
    def previa(f):   # página para la vista previa de la tarjeta: demo propia con url, o salida web del experimento
        for e in f["evidencias"]:
            r = evid.get(e, {}).get("ref", {})
            if r.get("url"): return r["url"]
            if r.get("con"): return r["con"]
            if r.get("url_preview"): return r["url_preview"]
        return None
    index = [{"id": f["id"], "t": f["tipo"], "s": f["subtipo"], "a": f["areas"], "tm": f["temas"], "r": f["rubros"], "n": f["nombre"], "d": (f["resumen"] or "")[:160],
              "lv": f["nivel"], "v": f["valor"], "ve": f["valor_estado"], "e": kinds(f), "c": f["col"], "p": previa(f)} for f in todas]

    # ── 8) escribir ──
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    w = lambda n, o: (OUT / n).write_text(json.dumps(o, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    por_col = collections.defaultdict(list)
    for f in fichas: por_col[f["col"]].append(f)
    for c, l in por_col.items(): w(f"{c}.json", l)
    w("proyectos.json", proyectos + funcs)
    w("rubros.json", rubros_out)
    w("evidencias.json", list(evid.values()))
    w("relaciones.json", rel)
    w("legacy-ids.json", legacy)
    w("index.json", index)
    tax = json.loads((ROOT / "docs" / "lab" / "taxonomia.json").read_text(encoding="utf-8"))
    for k in ("colecciones_actuales", "mapeo_de_campos"): tax.pop(k, None)
    w("taxonomia.json", tax)

    validar(datos, fichas, proyectos, funcs, rubros_out, legacy, rel, fusionadas, entradas_in, evid, nid, ids_todos)
    resumen(todas, rubros_out, proyectos, funcs, rel, evid, fusionadas)


def validar(datos, fichas, proyectos, funcs, rubros_out, legacy, rel, fusionadas, entradas_in, evid, nid, ids_todos):
    fallos = []
    # 1) conteo: cada entrada original llega a algún lado (fusionadas cuentan en la ficha que las absorbe)
    emitidas_de_origen = len(fichas) + len(fusionadas) + len(rubros_out)
    if emitidas_de_origen != entradas_in:
        fallos.append(f"conteo: entran {entradas_in}, salen {emitidas_de_origen} (fichas {len(fichas)} + fusionadas {len(fusionadas)} + rubros {len(rubros_out)})")
    # 2) ids únicos
    ids = [f["id"] for f in fichas + proyectos + funcs] + [r["id"] for r in rubros_out]
    dup = [i for i, n in collections.Counter(ids).items() if n > 1]
    if dup: fallos.append(f"ids repetidos: {dup}")
    # 3) ningún dato original se pierde
    por_id = {f["id"]: f for f in fichas}
    for col, lista in datos.items():
        if col == "rubros": continue
        for e in lista:
            f = por_id[nid[(col, e["id"])]]
            blob = json.dumps([f["nucleo"], f["tecnico"], f["reutilizable"], f["extra"]], ensure_ascii=False)
            if f["nombre"] != e["name"] and not (col == "estilos" and e["id"] in FUSIONAR_ESTILO_EN_LANDING): fallos.append(f"nombre cambiado {col}/{e['id']}")
            if (f["resumen"] or "") != (e.get("summary") or "") and col != "estilos" and not f.get("nucleo_borrador"): fallos.append(f"resumen cambiado {col}/{e['id']}")
            if f.get("nucleo_borrador") and (e.get("summary") or "") not in blob and (e.get("summary") or "") != (f["resumen"] or ""): fallos.append(f"resumen original perdido {col}/{e['id']}")
            for k, v in e.get("fields", []):
                if json.dumps(v, ensure_ascii=False)[1:-1] not in blob and not (col == "estilos" and e["id"] in FUSIONAR_ESTILO_EN_LANDING):
                    fallos.append(f"campo perdido {col}/{e['id']}: {k}")
            for k in ("palette", "swatches", "fonts", "code", "flow", "examples", "preset", "install", "prompt", "source", "tags"):
                if k in e and f["extra"].get(k) != e[k] and not (col == "estilos" and e["id"] in FUSIONAR_ESTILO_EN_LANDING):
                    fallos.append(f"extra perdido {col}/{e['id']}: {k}")
    # estilos fusionados: su texto está en la ficha de landing
    for e in fusionadas:
        f = por_id[nid[("estilos", e["id"])]]
        blob = json.dumps([f["nucleo"], f["tecnico"], f["reutilizable"]], ensure_ascii=False)
        for k, v in e["fields"]:
            if json.dumps(v, ensure_ascii=False)[1:-1] not in blob: fallos.append(f"estilo fusionado: campo perdido {e['id']}: {k}")
    # rubros: campos, paleta y relaciones
    for r in datos["rubros"]:
        o = next(x for x in rubros_out if x["legacy"]["id"] == r["id"])
        if o["campos"] != r.get("fields", []) or o["palette"] != r.get("palette", []): fallos.append(f"rubro con campos distintos: {r['id']}")
    # 4) legacy: todas las claves viejas resuelven a un id emitido
    for c, lista in datos.items():
        for e in lista:
            d = legacy.get(f"{c}/{e['id']}")
            if not d or d not in ids: fallos.append(f"legacy sin destino: {c}/{e['id']}")
    # 5) relaciones sin romper
    for r in rel:
        if r["desde"] not in ids_todos or r["a"] not in ids_todos: fallos.append(f"relación rota: {r}")
    # 6) evidencias referenciadas existen
    for f in fichas + proyectos + funcs:
        for e in f["evidencias"]:
            if e not in evid: fallos.append(f"evidencia inexistente {f['id']}: {e}")
    # 7) nada sensible en lo emitido
    for p in OUT.glob("*.json"):
        t = p.read_text(encoding="utf-8")
        for s in PROHIBIDOS:
            if s in t: fallos.append(f"texto prohibido '{s}' en {p.name}")
    if fallos:
        print("\nVALIDACIÓN FALLIDA:")
        for x in fallos[:40]: print("  ✘", x)
        print(f"  ({len(fallos)} problemas)")
        sys.exit(1)


def resumen(todas, rubros_out, proyectos, funcs, rel, evid, fusionadas):
    C = collections.Counter
    print(f"OK · {len(todas)} fichas ({len(todas) - len(proyectos) - len(funcs)} migradas, {len(proyectos)} proyectos, {len(funcs)} funcionalidades) · {len(rubros_out)} rubros · {len(rel)} relaciones · {len(evid)} evidencias · {len(fusionadas)} estilos fusionados")
    print("tipos:", dict(C(f["tipo"] for f in todas)))
    print("áreas:", dict(C(a for f in todas for a in f["areas"])))
    print("valor:", dict(C((f["valor_estado"]) for f in todas)))
    print("→", OUT)


if __name__ == "__main__":
    main()

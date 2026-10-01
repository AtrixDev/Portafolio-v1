#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Publica un experimento de skill (salida de correr.sh) en frontend/experimentos/<id>/.

  python3 tools/experimentos/publicar.py <id> [--dir /carpeta/de/experimentos]

- Copia lo que generó cada corrida (sin/ y con/), sin los archivos de entrada ni la carpeta .claude.
- Convierte para poder mostrarlo en la web: .md → .md.html (fragmento), .xlsx/.pptx/.docx/.pdf → PNG por página
  (LibreOffice + pdftoppm), y conserva el original para descargar.
- Escribe meta.json con el prompt, el modelo, el tiempo, los pasos, el costo y el resumen que dio Claude.
Las páginas HTML reciben solo <meta name="robots" content="noindex">: el diseño queda como salió.
"""
import json, re, shutil, subprocess, sys, tempfile
from datetime import date
from pathlib import Path
import markdown

AQUI = Path(__file__).resolve().parent
OUT_BASE = AQUI.parent.parent / "frontend" / "experimentos"
IGNORAR = {".claude", "node_modules", ".impeccable", ".git", "dist", "build", "__pycache__", "venv", ".venv"}
AUX = {"PRODUCT.md", "DESIGN.md", "DESIGN.json"}   # archivos de trabajo de algunas skills: se publican aparte


def archivos(carpeta: Path, entrada: set):
    for p in sorted(carpeta.rglob("*")):
        rel = p.relative_to(carpeta)
        if p.is_dir() or any(x in IGNORAR or x.startswith(".") for x in rel.parts) or rel.name in ("package-lock.json", "yarn.lock", "pnpm-lock.yaml"):
            continue
        if str(rel) in entrada and p.read_bytes() == (AQUI / ID / "entrada" / rel).read_bytes():
            continue   # archivo de entrada sin cambios
        yield rel


def a_png(origen: Path, destino: Path, prefijo: str):
    """Documento de Office o PDF → PNG por página. Devuelve las rutas relativas."""
    with tempfile.TemporaryDirectory() as tmp:
        pdf = origen
        if origen.suffix.lower() != ".pdf":
            # Planillas: cada hoja entera en una sola página (si no, la impresión la parte y parece desordenada)
            filtro = 'pdf:calc_pdf_Export:{"SinglePageSheets":{"type":"boolean","value":"true"}}' if origen.suffix.lower() in (".xlsx", ".xls", ".ods") else "pdf"
            subprocess.run(["soffice", "--headless", "--convert-to", filtro, "--outdir", tmp, str(origen)], check=True, capture_output=True, timeout=180)
            pdf = Path(tmp) / (origen.stem + ".pdf")
        subprocess.run(["pdftoppm", "-png", "-r", "110", "-l", "12", str(pdf), str(destino / prefijo)], check=True, timeout=180)
    return sorted(p.name for p in destino.glob(prefijo + "*.png"))


def publicar_lado(lado: str, base: Path, dest: Path, entrada: set):
    src = base / lado
    salida = []
    for rel in archivos(src, entrada):
        p = src / rel
        destino = dest / lado / rel
        destino.parent.mkdir(parents=True, exist_ok=True)
        ext = p.suffix.lower()
        item = {"nombre": str(rel), "ruta": f"{lado}/{rel}", "aux": rel.name in AUX}
        if ext == ".html":
            html = p.read_text(encoding="utf-8", errors="replace")
            if "noindex" not in html:
                html = re.sub(r"<head([^>]*)>", r'<head\1>\n<meta name="robots" content="noindex"><!-- Experimento del Lab de Programación: salida de Claude sin cambios de diseño -->', html, count=1, flags=re.I)
            destino.write_text(html, encoding="utf-8")
            item["tipo"] = "pagina"
        elif ext in (".md", ".txt"):
            shutil.copy2(p, destino)
            texto = p.read_text(encoding="utf-8", errors="replace")
            # Encabezado YAML (skills): se muestra como bloque de código, no como texto suelto
            texto = re.sub(r"\A---\n(.*?)\n---\n", lambda m: "```yaml\n" + m.group(1) + "\n```\n", texto, flags=re.S)
            # Una lista pegada al párrafo anterior (sin línea en blanco) se lee como texto corrido: se separa
            texto = re.sub(r"(?m)^((?![ \t]*(?:[-*+]|\d+\.)[ \t]).+)\n(?=[ \t]*(?:[-*+]|\d+\.)[ \t])", r"\1\n\n", texto)
            frag = destino.with_name(destino.name + ".html")
            frag.write_text(markdown.markdown(texto, extensions=["tables", "fenced_code"]), encoding="utf-8")
            item.update(tipo="texto", vista=f"{lado}/{rel}.html")
        elif ext in (".xlsx", ".pptx", ".docx", ".pdf"):
            shutil.copy2(p, destino)
            try:
                pngs = a_png(p, destino.parent, destino.stem + "-p")
                item.update(tipo="documento", paginas=[f"{lado}/{rel.parent / n}" if str(rel.parent) != "." else f"{lado}/{n}" for n in pngs])
            except Exception as e:
                item.update(tipo="descarga", error=str(e)[:120])
        elif ext in (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"):
            shutil.copy2(p, destino)
            item.update(tipo="imagen", paginas=[f"{lado}/{rel}"])
        elif ext in (".js", ".jsx", ".ts", ".tsx", ".css", ".py", ".json", ".csv"):
            shutil.copy2(p, destino)
            item["tipo"] = "codigo"
        else:
            shutil.copy2(p, destino)
            item["tipo"] = "descarga"
        salida.append(item)
    # Si hay una página o documento en la raíz (lo que pidió el prompt), lo de las subcarpetas (el proyecto
    # fuente que armó para generarlo) queda como auxiliar
    if any("/" not in i["nombre"] and i["tipo"] in ("pagina", "documento", "imagen") for i in salida):
        for i in salida:
            if "/" in i["nombre"]: i["aux"] = True
    # Si generó un documento, los scripts que usó para armarlo son auxiliares (se publican pero no se muestran primero)
    if any(i["tipo"] in ("documento", "pagina", "imagen") for i in salida):
        for i in salida:
            if i["tipo"] == "codigo": i["aux"] = True
    return salida


def skills_usadas(session_id: str):
    """Skills que Claude cargó en la sesión, leídas de la transcripción (prueba de que el experimento es limpio)."""
    for f in (Path.home() / ".claude" / "projects").rglob(f"{session_id}.jsonl"):
        return sorted(set(re.findall(r'"skill":"([^"]+)"', f.read_text(encoding="utf-8", errors="replace"))))
    return None


def metricas(base: Path, lado: str):
    try:
        d = json.loads((base / f"{lado}.json").read_text(encoding="utf-8"))
    except Exception:
        return {"error": "sin datos de la corrida"}
    return {
        "skills": skills_usadas(d.get("session_id", "")),
        "segundos": round(d.get("duration_ms", 0) / 1000),
        "pasos": d.get("num_turns"),
        "costo": round(d.get("total_cost_usd") or 0, 2),
        "modelos": list((d.get("modelUsage") or {}).keys()),
        "resumen": (d.get("result") or "")[:4000],
        "error": d.get("is_error") or None,
    }


if __name__ == "__main__":
    ID = sys.argv[1]
    base = Path(sys.argv[sys.argv.index("--dir") + 1] if "--dir" in sys.argv else "/tmp/experimentos") / ID
    if not (base / "sin").exists():
        sys.exit(f"No encuentro {base}/sin")
    dest = OUT_BASE / ID
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    ent_dir = AQUI / ID / "entrada"
    entrada = {str(p.relative_to(ent_dir)) for p in ent_dir.rglob("*") if p.is_file()} if ent_dir.exists() else set()
    meta = {
        "id": ID,
        "fecha": date.today().strftime("%d/%m/%Y"),
        "prompt": (AQUI / ID / "prompt.txt").read_text(encoding="utf-8").strip(),
        "entrada": sorted(entrada),
        "sin": {**metricas(base, "sin"), "archivos": publicar_lado("sin", base, dest, entrada)},
        "con": {**metricas(base, "con"), "archivos": publicar_lado("con", base, dest, entrada)},
    }
    for f in entrada:   # la entrada también se publica, para ver de qué partieron las dos
        (dest / "entrada" / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ent_dir / f, dest / "entrada" / f)
    (dest / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{ID}: sin {len(meta['sin']['archivos'])} archivos · con {len(meta['con']['archivos'])} archivos → {dest}")

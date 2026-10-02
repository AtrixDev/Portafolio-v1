#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regenera docs/lab/revision-completa.csv desde frontend/data/lab (una fila por ficha, con link y columnas para decidir)."""
import json, glob, csv
from pathlib import Path
R = Path(__file__).resolve().parent.parent; D = R / "frontend/data/lab/"
ev = {e["id"]: e for e in json.load(open(D / "evidencias.json", encoding="utf-8"))}
fich = []
for f in glob.glob(str(D / "*.json")):
    b = Path(f).stem
    if b in ("index", "rubros", "evidencias", "relaciones", "legacy-ids", "taxonomia"): continue
    d = json.load(open(f, encoding="utf-8")); fich += d if isinstance(d, list) else list(d.get("fichas", d).values())
orden = {"arquetipo de web": 0, "proyecto web": 1, "herramienta propia": 1, "funcionalidad": 2, "por rubro": 3, "skill": 4, "servicio": 5, "stack": 5, "arquitectura": 6, "estilo visual": 7, "patrón de página": 8, "patrón de panel": 9, "regla UX": 10, "par de fuentes": 11}
fich.sort(key=lambda x: (orden.get(x["subtipo"], 12), x["nombre"]))
def mejor(x):
    k = [ev[e]["tipo"] for e in x.get("evidencias", []) if e in ev]
    for t, l in (("proyecto", "Proyecto real"), ("experimento", "Experimento"), ("demo", "Demo"), ("ejemplo", "Ejemplo de terceros"), ("maqueta", "Maqueta")):
        if t in k: return l
    return "Sin ejemplo"
with open(R / "docs/lab/revision-completa.csv", "w", newline="", encoding="utf-8-sig") as fh:
    w = csv.writer(fh); w.writerow(["Área", "Subtipo", "Nombre", "Valor", "¿Valor confirmado?", "Texto", "Mejor evidencia", "Link", "Tu decisión (OK / Cambiar)", "Qué cambiar"])
    for x in fich:
        w.writerow([", ".join(x["areas"]), x["subtipo"], x["nombre"], (x["valor"] or "—").capitalize() if x["valor"] else "—", "Sí" if x["valor_estado"] == "validado" else ("No (propuesta)" if x["valor"] else "No aplica"),
                    "En revisión" if x.get("nucleo_borrador") else ("Original" if x.get("nucleo") else "Sin texto"), mejor(x), "https://portafolio-v1-dun-ten.vercel.app/programacion.html#/f/" + x["id"], "", ""])
print(len(fich), "filas")

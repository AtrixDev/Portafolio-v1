#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Arma la carpeta .deploy/ lista para publicar en Vercel:
  public/  ← frontend/   (la web estática)
  api/     ← backend/api/ (funciones serverless: /api/audit, /api/contact, /api/ml…)
  lib/     ← backend/lib/
  package.json (dependencias + Node 20)
Uso:  python3 tools/build-deploy.py   y después, desde .deploy/:  vercel deploy --prod
(la primera vez: vercel link --yes --project portafolio-v1)
"""
import json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = ROOT / ".deploy"
# El proyecto portafolio-v1 de Vercel tiene "Root Directory" = dariocolangelo-portfolio/v2 (del repo viejo):
# armamos esa misma ruta para no tener que cambiar la configuración del proyecto.
SUBDIR = "dariocolangelo-portfolio/v2"
OUT = BASE / SUBDIR
# Se regenera todo menos .vercel/ (el vínculo con el proyecto)
BASE.mkdir(exist_ok=True)
for item in BASE.iterdir():
    if item.name == ".vercel": continue
    shutil.rmtree(item) if item.is_dir() else item.unlink()
OUT.mkdir(parents=True)
(BASE / ".vercelignore").write_text(".env*\n")

shutil.copytree(ROOT / "frontend", OUT / "public", ignore=shutil.ignore_patterns("package-lock.json"))
shutil.copytree(ROOT / "backend" / "api", OUT / "api")
shutil.copytree(ROOT / "backend" / "lib", OUT / "lib")
pkg = json.loads((ROOT / "backend" / "package.json").read_text())
pkg.pop("scripts", None)
(OUT / "package.json").write_text(json.dumps(pkg, indent=2) + "\n")
NO_STORE = [{"key": "Cache-Control", "value": "no-store"}]
(OUT / "vercel.json").write_text(json.dumps({
    "framework": None, "cleanUrls": False, "trailingSlash": False,
    "headers": [
        {"source": "/admin.html", "headers": NO_STORE},
        {"source": "/(css|js)/(admin|tracker-app).(.*)", "headers": NO_STORE},
    ],
    # ML Tracker: la sincronización puede tardar; el cron la corre todos los días a las 7 (hora argentina)
    "functions": {"api/tracker.js": {"maxDuration": 60}},
    "crons": [{"path": "/api/tracker?action=cron", "schedule": "0 10 * * *"}],
}, indent=2) + "\n")
files = sum(1 for _ in OUT.rglob("*") if _.is_file())
print(f"Listo: {files} archivos en {OUT}")

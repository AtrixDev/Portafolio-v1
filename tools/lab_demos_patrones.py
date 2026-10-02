#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demos de patrones de página y de panel. A diferencia de los estilos, acá cambia la ESTRUCTURA: la misma oferta (Plata, una app de finanzas inventada)
armada sin el patrón (dispersa) y con el patrón. Son demos hechas para la ficha, con datos inventados.
Salida: frontend/prog-ejemplos/patrones/<id>.html y _sin-patron.html.  Uso: python3 tools/lab_demos_patrones.py
"""
from pathlib import Path
OUT = Path(__file__).resolve().parent.parent / "frontend" / "prog-ejemplos" / "patrones"

HEAD = """<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plata · @T@</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"><style>
*{box-sizing:border-box;margin:0}body{font-family:Manrope,system-ui,sans-serif;color:#1a1d29;background:#f6f7fb;line-height:1.5}
a{color:inherit;text-decoration:none}.b{display:inline-block;padding:10px 18px;border-radius:8px;font-weight:700;font-size:14px;background:#2f5bea;color:#fff;border:0;cursor:pointer;font-family:inherit}
.b.o{background:#fff;color:#1a1d29;border:1px solid #cfd4e2}.b.g{background:#12a150}.b.r{background:#e8453c}
@CSS@</style></head><body>
"""

def head(t, css): return HEAD.replace('@T@', t).replace('@CSS@', css)

# ───────── Sin patrón: todo compite ─────────
SIN = head("Sin patrón", """
.top{background:#1a1d29;color:#fff;font-size:12px;text-align:center;padding:6px}
nav{display:flex;align-items:center;gap:18px;padding:12px 28px;background:#fff;border-bottom:1px solid #e1e4ee;font-size:13px;flex-wrap:wrap}nav b{font-size:20px;margin-right:8px}nav a{color:#575d70}nav .b{margin-left:auto}
.w{max-width:1100px;margin:0 auto;padding:24px 28px}
.hero{display:grid;grid-template-columns:1fr 1fr;gap:26px;align-items:start}
h1{font-size:34px;line-height:1.1}h2{font-size:20px;margin:0 0 8px}
.row{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
.card{background:#fff;border:1px solid #e1e4ee;border-radius:10px;padding:16px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
.banner{background:#fff3c4;border:1px solid #f0d874;border-radius:10px;padding:12px 16px;margin:16px 0;display:flex;justify-content:space-between;align-items:center;gap:10px}
.news{background:#eaf0ff;border-radius:10px;padding:16px;margin-top:20px}.news input{padding:9px;border:1px solid #bcc5e0;border-radius:6px;margin-right:6px}
.small{font-size:13px;color:#575d70}
footer{margin-top:30px;padding:20px 28px;background:#1a1d29;color:#aab;font-size:12px;display:flex;gap:20px;flex-wrap:wrap}
@media(max-width:860px){.hero,.grid{grid-template-columns:1fr}}
""") + """<div class="top">Envío de novedades · Blog · Prensa · Trabajá con nosotros · Ayuda</div>
<nav><b>Plata</b><a>Cuentas</a><a>Tarjetas</a><a>Préstamos</a><a>Inversiones</a><a>Seguros</a><a>Blog</a><a>Nosotros</a><a>Ayuda</a><a class="b o">Ingresar</a><a class="b">Abrir cuenta</a><a class="b g">Descargar app</a></nav>
<div class="w"><section class="hero"><div><h1>La plataforma financiera integral para tu día a día</h1>
<p class="small" style="margin:10px 0">Plata reúne cuentas, tarjetas, préstamos, inversiones y seguros en un ecosistema pensado para que gestiones tus finanzas personales de manera simple, segura y eficiente, con herramientas de análisis y alertas inteligentes.</p>
<div class="row"><a class="b">Abrir cuenta</a><a class="b o">Ver planes</a><a class="b g">Descargar app</a><a class="b o">Hablar con ventas</a><a class="b r">Promo</a></div></div>
<div class="card"><h2>Ya tengo cuenta</h2><p class="small">Ingresá con tu usuario</p><div class="row"><input placeholder="Usuario" style="padding:9px;border:1px solid #cfd4e2;border-radius:6px"><a class="b o">Ingresar</a></div></div></section>
<div class="banner"><span><b>¡Promo de lanzamiento!</b> Beneficios exclusivos por tiempo limitado en tarjetas y préstamos.</span><a class="b r">Ver promo</a></div>
<div class="grid"><div class="card"><h2>Cuentas</h2><p class="small">Cuenta gratuita con múltiples beneficios.</p><a class="b o">Ver más</a></div><div class="card"><h2>Tarjetas</h2><p class="small">Crédito y débito con cuotas.</p><a class="b o">Ver más</a></div><div class="card"><h2>Préstamos</h2><p class="small">Tasas competitivas y sin vueltas.</p><a class="b o">Ver más</a></div><div class="card"><h2>Inversiones</h2><p class="small">Distintos instrumentos.</p><a class="b o">Ver más</a></div><div class="card"><h2>Seguros</h2><p class="small">Protegé lo que importa.</p><a class="b o">Ver más</a></div><div class="card"><h2>Blog</h2><p class="small">Novedades y consejos.</p><a class="b o">Leer</a></div></div>
<div class="news"><h2>Suscribite a nuestro newsletter</h2><input placeholder="Tu email"><a class="b">Suscribirme</a> <a class="b o">Seguinos en redes</a></div></div>
<footer><span>Plata S.A.</span><span>Términos</span><span>Privacidad</span><span>Defensa del consumidor</span><span>Contacto</span><span>Sucursales</span></footer></body></html>
"""

# ───────── Con el patrón: todo empuja a una sola acción ─────────
CONV = head("Optimizado para conversión", """
body{background:#fff}
header{display:flex;justify-content:space-between;align-items:center;max-width:1000px;margin:0 auto;padding:18px 24px}header b{font-size:21px;letter-spacing:-.02em}header span{font-size:13px;color:#575d70}
.w{max-width:1000px;margin:0 auto;padding:10px 24px 50px;display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center}
.k{display:inline-block;font-size:12px;font-weight:700;color:#12804a;background:#e4f6ec;padding:5px 11px;border-radius:99px;margin-bottom:16px}
h1{font-size:50px;line-height:1.02;letter-spacing:-.04em;font-weight:800}
.lead{font-size:18px;color:#575d70;margin:16px 0 20px;max-width:40ch}
ul.v{list-style:none;padding:0;display:grid;gap:9px;margin-bottom:22px}ul.v li{display:flex;gap:10px;font-size:15.5px;font-weight:600}ul.v li::before{content:"✓";color:#12a150;font-weight:800}
.proof{display:flex;align-items:center;gap:12px;font-size:13.5px;color:#575d70}.av{display:flex}.av i{width:30px;height:30px;border-radius:50%;border:2px solid #fff;margin-left:-8px;background:#cdd5f5}.av i:nth-child(2){background:#f5d5cd}.av i:nth-child(3){background:#cdeedd}.av i:first-child{margin-left:0}
form{background:#fff;border:1px solid #dfe3f0;border-radius:18px;padding:28px;box-shadow:0 22px 50px rgba(30,45,120,.14)}
form h2{font-size:22px;letter-spacing:-.02em;margin-bottom:4px}form p{font-size:14px;color:#575d70;margin-bottom:18px}
label{display:block;font-size:13px;font-weight:700;margin-bottom:6px}input{width:100%;padding:13px 14px;border:1.5px solid #cfd4e2;border-radius:10px;font:inherit;font-size:15px;margin-bottom:14px}input:focus{outline:3px solid #cdd9ff;border-color:#2f5bea}
.cta{width:100%;padding:16px;font-size:16px;border-radius:12px;background:#12a150;box-shadow:0 10px 24px rgba(18,161,80,.3)}.cta:hover{background:#0e8a43}
.fine{display:flex;justify-content:center;gap:16px;margin-top:14px;font-size:12.5px;color:#575d70}
.sec{max-width:1000px;margin:0 auto;padding:0 24px 40px;text-align:center;color:#575d70;font-size:13px;border-top:1px solid #eceef6;padding-top:22px;display:flex;justify-content:center;gap:26px;flex-wrap:wrap}.sec b{color:#1a1d29}
@media(max-width:860px){.w{grid-template-columns:1fr;gap:28px}h1{font-size:38px}}
""") + """<header><b>Plata</b><span>¿Ya tenés cuenta? <a href="#" style="text-decoration:underline;color:#2f5bea">Ingresá</a></span></header>
<main class="w"><section><span class="k">Gratis · sin tarjeta · en 2 minutos</span>
<h1>Tu plata, a la vista y en orden.</h1><p class="lead">Juntá tus cuentas y mirá cuánto te queda en el mes, sin planillas.</p>
<ul class="v"><li>Todas tus cuentas y tarjetas en una pantalla</li><li>Tus gastos se ordenan solos por categoría</li><li>Metas de ahorro con fecha</li></ul>
<div class="proof"><div class="av" aria-hidden="true"><i></i><i></i><i></i></div><span><b>12.400 personas</b> ya ordenaron su plata con Plata</span></div></section>
<form onsubmit="return false"><h2>Creá tu cuenta gratis</h2><p>Solo necesitamos tu email.</p><label for="e">Tu email</label><input id="e" type="email" placeholder="nombre@correo.com" autocomplete="email"><button class="b cta" type="submit">Empezar gratis</button>
<div class="fine"><span>🔒 Datos cifrados</span><span>Sin letra chica</span><span>Cancelás cuando quieras</span></div></form></main>
<div class="sec"><span><b>Seguridad bancaria</b> · Datos cifrados</span><span><b>Soporte</b> por chat, de lunes a sábado</span><span><b>4,8 ★</b> en las tiendas de apps</span></div></body></html>
"""

PATRONES = {
    ("estilos", "conversion-optimized"): dict(
        html=CONV, titulo="Optimizado para conversión",
        antes="Sin el patrón: la oferta vive en una página donde compiten cinco botones del mismo peso, tres menús, una promo y un login.",
        cambia="Se quita todo lo que no ayuda a una sola acción. Queda una columna con la promesa, tres beneficios, una prueba social y un formulario con un único campo y un único botón destacado. El menú se reduce a «Ingresá», y bajo el botón van las dudas típicas (gratis, sin tarjeta, cancelás cuando quieras)."),
}

import json, sys
sys.path.insert(0, str(Path(__file__).resolve().parent))
import lab_demos_patrones_lib as LIB

def _nombres():
    src = OUT.parent.parent / "data" / "weblab"; out = {}
    for f in ("estilos", "landing"):
        d = json.load(open(src / f"{f}.json", encoding="utf-8")); it = d if isinstance(d, list) else d.get("items", list(d.values()))
        for e in it: out[(f, e["id"])] = e["name"]
    return out

_N = _nombres()
for (col, pid), d in LIB.build_extra().items():
    d["titulo"] = _N.get((col, pid), d["titulo"]); PATRONES[(col, pid)] = d

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "_sin-patron.html").write_text(SIN, encoding="utf-8")
    (OUT / "_sin-panel.html").write_text(LIB.SIN_PANEL, encoding="utf-8")
    for (col, i), d in PATRONES.items(): (OUT / f"{i}.html").write_text(d["html"], encoding="utf-8")
    print(f"OK · {len(PATRONES)} demos de patrones + _sin-patron.html en {OUT}")

if __name__ == "__main__": main()

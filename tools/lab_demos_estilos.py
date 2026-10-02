#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Demos "mismo contenido, sin estilo y con estilo" de los estilos visuales (como la de Glassmorphism).

Todas las demos comparten la misma página (una landing de "Plata", una app de finanzas personales inventada) y el mismo texto:
solo cambia el estilo. La versión "sin estilo" es una página plana y neutra (_plano.html). Son demos hechas para la ficha, no proyectos reales.

Salida: frontend/prog-ejemplos/estilos/<id>.html y _plano.html. Uso: python3 tools/lab_demos_estilos.py
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "frontend" / "prog-ejemplos" / "estilos"

BASE = """*{box-sizing:border-box;margin:0}
:root{--bg:#eef0f4;--card:#fff;--card2:#e4e7ee;--edge:#d5d9e2;--ink:#1a1d29;--ink2:#575d70;--acc:#2f5bea;--accink:#fff;--r:14px;--rb:8px;--font:Manrope,system-ui,sans-serif}
body{min-height:100vh;font-family:var(--font);color:var(--ink);background:var(--bg);overflow-x:hidden;position:relative}
.bg{display:none}
:where(.g){background:var(--card);border:1px solid var(--edge);border-radius:var(--r)}
.w{position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:22px 28px 60px}
nav{display:flex;align-items:center;justify-content:space-between;padding:12px 18px}
nav b{font-weight:800;font-size:20px;letter-spacing:-.02em}
nav ul{display:flex;gap:26px;list-style:none;padding:0;font-size:14px;font-weight:500;color:var(--ink2)}
.btn{display:inline-block;padding:11px 20px;border-radius:var(--rb);font-weight:700;font-size:14px;color:var(--accink);background:var(--acc);text-decoration:none}
.btn.s{background:var(--card);color:var(--ink);border:1px solid var(--edge)}
.hero{display:grid;grid-template-columns:1.05fr 1fr;gap:40px;align-items:center;padding:70px 0 40px}
h1{font-size:62px;line-height:1.02;font-weight:800;letter-spacing:-.04em}
.lead{margin:20px 0 28px;font-size:18px;line-height:1.55;color:var(--ink2);max-width:44ch}
.row{display:flex;gap:12px}
.stack{position:relative;height:420px}
.card{position:absolute;padding:22px}
.c1{inset:0 40px 70px 0;display:grid;align-content:space-between}
.c1 small{color:var(--ink2);font-size:13px;font-weight:600}
.c1 .n{font-size:44px;font-weight:800;letter-spacing:-.03em;margin-top:4px}
.bars{display:flex;align-items:flex-end;gap:10px;height:120px}
.bars i{flex:1;border-radius:4px 4px 0 0;background:var(--acc)}
.c2{right:0;bottom:0;width:260px;padding:16px 18px;display:grid;gap:10px}
.t{display:flex;justify-content:space-between;font-size:14px;font-weight:600}
.t span{color:var(--ink2);font-weight:500}
.pills{display:flex;gap:10px;flex-wrap:wrap;margin-top:34px}
.pills span{padding:9px 16px;border-radius:var(--rb);background:var(--card2);border:1px solid var(--edge);font-size:13.5px;font-weight:600}
.feat{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:40px}
.feat div{padding:24px;background:var(--card)}
.feat h3{font-size:19px;font-weight:700;margin-bottom:8px;letter-spacing:-.01em}
.feat p{font-size:15px;line-height:1.5;color:var(--ink2)}
@media(max-width:860px){.hero,.feat{grid-template-columns:1fr}h1{font-size:44px}nav ul{display:none}}
"""

PAGE = """<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plata · {titulo}</title>
<link href="https://fonts.googleapis.com/css2?{fuentes}&display=swap" rel="stylesheet">
<style>
{base}
{css}
</style></head><body>
{top}<div class="bg" aria-hidden="true"><i></i><i></i><i></i></div>
<div class="w" id="main">
<nav class="g"><b>Plata</b><ul><li>Cuentas</li><li>Gastos</li><li>Ahorro</li><li>Ayuda</li></ul><a class="btn" href="#">Abrir mi cuenta</a></nav>
<section class="hero"><div><h1>Tu plata, a la vista y en orden.</h1><p class="lead">Juntá tus cuentas, seguí tus gastos del mes y fijate cuánto te queda, sin planillas ni vueltas.</p>
<div class="row"><a class="btn" href="#">Empezar gratis</a><a class="btn s" href="#">Ver cómo funciona</a></div>
<div class="pills"><span>Pagos con QR</span><span>Alertas de gastos</span><span>Metas de ahorro</span></div></div>
<div class="stack"><div class="card g c1"><div><small>Disponible este mes</small><div class="n">$ 842.300</div></div><div class="bars" aria-hidden="true"><i style="height:48%"></i><i style="height:72%"></i><i style="height:40%"></i><i style="height:88%"></i><i style="height:62%"></i><i style="height:100%"></i></div></div>
<div class="card g c2"><div class="t">Supermercado <span>− $ 48.900</span></div><div class="t">Sueldo <span>+ $ 1.250.000</span></div><div class="t">Alquiler <span>− $ 420.000</span></div></div></div></section>
<section class="feat"><div class="g"><h3>Todo en una pantalla</h3><p>Tus cuentas y tarjetas juntas, con el saldo real de cada una.</p></div><div class="g"><h3>Gastos sin cargar nada</h3><p>Se ordenan solos por categoría. Vos solo mirás.</p></div><div class="g"><h3>Metas con fecha</h3><p>Decís cuánto y para cuándo; te avisa si vas bien.</p></div></section>
</div>
{bottom}{js}</body></html>
"""

# Mucho de lo que sigue se repite entre estilos: fondos animados, etc.
ORBS_ANIM = """.bg{display:block;position:fixed;inset:0;overflow:hidden;z-index:0}
.bg i{position:absolute;border-radius:50%;animation:drift 18s ease-in-out infinite alternate}
@keyframes drift{to{transform:translate(8vmax,5vmax) scale(1.12)}}
@media(prefers-reduced-motion:reduce){.bg i{animation:none}}
"""

# Cada estilo: fuentes (query de Google Fonts), css, y opcionalmente top/bottom (HTML extra) y js.
# "cambia" dice en una frase qué se ve distinto; es el texto que acompaña a la demo en la ficha.
STYLES = {}

STYLES["dark-mode-oled"] = dict(
    titulo="Modo oscuro (OLED)", fuentes="family=Manrope:wght@400;500;600;700;800",
    cambia="Fondo negro puro (#000), superficies casi negras separadas por líneas finas y un solo color de acento. Pocas sombras y mucho contraste: se descansa la vista y las pantallas OLED apagan esos píxeles.",
    css=""":root{--bg:#000;--card:#09090b;--card2:#111114;--edge:#1c1c21;--ink:#f4f4f6;--ink2:#9b9ba6;--acc:#5eead4;--accink:#00110d;--r:16px;--rb:999px}
.btn{box-shadow:0 0 28px rgba(94,234,212,.28)}
.btn.s{background:transparent;color:var(--ink);border-color:#2a2a31;box-shadow:none}
.bars i{background:linear-gradient(#5eead4,#14b8a6)}
.pills span{background:#0f0f12;border-color:#222228;color:#d6d6dc}
.t span{color:#8b8b96}
.c1 .n{color:#fff}""")

STYLES["minimalism-swiss-style"] = dict(
    titulo="Minimalismo y estilo suizo", fuentes="family=Inter:wght@400;500;600;700",
    cambia="Blanco y negro, líneas finas en lugar de cajas, sin bordes redondeados, textos alineados a la izquierda y rótulos en mayúsculas chicas. Una sola pizca de rojo marca lo importante.",
    css=""":root{--bg:#fff;--card:#fff;--card2:transparent;--edge:#111;--ink:#111;--ink2:#555;--acc:#111;--accink:#fff;--r:0;--rb:0;--font:Inter,system-ui,sans-serif}
.g{border:0;border-top:2px solid #111;background:#fff}
nav{border-top:0;border-bottom:2px solid #111;padding:14px 0}
nav ul{gap:34px;text-transform:uppercase;letter-spacing:.09em;font-size:12px}
h1{font-weight:700;letter-spacing:-.05em}
.card.g{border:1px solid #111}
.bars i{border-radius:0;background:#111}.bars i:last-child{background:#e30613}
.pills{gap:22px}.pills span{background:none;border:0;border-top:1px solid #111;border-radius:0;padding:9px 0 0;text-transform:uppercase;letter-spacing:.09em;font-size:11px}
.btn.s{background:#fff;border:1px solid #111}
.feat{gap:26px}.feat .g{padding:18px 0 0}""")

STYLES["swiss-modernism-2-0"] = dict(
    titulo="Modernismo suizo 2.0", fuentes="family=Space+Grotesk:wght@400;500;700",
    cambia="La grilla suiza con más carácter: columnas a la vista, titular enorme en mayúsculas, un naranja fuerte en bloques sólidos y secciones numeradas.",
    css=""":root{--bg:#f3f1ec;--card:transparent;--card2:transparent;--edge:#111;--ink:#111;--ink2:#444;--acc:#ff4d00;--accink:#111;--r:0;--rb:0;--font:'Space Grotesk',system-ui,sans-serif}
body{background-image:repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 1px,transparent 1px calc(100%/12))}
.g{border:0;background:none}
nav{border-bottom:3px solid #111;padding:14px 0}
nav b{font-size:24px;letter-spacing:-.04em;text-transform:uppercase}
nav ul{text-transform:uppercase;font-weight:700;letter-spacing:.06em;font-size:12px}
h1{font-size:78px;text-transform:uppercase;line-height:.92;letter-spacing:-.05em;font-weight:700}
h1::after{content:".";color:#ff4d00}
.btn{border:2px solid #111;font-weight:700}.btn.s{background:transparent;border:2px solid #111}
.c1{background:#ff4d00;border:2px solid #111;color:#111}.c1 small{color:#111}.bars i{background:#111;border-radius:0}
.c2{background:#fff;border:2px solid #111}
.pills span{border:2px solid #111;background:#fff;border-radius:0}
.feat{counter-reset:n;gap:0;border-top:3px solid #111}
.feat .g{counter-increment:n;border-left:1px solid #111;padding:22px 22px 8px}.feat .g:first-child{border-left:0;padding-left:0}
.feat .g::before{content:"0" counter(n);display:block;font-size:44px;font-weight:700;color:#ff4d00;letter-spacing:-.05em;margin-bottom:6px}""")

STYLES["exaggerated-minimalism"] = dict(
    titulo="Minimalismo exagerado", fuentes="family=Inter+Tight:wght@400;500;600;800",
    cambia="Casi todo desaparece y un solo elemento manda: el titular, enorme. Mucho espacio vacío, sin cajas ni bordes, texto de apoyo diminuto y contraste total.",
    css=""":root{--bg:#f7f5f0;--card:transparent;--card2:transparent;--edge:transparent;--ink:#0a0a0a;--ink2:#6b6b6b;--acc:#0a0a0a;--accink:#f7f5f0;--r:0;--rb:999px;--font:'Inter Tight',system-ui,sans-serif}
.g{border:0;background:none}
nav{padding:0 0 8px}nav b{font-size:15px}nav ul{font-size:12px;gap:18px}
.hero{grid-template-columns:1.5fr .7fr;padding:70px 0 40px;align-items:end}
h1{font-size:120px;line-height:.88;letter-spacing:-.055em;word-spacing:.1em;font-weight:800;max-width:8ch}
.lead{font-size:14px;color:#6b6b6b;max-width:28ch}
.btn{padding:9px 16px;font-size:12px}.btn.s{background:none;border:0;padding-left:0;text-decoration:underline}
.pills{margin-top:20px}.pills span{background:none;border:0;padding:0;color:#6b6b6b;font-size:12px;font-weight:500}.pills span+span::before{content:"/ ";margin-left:4px}
.stack{height:300px}.c1{inset:0 40px 100px 0;padding:0}.c1 .n{font-size:28px}.bars{height:54px}.bars i{background:#0a0a0a;border-radius:0}
.c2{width:200px;padding:0;gap:6px}.t{font-size:12px}
.feat{margin-top:90px;gap:60px}.feat .g{padding:0}.feat h3{font-size:13px;font-weight:600}.feat p{font-size:12.5px}""")

STYLES["neubrutalism"] = dict(
    titulo="Neobrutalismo", fuentes="family=Space+Grotesk:wght@500;700",
    cambia="Bordes negros gruesos, sombras duras sin desenfoque, colores planos y vivos, y botones que se aplastan al apretarlos. Se ve juguetón y muy legible.",
    css=""":root{--bg:#fff3c4;--card:#fff;--card2:#fde047;--edge:#000;--ink:#000;--ink2:#222;--acc:#ff5c8a;--accink:#000;--r:12px;--rb:10px;--font:'Space Grotesk',system-ui,sans-serif}
.g{border:3px solid #000;box-shadow:6px 6px 0 #000}
nav{background:#a3e635}
.btn{border:3px solid #000;box-shadow:4px 4px 0 #000;font-weight:700;transition:transform .12s,box-shadow .12s}
.btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #000}.btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 #000}
.btn.s{background:#fff}
h1{font-weight:700;letter-spacing:-.045em}
.pills span{border:2px solid #000;box-shadow:3px 3px 0 #000}.pills span:nth-child(2){background:#93c5fd}.pills span:nth-child(3){background:#86efac}
.c1{background:#c4b5fd}.bars i{border:2px solid #000;border-radius:0;background:#ff5c8a}
.feat .g:nth-child(1){background:#bef264}.feat .g:nth-child(2){background:#fda4af}.feat .g:nth-child(3){background:#7dd3fc}""")

STYLES["aurora-ui"] = dict(
    titulo="Aurora UI", fuentes="family=Plus+Jakarta+Sans:wght@400;500;600;700;800",
    cambia="El fondo es el protagonista: grandes manchas de color que se mezclan y se mueven despacio, como una aurora, detrás de tarjetas oscuras muy discretas. El titular lleva el mismo degradé.",
    css=ORBS_ANIM + """:root{--bg:#050816;--card:rgba(255,255,255,.045);--card2:rgba(255,255,255,.06);--edge:rgba(255,255,255,.1);--ink:#f1f5ff;--ink2:#a5b0cc;--acc:#a78bfa;--accink:#0b0820;--r:20px;--rb:999px;--font:'Plus Jakarta Sans',system-ui,sans-serif}
.bg i{width:70vmax;height:70vmax;filter:blur(90px);opacity:.55;mix-blend-mode:screen}
.bg i:nth-child(1){background:radial-gradient(circle,#22d3ee,transparent 62%);top:-32vmax;left:-12vmax}
.bg i:nth-child(2){background:radial-gradient(circle,#8b5cf6,transparent 62%);top:-12vmax;right:-22vmax;animation-delay:-6s}
.bg i:nth-child(3){background:radial-gradient(circle,#34d399,transparent 62%);bottom:-38vmax;left:18vmax;animation-delay:-12s}
h1{background:linear-gradient(95deg,#a5f3fc,#c4b5fd 50%,#6ee7b7);-webkit-background-clip:text;background-clip:text;color:transparent}
.btn{background:linear-gradient(95deg,#67e8f9,#a78bfa);box-shadow:0 8px 30px rgba(167,139,250,.35)}
.btn.s{background:rgba(255,255,255,.06);color:var(--ink);box-shadow:none}
.bars i{background:linear-gradient(#67e8f9,#a78bfa)}.pills span{color:#dbe4ff}""")

STYLES["gradient-mesh-aurora-evolved"] = dict(
    titulo="Mesh gradient / aurora evolucionada", fuentes="family=DM+Sans:wght@400;500;600;700",
    cambia="Un fondo de degradés pastel superpuestos con un toque de grano, tarjetas de vidrio claro y un botón con degradé tornasolado. Colorido pero luminoso, ideal para destacar una sección.",
    css=""":root{--bg:#fdf6ff;--card:rgba(255,255,255,.58);--card2:rgba(255,255,255,.7);--edge:rgba(255,255,255,.95);--ink:#241b3a;--ink2:#5f5678;--acc:#7c3aed;--accink:#fff;--r:24px;--rb:999px;--font:'DM Sans',system-ui,sans-serif}
.bg{display:block;position:fixed;inset:0;z-index:0;background:radial-gradient(40% 50% at 12% 18%,#ffd1e6 0,transparent 70%),radial-gradient(45% 55% at 88% 10%,#c9deff 0,transparent 70%),radial-gradient(50% 60% at 72% 92%,#d3ffe4 0,transparent 70%),radial-gradient(40% 50% at 18% 88%,#fff0bf 0,transparent 70%),#fdf6ff}
.bg::after{content:"";position:absolute;inset:0;opacity:.22;mix-blend-mode:multiply;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.g{box-shadow:0 14px 44px rgba(124,92,214,.14);backdrop-filter:blur(10px)}
.btn{background:conic-gradient(from 210deg,#7c3aed,#ec4899,#f59e0b,#06b6d4,#7c3aed);box-shadow:0 8px 24px rgba(124,58,237,.3)}
.btn.s{background:rgba(255,255,255,.7);color:var(--ink);border-color:#fff}
.bars i{background:linear-gradient(#f0abfc,#7c3aed 55%,#06b6d4)}
.pills span{background:rgba(255,255,255,.7);border-color:#fff}""")

STYLES["liquid-glass"] = dict(
    titulo="Liquid Glass", fuentes="family=Manrope:wght@400;500;600;700;800",
    cambia="Vidrio que parece líquido: bordes muy redondeados, un reflejo curvo en la parte de arriba de cada pieza, brillo interior y formas que se deforman suavemente al pasar el mouse.",
    css=ORBS_ANIM + """:root{--bg:#1a1747;--card:rgba(255,255,255,.1);--card2:rgba(255,255,255,.1);--edge:rgba(255,255,255,.38);--ink:#fbfaff;--ink2:rgba(251,250,255,.8);--acc:#fff;--accink:#1a1033;--r:34px;--rb:999px}
body{background:linear-gradient(135deg,#1e1b4b,#312e81 38%,#0e7490 72%,#134e4a)}
.bg i{filter:blur(60px);opacity:.85}
.bg i:nth-child(1){width:520px;height:520px;background:#7c3aed;top:-120px;left:-80px}
.bg i:nth-child(2){width:460px;height:460px;background:#06b6d4;top:160px;right:-120px;animation-delay:-6s}
.bg i:nth-child(3){width:380px;height:380px;background:#f472b6;bottom:-100px;left:30%;animation-delay:-12s}
.g{background:linear-gradient(135deg,rgba(255,255,255,.24),rgba(255,255,255,.05));backdrop-filter:blur(26px) saturate(190%) brightness(1.08);-webkit-backdrop-filter:blur(26px) saturate(190%) brightness(1.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 0 -1px 0 rgba(255,255,255,.12),inset 0 0 32px rgba(255,255,255,.08),0 24px 54px rgba(0,0,0,.35);overflow:hidden;transition:border-radius .7s cubic-bezier(.2,.8,.2,1),transform .5s}
.g::before{content:"";position:absolute;top:0;left:8%;right:8%;height:45%;background:linear-gradient(rgba(255,255,255,.42),transparent);border-radius:0 0 50% 50%/0 0 100% 100%;opacity:.5;pointer-events:none}
.g:hover{border-radius:44px 26px 40px 30px/30px 44px 26px 40px}
.btn{background:linear-gradient(rgba(255,255,255,.95),rgba(255,255,255,.75));box-shadow:inset 0 1px 0 #fff,0 10px 26px rgba(255,255,255,.25)}
.btn.s{background:rgba(255,255,255,.14);color:var(--ink);border-color:rgba(255,255,255,.4);box-shadow:inset 0 1px 0 rgba(255,255,255,.5)}
.bars i{background:linear-gradient(#fff,rgba(255,255,255,.45));border-radius:8px}
.pills span{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.4)}""")

STYLES["soft-ui-evolution"] = dict(
    titulo="Evolución de Soft UI", fuentes="family=Plus+Jakarta+Sans:wght@400;500;600;700;800",
    cambia="Relieve suave de luz y sombra (como plástico moldeado), pero con textos más oscuros, bordes de foco claros y un acento azul que se lee bien. La calidez del neumorfismo sin su problema de contraste.",
    css=""":root{--bg:#e8ecf3;--card:#e8ecf3;--card2:#e8ecf3;--edge:transparent;--ink:#1e2a44;--ink2:#4c5b78;--acc:#3b5bdb;--accink:#fff;--r:24px;--rb:14px;--font:'Plus Jakarta Sans',system-ui,sans-serif}
.g{border:0;box-shadow:10px 10px 22px #c3c9d6,-10px -10px 22px #fff}
.btn{background:linear-gradient(145deg,#4a6cf0,#3250c8);box-shadow:6px 6px 14px #bfc6d4,-6px -6px 14px #fff;transition:box-shadow .15s,transform .15s}
.btn.s{background:#e8ecf3;color:var(--ink);border:0;box-shadow:6px 6px 14px #c3c9d6,-6px -6px 14px #fff}
.btn:active{box-shadow:inset 4px 4px 9px rgba(0,0,0,.28);transform:scale(.98)}
.btn:focus-visible{outline:3px solid #3b5bdb;outline-offset:3px}
.pills span{border:0;background:#e8ecf3;box-shadow:inset 3px 3px 7px #c3c9d6,inset -3px -3px 7px #fff}
.bars{padding:12px;border-radius:16px;box-shadow:inset 4px 4px 9px #c3c9d6,inset -4px -4px 9px #fff}
.bars i{background:linear-gradient(#5b7cfa,#3b5bdb);border-radius:8px}
.c2{box-shadow:10px 10px 22px #c3c9d6,-10px -10px 22px #fff}""")

STYLES["dimensional-layering"] = dict(
    titulo="Capas dimensionales", fuentes="family=Inter:wght@400;500;600;700;800",
    cambia="La profundidad se arma con capas: sombras en varios niveles, tarjetas inclinadas que se superponen y piezas que flotan a distinta altura. Lo que está más cerca se ve más importante.",
    css=""":root{--bg:#e9ecf5;--card:#fff;--card2:#f1f3fa;--edge:rgba(20,30,70,.06);--ink:#161a2c;--ink2:#555b74;--acc:#4338ca;--accink:#fff;--r:20px;--rb:12px;--font:Inter,system-ui,sans-serif}
body{background:linear-gradient(180deg,#f1f3fb,#dde2f1)}
.g{border:0;box-shadow:0 1px 1px rgba(20,30,70,.06),0 2px 4px rgba(20,30,70,.06),0 6px 12px rgba(20,30,70,.08),0 16px 32px rgba(20,30,70,.1),0 36px 64px rgba(20,30,70,.12)}
.stack{perspective:1300px;transform-style:preserve-3d}
.c1{transform:rotateX(7deg) rotateY(-12deg)}
.c2{transform:rotateX(7deg) rotateY(-12deg) translate(14px,-18px) translateZ(70px);box-shadow:0 2px 4px rgba(20,30,70,.08),0 12px 24px rgba(20,30,70,.14),0 40px 70px rgba(20,30,70,.22)}
.btn{box-shadow:0 2px 0 #2e2796,0 10px 20px rgba(67,56,202,.35)}
.btn.s{box-shadow:0 2px 0 #d3d8ea,0 8px 16px rgba(20,30,70,.08)}
.feat .g:nth-child(2){transform:translateY(-14px)}.feat .g:nth-child(3){transform:translateY(-28px)}
.pills span{box-shadow:0 2px 6px rgba(20,30,70,.1);border:0;background:#fff}""")

STYLES["bento-box-grid"] = dict(
    titulo="Grilla bento", fuentes="family=Inter:wght@400;500;600;700;800",
    cambia="Todo el contenido se reordena en tarjetas de distintos tamaños sobre una grilla, como las cajas de un bento. Cada pieza tiene su lugar y el tamaño indica la importancia.",
    css=""":root{--bg:#f5f5f7;--card:#fff;--card2:#f0f0f3;--edge:transparent;--ink:#1d1d1f;--ink2:#6e6e73;--acc:#0071e3;--accink:#fff;--r:28px;--rb:999px;--font:Inter,system-ui,sans-serif}
.w{display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:minmax(110px,auto);gap:14px;padding:22px}
.hero,.stack,.feat{display:contents}
nav{grid-column:1/-1;border-radius:22px}
.g{border:0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.hero>div:first-child{grid-column:1/4;grid-row:2/5;background:#fff;border-radius:28px;padding:38px;display:flex;flex-direction:column;justify-content:center}
h1{font-size:46px}.lead{font-size:16px}.pills{margin-top:22px}
.card{position:static}
.c1{grid-column:4/7;grid-row:2/4;background:#0b0b10;color:#fff}.c1 small{color:#9a9aa6}.bars i{background:#2997ff}
.c2{grid-column:4/7;grid-row:4/5;width:auto;background:#e8f0ff}
.feat .g{padding:22px}.feat .g:nth-child(1){grid-column:1/3;background:#fff4e5}.feat .g:nth-child(2){grid-column:3/5;background:#eafbf0}.feat .g:nth-child(3){grid-column:5/7;background:#f3ecff}
.feat h3{font-size:17px}.feat p{font-size:14px}
@media(max-width:860px){.w{grid-template-columns:1fr}.hero>div:first-child,.c1,.c2,.feat .g:nth-child(n){grid-column:1/-1;grid-row:auto}.c1{min-height:220px}.c2{position:static}}""")

STYLES["bento-grids"] = dict(
    titulo="Grillas bento", fuentes="family=Manrope:wght@400;500;600;700;800",
    cambia="Una variante en tarjetas de colores suaves: una pieza alta a la izquierda, dos a la derecha y tres abajo, con bordes muy redondeados y poco espacio entre ellas.",
    css=""":root{--bg:#eceaf6;--card:#fff;--card2:#fff;--edge:transparent;--ink:#1c1b2e;--ink2:#625f7d;--acc:#6d4aff;--accink:#fff;--r:30px;--rb:999px}
.w{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:minmax(120px,auto);gap:12px;padding:20px}
.hero,.stack,.feat{display:contents}
nav{grid-column:1/-1;border-radius:999px}
.g{border:0}
.hero>div:first-child{grid-column:1/3;grid-row:2/5;background:#d9d2ff;border-radius:30px;padding:38px;display:flex;flex-direction:column;justify-content:center}
h1{font-size:48px}.lead{font-size:16px;color:#4a4670}.pills span{background:#fff;border:0}
.card{position:static}
.c1{grid-column:3/5;grid-row:2/4;background:#1c1b2e;color:#fff}.c1 small{color:#a9a6c9}.bars i{background:#a99bff}
.c2{grid-column:3/5;grid-row:4/5;width:auto;background:#ffe3ec}
.feat .g{padding:22px}.feat .g:nth-child(1){grid-column:1/2;background:#d7f5e6}.feat .g:nth-child(2){grid-column:2/4;background:#fff0c9}.feat .g:nth-child(3){grid-column:4/5;background:#d6ecff}
.feat h3{font-size:16px}.feat p{font-size:13.5px}
@media(max-width:860px){.w{grid-template-columns:1fr}.hero>div:first-child,.c1,.c2,.feat .g:nth-child(n){grid-column:1/-1;grid-row:auto}.c1{min-height:220px}}""")

STYLES["editorial-grid-magazine"] = dict(
    titulo="Grilla editorial / revista", fuentes="family=Playfair+Display:ital,wght@0,700;0,900;1,700;1,900&family=Inter:wght@400;500;600",
    cambia="Se arma como la página de una revista: cabecera centrada con filetes dobles, titular en serif cursiva, texto en dos columnas con letra capital y columnas separadas por líneas finas.",
    css=""":root{--bg:#f4efe6;--card:transparent;--card2:transparent;--edge:#1a1a1a;--ink:#1a1a1a;--ink2:#4a4a4a;--acc:#b3261e;--accink:#fff;--r:0;--rb:0;--font:Inter,system-ui,sans-serif}
.g{border:0;background:none}
nav{flex-direction:column;gap:8px;border-top:3px double #1a1a1a;border-bottom:1px solid #1a1a1a;padding:14px 0 12px}
nav b{font-family:'Playfair Display',serif;font-size:42px;font-weight:900;letter-spacing:-.02em}
nav ul{order:2;text-transform:uppercase;letter-spacing:.14em;font-size:11px}nav .btn{display:none}
h1{font-family:'Playfair Display',serif;font-style:italic;font-weight:900;letter-spacing:-.02em;font-size:64px;line-height:1}
.lead{font-family:'Playfair Display',serif;font-size:18px;max-width:46ch;color:#2a2a2a}
.lead::first-letter{float:left;font-size:54px;line-height:.85;font-weight:900;padding:4px 8px 0 0;color:#b3261e}
.hero{border-bottom:1px solid #1a1a1a;padding-bottom:50px}
.btn{border-radius:0;text-transform:uppercase;letter-spacing:.12em;font-size:12px}.btn.s{background:none;border:1px solid #1a1a1a}
.card.g{background:#fbf8f1;border:1px solid #1a1a1a}
.bars i{background:#1a1a1a;border-radius:0}.bars i:last-child{background:#b3261e}
.pills span{background:none;border:0;border-bottom:1px solid #1a1a1a;border-radius:0;padding:4px 0;font-family:'Playfair Display',serif;font-style:italic;font-size:14px}
.feat{gap:0;border-top:3px double #1a1a1a;padding-top:22px;margin-top:30px}.feat .g{padding:0 24px;border-left:1px solid #1a1a1a}.feat .g:first-child{border-left:0;padding-left:0}
.feat h3{font-family:'Playfair Display',serif;font-size:22px}""")

STYLES["kinetic-typography"] = dict(
    titulo="Tipografía cinética", fuentes="family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,300..800",
    cambia="El texto es lo que se mueve: una franja que corre sin parar, un titular enorme cuyo grosor y ancho respiran, y un barrido de color que lo recorre.",
    top='<div class="mq" aria-hidden="true"><span>TU PLATA · A LA VISTA · EN ORDEN · TU PLATA · A LA VISTA · EN ORDEN · TU PLATA · A LA VISTA · EN ORDEN · </span></div>',
    css=""":root{--bg:#0d0d0f;--card:#17171b;--card2:#202026;--edge:#2a2a31;--ink:#f6f4ee;--ink2:#a9a8b2;--acc:#d9ff3f;--accink:#0d0d0f;--r:18px;--rb:999px;--font:'Bricolage Grotesque',system-ui,sans-serif}
.mq{overflow:hidden;white-space:nowrap;background:#d9ff3f;color:#0d0d0f;font-weight:800;font-size:15px;letter-spacing:.06em;padding:9px 0}
.mq span{display:inline-block;animation:mq 22s linear infinite}
@keyframes mq{to{transform:translateX(-33.33%)}}
h1{font-size:92px;line-height:.92;text-transform:uppercase;letter-spacing:-.03em;background:linear-gradient(100deg,#f6f4ee 30%,#d9ff3f 50%,#f6f4ee 70%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sweep 5s ease-in-out infinite,breathe 4s ease-in-out infinite alternate}
@keyframes sweep{0%{background-position:100% 0}100%{background-position:-100% 0}}
@keyframes breathe{from{font-variation-settings:"wdth" 75,"wght" 500}to{font-variation-settings:"wdth" 100,"wght" 800}}
.bars i{background:#d9ff3f}.pills span{background:#202026;border-color:#2a2a31}
@media(prefers-reduced-motion:reduce){.mq span,h1{animation:none}h1{color:var(--ink);background:none}}""")

STYLES["motion-driven"] = dict(
    titulo="Guiado por el movimiento", fuentes="family=Manrope:wght@400;500;600;700;800",
    cambia="Todo entra en escena de a una pieza: el título sube, las barras crecen, las tarjetas se deslizan y el saldo cuenta hasta su valor. El movimiento guía la mirada en el orden en que se debe leer.",
    css=""":root{--acc:#2f5bea}
@keyframes up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}
@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes slide{from{opacity:0;transform:translateX(40px) rotate(2deg)}to{opacity:1;transform:none}}
@keyframes float{50%{transform:translateY(-8px)}}
nav{animation:up .6s both}h1{animation:up .7s .1s both}.lead{animation:up .7s .2s both}.row{animation:up .7s .3s both}
.pills span{animation:up .6s both}.pills span:nth-child(1){animation-delay:.4s}.pills span:nth-child(2){animation-delay:.5s}.pills span:nth-child(3){animation-delay:.6s}
.c1{animation:slide .9s .25s cubic-bezier(.2,.8,.2,1) both}
.c2{animation:slide .9s .5s cubic-bezier(.2,.8,.2,1) both,float 5s 1.6s ease-in-out infinite}
.bars i{transform-origin:bottom;animation:grow .9s cubic-bezier(.2,.8,.2,1) both}
.bars i:nth-child(1){animation-delay:.5s}.bars i:nth-child(2){animation-delay:.58s}.bars i:nth-child(3){animation-delay:.66s}.bars i:nth-child(4){animation-delay:.74s}.bars i:nth-child(5){animation-delay:.82s}.bars i:nth-child(6){animation-delay:.9s}
.feat .g{animation:up .7s both}.feat .g:nth-child(1){animation-delay:.7s}.feat .g:nth-child(2){animation-delay:.8s}.feat .g:nth-child(3){animation-delay:.9s}
.btn{transition:transform .2s,box-shadow .2s}.btn:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(47,91,234,.3)}
@media(prefers-reduced-motion:reduce){*{animation:none!important}}""",
    js="""<script>(function(){var n=document.querySelector('.c1 .n');if(!n||matchMedia('(prefers-reduced-motion:reduce)').matches)return;var T=842300,t0=performance.now();(function f(t){var p=Math.min(1,(t-t0-500)/1100);if(p<0){requestAnimationFrame(f);return}var e=1-Math.pow(1-p,3);n.textContent='$ '+Math.round(T*e).toLocaleString('es-AR');if(p<1)requestAnimationFrame(f)})(t0)})()</script>""")

STYLES["micro-interactions"] = dict(
    titulo="Microinteracciones", fuentes="family=Manrope:wght@400;500;600;700;800",
    cambia="Cada gesto tiene respuesta: los botones se hunden y largan una onda al tocarlos, las etiquetas se pueden marcar, las tarjetas se inclinan hacia el cursor y cada barra muestra su valor al pasar el mouse.",
    css=""":root{--acc:#2f5bea}
.btn{position:relative;overflow:hidden;transition:transform .15s,box-shadow .2s;cursor:pointer}
.btn:hover{box-shadow:0 8px 20px rgba(47,91,234,.3)}.btn:active{transform:scale(.95)}
.btn.s:hover{box-shadow:0 6px 16px rgba(0,0,0,.1)}
.rip{position:absolute;border-radius:50%;background:rgba(255,255,255,.55);transform:scale(0);animation:rip .6s ease-out forwards;pointer-events:none}
.btn.s .rip{background:rgba(47,91,234,.25)}
@keyframes rip{to{transform:scale(4);opacity:0}}
.pills span{cursor:pointer;user-select:none;transition:background .2s,color .2s,transform .15s,border-color .2s}
.pills span:active{transform:scale(.94)}
.pills span.on{background:var(--acc);color:#fff;border-color:var(--acc)}
.pills span.on::before{content:"✓ "}
.card,.feat .g{transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s;will-change:transform}
.feat .g:hover{box-shadow:0 14px 30px rgba(20,30,70,.12)}
.bars i{position:relative;transition:filter .15s,transform .2s;transform-origin:bottom}
.bars i:hover{filter:brightness(1.25);transform:scaleY(1.04)}
.bars i::after{content:attr(data-v);position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%) translateY(4px);background:#1a1d29;color:#fff;font-size:11px;font-weight:700;padding:3px 7px;border-radius:6px;opacity:0;pointer-events:none;transition:opacity .15s,transform .15s;white-space:nowrap}
.bars i:hover::after{opacity:1;transform:translateX(-50%)}
@media(prefers-reduced-motion:reduce){*{transition:none!important}.rip{display:none}}""",
    js="""<script>(function(){
document.querySelectorAll('.btn').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();var r=b.getBoundingClientRect(),s=document.createElement('span'),d=Math.max(r.width,r.height);s.className='rip';s.style.cssText='width:'+d+'px;height:'+d+'px;left:'+(e.clientX-r.left-d/2)+'px;top:'+(e.clientY-r.top-d/2)+'px';b.appendChild(s);setTimeout(function(){s.remove()},650)})});
document.querySelectorAll('.pills span').forEach(function(p){p.addEventListener('click',function(){p.classList.toggle('on')})});
var vals=['$ 180.000','$ 260.000','$ 145.000','$ 320.000','$ 225.000','$ 365.000'];document.querySelectorAll('.bars i').forEach(function(b,i){b.setAttribute('data-v',vals[i])});
if(!matchMedia('(prefers-reduced-motion:reduce)').matches)document.querySelectorAll('.c1,.feat .g').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform='perspective(700px) rotateY('+x*8+'deg) rotateX('+(-y*8)+'deg) translateY(-3px)'});c.addEventListener('pointerleave',function(){c.style.transform=''})});
})()</script>""")

STYLES["interactive-cursor-design"] = dict(
    titulo="Diseño con cursor interactivo", fuentes="family=Syne:wght@500;700;800&family=Inter:wght@400;500;600",
    cambia="El cursor es parte del diseño: un círculo que sigue al mouse con retraso, se agranda sobre los botones y las tarjetas, y una luz que ilumina cada pieza donde apuntás. Solo funciona con mouse.",
    top='<div class="cur" aria-hidden="true"><span>Ver</span></div>',
    css=""":root{--bg:#0f0f14;--card:#16161d;--card2:#1d1d26;--edge:#26262f;--ink:#f3f1ee;--ink2:#a2a0ab;--acc:#ff6b3d;--accink:#fff;--r:20px;--rb:999px;--font:Inter,system-ui,sans-serif}
@media(hover:hover) and (pointer:fine){body,a,.btn,.g,.pills span{cursor:none}}
h1{font-family:Syne,sans-serif;font-weight:800;letter-spacing:-.04em}nav b{font-family:Syne,sans-serif}
.cur{position:fixed;left:0;top:0;opacity:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:#fff;mix-blend-mode:difference;pointer-events:none;z-index:99;display:grid;place-items:center;transition:width .25s,height .25s,margin .25s;font:700 12px Inter;color:#000}
.cur span{opacity:0;transition:opacity .2s}
.cur.on{opacity:1}.cur.big{width:78px;height:78px;margin:-39px 0 0 -39px}.cur.big span{opacity:1}
@media(hover:none){.cur{display:none}}
.g{position:relative;overflow:hidden}.card{position:absolute}
.g::after{content:"";position:absolute;inset:0;background:radial-gradient(260px circle at var(--mx,50%) var(--my,50%),rgba(255,107,61,.22),transparent 60%);opacity:0;transition:opacity .3s;pointer-events:none}
.g:hover::after{opacity:1}
.btn{transition:transform .2s}.btn.s{background:#1d1d26;color:var(--ink);border-color:#2f2f3a}
.bars i{background:linear-gradient(#ff9a6b,#ff6b3d)}.pills span{background:#1d1d26;border-color:#2f2f3a}""",
    js="""<script>(function(){var c=document.querySelector('.cur');if(!c||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;var x=innerWidth/2,y=innerHeight/2,tx=x,ty=y;
addEventListener('pointermove',function(e){tx=e.clientX;ty=e.clientY;c.classList.add('on')});(function f(){x+=(tx-x)*.18;y+=(ty-y)*.18;c.style.transform='translate('+x+'px,'+y+'px)';requestAnimationFrame(f)})();
document.querySelectorAll('.btn,.g,.pills span').forEach(function(el){el.addEventListener('pointerenter',function(){c.classList.add('big')});el.addEventListener('pointerleave',function(){c.classList.remove('big')});el.addEventListener('pointermove',function(e){var r=el.getBoundingClientRect();el.style.setProperty('--mx',(e.clientX-r.left)+'px');el.style.setProperty('--my',(e.clientY-r.top)+'px')})});
document.querySelectorAll('.btn').forEach(function(b){b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.25)+'px,'+((e.clientY-r.top-r.height/2)*.25)+'px)'});b.addEventListener('pointerleave',function(){b.style.transform=''})})})()</script>""")

STYLES["accessible-ethical"] = dict(
    titulo="Accesible y ético", fuentes="family=Atkinson+Hyperlegible:wght@400;700",
    cambia="Contraste máximo (negro sobre blanco), letra más grande, botones de al menos 48 px, un anillo de foco grueso y visible al navegar con teclado, subrayado en los enlaces y un acceso directo «Saltar al contenido». Sin animaciones que molesten.",
    top='<a class="skip" href="#main">Saltar al contenido</a>',
    css=""":root{--bg:#fff;--card:#fff;--card2:#fff;--edge:#000;--ink:#000;--ink2:#1f1f1f;--acc:#0033a0;--accink:#fff;--r:10px;--rb:10px;--font:'Atkinson Hyperlegible',system-ui,sans-serif}
body{font-size:18px;line-height:1.6}
.skip{position:absolute;left:12px;top:-60px;background:#000;color:#fff;padding:12px 18px;border-radius:8px;font-weight:700;z-index:99;text-decoration:underline}.skip:focus{top:12px}
.g{border:2px solid #000}
nav ul{font-size:16px;color:#000;gap:22px}nav li{text-decoration:underline;text-underline-offset:5px}
.btn{min-height:50px;display:inline-flex;align-items:center;padding:12px 26px;font-size:17px;border:2px solid #000}
.btn.s{border:2px solid #000}
.btn:focus-visible,a:focus-visible,li:focus-visible{outline:4px solid #ffbf00;outline-offset:3px}
.lead{font-size:21px;color:#111;max-width:40ch}
h1{font-weight:700;letter-spacing:-.02em}
.t span{color:#111;font-weight:700}
.bars i{background:#0033a0;border-radius:0;border:2px solid #000}
.pills span{border:2px solid #000;background:#fff;font-size:16px;padding:10px 16px}
.feat p{font-size:17px;color:#111}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}""")

STYLES["inclusive-design"] = dict(
    titulo="Diseño inclusivo", fuentes="family=Atkinson+Hyperlegible:wght@400;700",
    cambia="Pensado para que lo usen más personas: una tipografía que evita confundir letras, paleta segura para el daltonismo, información que no depende solo del color (rayas en las barras, flechas en los montos), más interlineado y lenguaje simple.",
    css=""":root{--bg:#fbfaf7;--card:#fff;--card2:#f1efe9;--edge:#8a867c;--ink:#14213d;--ink2:#2f3a56;--acc:#0072b2;--accink:#fff;--r:14px;--rb:10px;--font:'Atkinson Hyperlegible',system-ui,sans-serif}
body{font-size:17px;line-height:1.7;letter-spacing:.01em}
.g{border:2px solid #8a867c}
.btn{min-height:48px;display:inline-flex;align-items:center;padding:12px 24px}
.btn:focus-visible{outline:4px solid #e69f00;outline-offset:3px}
.lead{color:#243252;max-width:42ch}
.bars i{background:repeating-linear-gradient(45deg,#0072b2 0 8px,#56b4e9 8px 16px);border:2px solid #14213d;border-radius:0}
.bars i:nth-child(even){background:repeating-linear-gradient(-45deg,#e69f00 0 8px,#f5c869 8px 16px)}
.t:nth-child(1) span::before,.t:nth-child(3) span::before{content:"▼ ";color:#b45309}
.t:nth-child(2) span::before{content:"▲ ";color:#0072b2}
.t span{color:#14213d;font-weight:700}
.pills span{background:#fff;border:2px solid #8a867c}
.feat p{color:#243252}""")

STYLES["3d-hyperrealism"] = dict(
    titulo="3D e hiperrealismo", fuentes="family=Manrope:wght@400;500;600;700;800",
    cambia="Los objetos parecen reales: una tarjeta metálica inclinada con brillo, relieve y sombra profunda, botones de vidrio con reflejo y paneles de metal cepillado. Todo con luz y material, sin dibujos planos.",
    css=""":root{--bg:#10131b;--card:#1d2230;--card2:#262c3c;--edge:#383f52;--ink:#eef1f8;--ink2:#a6aec3;--acc:#4f7cff;--accink:#fff;--r:20px;--rb:12px}
body{background:radial-gradient(circle at 30% 15%,#2a3042,#0d1017 70%)}
.g{background:linear-gradient(180deg,#2a3042,#1a1f2c);border:1px solid #3a4157;box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 20px 40px rgba(0,0,0,.45)}
nav{border-radius:16px}
.btn{background:linear-gradient(#7b9cff,#3f69f0 50%,#2a4fd0);border:1px solid #1f3aa8;text-shadow:0 -1px 0 rgba(0,0,0,.35);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),inset 0 -2px 0 rgba(0,0,0,.2),0 8px 18px rgba(31,58,168,.5)}
.btn.s{background:linear-gradient(#323a50,#222838);color:var(--ink);border-color:#444c64;text-shadow:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 6px 14px rgba(0,0,0,.4)}
.stack{perspective:1100px}
.c1{background:linear-gradient(125deg,#e3e8f2 0,#9aa4b8 28%,#f4f6fb 46%,#8a94a8 66%,#cfd6e3 100%);color:#161a26;border:0;border-radius:24px;transform:rotateX(8deg) rotateY(-14deg) rotateZ(2deg);box-shadow:0 50px 70px rgba(0,0,0,.6),0 14px 24px rgba(0,0,0,.5),inset 0 2px 2px rgba(255,255,255,.95),inset 0 -3px 5px rgba(0,0,0,.25)}
.c1 small{color:#3a4258}.c1 .n{text-shadow:0 1px 0 #fff,0 -1px 0 rgba(0,0,0,.28)}
.c1::after{content:"";position:absolute;inset:0;border-radius:24px;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.55) 48%,transparent 56%);pointer-events:none}
.bars i{background:linear-gradient(90deg,#3b4a7a,#1d2a52,#3b4a7a);border-radius:3px 3px 0 0;box-shadow:inset 0 2px 0 rgba(255,255,255,.35)}
.c2{transform:rotateX(8deg) rotateY(-14deg) translate(8px,-6px)}
.pills span{background:linear-gradient(#2d3448,#1f2535);border:1px solid #3d455c;color:var(--ink);box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}""")

STYLES["3d-product-preview"] = dict(
    titulo="Vista previa 3D de producto", fuentes="family=Manrope:wght@400;500;600;700;800",
    cambia="El producto (la tarjeta) se puede girar y mirar desde varios ángulos: gira sola con suavidad y sigue al mouse. Debajo tiene su sombra, como si estuviera apoyada.",
    bottom='<p class="hint" aria-hidden="true">Mové el mouse sobre la tarjeta para girarla</p>',
    css=""":root{--bg:#e7eaf2;--acc:#2f5bea}
body{background:radial-gradient(circle at 60% 40%,#fff,#dfe3ee 70%)}
.stack{perspective:1100px}
.c1{transform-style:preserve-3d;transform:rotateY(-26deg) rotateX(6deg);animation:spin 9s ease-in-out infinite alternate;background:linear-gradient(135deg,#2f5bea,#1b2f8a);color:#fff;border:0;border-radius:24px;box-shadow:0 30px 50px rgba(30,45,120,.35),inset 0 1px 0 rgba(255,255,255,.4)}
.c1 small{color:#c3d0ff}.bars i{background:rgba(255,255,255,.85)}
.c1::after{content:"";position:absolute;inset:0;border-radius:24px;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.28) 48%,transparent 60%);pointer-events:none}
@keyframes spin{from{transform:rotateY(-28deg) rotateX(7deg)}to{transform:rotateY(24deg) rotateX(-3deg)}}
.stack::before{content:"";position:absolute;left:6%;right:12%;bottom:52px;height:34px;border-radius:50%;background:radial-gradient(rgba(20,30,90,.35),transparent 70%);filter:blur(8px)}
.c2{box-shadow:0 18px 36px rgba(20,30,70,.15)}
.hint{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);font-size:12px;font-weight:600;color:#6b7390;background:rgba(255,255,255,.7);padding:5px 12px;border-radius:999px}
@media(prefers-reduced-motion:reduce){.c1{animation:none}}""",
    js="""<script>(function(){var c=document.querySelector('.c1');if(!c||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
addEventListener('pointermove',function(e){var x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;c.style.animation='none';c.style.transform='rotateY('+(x*50)+'deg) rotateX('+(-y*22)+'deg)'})})()</script>""")

STYLES["parallax-storytelling"] = dict(
    titulo="Storytelling con parallax", fuentes="family=Manrope:wght@400;500;600;700;800",
    cambia="Las capas se mueven a distinta velocidad cuando bajás o movés el mouse: el fondo va más lento, el titular más rápido y las tarjetas flotan en el medio. La historia se va descubriendo de a poco.",
    css=""":root{--bg:#0b1020;--card:rgba(255,255,255,.06);--card2:rgba(255,255,255,.08);--edge:rgba(255,255,255,.14);--ink:#f2f5ff;--ink2:#a9b4d3;--acc:#7dd3fc;--accink:#06182a;--r:22px;--rb:999px}
body{background:linear-gradient(180deg,#0b1020,#14264a 55%,#1b3a64);padding-bottom:60vh}
.bg{display:block;position:fixed;inset:0;z-index:0;overflow:hidden}
.bg i{position:absolute;border-radius:50%;filter:blur(70px);will-change:transform}
.bg i:nth-child(1){width:520px;height:520px;background:#3b82f6;opacity:.45;top:-100px;left:-100px}
.bg i:nth-child(2){width:420px;height:420px;background:#22d3ee;opacity:.35;top:30%;right:-120px}
.bg i:nth-child(3){width:480px;height:480px;background:#a78bfa;opacity:.35;bottom:-160px;left:25%}
.g{backdrop-filter:blur(8px)}
.hero>div:first-child,.stack,.feat .g{will-change:transform}
.btn.s{color:var(--ink)}.bars i{background:linear-gradient(#7dd3fc,#3b82f6)}
.rv{opacity:0;transform:translateY(40px);transition:opacity .8s,transform .8s}.rv.in{opacity:1;transform:none}""",
    js="""<script>(function(){var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;var o=[].slice.call(document.querySelectorAll('.bg i')),h=document.querySelector('.hero>div:first-child'),s=document.querySelector('.stack'),f=[].slice.call(document.querySelectorAll('.feat .g'));
var mx=0,my=0;function up(){var y=scrollY;o.forEach(function(e,i){e.style.transform='translate('+(mx*(i+1)*14)+'px,'+(-y*(.08+i*.05)+my*(i+1)*10)+'px)'});h.style.transform='translateY('+(-y*.12)+'px)';s.style.transform='translate('+(mx*-18)+'px,'+(-y*.2+my*-12)+'px)';f.forEach(function(e,i){e.style.transform='translateY('+(-y*(.04+i*.03))+'px)'})}
if(!rm){addEventListener('scroll',up,{passive:true});addEventListener('pointermove',function(e){mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;up()});up();
f.forEach(function(e){e.classList.add('rv')});var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting)x.target.classList.add('in')})},{threshold:.2});f.forEach(function(e){io.observe(e)})}})()</script>""")

STYLES["ai-native-ui"] = dict(
    titulo="UI nativa de IA", fuentes="family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500",
    cambia="La interfaz gira alrededor de una conversación: una barra para preguntarle al asistente, texto que aparece mientras se genera, sugerencias como botones y respuestas marcadas como generadas por IA.",
    bottom='<div class="ask"><span class="sp">✦</span><input type="text" placeholder="Preguntale a Plata: ¿cuánto puedo gastar esta semana?" aria-label="Preguntale a Plata"><button type="button" aria-label="Enviar">↑</button></div>',
    css=""":root{--bg:#0a0b12;--card:rgba(255,255,255,.05);--card2:rgba(255,255,255,.07);--edge:rgba(255,255,255,.1);--ink:#f2f3fa;--ink2:#a3a6bd;--acc:#8b8cff;--accink:#0a0b12;--r:18px;--rb:999px;--font:Inter,system-ui,sans-serif}
body{background:radial-gradient(60% 50% at 50% -10%,rgba(139,92,246,.35),transparent 70%),radial-gradient(40% 40% at 90% 30%,rgba(34,211,238,.18),transparent 70%),#0a0b12;padding-bottom:110px}
nav{background:transparent;border:0}
h1{font-weight:700;letter-spacing:-.045em;font-size:56px}
.lead::before{content:"✦ Plata IA";display:inline-block;margin-right:10px;padding:3px 10px;border-radius:999px;font:500 11px 'JetBrains Mono',monospace;color:#c7c8ff;background:rgba(139,140,255,.14);border:1px solid rgba(139,140,255,.3);vertical-align:2px}
.lead.typing::after{content:"▍";color:#8b8cff;animation:bl 1s steps(1) infinite}
@keyframes bl{50%{opacity:0}}
.btn{background:linear-gradient(95deg,#8b8cff,#22d3ee);color:#0a0b12}
.btn.s{background:rgba(255,255,255,.06);color:var(--ink);border-color:rgba(255,255,255,.14)}
.pills span{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.12);color:#dcdeff}
.c1,.c2{position:absolute}.c1::before,.c2::before{content:"Generado por Plata IA";position:absolute;top:-10px;left:16px;font:500 10.5px 'JetBrains Mono',monospace;color:#c7c8ff;background:#14152a;border:1px solid rgba(139,140,255,.35);padding:2px 8px;border-radius:999px}
.bars i{background:linear-gradient(#a5a6ff,#22d3ee)}
.ask{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);width:min(640px,calc(100% - 32px));display:flex;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:999px;background:rgba(20,21,36,.85);backdrop-filter:blur(16px);border:1px solid rgba(139,140,255,.35);box-shadow:0 0 0 4px rgba(139,140,255,.08),0 18px 44px rgba(0,0,0,.5);z-index:5}
.ask .sp{color:#8b8cff}.ask input{flex:1;background:none;border:0;outline:0;color:var(--ink);font:500 14px Inter,sans-serif}.ask input::placeholder{color:#7d8099}
.ask button{width:34px;height:34px;border-radius:50%;border:0;background:linear-gradient(135deg,#8b8cff,#22d3ee);color:#0a0b12;font-weight:800;cursor:pointer}""",
    js="""<script>(function(){var l=document.querySelector('.lead');if(!l||matchMedia('(prefers-reduced-motion:reduce)').matches)return;var t=l.textContent;l.textContent='';l.classList.add('typing');var i=0;(function f(){l.textContent=t.slice(0,i);i+=2;if(i<=t.length+2)setTimeout(f,18);else l.classList.remove('typing')})()})()</script>""")



# ───────────── Segundo lote: el resto de los estilos visuales ─────────────
STYLES["neumorphism"] = dict(
    titulo="Neumorfismo", fuentes="family=Nunito:wght@400;600;700;800",
    cambia="Todo parece moldeado en el mismo material: las piezas sobresalen o se hunden con una luz clara arriba a la izquierda y una sombra suave abajo a la derecha. Se ve calmo y táctil, pero con textos grises el contraste es bajo.",
    css=""":root{--bg:#e0e5ec;--card:#e0e5ec;--card2:#e0e5ec;--edge:transparent;--ink:#5a6a85;--ink2:#7d8aa3;--acc:#6d8cff;--accink:#fff;--r:26px;--rb:16px;--font:Nunito,system-ui,sans-serif}
.g{border:0;box-shadow:9px 9px 18px #a3b1c6,-9px -9px 18px #fff}
.btn{background:#e0e5ec;color:#4d6bd8;box-shadow:6px 6px 12px #a3b1c6,-6px -6px 12px #fff}
.btn:active{box-shadow:inset 4px 4px 8px #a3b1c6,inset -4px -4px 8px #fff}
.btn.s{border:0;color:var(--ink)}
.pills span{border:0;background:#e0e5ec;box-shadow:inset 3px 3px 6px #a3b1c6,inset -3px -3px 6px #fff}
.bars{padding:12px;border-radius:16px;box-shadow:inset 4px 4px 8px #a3b1c6,inset -4px -4px 8px #fff}
.bars i{background:linear-gradient(#8ea6ff,#6d8cff);border-radius:8px}
h1{color:#4a5a78}""")

STYLES["brutalism"] = dict(
    titulo="Brutalismo", fuentes="family=Space+Mono:wght@400;700",
    cambia="Sin pulir a propósito: tipografía de sistema, bordes negros visibles, enlaces azules subrayados, cajas rectas y composiciones que rompen la prolijidad. Se reconoce al instante y rechaza lo convencional.",
    css=""":root{--bg:#e9e9e9;--card:#fff;--card2:#ff0;--edge:#000;--ink:#000;--ink2:#000;--acc:#0000ee;--accink:#fff;--r:0;--rb:0;--font:'Times New Roman',Times,serif}
.g{border:3px solid #000;box-shadow:none}
nav{background:#ff0;border-width:4px}nav b{font-family:'Space Mono',monospace;font-size:22px;text-transform:uppercase}
nav ul{color:#0000ee;text-decoration:underline}
h1{font-family:Arial,Helvetica,sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:-.02em;font-size:64px;line-height:.95}
.lead{color:#000;font-size:19px}
.btn{border:3px solid #000;background:#0000ee;color:#fff;font-family:'Space Mono',monospace;text-transform:uppercase}
.btn.s{background:#fff;color:#000}
.c1{background:#fff;transform:rotate(-1.5deg)}.c2{transform:rotate(1.5deg);background:#ff0}
.bars i{background:#000;border-radius:0}
.pills span{border:2px solid #000;background:#fff;font-family:'Space Mono',monospace}
.feat .g:nth-child(2){margin-top:20px}.feat .g:nth-child(3){margin-top:40px}""")

STYLES["vibrant-block-based"] = dict(
    titulo="Vibrante y en bloques", fuentes="family=Poppins:wght@500;700;800",
    cambia="La página se arma con grandes bloques de color plano y formas geométricas, con tipografía muy gruesa y botones enormes. Transmite energía y se escanea de un vistazo.",
    css=""":root{--bg:#fff;--card:#fff;--card2:#fff;--edge:transparent;--ink:#111;--ink2:#333;--acc:#ff3d71;--accink:#fff;--r:0;--rb:999px;--font:Poppins,system-ui,sans-serif}
.g{border:0}
nav{background:#111;color:#fff;border-radius:0}nav ul{color:#ddd}
.hero{gap:0;padding:0;margin:0 -28px;align-items:stretch}
.hero>div:first-child{background:#3b3bff;color:#fff;padding:60px 44px}
.lead{color:#e4e4ff}h1{font-weight:800}
.btn{padding:15px 28px;font-size:15px}.btn.s{background:#fff;color:#111;border:0}
.pills span{background:#ffe14a;color:#111;border:0}
.stack{height:auto;min-height:420px;background:#ffe14a;padding:40px}
.c1{inset:40px 80px 110px 40px;background:#ff3d71;color:#fff}.c1 small{color:#fff}.bars i{background:#111;border-radius:0}
.c2{right:40px;bottom:40px;background:#fff}
.feat{margin:0 -28px;gap:0}.feat .g{padding:40px;border-radius:0}
.feat .g:nth-child(1){background:#00c2a8}.feat .g:nth-child(2){background:#ff8a3d}.feat .g:nth-child(3){background:#8b5cf6;color:#fff}
.feat p{color:inherit;opacity:.9}.feat h3{font-size:24px;font-weight:800}""")

STYLES["claymorphism"] = dict(
    titulo="Claymorfismo", fuentes="family=Nunito:wght@600;700;800;900",
    cambia="Piezas hinchadas y redondeadas, como de arcilla o goma: sombras dobles por dentro y por fuera, colores pastel y tipografía gorda. Se ve amigable y divertido, ideal para público joven o infantil.",
    css=""":root{--bg:#efe8ff;--card:#f7f2ff;--card2:#ffe3f1;--edge:transparent;--ink:#3a2a6a;--ink2:#6b5a99;--acc:#7c5cff;--accink:#fff;--r:34px;--rb:22px;--font:Nunito,system-ui,sans-serif}
.g{border:0;box-shadow:12px 12px 26px rgba(124,92,255,.22),inset -8px -8px 14px rgba(124,92,255,.12),inset 8px 8px 14px rgba(255,255,255,.95)}
h1{font-weight:900;letter-spacing:-.03em}
.btn{background:linear-gradient(145deg,#9a82ff,#6a49ee);box-shadow:8px 8px 16px rgba(106,73,238,.35),inset -4px -4px 8px rgba(0,0,0,.15),inset 4px 4px 8px rgba(255,255,255,.4);padding:14px 26px;font-weight:800;transition:transform .2s cubic-bezier(.3,1.6,.5,1)}
.btn:hover{transform:scale(1.06)}.btn:active{transform:scale(.95)}
.btn.s{background:#fff;color:var(--ink);box-shadow:8px 8px 16px rgba(124,92,255,.2),inset -4px -4px 8px rgba(124,92,255,.1),inset 4px 4px 8px #fff;border:0}
.pills span{border:0;background:#ffd6ea;box-shadow:inset -3px -3px 6px rgba(0,0,0,.08),inset 3px 3px 6px rgba(255,255,255,.9)}.pills span:nth-child(2){background:#d3f5e6}.pills span:nth-child(3){background:#ffeab8}
.bars i{border-radius:14px;background:linear-gradient(#ffb0d4,#ff6fae);box-shadow:inset -3px -3px 6px rgba(0,0,0,.12),inset 3px 3px 6px rgba(255,255,255,.7)}
.feat .g:nth-child(1){background:#ffe3f1}.feat .g:nth-child(2){background:#dcf7ec}.feat .g:nth-child(3){background:#fff1c9}""")

STYLES["retro-futurism"] = dict(
    titulo="Retrofuturismo", fuentes="family=Orbitron:wght@500;700;900&family=Rajdhani:wght@500;600",
    cambia="El futuro como se imaginaba en los años 80: noche violeta, neón magenta y celeste, texto cromado, un sol de atardecer y una grilla en perspectiva en el piso.",
    css=""":root{--bg:#120a2e;--card:rgba(30,12,66,.7);--card2:rgba(40,16,90,.8);--edge:#ff2bd6;--ink:#f6e9ff;--ink2:#c9b0ee;--acc:#ff2bd6;--accink:#fff;--r:6px;--rb:4px;--font:Rajdhani,system-ui,sans-serif}
body{background:linear-gradient(#120a2e 0,#2a0f5e 55%,#ff5f9e 78%,#ffb36b 100%)}
.bg{display:block;position:fixed;inset:auto 0 0 0;height:36vh;z-index:0;background:linear-gradient(transparent 0,#1a0838 2%),repeating-linear-gradient(90deg,#ff2bd6 0 2px,transparent 2px 70px),repeating-linear-gradient(0deg,#ff2bd6 0 2px,transparent 2px 38px);transform:perspective(380px) rotateX(58deg);transform-origin:50% 0;opacity:.55}
.g{border:1px solid #ff2bd6;box-shadow:0 0 16px rgba(255,43,214,.45),inset 0 0 18px rgba(255,43,214,.15)}
h1{font-family:Orbitron,sans-serif;font-weight:900;font-size:50px;background:linear-gradient(#fff,#ff9ae9 55%,#7df9ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:none;filter:drop-shadow(0 0 14px rgba(255,43,214,.7))}
nav b{font-family:Orbitron;letter-spacing:.1em}
.btn{background:linear-gradient(90deg,#ff2bd6,#7c3aed);box-shadow:0 0 22px rgba(255,43,214,.7);text-transform:uppercase;letter-spacing:.1em;font-family:Orbitron;font-size:12px}
.btn.s{background:transparent;color:#7df9ff;border:1px solid #7df9ff;box-shadow:0 0 14px rgba(125,249,255,.5)}
.bars i{background:linear-gradient(#7df9ff,#ff2bd6);box-shadow:0 0 12px rgba(125,249,255,.6)}
.pills span{background:transparent;border:1px solid #7df9ff;color:#7df9ff}
.c1 .n{font-family:Orbitron;color:#fff;text-shadow:0 0 16px #ff2bd6}""")

STYLES["flat-design"] = dict(
    titulo="Diseño flat", fuentes="family=Poppins:wght@400;500;600;700",
    cambia="Todo plano: colores sólidos, sin sombras, sin degradés y sin texturas. La jerarquía la dan el color y el tamaño del texto. Es simple, liviano y se adapta a cualquier pantalla.",
    css=""":root{--bg:#ecf0f1;--card:#fff;--card2:#fff;--edge:transparent;--ink:#2c3e50;--ink2:#6b7c8c;--acc:#3498db;--accink:#fff;--r:4px;--rb:4px;--font:Poppins,system-ui,sans-serif}
.g{border:0;box-shadow:none}
nav{background:#2c3e50;color:#fff}nav ul{color:#bdc3c7}
.btn{padding:12px 22px;background:#2ecc71}.btn.s{background:#fff;color:#2c3e50;border:0}
h1{font-weight:700}
.c1{background:#3498db;color:#fff}.c1 small{color:#d6eaf8}.bars i{background:#fff;border-radius:0}.bars i:last-child{background:#f1c40f}
.c2{background:#fff}
.pills span{border:0;background:#fff}.pills span:nth-child(1){background:#f1c40f}.pills span:nth-child(2){background:#e74c3c;color:#fff}.pills span:nth-child(3){background:#9b59b6;color:#fff}
.feat .g:nth-child(1){background:#1abc9c;color:#fff}.feat .g:nth-child(2){background:#e67e22;color:#fff}.feat .g:nth-child(3){background:#9b59b6;color:#fff}
.feat p{color:inherit;opacity:.92}""")

STYLES["skeuomorphism"] = dict(
    titulo="Esqueuomorfismo", fuentes="family=Playfair+Display:wght@600;700&family=Lato:wght@400;700",
    cambia="Imita objetos de verdad: mesa de madera, papel con costuras, relieve en los textos y botones metálicos con reflejo. Todo parece algo que se puede tocar.",
    css=""":root{--bg:#6b4a2f;--card:#f6efdc;--card2:#e9dcc0;--edge:#a8895c;--ink:#3b2a18;--ink2:#6a5136;--acc:#b8332a;--accink:#fff;--r:12px;--rb:8px;--font:Lato,system-ui,sans-serif}
body{background:repeating-linear-gradient(90deg,rgba(0,0,0,.05) 0 2px,transparent 2px 9px),linear-gradient(#7a5636,#5a3d25)}
.g{background:linear-gradient(#f8f2e1,#ece0c4);border:2px dashed #a8895c;outline:5px solid #f6efdc;outline-offset:-9px;box-shadow:0 10px 22px rgba(0,0,0,.5),inset 0 1px 0 #fff}
nav{background:linear-gradient(#8a5a36,#6a4426)!important;color:#f7ecd5;border:2px solid #3e2812;outline:none;box-shadow:0 6px 14px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.25)}nav ul{color:#f1deb9}nav b{text-shadow:0 -1px 0 rgba(0,0,0,.6)}
h1{font-family:'Playfair Display',serif;color:#f6e9cc;text-shadow:0 2px 0 #3e2812,0 4px 8px rgba(0,0,0,.5);font-size:56px}
.lead{color:#ecd9b4}
.btn{background:linear-gradient(#e0574d,#b8332a 55%,#8f241c);border:1px solid #6a1812;text-shadow:0 -1px 0 rgba(0,0,0,.5);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 4px 8px rgba(0,0,0,.45)}
.btn.s{background:linear-gradient(#f4f4f4,#bdbdbd 55%,#9a9a9a);color:#3b2a18;text-shadow:0 1px 0 #fff;border:1px solid #6d6d6d}
.pills span{background:linear-gradient(#f8f2e1,#e2d3b0);border:1px solid #a8895c;box-shadow:inset 0 1px 0 #fff,0 2px 4px rgba(0,0,0,.35)}
.bars i{background:linear-gradient(90deg,#8f241c,#d44a3f,#8f241c);border-radius:3px 3px 0 0;box-shadow:inset 0 2px 0 rgba(255,255,255,.4)}
.c1 .n,.feat h3{text-shadow:0 1px 0 #fff;font-family:'Playfair Display',serif}""")

STYLES["zero-interface"] = dict(
    titulo="Interfaz cero", fuentes="family=Inter:wght@300;400;500",
    cambia="La interfaz casi desaparece: sin cajas, sin bordes y sin botones llamativos; solo texto limpio y un indicador de que se puede hablar. La tecnología se hace a un lado y se usa con la voz o con gestos.",
    bottom='<div class="listen" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><span>Te escucho…</span></div>',
    css=""":root{--bg:#fbfbfa;--card:transparent;--card2:transparent;--edge:transparent;--ink:#1c1c1c;--ink2:#7a7a7a;--acc:#1c1c1c;--accink:#fbfbfa;--r:0;--rb:999px;--font:Inter,system-ui,sans-serif}
.g{border:0;background:none}
nav{padding:0}nav ul{display:none}nav .btn{background:none;color:#7a7a7a;padding:0;font-weight:400}
.hero{padding-top:90px}h1{font-weight:300;letter-spacing:-.04em;font-size:58px}
.lead{font-weight:300}
.btn{background:none;color:var(--ink);padding:0;font-weight:500;text-decoration:underline;text-underline-offset:6px}.btn.s{border:0;background:none;color:#7a7a7a}
.pills span{background:none;border:0;padding:0;color:#7a7a7a;font-weight:400}.pills span+span::before{content:"·";margin:0 10px 0 -2px}
.stack{height:260px}.c1{inset:0 40px 70px 0;padding:0}.c1 .n{font-weight:300}.bars{height:70px;gap:6px}.bars i{background:#1c1c1c;border-radius:0;opacity:.7}
.c2{padding:0;width:230px}.t{font-weight:400;font-size:13px}
.feat{gap:50px}.feat .g{padding:0}.feat h3{font-weight:500;font-size:15px}.feat p{font-size:13px}
.listen{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);display:flex;align-items:center;gap:5px;color:#7a7a7a;font-size:13px}
.listen i{width:3px;height:10px;background:#1c1c1c;border-radius:2px;animation:wv 1.1s ease-in-out infinite}
.listen i:nth-child(2){animation-delay:.12s}.listen i:nth-child(3){animation-delay:.24s}.listen i:nth-child(4){animation-delay:.36s}.listen i:nth-child(5){animation-delay:.48s}
.listen span{margin-left:8px}@keyframes wv{50%{height:22px}}
@media(prefers-reduced-motion:reduce){.listen i{animation:none}}""")

STYLES["y2k-aesthetic"] = dict(
    titulo="Estética Y2K", fuentes="family=Fredoka:wght@500;600;700&family=Orbitron:wght@700",
    cambia="La nostalgia de los 2000: degradé rosa y celeste, cromados, botones de gel brillantes, estrellas y bordes plateados. Mucho brillo y un aire futurista de cuando internet era nuevo.",
    css=""":root{--bg:#ffd9f1;--card:rgba(255,255,255,.65);--card2:rgba(255,255,255,.8);--edge:#c7c9e6;--ink:#3a2c6e;--ink2:#6f62a3;--acc:#ff4fb8;--accink:#fff;--r:22px;--rb:999px;--font:Fredoka,system-ui,sans-serif}
body{background:radial-gradient(circle at 18% 20%,#fff 0 2px,transparent 3px) 0 0/90px 90px,radial-gradient(circle at 70% 60%,#fff 0 1.5px,transparent 2.5px) 0 0/70px 70px,linear-gradient(135deg,#ffc3ec,#c9d6ff 55%,#bff4ff)}
.g{border:2px solid #fff;box-shadow:0 0 0 2px #b9bde0,0 12px 28px rgba(120,100,200,.3),inset 0 2px 6px #fff}
nav b{font-family:Orbitron,sans-serif;background:linear-gradient(#ff4fb8,#7c5cff 60%,#00c2ff);-webkit-background-clip:text;background-clip:text;color:transparent}
h1{font-weight:700;letter-spacing:-.02em;text-shadow:3px 3px 0 #fff}
.btn{background:linear-gradient(#ff9ad6,#ff4fb8 55%,#e0289a);border:2px solid #fff;box-shadow:0 0 0 2px #ff4fb8,inset 0 3px 5px rgba(255,255,255,.8),0 8px 16px rgba(224,40,154,.4);text-shadow:0 1px 2px rgba(0,0,0,.25)}
.btn.s{background:linear-gradient(#fff,#d7dcf7);color:var(--ink);box-shadow:0 0 0 2px #b9bde0,inset 0 3px 5px #fff}
.bars i{background:linear-gradient(#e2e6ff,#9aa6e8 50%,#c9d0ff);border:1px solid #fff;border-radius:8px 8px 0 0}
.pills span{background:linear-gradient(#fff,#e6e9ff);border:2px solid #fff;box-shadow:0 0 0 1.5px #b9bde0}
.c1 .n{font-family:Orbitron;font-size:36px}""")

STYLES["cyberpunk-ui"] = dict(
    titulo="UI cyberpunk", fuentes="family=Rajdhani:wght@500;600;700&family=Share+Tech+Mono",
    cambia="Noche eléctrica: negro con amarillo, cian y magenta de neón, esquinas cortadas, texto con efecto glitch, líneas de escaneo y detalles de terminal.",
    css=""":root{--bg:#07070c;--card:#0f0f1a;--card2:#14142a;--edge:#fcee0a;--ink:#f3f3f7;--ink2:#9a9ab8;--acc:#fcee0a;--accink:#07070c;--r:0;--rb:0;--font:Rajdhani,system-ui,sans-serif}
body::after{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);z-index:9}
.g{border:1px solid #fcee0a;clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px));box-shadow:none}
nav b{font-family:'Share Tech Mono',monospace;color:#fcee0a;letter-spacing:.1em;text-transform:uppercase}nav ul{font-family:'Share Tech Mono',monospace;text-transform:uppercase;font-size:12px}
h1{text-transform:uppercase;font-weight:700;letter-spacing:-.01em;text-shadow:3px 0 #ff2a6d,-3px 0 #05d9e8;font-size:60px}
.lead{font-family:'Share Tech Mono',monospace;font-size:14px;color:#9ad7e0}
.btn{clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));text-transform:uppercase;letter-spacing:.08em;font-weight:700}
.btn.s{background:transparent;color:#05d9e8;border:1px solid #05d9e8;clip-path:none}
.c1{border-color:#05d9e8}.bars i{background:linear-gradient(#05d9e8,#ff2a6d);border-radius:0}
.pills span{background:transparent;border:1px solid #ff2a6d;color:#ff2a6d;font-family:'Share Tech Mono',monospace;border-radius:0}
.c1 .n{font-family:'Share Tech Mono';color:#fcee0a;text-shadow:2px 0 #ff2a6d}""")

STYLES["organic-biophilic"] = dict(
    titulo="Orgánico biofílico", fuentes="family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Nunito:wght@400;600",
    cambia="Inspirado en la naturaleza: verdes y tierras, formas redondeadas que no son círculos ni cuadrados perfectos, textos en serif cálida y mucho aire. Transmite calma y bienestar.",
    css=""":root{--bg:#f1efe4;--card:#fbf9f0;--card2:#e3ebd3;--edge:#d6dcc0;--ink:#2f3d2a;--ink2:#5d6e54;--acc:#4f7a3a;--accink:#fff;--r:46px 30px 52px 28px/34px 52px 30px 48px;--rb:999px;--font:Nunito,system-ui,sans-serif}
.g{box-shadow:0 10px 30px rgba(79,122,58,.12)}
nav{border-radius:999px}
h1{font-family:Fraunces,serif;font-weight:700;letter-spacing:-.025em;color:#2f4a24}
.btn{box-shadow:0 8px 18px rgba(79,122,58,.3)}
.btn.s{background:#fbf9f0;color:var(--ink);border-color:#cfd7b4}
.bars i{border-radius:999px 999px 6px 6px;background:linear-gradient(#9ac27a,#4f7a3a)}
.pills span{background:#e3ebd3;border-color:#d0dbb8}
.feat .g:nth-child(1){border-radius:50px 28px 50px 30px/30px 50px 28px 50px}.feat .g:nth-child(2){border-radius:28px 50px 30px 50px/50px 30px 50px 28px;background:#e9efd9}.feat .g:nth-child(3){border-radius:48px 34px 28px 54px/40px 28px 52px 34px;background:#f4eddc}
.feat h3{font-family:Fraunces,serif}""")

STYLES["memphis-design"] = dict(
    titulo="Diseño Memphis", fuentes="family=Poppins:wght@600;700;800",
    cambia="El caos alegre de los 80: formas geométricas sueltas, garabatos y puntitos, colores que chocan, bordes negros gruesos y composiciones algo torcidas. Pura personalidad.",
    css=""":root{--bg:#fff7e6;--card:#fff;--card2:#ffe14a;--edge:#111;--ink:#111;--ink2:#333;--acc:#ff4f9a;--accink:#fff;--r:0;--rb:0;--font:Poppins,system-ui,sans-serif}
.bg{display:block;position:fixed;inset:0;z-index:0;background:radial-gradient(#111 1.6px,transparent 2px) 0 0/22px 22px,transparent;opacity:.12}
.bg i{position:absolute}.bg i:nth-child(1){width:130px;height:130px;background:#00c2d1;border-radius:50%;top:8%;right:6%;opacity:.9}
.bg i:nth-child(2){width:0;height:0;border-left:70px solid transparent;border-right:70px solid transparent;border-bottom:120px solid #ff4f9a;left:3%;bottom:14%;transform:rotate(18deg)}
.bg i:nth-child(3){width:150px;height:30px;background:repeating-linear-gradient(135deg,#111 0 8px,transparent 8px 16px);right:12%;bottom:8%;transform:rotate(-8deg)}
.bg{opacity:1;background:none}
.g{border:3px solid #111;box-shadow:7px 7px 0 #111}
nav{background:#ffe14a}
h1{font-weight:800;letter-spacing:-.04em;text-transform:uppercase;font-size:56px}
.btn{border:3px solid #111;box-shadow:4px 4px 0 #111;transform:rotate(-1.5deg)}.btn.s{transform:rotate(1.5deg);background:#fff}
.c1{background:#9ee8ff;transform:rotate(-2deg)}.c2{background:#fff;transform:rotate(2deg)}
.bars i{background:#ff4f9a;border:2px solid #111;border-radius:0}.bars i:nth-child(even){background:#ffe14a}
.pills span{border:2px solid #111;background:#ffe14a;box-shadow:3px 3px 0 #111}.pills span:nth-child(2){background:#ff9ad0}.pills span:nth-child(3){background:#8ef0d4}
.feat .g:nth-child(1){background:#ff9ad0;transform:rotate(-1deg)}.feat .g:nth-child(2){background:#9ee8ff;transform:rotate(1deg)}.feat .g:nth-child(3){background:#ffe14a;transform:rotate(-1.5deg)}""")

STYLES["vaporwave"] = dict(
    titulo="Vaporwave", fuentes="family=VT323&family=Major+Mono+Display&family=Poppins:wght@500;700",
    cambia="Nostalgia de internet de los 90 vista en sueño: degradé de atardecer rosa y violeta, piso de grilla neón, ventanas de sistema operativo antiguo y textos en monoespaciada.",
    css=""":root{--bg:#2b1055;--card:#c8b6ff;--card2:#ffd1f3;--edge:#fff;--ink:#2b1055;--ink2:#4b2f86;--acc:#ff71ce;--accink:#2b1055;--r:0;--rb:0;--font:'VT323',monospace}
body{background:linear-gradient(#2b1055 0,#7b2cbf 45%,#ff71ce 80%,#ffb86c 100%)}
.bg{display:block;position:fixed;inset:auto 0 0 0;height:34vh;z-index:0;background:repeating-linear-gradient(90deg,#01cdfe 0 2px,transparent 2px 64px),repeating-linear-gradient(0deg,#01cdfe 0 2px,transparent 2px 34px),#1a0838;transform:perspective(360px) rotateX(60deg);transform-origin:50% 0;opacity:.7}
.g{background:#c8b6ff;border:2px solid #fff;box-shadow:inset -2px -2px 0 #6b4fb3,inset 2px 2px 0 #fff,6px 6px 0 rgba(0,0,0,.35)}
nav{background:#2b1055;color:#fff;border-color:#01cdfe}nav b{font-family:'Major Mono Display',monospace;color:#ff71ce}nav ul{color:#fff;font-size:18px}
h1{font-family:'Major Mono Display',monospace;font-weight:400;font-size:44px;color:#fff;text-shadow:3px 3px 0 #ff71ce,6px 6px 0 #01cdfe;letter-spacing:-.02em;line-height:1.1}
.lead{color:#fff;font-size:22px;text-shadow:2px 2px 0 rgba(0,0,0,.35)}
body{font-size:20px}.btn{background:#c8b6ff;color:#2b1055;border:2px solid #fff;box-shadow:inset -2px -2px 0 #6b4fb3,inset 2px 2px 0 #fff;font-family:'VT323';font-size:20px;text-transform:uppercase}
.btn.s{background:#ffd1f3}
.c1{background:#ffd1f3}.c1 .n{font-family:'Major Mono Display';font-size:34px}.bars i{background:linear-gradient(#01cdfe,#b967ff);border:1px solid #fff;border-radius:0}
.pills span{background:#fff;border:2px solid #2b1055;font-size:18px;box-shadow:3px 3px 0 #ff71ce}
.t{font-size:19px}""")

STYLES["hud-sci-fi-fui"] = dict(
    titulo="HUD / FUI de ciencia ficción", fuentes="family=Orbitron:wght@500;700&family=Share+Tech+Mono",
    cambia="Una pantalla de nave espacial: fondo oscuro, líneas finas cian, esquinas con marcas, números y rótulos en monoespaciada diminuta, y paneles transparentes con brillo.",
    css=""":root{--bg:#02070e;--card:rgba(6,30,48,.55);--card2:rgba(6,40,60,.6);--edge:rgba(0,229,255,.55);--ink:#d7f9ff;--ink2:#6fb7c6;--acc:#00e5ff;--accink:#02070e;--r:0;--rb:0;--font:'Share Tech Mono',monospace}
body{background:radial-gradient(circle at 50% 30%,#06223a,#02070e 70%),repeating-linear-gradient(0deg,rgba(0,229,255,.04) 0 1px,transparent 1px 28px),repeating-linear-gradient(90deg,rgba(0,229,255,.04) 0 1px,transparent 1px 28px)}
.g{border:1px solid rgba(0,229,255,.5);box-shadow:0 0 18px rgba(0,229,255,.18),inset 0 0 22px rgba(0,229,255,.08);background-image:linear-gradient(#00e5ff,#00e5ff),linear-gradient(#00e5ff,#00e5ff),linear-gradient(#00e5ff,#00e5ff),linear-gradient(#00e5ff,#00e5ff);background-repeat:no-repeat;background-size:14px 2px,2px 14px,14px 2px,2px 14px;background-position:0 0,0 0,100% 100%,100% 100%}
nav b{font-family:Orbitron;letter-spacing:.18em;text-transform:uppercase;font-size:16px;color:#00e5ff}nav ul{text-transform:uppercase;letter-spacing:.14em;font-size:11px}
h1{font-family:Orbitron;font-weight:500;font-size:46px;text-transform:uppercase;letter-spacing:.02em;text-shadow:0 0 14px rgba(0,229,255,.6)}
.lead{font-size:14px;color:#8fd3df}
.btn{background:rgba(0,229,255,.12);color:#00e5ff;border:1px solid #00e5ff;box-shadow:0 0 14px rgba(0,229,255,.35);text-transform:uppercase;letter-spacing:.14em;font-size:11px}
.btn.s{color:#6fb7c6;border-color:rgba(0,229,255,.35);box-shadow:none}
.bars i{background:linear-gradient(#00e5ff,rgba(0,229,255,.15));border-radius:0;box-shadow:0 0 10px rgba(0,229,255,.5)}
.pills span{background:transparent;border:1px solid rgba(0,229,255,.45);color:#8fd3df;text-transform:uppercase;letter-spacing:.1em;font-size:10.5px;border-radius:0}
.c1 .n{font-family:Orbitron;font-weight:500;text-shadow:0 0 12px rgba(0,229,255,.7)}.c1 small{text-transform:uppercase;letter-spacing:.14em;font-size:10px}""")

STYLES["pixel-art"] = dict(
    titulo="Pixel art", fuentes="family=Press+Start+2P&family=VT323",
    cambia="Estética de videojuego de 8 bits: tipografía de píxeles, bordes escalonados sin curvas, colores de paleta limitada y barras en bloques. Nostálgico y muy reconocible.",
    css=""":root{--bg:#1a1c2c;--card:#292b45;--card2:#3b3f63;--edge:#f4f4f4;--ink:#f4f4f4;--ink2:#a7b1d9;--acc:#ffcd75;--accink:#1a1c2c;--r:0;--rb:0;--font:'VT323',monospace}
body{font-size:20px;image-rendering:pixelated}
.g{border:0;box-shadow:0 -4px 0 0 #f4f4f4,0 4px 0 0 #f4f4f4,-4px 0 0 0 #f4f4f4,4px 0 0 0 #f4f4f4}
nav{margin:4px}nav b{font-family:'Press Start 2P';font-size:15px;color:#ffcd75}nav ul{font-size:20px}
h1{font-family:'Press Start 2P';font-size:30px;line-height:1.5;letter-spacing:0;font-weight:400;text-shadow:4px 4px 0 #b13e53}
.lead{font-size:23px}
.btn{font-family:'Press Start 2P';font-size:11px;padding:14px 18px;box-shadow:0 -4px 0 0 #1a1c2c,0 4px 0 0 #1a1c2c,-4px 0 0 0 #1a1c2c,4px 0 0 0 #1a1c2c,inset -4px -4px 0 rgba(0,0,0,.25);margin:4px}
.btn.s{background:#3b3f63;color:#f4f4f4;border:0}
.c1 small{font-size:18px}.c1 .n{font-family:'Press Start 2P';font-size:26px;color:#ffcd75}
.bars i{background:#38b764;border-radius:0;box-shadow:inset -6px 0 0 rgba(0,0,0,.25)}.bars i:nth-child(even){background:#41a6f6}
.pills span{border:0;background:#3b3f63;font-size:18px;box-shadow:0 -3px 0 0 #a7b1d9,0 3px 0 0 #a7b1d9,-3px 0 0 0 #a7b1d9,3px 0 0 0 #a7b1d9;margin:3px}
.t{font-size:19px}.feat h3{font-family:'Press Start 2P';font-size:12px;line-height:1.6}.feat p{font-size:20px}""")

STYLES["e-ink-paper"] = dict(
    titulo="E-ink / papel", fuentes="family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400",
    cambia="Se ve como papel o como una pantalla de tinta electrónica: fondo marfil mate, solo tonos de gris y negro, sin sombras ni brillos y texto en serif pensado para leer sin cansarse.",
    css=""":root{--bg:#ecebe4;--card:#f4f3ec;--card2:#e4e3da;--edge:#1c1c1c;--ink:#1c1c1c;--ink2:#444;--acc:#1c1c1c;--accink:#f4f3ec;--r:2px;--rb:2px;--font:'Source Serif 4',Georgia,serif}
.g{border:1px solid #1c1c1c;box-shadow:none}
nav{border-width:0 0 2px 0;border-radius:0;background:none}nav b{font-style:italic}
h1{font-weight:700;letter-spacing:-.025em;font-size:58px}
.lead{font-size:19px;color:#2a2a2a}
.btn{border:2px solid #1c1c1c}.btn.s{background:none;border:2px solid #1c1c1c}
.bars i{background:repeating-linear-gradient(0deg,#1c1c1c 0 2px,#ecebe4 2px 4px);border:1px solid #1c1c1c;border-radius:0}.bars i:last-child{background:#1c1c1c}
.pills span{background:none;border:1px solid #1c1c1c}
.t span{color:#1c1c1c;font-style:italic}""")

STYLES["gen-z-chaos-maximalism"] = dict(
    titulo="Caos Gen Z / maximalismo", fuentes="family=Bowlby+One&family=Space+Mono:wght@400;700",
    cambia="Todo a la vez, a propósito: colores ácidos que chocan, pegatinas y etiquetas torcidas, mezcla de tipografías, bordes gruesos y una cinta que atraviesa la pantalla. Parece un collage de internet.",
    top='<div class="tape" aria-hidden="true"><span>¡NUEVO! ★ TU PLATA ★ SIN PLANILLAS ★ ¡NUEVO! ★ TU PLATA ★ SIN PLANILLAS ★ ¡NUEVO! ★ TU PLATA ★ SIN PLANILLAS ★</span></div>',
    css=""":root{--bg:#c6ff3d;--card:#fff;--card2:#ff7ad9;--edge:#000;--ink:#000;--ink2:#111;--acc:#7a2dff;--accink:#fff;--r:18px;--rb:999px;--font:'Space Mono',monospace}
.tape{background:#000;color:#c6ff3d;font-family:'Bowlby One';font-size:15px;white-space:nowrap;overflow:hidden;padding:8px 0;transform:rotate(-1.2deg);margin:12px -10px 0;position:relative;z-index:3}
.tape span{display:inline-block;animation:tp 20s linear infinite}@keyframes tp{to{transform:translateX(-33%)}}
.g{border:3px solid #000;box-shadow:6px 6px 0 #000}
nav{background:#ff7ad9;transform:rotate(.6deg)}nav b{font-family:'Bowlby One';font-size:22px}
h1{font-family:'Bowlby One';font-weight:400;font-size:54px;letter-spacing:-.01em;line-height:1.02;color:#000;text-shadow:3px 3px 0 #fff,6px 6px 0 #7a2dff}
.btn{border:3px solid #000;box-shadow:4px 4px 0 #000;transform:rotate(-2deg);font-weight:700}.btn.s{background:#ffe600;transform:rotate(1.5deg)}
.c1{background:#7a2dff;color:#fff;transform:rotate(-2.5deg)}.c1 small{color:#fff}.bars i{background:#c6ff3d;border:2px solid #000;border-radius:0}
.c2{transform:rotate(2deg);background:#ffe600}
.pills span{border:2px solid #000;background:#fff;box-shadow:3px 3px 0 #000}.pills span:nth-child(1){transform:rotate(-3deg);background:#ff7ad9}.pills span:nth-child(2){transform:rotate(2deg);background:#33e1ff}.pills span:nth-child(3){transform:rotate(-1deg);background:#ffe600}
.feat .g:nth-child(1){background:#ffe600;transform:rotate(-1.5deg)}.feat .g:nth-child(2){background:#33e1ff;transform:rotate(1.2deg)}.feat .g:nth-child(3){background:#ff7ad9;transform:rotate(-1deg)}
.feat h3{font-family:'Bowlby One';font-weight:400}
@media(prefers-reduced-motion:reduce){.tape span{animation:none}}""")

STYLES["biomimetic-organic-2-0"] = dict(
    titulo="Biomimético / orgánico 2.0", fuentes="family=Fraunces:opsz,wght@9..144,400;9..144,600&family=DM+Sans:wght@400;500;700",
    cambia="Inspirado en cómo crece la naturaleza: manchas translúcidas que respiran y cambian de forma, degradés de células y agua, y tarjetas con contornos que se deforman lentamente.",
    css=ORBS_ANIM + """:root{--bg:#07181a;--card:rgba(255,255,255,.07);--card2:rgba(255,255,255,.09);--edge:rgba(160,255,225,.22);--ink:#e8fff7;--ink2:#9fd0c2;--acc:#7dffd4;--accink:#052a22;--r:40px;--rb:999px;--font:'DM Sans',system-ui,sans-serif}
.bg i{filter:blur(48px);opacity:.55;border-radius:60% 40% 55% 45%/50% 60% 40% 50%;animation:morph 14s ease-in-out infinite alternate}
.bg i:nth-child(1){width:55vmax;height:48vmax;background:radial-gradient(circle,#2dd4a8,transparent 65%);top:-20vmax;left:-12vmax}
.bg i:nth-child(2){width:46vmax;height:46vmax;background:radial-gradient(circle,#38bdf8,transparent 65%);top:5vmax;right:-18vmax;animation-delay:-5s}
.bg i:nth-child(3){width:50vmax;height:42vmax;background:radial-gradient(circle,#a3e635,transparent 65%);bottom:-25vmax;left:20vmax;animation-delay:-9s}
@keyframes morph{50%{border-radius:40% 60% 45% 55%/55% 40% 60% 45%;transform:translate(5vmax,3vmax) scale(1.1)}}
.g{backdrop-filter:blur(10px);animation:blob 12s ease-in-out infinite alternate}
@keyframes blob{0%{border-radius:44px 30px 50px 32px/32px 50px 30px 46px}100%{border-radius:30px 48px 32px 52px/48px 32px 50px 30px}}
nav{animation:none;border-radius:999px}
h1{font-family:Fraunces,serif;font-weight:600;letter-spacing:-.03em}
.btn{background:linear-gradient(120deg,#7dffd4,#7dd3fc);box-shadow:0 8px 28px rgba(125,255,212,.3)}
.btn.s{background:rgba(255,255,255,.08);color:var(--ink);border-color:rgba(160,255,225,.3);box-shadow:none}
.bars i{border-radius:999px;background:linear-gradient(#7dffd4,#2dd4bf)}
.pills span{background:rgba(255,255,255,.08);border-color:rgba(160,255,225,.25)}
@media(prefers-reduced-motion:reduce){.g,.bg i{animation:none}}""")

STYLES["anti-polish-raw-aesthetic"] = dict(
    titulo="Antipulido / estética cruda", fuentes="family=Caveat:wght@500;700&family=Rock+Salt&family=Special+Elite",
    cambia="Hecho a mano y sin retocar: papel kraft, trazos irregulares de marcador, notas pegadas con cinta, subrayados de resaltador y letra manuscrita. Imperfecto a propósito, humano y auténtico.",
    css=""":root{--bg:#d9c9a3;--card:#fbf5e3;--card2:#fff2a8;--edge:#2b2b2b;--ink:#222;--ink2:#444;--acc:#e8402a;--accink:#fff;--r:3px 9px 4px 11px/9px 4px 11px 3px;--rb:4px 12px 6px 10px/10px 5px 12px 4px;--font:'Special Elite','Courier New',monospace}
body{background-image:radial-gradient(rgba(0,0,0,.06) 1px,transparent 1.5px),linear-gradient(#dccaa1,#cdb98c);background-size:7px 7px,auto}
.g{border:2.5px solid #2b2b2b;box-shadow:3px 4px 0 rgba(0,0,0,.28)}
nav{background:#fbf5e3;transform:rotate(-.5deg)}nav b{font-family:'Rock Salt',cursive;font-size:17px;font-weight:400}nav ul{font-family:Caveat,cursive;font-size:20px;font-weight:700}
h1{font-family:'Rock Salt',cursive;font-weight:400;font-size:44px;line-height:1.25;letter-spacing:0}
h1::after{content:"";display:block;height:10px;width:70%;background:#ffe44d;opacity:.8;margin-top:-14px;position:relative;z-index:-1;transform:rotate(-1deg)}
.lead{font-family:Caveat,cursive;font-size:26px;font-weight:500;line-height:1.2}
.btn{border:2.5px solid #2b2b2b;font-family:Caveat,cursive;font-size:22px;font-weight:700;padding:6px 18px;transform:rotate(-1.5deg)}.btn.s{transform:rotate(1deg);background:#fff2a8}
.c1{transform:rotate(-1.2deg);background:#fff}.c2{transform:rotate(2deg);background:#fff2a8}
.c1::before{content:"";position:absolute;top:-12px;left:42%;width:90px;height:24px;background:rgba(255,235,150,.75);transform:rotate(-3deg);box-shadow:0 1px 2px rgba(0,0,0,.2)}
.bars i{background:repeating-linear-gradient(45deg,#e8402a 0 5px,#f0735f 5px 9px);border:2px solid #2b2b2b;border-radius:3px 6px 0 0}
.pills span{border:2px dashed #2b2b2b;background:none;font-family:Caveat,cursive;font-size:20px;font-weight:700;transform:rotate(-1deg)}
.feat .g:nth-child(1){transform:rotate(-1deg)}.feat .g:nth-child(2){transform:rotate(1deg);background:#fff2a8}.feat .g:nth-child(3){transform:rotate(-.6deg)}
.feat h3{font-family:'Rock Salt',cursive;font-weight:400;font-size:15px}.feat p{font-family:Caveat,cursive;font-size:21px}""")

STYLES["tactile-digital-deformable-ui"] = dict(
    titulo="Digital táctil / UI deformable", fuentes="family=Fredoka:wght@500;600;700",
    cambia="Los elementos se sienten como gelatina: botones brillantes y abultados que se aplastan al apretarlos y rebotan al soltarlos, y piezas que se estiran al pasar el mouse.",
    css=""":root{--bg:#fff0e0;--card:#fff;--card2:#ffe4cf;--edge:transparent;--ink:#4a2a1a;--ink2:#85604b;--acc:#ff6b4a;--accink:#fff;--r:30px;--rb:999px;--font:Fredoka,system-ui,sans-serif}
.g{border:0;box-shadow:0 10px 0 rgba(255,107,74,.18),0 18px 28px rgba(160,80,40,.12),inset 0 3px 0 #fff;transition:transform .5s cubic-bezier(.3,1.7,.5,1)}
.g:hover{transform:scale(1.03,.97)}
.btn{background:radial-gradient(circle at 30% 25%,#ffb199,#ff6b4a 55%,#e8431f);box-shadow:0 8px 0 #c63a1a,0 14px 20px rgba(200,60,30,.35),inset 0 4px 6px rgba(255,255,255,.55);padding:14px 28px;font-size:15px;font-weight:700;transition:transform .35s cubic-bezier(.3,1.9,.5,1),box-shadow .35s}
.btn:hover{transform:scale(1.08,.94)}.btn:active{transform:translateY(7px) scale(1.04,.88);box-shadow:0 1px 0 #c63a1a,0 4px 8px rgba(200,60,30,.3),inset 0 4px 6px rgba(255,255,255,.5);transition-duration:.08s}
.btn.s{background:radial-gradient(circle at 30% 25%,#fff,#ffe2cc);color:var(--ink);box-shadow:0 8px 0 #e8c4a8,0 14px 20px rgba(160,80,40,.18),inset 0 4px 6px #fff}
.pills span{border:0;background:radial-gradient(circle at 30% 25%,#fff,#ffd9be);box-shadow:0 4px 0 #e8c4a8,inset 0 2px 3px #fff}
.bars i{border-radius:14px 14px 6px 6px;background:radial-gradient(circle at 30% 20%,#ffb199,#ff6b4a);box-shadow:inset 0 3px 4px rgba(255,255,255,.6)}
h1{font-weight:700;letter-spacing:-.03em}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}""")

STYLES["nature-distilled"] = dict(
    titulo="Naturaleza destilada", fuentes="family=Cormorant+Garamond:wght@500;600;700&family=Nunito:wght@400;600",
    cambia="Tonos de tierra apagados (terracota, arena, oliva), textura de lino, tipografía serif suave y mucho espacio. Se siente artesanal, cálido y sin apuro.",
    css=""":root{--bg:#ece3d3;--card:#f6efe2;--card2:#e5d8c2;--edge:#d3c3a6;--ink:#4a3a2a;--ink2:#7b6a55;--acc:#b5654a;--accink:#fff;--r:18px;--rb:999px;--font:Nunito,system-ui,sans-serif}
body{background-image:repeating-linear-gradient(0deg,rgba(120,90,50,.04) 0 1px,transparent 1px 4px),repeating-linear-gradient(90deg,rgba(120,90,50,.04) 0 1px,transparent 1px 4px)}
.g{box-shadow:0 8px 22px rgba(110,80,40,.1)}
h1{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:72px;letter-spacing:-.02em;line-height:.98;color:#5a3f2a}
nav b{font-family:'Cormorant Garamond',serif;font-size:26px}
.btn{background:#b5654a;box-shadow:0 6px 14px rgba(181,101,74,.3)}.btn.s{background:#f6efe2;color:var(--ink);border-color:#d3c3a6}
.bars i{background:linear-gradient(#c9886d,#a85d42);border-radius:6px 6px 0 0}.bars i:nth-child(odd){background:linear-gradient(#a3a97a,#7b8452)}
.pills span{background:#e5d8c2;border-color:#d3c3a6}
.c1{background:#f0e6d4}.feat h3{font-family:'Cormorant Garamond',serif;font-size:24px}""")

STYLES["voice-first-multimodal"] = dict(
    titulo="Multimodal con voz primero", fuentes="family=Inter:wght@400;500;600;700",
    cambia="Se piensa para hablarle: un micrófono grande con ondas, subtítulos de lo que se dice, sugerencias de frases y la respuesta en pantalla y en voz. Los botones pasan a segundo plano.",
    bottom='<div class="mic"><div class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><button type="button" class="micb" aria-label="Hablar">🎙</button><div class="cap">“¿Cuánto me queda este mes?” <b>→ Te quedan $ 842.300</b></div></div>',
    css=""":root{--bg:#0e1424;--card:rgba(255,255,255,.06);--card2:rgba(255,255,255,.08);--edge:rgba(255,255,255,.12);--ink:#f2f5ff;--ink2:#a6b0cf;--acc:#5b8cff;--accink:#fff;--r:22px;--rb:999px;--font:Inter,system-ui,sans-serif}
body{background:radial-gradient(60% 45% at 50% 100%,rgba(91,140,255,.35),transparent 70%),#0e1424;padding-bottom:330px}
h1{font-weight:700;letter-spacing:-.045em}
.btn{background:rgba(91,140,255,.18);color:#c9d8ff;border:1px solid rgba(91,140,255,.4)}.btn.s{background:transparent;color:#a6b0cf;border-color:rgba(255,255,255,.15)}
.pills span{background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.14)}.pills span::before{content:"“";color:#7fa4ff}.pills span::after{content:"”";color:#7fa4ff}
.bars i{background:linear-gradient(#8fb0ff,#5b8cff)}
.mic{position:fixed;left:0;right:0;bottom:0;display:grid;justify-items:center;gap:10px;padding:14px 0 18px;background:linear-gradient(transparent,rgba(14,20,36,.92) 40%);z-index:5}
.micb{width:74px;height:74px;border-radius:50%;border:0;font-size:28px;background:linear-gradient(135deg,#5b8cff,#8b5cf6);box-shadow:0 0 0 10px rgba(91,140,255,.15),0 0 0 22px rgba(91,140,255,.08),0 14px 34px rgba(91,140,255,.5);cursor:pointer;animation:pl 2.4s ease-in-out infinite}
@keyframes pl{50%{box-shadow:0 0 0 14px rgba(91,140,255,.18),0 0 0 30px rgba(91,140,255,.06),0 14px 34px rgba(91,140,255,.5)}}
.wave{display:flex;align-items:center;gap:5px;height:34px}.wave i{width:4px;height:8px;border-radius:2px;background:#8fb0ff;animation:wv 1s ease-in-out infinite}
.wave i:nth-child(2n){animation-delay:.15s}.wave i:nth-child(3n){animation-delay:.3s}.wave i:nth-child(4){animation-delay:.45s}@keyframes wv{50%{height:30px}}
.cap{font-size:14px;color:#c2cbe8}.cap b{color:#fff}
@media(prefers-reduced-motion:reduce){.micb,.wave i{animation:none}}""")

STYLES["chromatic-aberration-rgb-split"] = dict(
    titulo="Aberración cromática / RGB separado", fuentes="family=Space+Mono:wght@400;700&family=Space+Grotesk:wght@500;700",
    cambia="Los canales de color se separan como en una lente defectuosa o una cinta VHS: halos rojos y celestes alrededor de los textos y los bordes, con un temblor ocasional y líneas de ruido.",
    css=""":root{--bg:#0a0a0f;--card:#101018;--card2:#16161f;--edge:#2a2a38;--ink:#f1f1f6;--ink2:#9a9ab0;--acc:#ff2d55;--accink:#fff;--r:6px;--rb:4px;--font:'Space Grotesk',system-ui,sans-serif}
body::after{content:"";position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 3px);z-index:9}
.g{border:1px solid #2a2a38;box-shadow:2px 0 0 rgba(255,45,85,.5),-2px 0 0 rgba(0,229,255,.5)}
h1{font-weight:700;text-shadow:4px 0 rgba(255,45,85,.85),-4px 0 rgba(0,229,255,.85);animation:jit 5s steps(1) infinite}
@keyframes jit{0%,92%,100%{transform:none}93%{transform:translate(3px,-1px)}95%{transform:translate(-3px,1px)}97%{transform:translate(2px,0)}}
nav b{text-shadow:2px 0 rgba(255,45,85,.9),-2px 0 rgba(0,229,255,.9);font-family:'Space Mono',monospace}
.lead,.t,.feat p{font-family:'Space Mono',monospace;font-size:13px}.lead{font-size:15px}
.btn{box-shadow:3px 0 0 rgba(0,229,255,.8),-3px 0 0 rgba(255,255,255,.2)}.btn.s{background:transparent;color:var(--ink);border-color:#444}
.bars i{background:#f1f1f6;border-radius:0;box-shadow:3px 0 0 rgba(255,45,85,.8),-3px 0 0 rgba(0,229,255,.8)}
.c1 .n{text-shadow:3px 0 rgba(255,45,85,.9),-3px 0 rgba(0,229,255,.9)}
.pills span{background:transparent;border:1px solid #444;font-family:'Space Mono',monospace;font-size:12px}
@media(prefers-reduced-motion:reduce){h1{animation:none}}""")

STYLES["vintage-analog-retro-film"] = dict(
    titulo="Analógico vintage / película retro", fuentes="family=Special+Elite&family=Playfair+Display:ital,wght@1,700&family=Courier+Prime:wght@400;700",
    cambia="Una foto de los 70 revelada en casa: colores desteñidos cálidos, grano de película, fugas de luz naranja, marcos tipo polaroid y la fecha impresa abajo, como en una cámara de rollo.",
    css=""":root{--bg:#d8c8a8;--card:#f4ead2;--card2:#eadcb8;--edge:#bfa77a;--ink:#3b2e1e;--ink2:#6b5a43;--acc:#c0562f;--accink:#fff5e0;--r:3px;--rb:3px;--font:'Courier Prime',monospace}
body{background:radial-gradient(circle at 15% 10%,rgba(255,150,60,.35),transparent 45%),radial-gradient(circle at 90% 85%,rgba(255,100,80,.25),transparent 45%),linear-gradient(#e0d0ae,#cdb98f)}
body::after{content:"";position:fixed;inset:0;pointer-events:none;opacity:.35;mix-blend-mode:multiply;z-index:9;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.g{border:0;background:#f7efdb;box-shadow:0 10px 22px rgba(70,45,10,.3)}
.card.g{padding:14px 14px 40px;background:#fbf5e6;transform:rotate(-1.5deg)}.c2{transform:rotate(2deg)}
.c1::after{content:"'78  10  02";position:absolute;right:14px;bottom:10px;font:400 12px 'Special Elite';color:#c0562f;letter-spacing:.1em}
nav{background:#2f2418!important;color:#f1e3c4}nav ul{color:#d8c7a3}
h1{font-family:'Playfair Display',serif;font-style:italic;font-weight:700;color:#5a3a1e;font-size:58px;letter-spacing:-.02em}
.lead{color:#4a3a28;font-size:16px}
.btn{background:#c0562f;box-shadow:0 4px 0 #8a3a1c;font-family:'Special Elite';letter-spacing:.04em}.btn.s{background:#f4ead2;color:#3b2e1e;border:1px solid #bfa77a;box-shadow:0 4px 0 #cdb98f}
.bars i{background:linear-gradient(#d9774a,#a8441f);border-radius:1px 1px 0 0}.bars i:nth-child(even){background:linear-gradient(#6fa6a0,#3f7771)}
.pills span{background:#eadcb8;border:1px solid #bfa77a}
.feat .g{padding:20px 22px;background:#fbf5e6;border-top:12px solid #f7efdb}
.feat h3{font-family:'Playfair Display',serif;font-style:italic}""")

STYLES["bauhaus"] = dict(
    titulo="Bauhaus", fuentes="family=Jost:wght@400;500;700;800",
    cambia="Formas geométricas básicas (círculo, cuadrado, triángulo), colores primarios (rojo, amarillo y azul) con negro, tipografía geométrica en mayúsculas y composición asimétrica con sombras duras.",
    css=""":root{--bg:#f4efe4;--card:#fff;--card2:#ffd400;--edge:#111;--ink:#111;--ink2:#333;--acc:#e63312;--accink:#fff;--r:0;--rb:0;--font:Jost,system-ui,sans-serif}
.bg{display:block;position:fixed;inset:0;z-index:0}
.bg i{position:absolute}.bg i:nth-child(1){width:220px;height:220px;border-radius:50%;background:#ffd400;top:-60px;right:6%}
.bg i:nth-child(2){width:150px;height:150px;background:#1d4ed8;bottom:6%;left:-40px;transform:rotate(12deg)}
.bg i:nth-child(3){width:0;height:0;border-left:80px solid transparent;border-right:80px solid transparent;border-bottom:140px solid #e63312;right:4%;bottom:5%}
.g{border:3px solid #111;box-shadow:8px 8px 0 #111}
nav{background:#111;color:#fff}nav b{text-transform:uppercase;letter-spacing:.14em}nav ul{color:#fff;text-transform:uppercase;letter-spacing:.1em;font-size:12px;font-weight:700}
h1{font-weight:800;text-transform:uppercase;letter-spacing:-.02em;font-size:60px;line-height:.98}
.btn{border:3px solid #111;text-transform:uppercase;letter-spacing:.1em;font-size:12px;font-weight:800}.btn.s{background:#ffd400;color:#111}
.c1{background:#1d4ed8;color:#fff}.c1 small{color:#cfe0ff}.bars i{background:#ffd400;border:2px solid #111;border-radius:0}.bars i:nth-child(3){background:#e63312}
.c2{background:#fff}
.pills span{border:2px solid #111;background:#fff;text-transform:uppercase;letter-spacing:.08em;font-size:11px;font-weight:700}
.feat .g:nth-child(1){background:#e63312;color:#fff}.feat .g:nth-child(2){background:#ffd400}.feat .g:nth-child(3){background:#fff}
.feat .g:nth-child(1) p{color:#fff}.feat h3{text-transform:uppercase;letter-spacing:.04em}""")

STYLES["minimalist-monochrome"] = dict(
    titulo="Monocromo minimalista", fuentes="family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600",
    cambia="Solo blanco, negro y grises: una pieza invertida (fondo negro) como único énfasis, serif de contraste fuerte en los títulos, rótulos en mayúsculas chicas y líneas finas, sin una sola curva.",
    css=""":root{--bg:#fff;--card:#fff;--card2:#fff;--edge:#111;--ink:#111;--ink2:#555;--acc:#111;--accink:#fff;--r:0;--rb:0;--font:Inter,system-ui,sans-serif}
.g{border:1px solid #111;box-shadow:none}
nav{border-width:0 0 1px 0}nav b{font-family:'Playfair Display',serif;font-weight:900;font-size:24px}nav ul{text-transform:uppercase;letter-spacing:.16em;font-size:10.5px;font-weight:600}
h1{font-family:'Playfair Display',serif;font-weight:900;letter-spacing:-.03em;font-size:70px;line-height:.98}
.lead{font-size:16px}
.btn{text-transform:uppercase;letter-spacing:.14em;font-size:11px}.btn.s{background:#fff;border:1px solid #111}
.c1{background:#111;color:#fff;border-color:#111}.c1 small{color:#bbb;text-transform:uppercase;letter-spacing:.14em;font-size:10px}.c1 .n{font-family:'Playfair Display',serif;font-weight:700}
.bars i{background:#fff;border-radius:0}.bars i:nth-child(odd){background:#777}
.pills span{background:none;border:1px solid #111;text-transform:uppercase;letter-spacing:.12em;font-size:10.5px}
.feat h3{font-family:'Playfair Display',serif;font-size:21px}.feat .g{padding:26px}""")



def render(id_, st):
    return PAGE.format(titulo=st["titulo"], fuentes=st["fuentes"], base=BASE, css=st["css"], top=st.get("top", ""), bottom=st.get("bottom", ""), js=st.get("js", ""))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    plano = PAGE.format(titulo="Versión plana", fuentes="family=Manrope:wght@400;500;600;700;800", base=BASE, css="", top="", bottom="", js="")
    (OUT / "_plano.html").write_text(plano, encoding="utf-8")
    for i, st in STYLES.items():
        (OUT / f"{i}.html").write_text(render(i, st), encoding="utf-8")
    print(f"OK · {len(STYLES)} demos de estilos + _plano.html en {OUT}")


if __name__ == "__main__":
    main()

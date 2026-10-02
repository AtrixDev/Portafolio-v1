#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Aguirre Propiedades (inmobiliaria de barrio, inventada). Mundo: arquitectura editorial, azul noche, bronce y papel.
Búsqueda en vivo (operación, barrio, ambientes, precio), favoritos, ficha lateral con pedido de visita y tasación de referencia."""
import json
from lab_demos_pro_lib import shell, escribir
from lab_demos_ilus import casa, depto, svg

TOKENS = dict(bg="#f5f1ea", ink="#13213a", pri="#13213a", ring="#13213a", sel="#a8803f", sb="rgba(19,33,58,.4)", f1="'Newsreader',Georgia,serif", f2="'Hanken Grotesk',system-ui,sans-serif")
FUENTES = "family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Hanken+Grotesk:wght@400;500;600;700"

def ic(d, w=1.8): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
I_BED = ic('<path d="M3 18V7M3 13h18v5M21 13v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="10" r="1.6"/>')
I_M2 = ic('<path d="M4 4h16v16H4z"/><path d="M4 9h5M9 4v5"/>')
I_BATH = ic('<path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3Z"/><path d="M6 12V6a2 2 0 0 1 3.5-1.3M7 19l-1 2M17 19l1 2"/>')
I_HEART = ic('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.600-7 10-7 10Z"/>')
I_X = ic('<path d="M6 6l12 12M18 6 6 18"/>', 2)
I_PIN = ic('<path d="M12 21s7-6 7-11.200a7 7 0 0 0-14 0C5 15 12 21 12 21Z"/><circle cx="12" cy="10" r="2.500"/>')
I_OK = ic('<path d="m5 12.500 4.500 4.500L19 7.500"/>', 2.2)

SKY = svg(620, 460, '''<defs><pattern id="vt" width="22" height="26" patternUnits="userSpaceOnUse"><rect x="4" y="5" width="12" height="15" rx="1.500" fill="#f5f1ea" opacity=".78"/></pattern><pattern id="vt2" width="20" height="24" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="11" height="14" rx="1.500" fill="#13213a" opacity=".16"/></pattern></defs>
<circle cx="470" cy="108" r="64" fill="#e6d4ae"/><circle cx="470" cy="108" r="64" fill="none" stroke="#a8803f" stroke-width="2" opacity=".5"/>
<g><rect x="30" y="196" width="118" height="264" fill="#c9bfa8"/><rect x="30" y="196" width="118" height="264" fill="url(#vt2)"/><rect x="24" y="190" width="130" height="10" fill="#b4a88e"/></g>
<g><rect x="164" y="118" width="148" height="342" fill="#13213a"/><rect x="164" y="118" width="148" height="342" fill="url(#vt)"/><rect x="156" y="110" width="164" height="12" fill="#0b152b"/><rect x="226" y="86" width="24" height="26" fill="#0b152b"/></g>
<g><rect x="326" y="226" width="126" height="234" fill="#8a6a30"/><rect x="326" y="226" width="126" height="234" fill="url(#vt)" opacity=".9"/><path d="M318 226h142l-71-34Z" fill="#6f5424"/></g>
<g><rect x="466" y="160" width="124" height="300" fill="#2b3f66"/><rect x="466" y="160" width="124" height="300" fill="url(#vt)"/><rect x="458" y="152" width="140" height="10" fill="#1b2a49"/></g>
<rect x="0" y="448" width="620" height="12" fill="#13213a"/>
<g><circle cx="150" cy="420" r="24" fill="#4f7a5a"/><rect x="147" y="430" width="6" height="22" fill="#5a3b22"/><circle cx="454" cy="424" r="20" fill="#5f8a68"/><rect x="451" y="432" width="6" height="20" fill="#5a3b22"/></g>''')

# propiedades de ejemplo
P = [
 dict(id="p1", op="venta", t="Departamento", b="Belgrano", d="Juramento 2400", n="3 ambientes con balcón corrido", a=3, m=72, ba=2, pr=189000, art=depto("#dfe6f0", "#ece4d3"), tag="Más visto",
      tx="Living comedor luminoso con balcón al frente, cocina separada y dos dormitorios en suite. Edificio con ascensor y amenities.", f=["Balcón corrido al frente", "Cocina independiente", "Baulera incluida", "Apto crédito"]),
 dict(id="p2", op="venta", t="Casa", b="Núñez", d="Olazábal 3300", n="Casa con jardín y parrilla", a=5, m=210, ba=3, pr=420000, art=casa("#e3ece6", "#f1e6cf", "#8a4b32"), tag="",
      tx="Casa en dos plantas con jardín, quincho con parrilla y cochera para dos autos. Dormitorios en planta alta.", f=["Jardín de 80 m²", "Quincho con parrilla", "Cochera doble", "Calefacción central"]),
 dict(id="p3", op="venta", t="Departamento", b="Colegiales", d="Conde 1500", n="Monoambiente a estrenar", a=1, m=34, ba=1, pr=98000, art=depto("#efe6d4", "#dfe6f0"), tag="A estrenar",
      tx="Monoambiente con balcón y cocina integrada, a estrenar. Ideal inversión o primera vivienda.", f=["A estrenar", "Balcón", "Cocina integrada", "Amenities con SUM"]),
 dict(id="p4", op="venta", t="PH", b="Palermo", d="Gorriti 4800", n="PH reciclado con terraza propia", a=4, m=118, ba=2, pr=265000, art=casa("#dfe6f0", "#fff6e6", "#2b3f66"), tag="Reciclado",
      tx="PH al frente totalmente reciclado, con patio y terraza propia con parrilla. Sin expensas.", f=["Terraza con parrilla", "Patio propio", "Sin expensas", "Reciclado a nuevo"]),
 dict(id="p5", op="venta", t="Departamento", b="Belgrano", d="Echeverría 2000", n="2 ambientes luminoso", a=2, m=48, ba=1, pr=132000, art=depto("#e3ece6", "#ece4d3"), tag="",
      tx="Dos ambientes al contrafrente, muy luminoso y silencioso. Cocina con desayunador.", f=["Contrafrente", "Muy luminoso", "Cocina con desayunador", "Apto profesional"]),
 dict(id="p6", op="alquiler", t="Departamento", b="Belgrano", d="Arribeños 2300", n="2 ambientes con cochera opcional", a=2, m=52, ba=1, pr=780000, art=depto("#dfe6f0", "#f1e6cf"), tag="Disponible ya",
      tx="Dos ambientes con balcón. Contrato por 36 meses con actualización semestral.", f=["Balcón", "Cochera opcional", "Contrato de 36 meses", "Disponible ya"]),
 dict(id="p7", op="alquiler", t="Departamento", b="Núñez", d="Libertador 7200", n="3 ambientes con vista abierta", a=3, m=78, ba=2, pr=1150000, art=depto("#efe6d4", "#dfe6f0"), tag="",
      tx="Tres ambientes en piso alto con vista abierta, cocina con lavadero y dos baños.", f=["Piso alto", "Vista abierta", "Lavadero", "Pileta y gimnasio"]),
 dict(id="p8", op="alquiler", t="Casa", b="Colegiales", d="Zapiola 1700", n="Casa de 4 ambientes con patio", a=4, m=150, ba=2, pr=1900000, art=casa("#e3ece6", "#f1e6cf", "#2b3f66"), tag="",
      tx="Casa con patio y parrilla en calle tranquila, cerca de todo. Acepta mascotas.", f=["Patio con parrilla", "Acepta mascotas", "Cerca del subte", "Cochera"]),
 dict(id="p9", op="alquiler", t="Departamento", b="Palermo", d="Thames 1900", n="Monoambiente amoblado", a=1, m=32, ba=1, pr=520000, art=depto("#e3ece6", "#dfe6f0"), tag="Amoblado",
      tx="Monoambiente amoblado con balcón, ideal para una o dos personas. Servicios aparte.", f=["Amoblado", "Balcón", "Pet friendly", "Lavandería en el edificio"]),
]
for p in P: p["art"] = p["art"]

CSS = r"""
.hd{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 96%,#fff);border-bottom:1px solid transparent;transition:border-color .25s}.hd.sc{border-color:#d9cfbb}
.hd-in{display:flex;align-items:center;justify-content:space-between;height:72px;gap:18px}
.logo{font:600 27px var(--f1);letter-spacing:-.01em}.logo small{display:block;font:600 10.5px var(--f2);letter-spacing:.2em;text-transform:uppercase;color:#8a6a30;margin-top:-2px}
.hd nav{display:flex;gap:30px;font-weight:500;font-size:15px}.hd nav a{padding:6px 0;position:relative}.hd nav a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1.5px;background:#a8803f;transform:scaleX(0);transform-origin:left;transition:transform .3s var(--ease)}.hd nav a:hover::after{transform:scaleX(1)}
.hd-r{display:flex;gap:10px;align-items:center}
.fav{position:relative;display:inline-flex;gap:8px;align-items:center;padding:10px 14px;border-radius:99px;font-weight:600;font-size:14px;box-shadow:inset 0 0 0 1.5px #cfc3aa}.fav:hover{background:rgba(19,33,58,.06)}.fav svg{width:19px;height:19px}.fav .n{min-width:22px;height:22px;display:inline-grid;place-items:center;border-radius:99px;background:var(--pri);color:#fff;font-size:12px;padding:0 6px}.fav .n.bump{animation:bump .26s var(--ease)}@keyframes bump{40%{transform:scale(1.3)}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:14px 24px;border-radius:12px;background:var(--pri);color:#fff;font-weight:600;font-size:15.5px}.btn:hover{background:#0b152b}.btn.br{background:#a8803f;color:#fff}.btn.br:hover{background:#8a6a30}.btn.o{background:transparent;color:var(--pri);box-shadow:inset 0 0 0 1.5px var(--pri)}.btn.o:hover{background:rgba(19,33,58,.07)}
.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(20px,4vw,60px);align-items:center;padding-block:clamp(30px,5vw,64px) clamp(70px,7vw,100px)}
.hero h1{font-size:clamp(2.8rem,6vw,5.2rem);font-weight:500;letter-spacing:-.03em;line-height:.98}.hero h1 em{font-style:italic;color:#8a6a30}
.hero p{margin:22px 0 0;font-size:clamp(1.05rem,1vw + .8rem,1.25rem);max-width:42ch;color:#3c4a66}
.sky{position:relative}.sky svg{width:100%;height:auto;display:block}
.find{position:relative;z-index:2;margin-top:calc(-1 * clamp(52px,5vw,72px));background:#fff;border-radius:26px;padding:clamp(18px,2.4vw,28px);box-shadow:0 30px 60px -28px rgba(19,33,58,.4),0 4px 12px -4px rgba(19,33,58,.12);display:grid;grid-template-columns:auto 1fr 1fr 1.3fr auto;gap:16px;align-items:end}
.seg{position:relative;display:inline-grid;grid-template-columns:1fr 1fr;background:#efe9db;border-radius:14px;padding:4px;isolation:isolate}.seg::before{content:"";position:absolute;z-index:-1;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);background:#fff;border-radius:11px;box-shadow:0 2px 8px rgba(19,33,58,.15);transition:transform .35s var(--ease-io)}.seg[data-op=alquiler]::before{transform:translateX(100%)}.seg button{padding:12px 20px;font-weight:600;font-size:15px;border-radius:11px;color:#55607a;transition:color .2s}.seg button[aria-pressed=true]{color:var(--pri)}
.fld{display:grid;gap:6px}.fld>span{font-size:12.5px;font-weight:700;letter-spacing:.04em;color:#55607a}.fld select{appearance:none;border:0;border-radius:12px;padding:13px 40px 13px 14px;font-weight:600;font-size:15.5px;background:#f5f1ea url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' fill='none' stroke='%2313213a' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m3 5 4 4 4-4'/%3E%3C/svg%3E") no-repeat right 14px center;cursor:pointer;box-shadow:inset 0 0 0 1.5px transparent;transition:box-shadow .2s}.fld select:hover{box-shadow:inset 0 0 0 1.5px #cfc3aa}
.rng output{font-weight:700;color:var(--pri);font-size:14px;float:right}.rng input{width:100%;accent-color:#a8803f;height:44px;cursor:pointer}
.find .btn{height:50px;padding:0 26px;white-space:nowrap}
.res{padding-block:clamp(44px,6vw,80px) 10px}.res-h{display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap;margin-bottom:26px}.res-h h2{font-size:clamp(1.9rem,3.6vw,3rem);font-weight:500;letter-spacing:-.025em}.res-h p{color:#55607a;font-weight:500}
.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.pr{position:relative;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 1px 0 #e5dcc9,0 22px 34px -26px rgba(19,33,58,.4);transition:transform .3s var(--ease),box-shadow .3s;animation:rise .55s var(--ease) both;animation-delay:calc(var(--i,0)*55ms);cursor:pointer;text-align:left}.pr:hover{transform:translateY(-5px);box-shadow:0 1px 0 #e5dcc9,0 34px 44px -26px rgba(19,33,58,.5)}.pr:active{transform:translateY(-2px) scale(.99)}
@keyframes rise{from{opacity:0;transform:translateY(14px) scale(.98)}}
.pr .im{position:relative;aspect-ratio:3/2;overflow:hidden;background:#e8e0cf}.pr .im svg{width:100%;height:100%;display:block;transition:transform .6s var(--ease)}.pr:hover .im svg{transform:scale(1.04)}
.pr .tg{position:absolute;left:12px;top:12px;background:var(--pri);color:#fff;font-size:12px;font-weight:700;padding:5px 11px;border-radius:99px}
.hrt{position:absolute;right:10px;top:10px;width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.94);display:grid;place-items:center;color:var(--pri);transition:transform .16s var(--ease),background .2s}.hrt:active{transform:scale(.88)}.hrt svg{width:20px;height:20px;transition:fill .2s,transform .3s var(--ease)}.hrt[aria-pressed=true]{background:var(--pri);color:#fff}.hrt[aria-pressed=true] svg{fill:currentColor;animation:pop .3s var(--ease)}@keyframes pop{50%{transform:scale(1.3)}}
.pr .bd{padding:18px 20px 20px}.pr .pz{font:500 clamp(1.5rem,2vw,1.9rem) var(--f1);letter-spacing:-.02em}.pr .pz small{font:500 14px var(--f2);color:#55607a}
.pr h3{font:600 17px var(--f2);margin:6px 0 2px;letter-spacing:0;line-height:1.3}.pr .dd{display:flex;gap:6px;align-items:center;color:#55607a;font-size:14px}.pr .dd svg{width:15px;height:15px;flex:none}
.sp{display:flex;gap:16px;margin-top:14px;padding-top:14px;border-top:1px solid #ece5d4;font-size:14px;font-weight:600;color:#3c4a66}.sp span{display:flex;gap:6px;align-items:center}.sp svg{width:18px;height:18px;color:#8a6a30}
.vac{grid-column:1/-1;text-align:center;padding:50px 20px;background:#fff;border-radius:22px}.vac b{display:block;font:500 28px var(--f1);margin-bottom:8px}.vac p{color:#55607a;margin-bottom:18px}
.sec{padding-block:clamp(48px,7vw,96px)}
.tas{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(24px,5vw,72px);align-items:center}
.tas h2,.how h2{font-size:clamp(2rem,4.2vw,3.5rem);font-weight:500;letter-spacing:-.03em}.tas p{margin-top:16px;color:#3c4a66;max-width:42ch}
.tc{background:var(--pri);color:#f3eee3;border-radius:28px;padding:clamp(22px,3vw,34px);box-shadow:0 36px 60px -34px rgba(19,33,58,.7)}.tc label{display:grid;gap:7px;font-size:13px;font-weight:700;letter-spacing:.04em;margin-bottom:16px;color:#c9c2ae}.tc select{appearance:none;border:0;border-radius:12px;padding:13px 14px;font-weight:600;font-size:15.5px;background:#fff;color:var(--pri)}.tc output{float:right;color:#fff}.tc input[type=range]{accent-color:#c9a363;width:100%;height:40px}
.out{margin-top:6px;padding:18px 20px;border-radius:18px;background:#0b152b}.out small{color:#c9c2ae;font-size:13px}.out b{display:block;font:500 clamp(1.7rem,3vw,2.4rem) var(--f1);color:#fff;margin:2px 0}.out span{font-size:13px;color:#c9c2ae}
.tc .btn{width:100%;margin-top:16px}
.how{border-top:1.5px solid var(--ink)}.how ol{list-style:none;margin-top:30px;display:grid}.how li{display:grid;grid-template-columns:70px minmax(0,1fr) minmax(0,1.2fr);gap:20px;padding:26px 0;border-bottom:1px solid #d9cfbb;align-items:baseline}.how li>span{font:500 34px var(--f1);color:#8a6a30}.how li b{font:500 clamp(1.4rem,2.2vw,1.9rem) var(--f1);letter-spacing:-.015em}.how li p{color:#3c4a66;max-width:46ch}
footer{background:var(--pri);color:#d6d2c4;padding:48px 0 90px;margin-top:20px}footer .w{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:flex-end}footer b{font:600 30px var(--f1);color:#fff}footer p{font-size:14px}
/* paneles */
.ov{position:fixed;inset:0;z-index:100;background:rgba(11,21,43,.5);opacity:0;pointer-events:none;transition:opacity .3s var(--ease)}.ov.on{opacity:1;pointer-events:auto}
.dr{position:fixed;top:0;right:0;bottom:0;z-index:110;width:min(520px,100%);background:#faf7f0;transform:translateX(104%);transition:transform .34s var(--ease-drawer);display:flex;flex-direction:column;visibility:hidden;box-shadow:-30px 0 60px -30px rgba(0,0,0,.45)}.dr.on{transform:none;visibility:visible}
.dr>header{display:flex;justify-content:space-between;align-items:center;padding:16px 22px;border-bottom:1px solid #e3dac6}.dr>header h3{font:500 24px var(--f1)}.x{width:40px;height:40px;border-radius:50%;display:grid;place-items:center}.x:hover{background:rgba(0,0,0,.07)}.x svg{width:20px;height:20px}
.dr .bd{flex:1;overflow:auto;padding:0 0 24px}.dr .art{aspect-ratio:3/2;background:#e8e0cf}.dr .art svg{width:100%;height:100%;display:block}.dr .in{padding:22px 24px}
.dr .in h4{font:500 clamp(1.7rem,3vw,2.2rem) var(--f1);letter-spacing:-.02em;line-height:1.05}.dr .in .pz{font:500 30px var(--f1);margin:12px 0 4px}.dr .in .dd{display:flex;gap:6px;align-items:center;color:#55607a}.dr .in .dd svg{width:16px;height:16px}
.dr .in .sp{margin-top:18px}.dr .in p{margin-top:16px;color:#3c4a66}.ft{list-style:none;margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}.ft li{display:flex;gap:9px;align-items:flex-start;font-weight:500;font-size:15px}.ft svg{width:18px;height:18px;flex:none;color:#2f7a4f;margin-top:3px}
.vis{margin-top:24px;padding:20px;background:#fff;border-radius:20px;box-shadow:0 1px 0 #e5dcc9}.vis h5{font:500 21px var(--f1);margin-bottom:12px}.chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}.chip{padding:10px 14px;border-radius:12px;font-weight:600;font-size:14.5px;box-shadow:inset 0 0 0 1.5px #d9cfbb;background:#fff}.chip:hover{box-shadow:inset 0 0 0 1.5px var(--pri)}.chip[aria-pressed=true]{background:var(--pri);color:#fff;box-shadow:none}.chip:disabled{opacity:.4;text-decoration:line-through;cursor:not-allowed}
.vis .btn{width:100%;margin-top:6px}
.fl{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 24px;border-bottom:1px solid #e9e0cc}.fl .t{width:96px;aspect-ratio:3/2;border-radius:10px;overflow:hidden;background:#e8e0cf}.fl .t svg{width:100%;height:100%;display:block}.fl b{display:block;font-weight:600;line-height:1.3}.fl small{color:#55607a}.fl .x{width:36px;height:36px}
.emp{text-align:center;padding:50px 24px;color:#55607a}.emp b{display:block;font:500 24px var(--f1);color:var(--ink);margin-bottom:6px}
.dr .fo{padding:16px 24px 22px;border-top:1px solid #e3dac6}.dr .fo .btn{width:100%}
body.dr-open .fw,body.dr-open .demo{opacity:0;pointer-events:none}
@media(max-width:1000px){.find{grid-template-columns:1fr 1fr}.find .seg{grid-column:1/-1}.find .btn{grid-column:1/-1}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:820px){.hd nav{display:none}.hero,.tas{grid-template-columns:minmax(0,1fr)}.hero .sky{max-width:420px;margin:0 auto}.how li{grid-template-columns:44px minmax(0,1fr)}.how li p{grid-column:2}}
@media(max-width:560px){.grid{grid-template-columns:minmax(0,1fr)}.find{grid-template-columns:minmax(0,1fr)}.ft{grid-template-columns:minmax(0,1fr)}.fav .t{display:none}.hd-r .btn{display:none}.fl{grid-template-columns:76px minmax(0,1fr) auto;padding:12px 18px}.fl .t{width:76px}}
"""

BODY = f'''
<header class="hd" id="hd"><div class="w hd-in"><a class="logo" href="#top">Aguirre<small>Propiedades</small></a>
<nav aria-label="Principal"><a href="#propiedades">Propiedades</a><a href="#tasacion">Tasaciones</a><a href="#como">Cómo trabajamos</a></nav>
<div class="hd-r"><button class="fav press" id="open-fav" aria-label="Ver favoritos">{I_HEART}<span class="t">Favoritos</span><span class="n num" id="fn">0</span></button><a class="btn press" href="#tasacion">Pedir tasación</a></div></div></header>
<main id="top"><section class="w hero"><div><h1 data-rv>Tu próxima casa está en <em>Belgrano.</em></h1><p data-rv style="--d:1">Hace 26 años acompañamos a familias del barrio a comprar, vender y alquilar. Mirá lo que hay hoy y pedí una visita en un toque.</p></div><div class="sky" data-rv style="--d:1">{SKY}</div></section>
<div class="w"><form class="find" id="find" data-rv style="--d:2" onsubmit="return false">
<div class="seg" id="seg" data-op="venta" role="group" aria-label="Operación"><button type="button" data-op="venta" aria-pressed="true" class="press">Comprar</button><button type="button" data-op="alquiler" aria-pressed="false" class="press">Alquilar</button></div>
<label class="fld"><span>Barrio</span><select id="fb"><option value="">Todos</option><option>Belgrano</option><option>Núñez</option><option>Colegiales</option><option>Palermo</option></select></label>
<label class="fld"><span>Ambientes</span><select id="fa"><option value="">Cualquiera</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4 o más</option></select></label>
<label class="fld rng"><span>Precio máximo <output id="po" class="num"></output></span><input type="range" id="fp" aria-label="Precio máximo"></label>
<button class="btn press" type="submit" id="go">Ver propiedades</button></form></div>
<section class="w res" id="propiedades" aria-live="polite"><div class="res-h"><div><h2 id="rt">Propiedades</h2><p id="rs"></p></div></div><div class="grid" id="grid"></div></section>
<section class="w sec" id="tasacion"><div class="tas"><div data-rv><h2>¿Cuánto vale tu propiedad?</h2><p>Con tres datos te damos un valor de referencia. Para la tasación real vamos a verla, medirla y compararla con lo que se vendió cerca.</p></div>
<div class="tc" data-rv style="--d:1"><label>Tipo<select id="tt1"><option>Departamento</option><option>Casa</option><option>PH</option></select></label><label>Barrio<select id="tb"><option>Belgrano</option><option>Núñez</option><option>Colegiales</option><option>Palermo</option></select></label><label>Superficie <output id="tmo" class="num"></output><input type="range" id="tm" min="25" max="250" value="70" aria-label="Superficie en metros cuadrados"></label>
<div class="out"><small>Valor de referencia (ejemplo)</small><b class="num" id="tv">—</b><span>Estimación de ejemplo. La tasación real incluye una visita.</span></div><button class="btn br press" data-wa="Hola, quiero que tasen mi propiedad">Pedir tasación real</button></div></div></section>
<section class="w sec how" id="como"><h2 data-rv>Así trabajamos</h2><ol>
<li data-rv><span>1</span><b>Te escuchamos</b><p>Qué buscás, para cuándo y hasta cuánto. Sin vueltas ni formularios largos.</p></li>
<li data-rv style="--d:1"><span>2</span><b>Te mostramos solo lo que encaja</b><p>Una selección corta, no cien avisos. Coordinamos las visitas en el horario que te quede cómodo.</p></li>
<li data-rv style="--d:2"><span>3</span><b>Te acompañamos hasta la escritura</b><p>Revisamos la documentación con vos y te explicamos cada paso hasta que tenés las llaves.</p></li></ol></section></main>
<footer><div class="w"><div><b>Aguirre Propiedades</b><p>Corredores matriculados · Av. Cabildo 2200, Belgrano · Lunes a viernes de 9 a 18 h</p></div><p>Las propiedades de esta página son un ejemplo.</p></div></footer>
<div class="ov" id="ov"></div>
<aside class="dr" id="dp" role="dialog" aria-modal="true" aria-label="Detalle de la propiedad" aria-hidden="true"><header><h3>Propiedad</h3><button class="x press" data-close aria-label="Cerrar">{I_X}</button></header><div class="bd" id="db"></div></aside>
<aside class="dr" id="fp2" role="dialog" aria-modal="true" aria-label="Favoritos" aria-hidden="true"><header><h3>Tus favoritos</h3><button class="x press" data-close aria-label="Cerrar">{I_X}</button></header><div class="bd" id="fb2"></div><div class="fo" id="ff"></div></aside>
'''

JS = r"""
(function(){
var P=@@P@@;
var IC={bed:'@@BED@@',m2:'@@M2@@',bath:'@@BATH@@',heart:'@@HEART@@',pin:'@@PIN@@',ok:'@@OK@@',x:'@@X@@'};
var S={op:'venta',b:'',a:'',p:0},favs={};
var RNG={venta:[60000,450000,10000,450000],alquiler:[400000,2000000,50000,2000000]};
function precio(p){return p.op==='venta'?'USD '+p.pr.toLocaleString('es-AR'):'$ '+p.pr.toLocaleString('es-AR')+' <small>/ mes</small>'}
function precioT(p){return p.op==='venta'?'USD '+p.pr.toLocaleString('es-AR'):'$ '+p.pr.toLocaleString('es-AR')+' por mes'}
var hd=$('#hd');addEventListener('scroll',function(){hd.classList.toggle('sc',scrollY>8)},{passive:true});
function setRange(){var r=RNG[S.op],i=$('#fp');i.min=r[0];i.max=r[1];i.step=r[2];i.value=r[3];S.p=r[3];lab()}
function lab(){$('#po').textContent=(S.op==='venta'?'USD ':'$ ')+(+$('#fp').value).toLocaleString('es-AR')+(+$('#fp').value>=+$('#fp').max?' o más':'')}
function lista(){return P.filter(function(p){return p.op===S.op&&(!S.b||p.b===S.b)&&(!S.a||(S.a==='4'?p.a>=4:p.a===+S.a))&&(p.pr<=S.p||S.p>=+$('#fp').max)})}
function card(p,i){var f=favs[p.id];return'<article class="pr" style="--i:'+i+'" data-id="'+p.id+'" tabindex="0" role="button" aria-label="Ver '+p.n+', '+p.b+'"><div class="im">'+p.art+(p.tag?'<span class="tg">'+p.tag+'</span>':'')+'<button class="hrt" type="button" data-fav="'+p.id+'" aria-pressed="'+(!!f)+'" aria-label="'+(f?'Quitar de favoritos':'Guardar en favoritos')+'">'+IC.heart+'</button></div><div class="bd"><div class="pz num">'+precio(p)+'</div><h3>'+p.n+'</h3><div class="dd">'+IC.pin+p.d+', '+p.b+'</div><div class="sp num"><span>'+IC.bed+p.a+' amb.</span><span>'+IC.m2+p.m+' m²</span><span>'+IC.bath+p.ba+(p.ba>1?' baños':' baño')+'</span></div></div></article>'}
function draw(){var l=lista(),g=$('#grid');$('#rt').textContent=(S.op==='venta'?'En venta':'En alquiler')+(S.b?' en '+S.b:'');$('#rs').textContent=l.length+(l.length===1?' propiedad':' propiedades');tween($('#cn'),l.length,function(v){return'Ver '+Math.round(v)+(Math.round(v)===1?' propiedad':' propiedades')},380);
 g.innerHTML=l.length?l.map(card).join(''):'<div class="vac"><b>No hay propiedades con esos filtros</b><p>Probá con otro barrio o subí el precio máximo.</p><button class="btn press" id="clr">Limpiar filtros</button></div>'}
$('#go').id='go';$('#go').innerHTML='<span id="cn" data-v="0">Ver propiedades</span>';
$('#seg').onclick=function(e){var b=e.target.closest('button');if(!b)return;S.op=b.dataset.op;this.dataset.op=S.op;$$('button',this).forEach(function(x){x.setAttribute('aria-pressed',x===b)});setRange();draw()};
$('#fb').onchange=function(){S.b=this.value;draw()};$('#fa').onchange=function(){S.a=this.value;draw()};
$('#fp').oninput=function(){S.p=+this.value;lab();draw()};
$('#go').onclick=function(){$('#propiedades').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
document.addEventListener('click',function(e){if(e.target.closest('#clr')){S.b='';S.a='';$('#fb').value='';$('#fa').value='';setRange();draw()}});
/* favoritos */
function nfav(){var n=Object.keys(favs).length,c=$('#fn');c.textContent=n;c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump')}
function favs2(){var ids=Object.keys(favs),b=$('#fb2'),f=$('#ff');if(!ids.length){b.innerHTML='<div class="emp"><b>Todavía no guardaste ninguna</b>Tocá el corazón en las propiedades que te gusten y las juntamos acá.</div>';f.innerHTML='';return}
 b.innerHTML=ids.map(function(id){var p=P.filter(function(x){return x.id===id})[0];return'<div class="fl"><div class="t">'+p.art+'</div><div><b>'+p.n+'</b><small>'+p.b+' · '+precioT(p)+'</small></div><button class="x press" data-unfav="'+id+'" aria-label="Quitar '+p.n+'">'+IC.x+'</button></div>'}).join('');
 f.innerHTML='<button class="btn br press" data-wa="Hola, quiero visitar estas propiedades: '+ids.map(function(id){return P.filter(function(x){return x.id===id})[0].n}).join(', ')+'">Pedir visita por '+ids.length+(ids.length===1?' propiedad':' propiedades')+'</button>'}
function toggleFav(id){if(favs[id])delete favs[id];else favs[id]=1;nfav();draw();favs2()}
document.addEventListener('click',function(e){var h=e.target.closest('[data-fav]');if(h){e.stopPropagation();toggleFav(h.dataset.fav);return}var u=e.target.closest('[data-unfav]');if(u){toggleFav(u.dataset.unfav);return}
 var c=e.target.closest('.pr');if(c)abrir(c.dataset.id)});
document.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('pr')){e.preventDefault();abrir(e.target.dataset.id)}});
/* paneles */
var ov=$('#ov'),last=null;
function openP(id){closeP(true);var p=document.getElementById(id);last=document.activeElement;p.classList.add('on');p.setAttribute('aria-hidden','false');ov.classList.add('on');document.body.classList.add('dr-open');document.body.style.overflow='hidden';setTimeout(function(){var f=$('.x',p);f&&f.focus()},60)}
function closeP(q){$$('.dr.on').forEach(function(p){p.classList.remove('on');p.setAttribute('aria-hidden','true')});ov.classList.remove('on');document.body.classList.remove('dr-open');document.body.style.overflow='';if(!q&&last&&last.focus)last.focus()}
ov.onclick=function(){closeP()};document.addEventListener('click',function(e){if(e.target.closest('[data-close]'))closeP()});addEventListener('keydown',function(e){if(e.key==='Escape')closeP()});
$('#open-fav').onclick=function(){favs2();openP('fp2')};
var visita={d:null,h:null};
function abrir(id){var p=P.filter(function(x){return x.id===id})[0],h='',dias=[];var d=new Date();for(var k=0;k<14&&dias.length<5;k++){d.setDate(d.getDate()+1);if(d.getDay()!==0)dias.push(new Date(d))}
 visita={d:null,h:null};
 $('#db').innerHTML='<div class="art">'+p.art+'</div><div class="in"><h4>'+p.n+'</h4><div class="pz num">'+precio(p)+'</div><div class="dd">'+IC.pin+p.d+', '+p.b+'</div><div class="sp num"><span>'+IC.bed+p.a+' ambientes</span><span>'+IC.m2+p.m+' m²</span><span>'+IC.bath+p.ba+(p.ba>1?' baños':' baño')+'</span></div><p>'+p.tx+'</p><ul class="ft">'+p.f.map(function(f){return'<li>'+IC.ok+f+'</li>'}).join('')+'</ul>'
 +'<div class="vis"><h5>Pedí una visita</h5><div class="chips" id="vd" role="group" aria-label="Día">'+dias.map(function(x,i){return'<button class="chip press" type="button" data-d="'+i+'" aria-pressed="false">'+x.toLocaleDateString('es-AR',{weekday:'short',day:'numeric'})+'</button>'}).join('')+'</div><div class="chips" id="vh" role="group" aria-label="Horario">'+['10:00','12:00','16:00','18:00'].map(function(x,i){return'<button class="chip press num" type="button" data-h="'+x+'" aria-pressed="false"'+(i===1?' disabled':'')+'>'+x+'</button>'}).join('')+'</div><button class="btn br press" id="vb" disabled>Elegí día y horario</button></div></div>';
 $('#db').dataset.p=p.n;$('#db').__dias=dias;$('#db').scrollTop=0;openP('dp')}
document.addEventListener('click',function(e){var d=e.target.closest('#vd .chip'),h=e.target.closest('#vh .chip');if(d){$$('#vd .chip').forEach(function(x){x.setAttribute('aria-pressed',x===d)});visita.d=$('#db').__dias[+d.dataset.d]}if(h&&!h.disabled){$$('#vh .chip').forEach(function(x){x.setAttribute('aria-pressed',x===h)});visita.h=h.dataset.h}
 if(d||h){var b=$('#vb');if(visita.d&&visita.h){b.disabled=false;var t=visita.d.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});b.textContent='Pedir visita el '+t+' a las '+visita.h;b.dataset.wa='Hola, quiero visitar «'+$('#db').dataset.p+'» el '+t+' a las '+visita.h}}});
/* tasación */
var M={Belgrano:3200,'Núñez':3000,Colegiales:2900,Palermo:3300},K={Departamento:1,Casa:1.12,PH:.96};
function tas(){var m=+$('#tm').value,v=m*M[$('#tb').value]*K[$('#tt1').value];$('#tmo').textContent=m+' m²';tween($('#tv'),v,function(x){return'USD '+(Math.round(x*.92/1000)*1000).toLocaleString('es-AR')+' – '+(Math.round(x*1.08/1000)*1000).toLocaleString('es-AR')},420)}
['tm','tb','tt1'].forEach(function(i){$('#'+i).addEventListener('input',tas)});
setRange();draw();tas();
})();
"""

def main():
    js = (JS.replace("@@P@@", json.dumps(P, ensure_ascii=False))
          .replace("@@BED@@", I_BED).replace("@@M2@@", I_M2).replace("@@BATH@@", I_BATH).replace("@@HEART@@", I_HEART).replace("@@PIN@@", I_PIN).replace("@@OK@@", I_OK).replace("@@X@@", I_X))
    escribir("inmobiliaria", shell("Aguirre Propiedades", FUENTES, TOKENS, CSS, BODY, js))
    print("OK · inmobiliaria (pro)")

if __name__ == "__main__":
    main()

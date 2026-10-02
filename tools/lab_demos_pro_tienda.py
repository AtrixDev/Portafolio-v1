#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Casa Bosque (tienda propia de una marca que vende en Mercado Libre). Fotos propias de la Mandolina Börner V5 (publicaciones de Darío).
Mundo: cocina de taller, papel cálido, verde bosque y terracota. Carrito lateral que funciona, estimador de envío y "vista del dueño"."""
from lab_demos_pro_lib import shell, escribir, WA_ICON
from lab_demos_negocios2 import _svg, KNIFE, BOARD, GRATER

TOKENS = dict(bg="#f4eee2", ink="#1c2a22", pri="#1f4d36", ring="#1f4d36", sb="rgba(31,77,54,.4)", f1="'Fraunces',Georgia,serif", f2="'Instrument Sans',system-ui,sans-serif")
FUENTES = "family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,500&family=Instrument+Sans:wght@400;500;600;700"

ICO_BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
ICO_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
ICO_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'

CSS = r"""
.ann{background:var(--pri);color:#e7efe3;text-align:center;font-size:13px;padding:9px 14px;letter-spacing:.01em}
.hd{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 96%,#fff);border-bottom:1px solid transparent;transition:border-color .25s}.hd.sc{border-color:#dccfb6}
.hd-in{display:flex;align-items:center;justify-content:space-between;height:68px;gap:20px}
.logo{font:700 28px var(--f1);letter-spacing:-.025em;color:var(--pri)}
.hd nav{display:flex;gap:30px;font-weight:500;font-size:15px}.hd nav a{position:relative;padding:6px 0}.hd nav a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--pri);transform:scaleX(0);transform-origin:left;transition:transform .3s var(--ease)}.hd nav a:hover::after{transform:scaleX(1)}
.cart{position:relative;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:99px;background:var(--pri);color:#fff;font-weight:600;font-size:14.5px}.cart:hover{background:#17402b}.cart svg{width:19px;height:19px}
.cnt{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:99px;background:#fff;color:var(--pri);font-size:12.5px;font-weight:700}.cnt.bump{animation:bump .26s var(--ease)}@keyframes bump{40%{transform:scale(1.3)}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:15px 26px;border-radius:99px;background:var(--pri);color:#fff;font-weight:600;font-size:16px;box-shadow:0 10px 24px -10px rgba(31,77,54,.7)}.btn:hover{background:#17402b}.btn.sec{background:transparent;color:var(--pri);box-shadow:inset 0 0 0 1.5px var(--pri)}.btn.sec:hover{background:rgba(31,77,54,.07)}
.hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(24px,5vw,64px);align-items:center;padding-block:clamp(28px,5vw,64px) clamp(36px,6vw,76px)}
.hero h1{font-size:clamp(2.7rem,6.2vw,5.4rem);font-weight:700;letter-spacing:-.035em;line-height:.98}.hero h1 em{font-style:italic;font-weight:500;color:#bd4f28}
.hero p{font-size:clamp(1.05rem,1.2vw + .7rem,1.28rem);max-width:44ch;margin:22px 0 30px;color:#394a40}
.cta{display:flex;gap:22px;align-items:center;flex-wrap:wrap}.lnk{font-weight:600;border-bottom:1.5px solid currentColor;padding-bottom:2px;color:var(--pri)}.lnk:hover{color:#bd4f28}
.trust{display:flex;gap:10px 22px;flex-wrap:wrap;list-style:none;margin-top:34px;font-size:14px;font-weight:600;color:#4b5b51}.trust li{display:flex;gap:7px;align-items:center}.trust svg{width:16px;height:16px;color:#2f8a55}
.hero-i{position:relative}.plate{background:#fff;border-radius:40px;padding:10px;box-shadow:0 40px 70px -30px rgba(31,77,54,.45),0 8px 18px -8px rgba(31,77,54,.2);transform:rotate(1.6deg);transition:transform .6s var(--ease)}.plate:hover{transform:rotate(0)}.plate img{display:block;width:100%;height:auto;border-radius:32px;mix-blend-mode:multiply;background:#fff}
.stamp{position:absolute;left:-14px;bottom:34px;background:#bd4f28;color:#fff;border-radius:18px;padding:12px 18px;box-shadow:0 14px 28px -10px rgba(189,79,40,.7);transform:rotate(-4deg);font-weight:600;font-size:14px;line-height:1.25}.stamp b{display:block;font:700 22px var(--f1)}
.sec{padding-block:clamp(44px,7vw,92px)}
.prod{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(22px,4vw,56px);align-items:start}
.gal{position:sticky;top:90px}.main{position:relative;aspect-ratio:1;border-radius:30px;overflow:hidden;background:#ece3d0}.main img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .35s var(--ease)}.main img.off{opacity:0}
.th{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:12px}.th button{aspect-ratio:1;border-radius:14px;overflow:hidden;background:#ece3d0;box-shadow:inset 0 0 0 2px transparent;opacity:.72;transition:opacity .2s,box-shadow .2s,transform .16s var(--ease)}.th button:hover{opacity:1}.th button:active{transform:scale(.96)}.th button[aria-pressed=true]{opacity:1;box-shadow:inset 0 0 0 2.5px var(--pri)}.th img{width:100%;height:100%;object-fit:cover;display:block}
.info h2{font-size:clamp(2rem,3.4vw,3rem);font-weight:700;letter-spacing:-.03em}
.rt{display:flex;gap:8px;align-items:center;margin:10px 0 18px;font-size:14px;color:#4b5b51}.stars{color:#d98a1c;letter-spacing:2px;font-size:15px}
.info>p{color:#394a40;max-width:46ch}
.feat{list-style:none;margin:20px 0 26px;display:grid;gap:10px}.feat li{display:flex;gap:11px;align-items:flex-start;font-weight:500}.feat svg{width:20px;height:20px;flex:none;margin-top:2px;color:#2f8a55}
.price{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap}.price strong{font:700 clamp(2.2rem,3.4vw,3rem) var(--f1);letter-spacing:-.02em}.price span{color:#4b5b51;font-size:15px}.tr{margin-top:6px;font-size:15px;color:#394a40}.tr b{color:#2f8a55}
.buy{display:flex;gap:12px;margin-top:22px;flex-wrap:wrap}
.qty{display:inline-flex;align-items:center;border-radius:99px;box-shadow:inset 0 0 0 1.5px #cdbf9f;background:#fbf7ee}.qty button{width:46px;height:50px;font-size:20px;font-weight:600;border-radius:99px}.qty button:hover{background:rgba(31,77,54,.08)}.qty output{min-width:26px;text-align:center;font-weight:700}
.ship{margin-top:26px;padding:18px 20px;border-radius:20px;background:#ebe2cf}.ship label{font-weight:700;font-size:14.5px;display:block;margin-bottom:8px}.ship .r{display:flex;gap:8px}.ship input{flex:1;min-width:0;border:0;border-radius:12px;padding:12px 14px;background:#fff;box-shadow:inset 0 0 0 1.5px #d8ccb0;font-size:16px}.ship input:focus{outline:2px solid var(--pri);outline-offset:1px}.ship button{padding:0 18px;border-radius:12px;background:var(--pri);color:#fff;font-weight:600}.ship button:hover{background:#17402b}.ship p{margin-top:10px;font-size:14.5px;min-height:1.5em}
.cuts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(20px,4vw,52px);align-items:center}
.cuts h2,.fam h2,.faq h2{font-size:clamp(2rem,4.2vw,3.4rem);font-weight:700;letter-spacing:-.03em;margin-bottom:18px}
.cuts p{max-width:44ch;color:#394a40}.tabla{margin-top:22px;border-top:1.5px solid var(--ink)}.tabla div{display:grid;grid-template-columns:1fr auto;gap:12px;padding:12px 0;border-bottom:1px solid #d5c9ae;font-size:15.5px}.tabla b{font-weight:600}.tabla span{color:#4b5b51;text-align:right}
.ph{border-radius:30px;overflow:hidden;background:#ece3d0;box-shadow:0 30px 50px -28px rgba(31,77,54,.4)}.ph img{display:block;width:100%;height:auto}.ph figcaption{padding:12px 18px;font-size:14px;color:#4b5b51;background:#fbf7ee}
.cuts .two{display:grid;gap:16px}
.fam .gr{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin-top:8px}
.pc{background:#fbf7ee;border-radius:26px;padding:18px;display:flex;flex-direction:column;box-shadow:0 1px 0 #e3d8be,0 18px 30px -22px rgba(31,77,54,.35);transition:transform .25s var(--ease),box-shadow .25s}.pc:hover{transform:translateY(-4px);box-shadow:0 1px 0 #e3d8be,0 28px 40px -22px rgba(31,77,54,.45)}.pc .im{border-radius:18px;background:#ece3d0;padding:18px;display:grid;place-items:center;height:168px}.pc .im svg{max-height:100%;width:auto;max-width:100%}.pc b{font:700 21px var(--f1);margin:16px 0 2px}.pc small{color:#4b5b51}.pc .f{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:16px}.pc strong{font:700 22px var(--f1)}.pc .add{padding:10px 18px;border-radius:99px;font-weight:600;font-size:14.5px;background:var(--pri);color:#fff}.pc .add:hover{background:#17402b}
.faq{max-width:780px}.faq details{border-top:1px solid #cdbf9f;padding:18px 0}.faq details:last-child{border-bottom:1px solid #cdbf9f}.faq summary{font:600 20px var(--f1);cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:16px;align-items:center}.faq summary::-webkit-details-marker{display:none}.faq summary::after{content:"+";font:400 26px var(--f2);transition:transform .3s var(--ease)}.faq details[open] summary::after{transform:rotate(45deg)}.faq p{margin-top:10px;color:#394a40;max-width:60ch}
footer{background:var(--pri);color:#dbe7d6;padding:46px 0 90px;margin-top:30px}footer .w{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:flex-end}footer b{font:700 30px var(--f1);color:#fff}footer p{font-size:14px;opacity:.85}
/* paneles laterales */
.ov{position:fixed;inset:0;z-index:100;background:rgba(20,30,24,.45);opacity:0;pointer-events:none;transition:opacity .3s var(--ease)}.ov.on{opacity:1;pointer-events:auto}
.dr{position:fixed;top:0;right:0;bottom:0;z-index:110;width:min(440px,100%);background:#fbf7ee;box-shadow:-30px 0 60px -30px rgba(0,0,0,.4);transform:translateX(104%);transition:transform .34s var(--ease-drawer);display:flex;flex-direction:column;visibility:hidden}.dr.on{transform:none;visibility:visible}
.dr header{display:flex;justify-content:space-between;align-items:center;padding:20px 22px;border-bottom:1px solid #e0d5bb}.dr h3{font:700 24px var(--f1)}.dr .x{width:40px;height:40px;border-radius:50%;display:grid;place-items:center}.dr .x:hover{background:rgba(0,0,0,.07)}.dr .x svg{width:20px;height:20px}
.dr .bd{flex:1;overflow:auto;padding:18px 22px}.dr .ft{padding:18px 22px 22px;border-top:1px solid #e0d5bb;background:#f6efdf}
.free{margin-bottom:16px;font-size:14px;font-weight:600}.free i{display:block;height:8px;border-radius:99px;background:#e2d7bd;margin-top:8px;overflow:hidden}.free i b{display:block;height:100%;width:0;background:#2f8a55;border-radius:99px;transition:width .6s var(--ease)}
.ln{display:grid;grid-template-columns:64px 1fr auto;gap:14px;align-items:center;padding:14px 0;border-bottom:1px solid #e6dcc4}.ln .t{width:64px;height:64px;border-radius:14px;background:#ece3d0;display:grid;place-items:center;overflow:hidden;padding:6px}.ln .t img{width:100%;height:100%;object-fit:cover;border-radius:10px}.ln .t svg{width:100%;height:auto}.ln b{display:block;font-weight:600}.ln small{display:block;color:#4b5b51}.ln .q{display:inline-flex;align-items:center;margin-top:6px;border-radius:99px;box-shadow:inset 0 0 0 1.5px #cdbf9f}.ln .q button{width:32px;height:32px;border-radius:99px;font-weight:700}.ln .q button:hover{background:rgba(31,77,54,.08)}.ln .q span{min-width:22px;text-align:center;font-weight:700;font-size:14px}.ln strong{font-weight:700}
.empty{text-align:center;padding:40px 10px;color:#4b5b51}.empty svg{width:120px;margin:0 auto 14px;display:block}.empty b{display:block;font:700 22px var(--f1);color:var(--ink);margin-bottom:6px}
.sm{display:flex;justify-content:space-between;margin:6px 0;font-size:15px}.sm.tt{font:700 20px var(--f1);margin-top:12px}.ft .btn{width:100%;margin-top:14px;background:#009ee3;box-shadow:0 10px 24px -10px rgba(0,158,227,.7)}.ft .btn:hover{background:#0087c4}.ft small{display:block;text-align:center;margin-top:10px;color:#4b5b51}
.ow{position:fixed;right:74px;bottom:14px;z-index:90;display:inline-flex;gap:8px;align-items:center;padding:12px 18px;border-radius:99px;background:#1c2a22;color:#fff;font-weight:600;font-size:14px;box-shadow:0 12px 28px -8px rgba(0,0,0,.5)}.ow:hover{background:#2b3f33}.ow i{width:8px;height:8px;border-radius:50%;background:#7fe0a4}
.cal label{display:grid;gap:6px;font-weight:600;font-size:14px;margin-bottom:14px}.cal input{border:0;border-radius:12px;padding:12px 14px;background:#fff;box-shadow:inset 0 0 0 1.5px #d8ccb0;font-size:17px;font-weight:600}.cal small{font-weight:500;color:#4b5b51}
.bars{margin-top:8px;display:grid;gap:14px}.bars .b{font-size:14px;font-weight:600}.bars .bar{height:34px;border-radius:10px;background:#e6dcc4;margin-top:6px;position:relative;overflow:hidden}.bars .bar i{position:absolute;inset:0 auto 0 0;width:0;border-radius:10px;background:#b9a98a;transition:width .55s var(--ease)}.bars .bar.pro i{background:#2f8a55}.bars .bar span{position:absolute;left:12px;top:50%;transform:translateY(-50%);font-weight:700;color:#14201a}
.gain{margin-top:18px;padding:16px 18px;border-radius:16px;background:#1f4d36;color:#fff;font-weight:600}.gain b{display:block;font:700 28px var(--f1)}.own p{font-size:14.5px;color:#394a40;margin-top:16px}
@media(max-width:900px){.hd nav{display:none}.hero,.prod,.cuts{grid-template-columns:minmax(0,1fr)}.gal{position:static}.fam .gr{grid-template-columns:minmax(0,1fr)}.stamp{left:8px}.ow{right:66px;padding:11px 14px}}
@media(max-width:520px){.hero h1{font-size:2.6rem}.buy .btn{flex:1}.cart span.lbl{display:none}.th{gap:6px}}
"""

PRODS = {
    "v5": ("Mandolina V5 Powerline", "5 placas · 10 cortes", 38900, "img", "img/mandolina-1.webp"),
    "cuchillos": ("Set de cuchillos", "Acero inoxidable · 3 piezas", 64500, "svg", _svg(330, 90, KNIFE)),
    "rallador": ("Rallador multiuso", "Acero inoxidable · 4 caras", 12800, "svg", _svg(260, 160, GRATER)),
    "tabla": ("Tabla de madera", "Madera maciza · 35 × 24 cm", 21300, "svg", _svg(260, 160, BOARD)),
}

def ar(n): return f"{n:,}".replace(",", ".")

def construir():
    fam = "".join(f'''<article class="pc" data-rv style="--d:{i}"><div class="im">{PRODS[k][4]}</div><b>{PRODS[k][0]}</b><small>{PRODS[k][1]}</small><div class="f"><strong class="num">$ {ar(PRODS[k][2])}</strong><button class="add press" data-add="{k}">Agregar</button></div></article>''' for i, k in enumerate(["cuchillos", "rallador", "tabla"]))
    body = f'''
<div class="ann">Envíos a todo el país · 6 cuotas sin interés con Mercado Pago · 10 % off por transferencia</div>
<header class="hd" id="hd"><div class="w hd-in"><a class="logo" href="#top">Casa Bosque</a>
<nav aria-label="Principal"><a href="#producto">Mandolina</a><a href="#cortes">Cortes</a><a href="#completa">Completá tu cocina</a><a href="#faq">Preguntas</a></nav>
<button class="cart press" id="open-cart" aria-label="Abrir el carrito">{ICO_BAG}<span class="lbl">Carrito</span><span class="cnt num" id="cnt">0</span></button></div></header>
<main id="top">
<section class="hero w">
 <div><h1 data-rv>Cortá parejo.<br>Cociná en <em>la mitad</em> del tiempo.</h1>
 <p data-rv style="--d:1">La Mandolina V5 rebana, ralla y hace juliana con una cuchilla de acero inoxidable ultra afilada. Cinco placas, más de diez cortes y garantía de 5 años.</p>
 <div class="cta" data-rv style="--d:2"><button class="btn press" id="buy-hero">Comprar · $ 38.900</button><a class="lnk" href="#cortes">Ver los cortes</a></div>
 <ul class="trust" data-rv style="--d:3"><li>{ICO_OK}Envío a todo el país</li><li>{ICO_OK}6 cuotas sin interés</li><li>{ICO_OK}Apta lavavajillas</li></ul></div>
 <div class="hero-i" data-rv style="--d:1"><div class="plate"><img src="img/mandolina-1.webp" alt="Mandolina V5 roja con sus placas de corte y el sujetador" width="500" height="500"></div><div class="stamp"><b>5 años</b>de garantía en las cuchillas</div></div>
</section>
<section class="sec w" id="producto"><div class="prod">
 <div class="gal" data-rv><div class="main" id="main"><img id="m0" src="img/mandolina-2.webp" alt="" width="500" height="500"><img id="m1" class="off" src="img/mandolina-2.webp" alt="" width="500" height="500"></div><div class="th" id="th" role="group" aria-label="Fotos del producto"></div></div>
 <div class="info" data-rv style="--d:1"><h2>Mandolina V5 Powerline</h2>
  <div class="rt"><span class="stars" aria-hidden="true">★★★★★</span><span>4,8 · 312 opiniones</span></div>
  <p>Cuchilla de acero inoxidable ultra afilada con sujetador de seguridad. Hacés rodajas, juliana y cubos en segundos, y todo se guarda en su caja.</p>
  <ul class="feat"><li>{ICO_OK}Más de 10 cortes distintos con 5 placas intercambiables</li><li>{ICO_OK}Sujetador que protege tu mano mientras cortás</li><li>{ICO_OK}Caja incluida para guardar las placas</li><li>{ICO_OK}Apta para lavavajillas</li></ul>
  <div class="price"><strong class="num">$ 38.900</strong><span>6 cuotas de <b class="num">$ 6.483</b> sin interés</span></div>
  <p class="tr"><b class="num">$ 35.010</b> pagando por transferencia (10 % off)</p>
  <div class="buy"><div class="qty" role="group" aria-label="Cantidad"><button class="press" id="qm" aria-label="Una menos">−</button><output id="qv" class="num">1</output><button class="press" id="qp" aria-label="Una más">+</button></div><button class="btn press" id="add-main" style="flex:1">Agregar al carrito</button></div>
  <div class="ship"><label for="cp">¿Cuándo te llega?</label><div class="r"><input id="cp" inputmode="numeric" maxlength="4" placeholder="Tu código postal" autocomplete="postal-code"><button class="press" id="cpb">Calcular</button></div><p id="cpr" aria-live="polite">Ingresá tu código postal y te decimos cuándo llega.</p></div>
 </div></div></section>
<section class="sec w" id="cortes"><div class="cuts">
 <div data-rv><h2>Diez cortes, una sola herramienta.</h2><p>Cambiás la placa con un botón y pasás de rodajas finas a juliana o cubos sin tocar la cuchilla. Todo el espesor se regula girando el sujetador.</p>
 <div class="tabla"><div><b>Rodajas</b><span>1,2 · 2,8 · 5 · 7 mm</span></div><div><b>Juliana fina y gruesa</b><span>placa de 3,5 mm</span></div><div><b>Juliana fina y gruesa</b><span>placa de 7 mm</span></div><div><b>Cubos</b><span>con ambas placas</span></div></div></div>
 <div class="two"><figure class="ph" data-rv><img src="img/mandolina-3.webp" alt="Tabla de cortes disponibles según la placa" width="500" height="500" loading="lazy"><figcaption>Los cortes de cada placa, de un vistazo.</figcaption></figure></div>
</div>
<div class="cuts" style="margin-top:clamp(28px,5vw,64px)"><figure class="ph" data-rv><img src="img/mandolina-4.webp" alt="Mandolina cortando cebolla sobre una tabla" width="500" height="500" loading="lazy"><figcaption>Cortes rápidos con movimientos ascendentes y descendentes.</figcaption></figure>
 <div data-rv style="--d:1"><h2>Rápida y segura.</h2><p>El sujetador mantiene la mano lejos de la cuchilla y las placas se guardan en su caja. Después de usarla, va directo al lavavajillas.</p></div></div></section>
<section class="sec w fam" id="completa"><h2 data-rv>Completá tu cocina</h2><div class="gr">{fam}</div></section>
<section class="sec w faq" id="faq"><h2 data-rv>Preguntas frecuentes</h2>
<details open data-rv><summary>¿Cuánto tarda en llegar?</summary><p>De 2 a 5 días hábiles según tu zona. Te mandamos el código de seguimiento apenas despachamos.</p></details>
<details data-rv><summary>¿Tiene garantía?</summary><p>Sí, 5 años en las cuchillas de acero inoxidable por defectos de fabricación.</p></details>
<details data-rv><summary>¿Es el mismo producto que en Mercado Libre?</summary><p>Es exactamente el mismo. Comprando acá tenés 10 % off por transferencia y combos que en el marketplace no ofrecemos.</p></details>
<details data-rv><summary>¿Puedo cambiarlo si no me convence?</summary><p>Tenés 10 días para devolverlo sin usar. Escribinos por WhatsApp y coordinamos el retiro.</p></details></section>
</main>
<footer><div class="w"><div><b>Casa Bosque</b><p>Utensilios de cocina de calidad profesional · Atención de lunes a viernes</p></div><p>Pagá con Mercado Pago, transferencia o tarjeta.</p></div></footer>
<button class="ow press" id="open-ow"><i></i>Vista del dueño</button>
<div class="ov" id="ov"></div>
<aside class="dr" id="cartp" role="dialog" aria-modal="true" aria-label="Carrito" aria-hidden="true"><header><h3>Tu carrito</h3><button class="x press" data-close aria-label="Cerrar">{ICO_X}</button></header><div class="bd" id="cbd"></div><div class="ft" id="cft"></div></aside>
<aside class="dr" id="owp" role="dialog" aria-modal="true" aria-label="Vista del dueño" aria-hidden="true"><header><h3>Vista del dueño</h3><button class="x press" data-close aria-label="Cerrar">{ICO_X}</button></header>
<div class="bd cal own"><p style="margin:0 0 16px;color:#394a40">Esto no lo ve quien compra: es lo que te queda por cada venta de la mandolina, en Mercado Libre y en tu propia tienda.</p>
<label>Precio de venta<input id="op" type="number" value="38900" min="0" inputmode="numeric"></label>
<label>Comisión del marketplace (%) <small>Valor de ejemplo, cambialo.</small><input id="oc" type="number" value="15" min="0" max="60" inputmode="decimal"></label>
<label>Costo de cobro en tu tienda (%) <small>Valor de ejemplo, cambialo.</small><input id="od" type="number" value="6" min="0" max="30" inputmode="decimal"></label>
<div class="bars"><div class="b">En el marketplace te quedan<div class="bar"><i id="b1"></i><span class="num" id="t1">—</span></div></div><div class="b">En tu tienda te quedan<div class="bar pro"><i id="b2"></i><span class="num" id="t2">—</span></div></div></div>
<div class="gain">Ganás más por cada venta<b class="num" id="gn">—</b><span class="num" id="gn2"></span></div>
<p>Además, en tu tienda guardás el mail y el historial de cada cliente para volver a venderle. La comisión real depende de la categoría y del tipo de publicación.</p></div></aside>
'''
    return body

JS = r"""
(function(){
var P={v5:{n:'Mandolina V5 Powerline',p:38900,t:'<img src="img/mandolina-1.webp" alt="">'},cuchillos:{n:'Set de cuchillos',p:64500,t:'@@K@@'},rallador:{n:'Rallador multiuso',p:12800,t:'@@G@@'},tabla:{n:'Tabla de madera',p:21300,t:'@@B@@'}};
var cart={},FREE=60000,qty=1;
var X='@@X@@';
/* encabezado */
var hd=$('#hd');addEventListener('scroll',function(){hd.classList.toggle('sc',scrollY>8)},{passive:true});
/* galería con fundido cruzado */
var G=[2,3,4,5,1],th=$('#th'),a=$('#m0'),b=$('#m1'),front=a;
th.innerHTML=G.map(function(k,i){return'<button type="button" data-k="'+k+'" aria-pressed="'+(i===0)+'" aria-label="Foto '+(i+1)+' de 5"><img src="img/mandolina-'+k+'.webp" alt="" loading="lazy"></button>'}).join('');
th.onclick=function(e){var bt=e.target.closest('button');if(!bt)return;$$('button',th).forEach(function(x){x.setAttribute('aria-pressed',x===bt)});var back=front===a?b:a;back.src='img/mandolina-'+bt.dataset.k+'.webp';back.classList.remove('off');front.classList.add('off');front=back};
/* cantidad y envío */
$('#qm').onclick=function(){qty=Math.max(1,qty-1);$('#qv').textContent=qty};$('#qp').onclick=function(){qty=Math.min(9,qty+1);$('#qv').textContent=qty};
function dia(n){var d=new Date();var k=0;while(k<n){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)k++}return d.toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'short'})}
$('#cpb').onclick=function(){var v=$('#cp').value.replace(/\D/g,''),r=$('#cpr');if(v.length<4){r.innerHTML='Revisá el código postal: tiene 4 números.';return}var cap=+v>=1000&&+v<=1499;r.innerHTML='Llega entre el <b>'+dia(cap?2:3)+'</b> y el <b>'+dia(cap?3:5)+'</b>. Envío <b>'+(cap?money(4900):money(7900))+'</b>, gratis desde '+money(FREE)+'.'};
$('#cp').addEventListener('keydown',function(e){if(e.key==='Enter')$('#cpb').click()});
/* carrito */
function total(){var t=0;for(var k in cart)t+=cart[k]*P[k].p;return t}
function count(){var n=0;for(var k in cart)n+=cart[k];return n}
function draw(){var n=count(),t=total(),bd=$('#cbd'),ft=$('#cft'),c=$('#cnt');c.textContent=n;
 if(!n){bd.innerHTML='<div class="empty">@@E@@<b>Tu carrito está vacío</b>Sumá la mandolina y completá tu cocina.</div>';ft.innerHTML='<button class="btn press" data-close style="background:var(--pri)">Seguir mirando</button>';return}
 var falta=Math.max(0,FREE-t);
 var h='<div class="free">'+(falta?'Te faltan <span class="num">'+money(falta)+'</span> para el envío gratis':'Tenés envío gratis en esta compra')+'<i><b style="width:'+Math.min(100,t/FREE*100)+'%"></b></i></div>';
 for(var k in cart){h+='<div class="ln"><div class="t">'+P[k].t+'</div><div><b>'+P[k].n+'</b><small class="num">'+money(P[k].p)+'</small><div class="q"><button class="press" data-d="-1" data-k="'+k+'" aria-label="Una menos de '+P[k].n+'">−</button><span class="num">'+cart[k]+'</span><button class="press" data-d="1" data-k="'+k+'" aria-label="Una más de '+P[k].n+'">+</button></div></div><strong class="num">'+money(P[k].p*cart[k])+'</strong></div>'}
 bd.innerHTML=h;
 ft.innerHTML='<div class="sm"><span>Subtotal</span><span class="num">'+money(t)+'</span></div><div class="sm"><span>Envío</span><span>'+(falta?'Se calcula con tu código postal':'Gratis')+'</span></div><div class="sm tt"><span>Total</span><span class="num">'+money(t)+'</span></div><button class="btn press" id="pay">Pagar con Mercado Pago</button><small>Pagando por transferencia tenés 10 % off: '+money(t*.9)+'</small>'}
function add(k,q){cart[k]=(cart[k]||0)+(q||1);draw();var c=$('#cnt');c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump')}
document.addEventListener('click',function(e){var ad=e.target.closest('[data-add]');if(ad){add(ad.dataset.add,1);say('Agregaste «'+P[ad.dataset.add].n+'» al carrito');return}
 var d=e.target.closest('[data-d]');if(d){var k=d.dataset.k;cart[k]+=+d.dataset.d;if(cart[k]<=0)delete cart[k];draw();return}
 if(e.target.closest('#pay')){say('Se abriría el checkout de Mercado Pago con tu pedido.');return}});
$('#add-main').onclick=function(){add('v5',qty);openP('cartp')};
$('#buy-hero').onclick=function(){add('v5',1);openP('cartp')};
/* paneles */
var ov=$('#ov'),last=null;
function openP(id){var p=document.getElementById(id);closeP(true);last=document.activeElement;p.classList.add('on');p.setAttribute('aria-hidden','false');ov.classList.add('on');document.body.classList.add('dr-open');document.body.style.overflow='hidden';setTimeout(function(){var f=$('button,input',p);f&&f.focus()},60)}
function closeP(q){$$('.dr.on').forEach(function(p){p.classList.remove('on');p.setAttribute('aria-hidden','true')});ov.classList.remove('on');document.body.classList.remove('dr-open');document.body.style.overflow='';if(!q&&last)last.focus()}
$('#open-cart').onclick=function(){openP('cartp')};$('#open-ow').onclick=function(){openP('owp')};ov.onclick=function(){closeP()};
document.addEventListener('click',function(e){if(e.target.closest('[data-close]'))closeP()});
addEventListener('keydown',function(e){if(e.key==='Escape')closeP()});
/* vista del dueño */
function calc(){var p=+$('#op').value||0,c=+$('#oc').value||0,d=+$('#od').value||0,a=p*(1-c/100),b=p*(1-d/100);
 tween($('#t1'),a,money);tween($('#t2'),b,money);$('#b1').style.width=(p?a/p*100:0)+'%';$('#b2').style.width=(p?b/p*100:0)+'%';
 tween($('#gn'),b-a,function(v){return money(v)+' por venta'});$('#gn2').textContent=money((b-a)*100)+' cada 100 ventas'}
['op','oc','od'].forEach(function(i){$('#'+i).oninput=calc});calc();draw();
})();
""".replace("@@K@@", _svg(330, 90, KNIFE).replace("'", "\\'")).replace("@@G@@", _svg(260, 160, GRATER).replace("'", "\\'")).replace("@@B@@", _svg(260, 160, BOARD).replace("'", "\\'")).replace("@@X@@", ICO_X.replace("'", "\\'")).replace("@@E@@", _svg(160, 120, '<path d="M34 44h92l-8 62H42Z" fill="#e4d6b6"/><path d="M58 44v-6a22 22 0 0 1 44 0v6" fill="none" stroke="#b9a98a" stroke-width="6" stroke-linecap="round"/><circle cx="68" cy="70" r="4" fill="#fbf7ee"/><circle cx="92" cy="70" r="4" fill="#fbf7ee"/><path d="M66 88q14 10 28 0" fill="none" stroke="#fbf7ee" stroke-width="4" stroke-linecap="round"/>').replace("'", "\\'"))

def main():
    escribir("tienda", shell("Casa Bosque", FUENTES, TOKENS, CSS, construir(), JS))
    print("OK · tienda (pro)")

if __name__ == "__main__":
    main()

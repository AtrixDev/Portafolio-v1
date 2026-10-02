#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Base común de las demos "pro" (hechas con el flujo completo de Impeccable y principios de Emil Kowalski).
Solo aporta el piso de calidad y la mecánica compartida; cada demo trae su propio mundo visual (tipografía, color, composición).
Piso de calidad: foco visible, selección y scrollbar con la paleta, números tabulares, text-wrap, movimiento reducido,
curvas de salida exponenciales, estados presionados (scale .97) y entrada escalonada que parte de lo ya visible."""
from pathlib import Path
OUT = Path(__file__).resolve().parent.parent / "frontend" / "prog-ejemplos" / "negocios"

CARTEL = 'Negocio inventado · demo hecha para esta ficha · <b>Diseñada con Impeccable y principios de Emil Kowalski</b>'

COMUN = """:root{--ease:cubic-bezier(.23,1,.32,1);--ease-io:cubic-bezier(.77,0,.175,1);--ease-drawer:cubic-bezier(.32,.72,0,1)}
*,*::before,*::after{box-sizing:border-box}*{margin:0;padding:0}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%;scrollbar-width:thin;scrollbar-color:var(--sb,rgba(0,0,0,.35)) transparent}
body{font-family:var(--f2);color:var(--ink);background:var(--bg);line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
h1,h2,h3,h4{font-family:var(--f1);text-wrap:balance;line-height:1.04}p,li{text-wrap:pretty}
a{color:inherit;text-decoration:none;text-underline-offset:.2em}button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
img,svg{max-width:100%}
::selection{background:var(--sel,var(--pri));color:var(--sel-ink,#fff)}
:focus-visible{outline:2px solid var(--ring,var(--pri));outline-offset:3px;border-radius:8px}
input,select,textarea{font:inherit;color:inherit;caret-color:var(--pri)}
::-webkit-scrollbar{width:10px;height:10px}::-webkit-scrollbar-thumb{background:var(--sb,rgba(0,0,0,.3));border-radius:99px;border:2px solid var(--bg)}
.num{font-variant-numeric:tabular-nums}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.w{max-width:1180px;margin:0 auto;padding:0 clamp(18px,4vw,36px)}
.press{transition:transform .16s var(--ease),background-color .18s,color .18s,box-shadow .22s,border-color .18s,opacity .18s}.press:active{transform:scale(.97)}
.js [data-rv]{opacity:0;transform:translateY(16px)}
.js [data-rv].in{opacity:1;transform:none;transition:opacity .7s var(--ease),transform .7s var(--ease);transition-delay:calc(var(--d,0)*70ms)}
.demo{position:fixed;left:12px;bottom:12px;z-index:200;max-width:min(520px,calc(100% - 92px));background:rgba(18,18,20,.9);color:#fff;font:600 11.5px/1.4 system-ui,-apple-system,sans-serif;padding:8px 12px;border-radius:10px;backdrop-filter:blur(8px)}
.demo b{color:#ffd84d;font-weight:700}
.fw{position:fixed;right:14px;bottom:14px;z-index:200;width:48px;height:48px;border-radius:50%;background:#25d366;color:#fff;display:grid;place-items:center;box-shadow:0 8px 22px rgba(0,0,0,.28);transition:transform .16s var(--ease)}.fw:active{transform:scale(.94)}.fw svg{width:24px;height:24px}
.toast{position:fixed;left:50%;bottom:76px;z-index:210;max-width:min(560px,calc(100% - 28px));background:#16181a;color:#fff;padding:13px 18px;border-radius:14px;font:600 14px/1.4 system-ui,sans-serif;box-shadow:0 14px 40px rgba(0,0,0,.35);opacity:0;transform:translate(-50%,10px);pointer-events:none;transition:opacity .25s var(--ease),transform .3s var(--ease)}.toast.on{opacity:1;transform:translate(-50%,0)}
body.dr-open .fw,body.dr-open .demo,body.dr-open .ow{opacity:0;pointer-events:none}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}.js [data-rv]{opacity:1;transform:none}}
@media(max-width:560px){.demo{font-size:10.5px;bottom:8px;left:8px;max-width:calc(100% - 72px)}.fw{width:44px;height:44px;right:10px;bottom:10px}}"""

JS_COMUN = """<div class="toast" id="tt" role="status" aria-live="polite"></div><script>
document.documentElement.classList.add('js');
function say(m){var t=document.getElementById('tt');t.textContent=m;t.classList.add('on');clearTimeout(window._t);window._t=setTimeout(function(){t.classList.remove('on')},4200)}
function wa(m){say('Se abriría WhatsApp con: «'+m+'»')}
document.addEventListener('click',function(e){var a=e.target.closest('[data-wa]');if(a){e.preventDefault();wa(a.dataset.wa)}});
(function(){var els=[].slice.call(document.querySelectorAll('[data-rv]'));if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});els.forEach(function(e){io.observe(e)});
setTimeout(function(){els.forEach(function(e){if(e.getBoundingClientRect().top<innerHeight)e.classList.add('in')})},60)})();
function $(s,r){return(r||document).querySelector(s)}function $$(s,r){return[].slice.call((r||document).querySelectorAll(s))}
function money(n,c){return(c||'$')+' '+Math.round(n).toLocaleString('es-AR')}
function tween(el,to,fmt,ms){var from=+el.dataset.v||0,t0=performance.now();ms=ms||520;if(matchMedia('(prefers-reduced-motion: reduce)').matches){el.textContent=fmt(to);el.dataset.v=to;return}
(function f(t){var k=Math.min(1,(t-t0)/ms),e=1-Math.pow(1-k,4);el.textContent=fmt(from+(to-from)*e);if(k<1)requestAnimationFrame(f);else el.dataset.v=to})(t0)}
</script>"""

WA_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.9 5-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.5-6c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-1.5-.7-2.5-1.3-3.4-2.9-.3-.4.3-.4.8-1.4.1-.2 0-.3 0-.5l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.8.8-1 1.7-.9 2.6.2 1.2 1.1 2.5 2.1 3.4 1.6 1.4 3 1.9 4.1 2.2.9.3 2 .2 2.7-.3.5-.4.9-1.1 1-1.7 0-.1 0-.2-.2-.3Z"/></svg>'

def shell(titulo, fuentes, tokens, css, body, js=""):
    """tokens: dict de variables CSS (sin guiones). fuentes: query de Google Fonts."""
    raiz = ":root{" + ";".join(f"--{k}:{v}" for k, v in tokens.items()) + "}"
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{titulo} · ejemplo</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
            f'<link href="https://fonts.googleapis.com/css2?{fuentes}&display=swap" rel="stylesheet"><style>{raiz}{COMUN}{css}</style></head><body>'
            f'{body}<button class="fw" data-wa="Hola, quiero hacer una consulta" aria-label="Escribir por WhatsApp">{WA_ICON}</button>'
            f'<div class="demo">{CARTEL}</div>{JS_COMUN}<script>{js}</script></body></html>')

def escribir(nombre, html):
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f"{nombre}.html").write_text(html, encoding="utf-8")

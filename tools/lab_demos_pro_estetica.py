#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lumière (peluquería y estética en Recoleta, inventada). Mundo: lila suave, ciruela y papel rosado; serif itálica.
Menú de servicios con pestañas, armado del turno (servicios, día y horario con disponibilidad) y mensaje listo para WhatsApp."""
import json
from lab_demos_pro_lib import shell, escribir
from lab_demos_ilus import BOTANICO, MAPA

TOKENS = dict(bg="#f3edf8", ink="#2b1a3f", pri="#5b3a8c", ring="#5b3a8c", sel="#5b3a8c", sb="rgba(91,58,140,.4)", f1="'Instrument Serif',Georgia,serif", f2="'DM Sans',system-ui,sans-serif")
FUENTES = "family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700"

def ic(d, w=1.8): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
I_PLUS = ic('<path d="M12 5v14M5 12h14"/>', 2)
I_OK = ic('<path d="m5 12.500 4.500 4.500L19 7.500"/>', 2.2)
I_X = ic('<path d="M6 6l12 12M18 6 6 18"/>', 2)
I_CLK = ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')

SERV = {
 "Pelo": [("Corte y brushing", "Lavado, corte a medida y brushing.", 60, 18500), ("Color de raíz", "Retoque de color en raíces.", 90, 26000), ("Balayage", "Iluminación natural, a mano alzada.", 180, 62000), ("Keratina", "Alisado y brillo que dura semanas.", 120, 38000)],
 "Uñas": [("Manicuría semipermanente", "Limado, cutículas y esmalte de 3 semanas.", 60, 14000), ("Pedicuría", "Cuidado completo de pies y esmaltado.", 60, 15500), ("Uñas esculpidas", "Extensión y diseño a elección.", 120, 24000)],
 "Rostro": [("Limpieza profunda", "Limpieza, extracción e hidratación.", 75, 21000), ("Máscara hidratante", "Ideal para piel seca o apagada.", 45, 16000), ("Perfilado de cejas", "Diseño según tu rostro.", 30, 8500)],
 "Depilación": [("Piernas completas", "Cera tibia, piel suave por semanas.", 45, 15000), ("Axilas", "Rápido y prolijo.", 15, 5000), ("Cavado", "Cera o depilación definitiva a consultar.", 20, 7500)],
}

CSS = r"""
.hd{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 94%,#fff);border-bottom:1px solid transparent;transition:border-color .25s}.hd.sc{border-color:#dccdee}
.hd-in{display:flex;align-items:center;justify-content:space-between;height:70px;gap:18px}.logo{font:italic 400 34px var(--f1);color:var(--pri);letter-spacing:-.01em}
.hd nav{display:flex;gap:30px;font-weight:500;font-size:15px}.hd nav a{position:relative;padding:6px 0}.hd nav a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1.5px;background:var(--pri);transform:scaleX(0);transform-origin:left;transition:transform .3s var(--ease)}.hd nav a:hover::after{transform:scaleX(1)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:14px 26px;border-radius:99px;background:var(--pri);color:#fff;font-weight:600;font-size:15.5px;box-shadow:0 12px 26px -12px rgba(91,58,140,.8)}.btn:hover{background:#482b73}.btn:disabled{background:#c9bddb;box-shadow:none;cursor:not-allowed}.btn.o{background:transparent;color:var(--pri);box-shadow:inset 0 0 0 1.5px var(--pri)}.btn.o:hover{background:rgba(91,58,140,.08)}
.hero{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(20px,4vw,60px);align-items:center;padding-block:clamp(26px,4vw,56px) clamp(40px,6vw,84px)}
.hero h1{font:400 clamp(3.2rem,7.6vw,6.6rem)/.92 var(--f1);letter-spacing:-.025em}.hero h1 em{color:var(--pri)}
.hero p{margin:24px 0 30px;max-width:40ch;font-size:clamp(1.05rem,1vw + .8rem,1.25rem);color:#4a3866}
.hero .cta{display:flex;gap:14px;flex-wrap:wrap;align-items:center}.hero .cta small{color:#5b4a78;font-weight:500}
.arch{max-width:420px;margin:0 auto;position:relative}.arch svg{width:100%;height:auto;display:block;filter:drop-shadow(0 30px 40px rgba(91,58,140,.28))}
.sec{padding-block:clamp(40px,6vw,84px)}
.sec>h2,.pol h2,.loc h2{font:400 clamp(2.2rem,4.6vw,3.8rem)/1 var(--f1);letter-spacing:-.02em;margin-bottom:10px}.sec>.lead{color:#4a3866;max-width:52ch;margin-bottom:30px}
.book{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(20px,3vw,44px);align-items:start}
.tabs{position:relative;display:inline-flex;gap:4px;padding:5px;border-radius:99px;background:#e7dcf3;margin-bottom:20px;max-width:100%;overflow-x:auto}.tabs .ind{position:absolute;top:5px;bottom:5px;left:0;border-radius:99px;background:#fff;box-shadow:0 2px 10px rgba(91,58,140,.2);transition:transform .38s var(--ease-io),width .38s var(--ease-io)}.tabs button{position:relative;z-index:1;padding:11px 20px;border-radius:99px;font-weight:600;font-size:15px;color:#5b4a78;white-space:nowrap;transition:color .2s}.tabs button[aria-selected=true]{color:var(--pri)}
.menu{list-style:none;border-top:1.5px solid var(--ink)}.menu li{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:14px 22px;align-items:center;padding:18px 0;border-bottom:1px solid #d9c9ec;animation:rise .45s var(--ease) both;animation-delay:calc(var(--i,0)*50ms)}@keyframes rise{from{opacity:0;transform:translateY(10px)}}
.menu b{display:block;font:400 clamp(1.5rem,2.2vw,1.9rem)/1.1 var(--f1)}.menu small{color:#5b4a78;font-size:14.5px}.menu .dt{display:grid;text-align:right;font-size:14px;color:#5b4a78}.menu .dt strong{font:600 16px var(--f2);color:var(--ink)}
.add{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1.5px var(--pri);color:var(--pri);background:transparent}.add:hover{background:rgba(91,58,140,.1)}.add svg{width:20px;height:20px;transition:transform .3s var(--ease)}.add[aria-pressed=true]{background:var(--pri);color:#fff;box-shadow:none}.add[aria-pressed=true] svg{transform:rotate(45deg)}
.sum{position:sticky;top:90px;background:#fffaf7;border-radius:28px;padding:clamp(20px,2.4vw,30px);box-shadow:0 40px 60px -36px rgba(91,58,140,.55),0 2px 0 #eadff5}
.sum h3{font:400 32px var(--f1);margin-bottom:4px}.sum .st{color:#5b4a78;font-size:14.5px;margin-bottom:16px}
.sel{display:flex;flex-wrap:wrap;gap:8px;min-height:40px;margin-bottom:14px}.sel .none{color:#7a6a94;font-size:14.5px;align-self:center}.sel button{display:inline-flex;gap:8px;align-items:center;padding:8px 8px 8px 14px;border-radius:99px;background:#efe6f8;font-weight:600;font-size:14px;animation:pop .3s var(--ease)}@keyframes pop{from{opacity:0;transform:scale(.92)}}.sel button svg{width:16px;height:16px;padding:2px;border-radius:50%;background:#fff;color:var(--pri)}
.tot{display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-block:1px dashed #cdbae3;margin-bottom:16px}.tot span{display:flex;gap:6px;align-items:center;color:#5b4a78;font-size:14.5px}.tot svg{width:17px;height:17px}.tot strong{font:400 34px var(--f1)}
.lbl{display:block;font-size:12.5px;font-weight:700;letter-spacing:.05em;color:#5b4a78;margin:14px 0 8px}
.days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}.days button{padding:9px 0;border-radius:14px;box-shadow:inset 0 0 0 1.5px #dccdee;background:#fff;line-height:1.2;font-size:12.5px;font-weight:600;color:#5b4a78}.days button b{display:block;font:400 22px var(--f1);color:var(--ink)}.days button:hover{box-shadow:inset 0 0 0 1.5px var(--pri)}.days button[aria-pressed=true]{background:var(--pri);color:#e9ddf6;box-shadow:none}.days button[aria-pressed=true] b{color:#fff}
.slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;min-height:46px}.slots button{padding:10px 0;border-radius:12px;font-weight:600;font-size:14.5px;background:#fff;box-shadow:inset 0 0 0 1.5px #dccdee;animation:pop .3s var(--ease) both;animation-delay:calc(var(--i,0)*18ms)}.slots button:hover:not(:disabled){box-shadow:inset 0 0 0 1.5px var(--pri)}.slots button[aria-pressed=true]{background:var(--pri);color:#fff;box-shadow:none}.slots button:disabled{opacity:.38;text-decoration:line-through;cursor:not-allowed}.slots .none{grid-column:1/-1;color:#7a6a94;font-size:14.5px;align-self:center}
.nm{width:100%;border:0;border-radius:14px;padding:13px 15px;background:#fff;box-shadow:inset 0 0 0 1.5px #dccdee;font-size:16px}.nm:focus{outline:2px solid var(--pri);outline-offset:1px}
.msg{margin-top:14px;padding:14px 16px;border-radius:16px;background:#efe6f8;font-size:14.5px;color:#3d2b5a;min-height:3.4em}.msg em{font-style:normal;color:#7a6a94}
.sum .btn{width:100%;margin-top:14px}.sum .fine{margin-top:10px;text-align:center;color:#5b4a78;font-size:13.5px}
.pol{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(20px,4vw,70px);border-top:1.5px solid var(--ink)}.pol dl{display:grid}.pol dl div{display:grid;grid-template-columns:150px minmax(0,1fr);gap:16px;padding:20px 0;border-bottom:1px solid #d9c9ec}.pol dt{font:400 26px var(--f1)}.pol dd{color:#4a3866;max-width:48ch}
.loc{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(20px,4vw,60px);align-items:center}.loc p{margin:12px 0 22px;color:#4a3866}.loc .map{border-radius:26px;overflow:hidden;box-shadow:0 30px 50px -34px rgba(91,58,140,.6)}.loc .map svg{width:100%;height:auto;display:block}
footer{background:var(--ink);color:#d9cdea;padding:44px 0 90px;margin-top:30px}footer .w{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:flex-end}footer b{font:italic 400 34px var(--f1);color:#fff}footer p{font-size:14px}
@media(max-width:900px){.hd nav{display:none}.hero,.book,.pol,.loc{grid-template-columns:minmax(0,1fr)}.sum{position:static}.arch{max-width:300px}.pol dl div{grid-template-columns:minmax(0,1fr)}}
@media(max-width:560px){.menu li{grid-template-columns:minmax(0,1fr) auto}.menu .dt{grid-column:1;text-align:left;grid-template-columns:auto auto;gap:4px 12px;justify-content:start}.menu .add{grid-row:1;grid-column:2}.slots{grid-template-columns:repeat(3,minmax(0,1fr))}.days button{font-size:11px}.days button b{font-size:18px}}
@media(max-width:560px){.hd .btn{padding:10px 16px;font-size:14px;white-space:nowrap}.logo{white-space:nowrap}}
"""

BODY = f'''
<header class="hd" id="hd"><div class="w hd-in"><a class="logo" href="#top">Lumière</a><nav aria-label="Principal"><a href="#turno">Servicios</a><a href="#antes">Antes de venir</a><a href="#donde">Cómo llegar</a></nav><a class="btn press" href="#turno">Reservar turno</a></div></header>
<main id="top"><section class="w hero"><div><h1 data-rv>Reservá tu turno en <em>tres toques.</em></h1><p data-rv style="--d:1">Peluquería y estética en Recoleta. Elegí el servicio, el día y el horario, y te confirmamos por WhatsApp.</p><div class="cta" data-rv style="--d:2"><a class="btn press" href="#turno">Elegir mi turno</a><small>Martes a sábado, de 10 a 19 h</small></div></div><div class="arch" data-rv style="--d:1">{BOTANICO}</div></section>
<section class="w sec" id="turno"><h2 data-rv>Armá tu turno</h2><p class="lead" data-rv style="--d:1">Sumá todos los servicios que quieras: te los hacemos en una sola visita y el horario se ajusta al tiempo total.</p>
<div class="book"><div data-rv><div class="tabs" id="tabs" role="tablist" aria-label="Tipo de servicio"><span class="ind" id="ind"></span></div><ul class="menu" id="menu"></ul></div>
<aside class="sum" data-rv style="--d:1" aria-label="Tu turno"><h3>Tu turno</h3><p class="st" id="st">Elegí uno o más servicios</p><div class="sel" id="sel" aria-live="polite"></div>
<div class="tot"><span>{I_CLK}<b id="td" style="font-weight:600">0 min</b></span><strong class="num" id="tp">$ 0</strong></div>
<span class="lbl">DÍA</span><div class="days" id="days" role="group" aria-label="Día"></div><span class="lbl">HORARIO</span><div class="slots" id="slots" role="group" aria-label="Horario"></div>
<span class="lbl"><label for="nm">TU NOMBRE</label></span><input class="nm" id="nm" placeholder="Cómo te llamamos" autocomplete="given-name"><div class="msg" id="msg" aria-live="polite"></div>
<button class="btn press" id="go" disabled>Reservar por WhatsApp</button><p class="fine">Te confirmamos por el mismo chat. Sin pagar nada ahora.</p></aside></div></section>
<section class="w sec"><div class="pol" id="antes"><h2 style="padding-top:26px" data-rv>Antes de venir</h2><dl data-rv style="--d:1"><div><dt>Seña</dt><dd>Para servicios de más de 2 horas pedimos una seña del 20 % por transferencia. Se descuenta del total.</dd></div><div><dt>Cambios</dt><dd>Podés mover o cancelar tu turno hasta 24 horas antes, sin costo, escribiéndonos por WhatsApp.</dd></div><div><dt>Llegada</dt><dd>Te pedimos llegar 5 minutos antes. Si hay una demora de más de 15 minutos, reprogramamos.</dd></div><div><dt>Medios de pago</dt><dd>Efectivo, transferencia, débito y crédito en cuotas con Mercado Pago.</dd></div></dl></div></section>
<section class="w sec" id="donde"><div class="loc"><div data-rv><h2>Cómo llegar</h2><p>Av. Callao 1500, Recoleta. A dos cuadras del subte, con bicicletero en la puerta.</p><a class="btn o press" href="#">Abrir en el mapa</a></div><div class="map" data-rv style="--d:1">{MAPA}</div></div></section></main>
<footer><div class="w"><div><b>Lumière</b><p>Peluquería y estética · Recoleta · Martes a sábado de 10 a 19 h</p></div><p>Los servicios y precios de esta página son un ejemplo.</p></div></footer>
'''

JS = r"""
(function(){
var SV=@@SV@@,X='@@X@@',PL='@@PL@@';
var sel={},day=null,slot=null,tab=Object.keys(SV)[0],dias=[];
var hd=$('#hd');addEventListener('scroll',function(){hd.classList.toggle('sc',scrollY>8)},{passive:true});
/* pestañas con indicador que se desliza */
var tabs=$('#tabs');Object.keys(SV).forEach(function(k,i){var b=document.createElement('button');b.type='button';b.setAttribute('role','tab');b.textContent=k;b.dataset.k=k;b.setAttribute('aria-selected',i===0);tabs.appendChild(b)});
function ind(){var a=$('[aria-selected=true]',tabs),i=$('#ind');i.style.width=a.offsetWidth+'px';i.style.transform='translateX('+a.offsetLeft+'px)'}
tabs.onclick=function(e){var b=e.target.closest('button');if(!b)return;tab=b.dataset.k;$$('button',tabs).forEach(function(x){x.setAttribute('aria-selected',x===b)});ind();menu()};
function dur(m){var h=Math.floor(m/60),r=m%60;return(h?h+' h':'')+(h&&r?' ':'')+(r||!h?r+' min':'')}
function menu(){$('#menu').innerHTML=SV[tab].map(function(s,i){var k=tab+'|'+s[0],on=!!sel[k];return'<li style="--i:'+i+'"><div><b>'+s[0]+'</b><small>'+s[1]+'</small></div><div class="dt num"><strong>'+money(s[3])+'</strong><span>'+dur(s[2])+'</span></div><button class="add press" data-k="'+k+'" aria-pressed="'+on+'" aria-label="'+(on?'Quitar ':'Sumar ')+s[0]+'">'+PL+'</button></li>'}).join('')}
function all(){var o=[];Object.keys(SV).forEach(function(c){SV[c].forEach(function(s){if(sel[c+'|'+s[0]])o.push({k:c+'|'+s[0],n:s[0],m:s[2],p:s[3]})})});return o}
$('#menu').onclick=function(e){var b=e.target.closest('.add');if(!b)return;var k=b.dataset.k;if(sel[k])delete sel[k];else sel[k]=1;b.setAttribute('aria-pressed',!!sel[k]);b.setAttribute('aria-label',(sel[k]?'Quitar ':'Sumar ')+k.split('|')[1]);slot=null;sum()};
$('#sel').onclick=function(e){var b=e.target.closest('button');if(!b)return;delete sel[b.dataset.k];slot=null;menu();sum()};
/* días y horarios */
(function(){var d=new Date();d.setHours(0,0,0,0);while(dias.length<7){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==1)dias.push(new Date(d))}
$('#days').innerHTML=dias.map(function(x,i){return'<button type="button" data-i="'+i+'" aria-pressed="false" class="press">'+x.toLocaleDateString('es-AR',{weekday:'short'}).replace('.','')+'<b class="num">'+x.getDate()+'</b></button>'}).join('')})();
$('#days').onclick=function(e){var b=e.target.closest('button');if(!b)return;day=+b.dataset.i;slot=null;$$('button',this).forEach(function(x){x.setAttribute('aria-pressed',x===b)});slots();msg()};
function ocupado(d,h){return((d*7+h*3+1)%5)===0}
function slots(){var m=all().reduce(function(a,s){return a+s.m},0),box=$('#slots');if(day===null){box.innerHTML='<span class="none">Elegí un día para ver los horarios.</span>';return}
 var out=[],ini=10*60,fin=19*60;for(var t=ini,i=0;t+Math.max(m,30)<=fin;t+=30,i++){var hh=Math.floor(t/60),mm=t%60,txt=('0'+hh).slice(-2)+':'+('0'+mm).slice(-2);out.push('<button type="button" class="press num" style="--i:'+i+'" data-t="'+txt+'" aria-pressed="'+(slot===txt)+'"'+(ocupado(day,i)?' disabled':'')+'>'+txt+'</button>')}
 box.innerHTML=out.length?out.join(''):'<span class="none">Estos servicios juntos no entran en un día. Probá sumando menos.</span>'}
$('#slots').onclick=function(e){var b=e.target.closest('button');if(!b||b.disabled)return;slot=b.dataset.t;$$('button',this).forEach(function(x){x.setAttribute('aria-pressed',x===b)});msg()};
function fecha(){return dias[day].toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}
function msg(){var l=all(),n=$('#nm').value.trim(),g=$('#go'),m=$('#msg');
 if(!l.length||day===null||!slot){m.innerHTML='<em>Así va a salir tu mensaje cuando elijas servicio, día y horario.</em>';g.disabled=true;g.textContent='Reservar por WhatsApp';return}
 var t='Hola Lumière, quiero reservar '+l.map(function(s){return s.n}).join(', ')+' el '+fecha()+' a las '+slot+'. Soy '+(n||'…')+'.';m.textContent=t;g.disabled=false;g.dataset.wa=t;g.textContent='Reservar por WhatsApp'}
$('#nm').oninput=msg;
function sum(){var l=all(),m=l.reduce(function(a,s){return a+s.m},0),p=l.reduce(function(a,s){return a+s.p},0);
 $('#sel').innerHTML=l.length?l.map(function(s){return'<button type="button" class="press" data-k="'+s.k+'" aria-label="Quitar '+s.n+'">'+s.n+X+'</button>'}).join(''):'<span class="none">Todavía no sumaste ningún servicio.</span>';
 $('#st').textContent=l.length?(l.length===1?'1 servicio elegido':l.length+' servicios elegidos'):'Elegí uno o más servicios';
 $('#td').textContent=dur(m);tween($('#tp'),p,money);slots();msg()}
menu();sum();ind();addEventListener('resize',ind);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(ind);
})();
"""

def main():
    js = JS.replace("@@SV@@", json.dumps(SERV, ensure_ascii=False)).replace("@@X@@", I_X).replace("@@PL@@", I_PLUS)
    escribir("estetica", shell("Lumière", FUENTES, TOKENS, CSS, BODY, js))
    print("OK · estetica (pro)")

if __name__ == "__main__":
    main()

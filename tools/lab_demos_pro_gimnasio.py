#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Box Norte (box de funcional y fuerza, inventado). Mundo: industrial oscuro, lima y tipografía condensada.
Grilla de clases por día con lugares disponibles que cambian al reservar, próxima clase calculada con la hora real y planes con descuento trimestral."""
import json
from lab_demos_pro_lib import shell, escribir
from lab_demos_ilus import PESA

TOKENS = dict(bg="#0e1012", ink="#f2f3ee", pri="#c8f031", ring="#c8f031", sel="#c8f031", **{"sel-ink": "#0e1012"}, sb="rgba(200,240,49,.45)", f1="'Barlow Condensed',Impact,sans-serif", f2="'Barlow',system-ui,sans-serif")
FUENTES = "family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700"

def ic(d, w=2): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
I_OK = ic('<path d="m5 12.500 4.500 4.500L19 7.500"/>', 2.4)
I_CLK = ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')

CLASES = {  # día 0..5 = lun..sáb ; (hora, tipo, coach, minutos)
 "sem": [("07:00", "Fuerza", "Nico", 60), ("09:00", "Funcional", "Lu", 60), ("12:30", "WOD", "Fran", 45), ("18:30", "Funcional", "Lu", 60), ("20:00", "Fuerza", "Nico", 60)],
 "sab": [("10:00", "WOD", "Fran", 60), ("11:30", "Movilidad", "Lu", 45)],
}

CSS = r"""
body{background:var(--bg)}
.hd{position:sticky;top:0;z-index:40;background:rgba(14,16,18,.94);border-bottom:1px solid transparent;transition:border-color .25s}.hd.sc{border-color:#262a2f}
.hd-in{display:flex;align-items:center;justify-content:space-between;height:68px;gap:18px}.logo{font:800 30px var(--f1);letter-spacing:.04em;text-transform:uppercase}.logo i{font-style:normal;color:var(--pri)}
.hd nav{display:flex;gap:28px;font:600 15px var(--f1);letter-spacing:.1em;text-transform:uppercase;color:#aeb2b5}.hd nav a{padding:6px 0;transition:color .2s}.hd nav a:hover{color:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:14px 26px;border-radius:10px;background:var(--pri);color:#0e1012;font:700 18px var(--f1);letter-spacing:.06em;text-transform:uppercase}.btn:hover{background:#d8ff4a}.btn:disabled{background:#2a2e33;color:#6d7378;cursor:not-allowed}.btn.o{background:transparent;color:#fff;box-shadow:inset 0 0 0 1.5px #4a5056}.btn.o:hover{background:rgba(255,255,255,.07)}
.hero{position:relative;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(20px,4vw,56px);align-items:center;padding-block:clamp(36px,6vw,84px) clamp(44px,6vw,84px)}
.hero h1{font:800 clamp(3.6rem,9.4vw,6rem)/.9 var(--f1);letter-spacing:-.005em;text-transform:uppercase}.hero h1 span{color:var(--pri);display:block}
.hero p{margin:24px 0 30px;max-width:42ch;font-size:clamp(1.05rem,.9vw + .8rem,1.25rem);color:#b8bcbf}
.cta{display:flex;gap:12px;flex-wrap:wrap}
.hv{position:relative;display:grid;place-items:center;padding-bottom:92px}.hv::before{content:"";position:absolute;inset:6% 0 6% 10%;background:repeating-linear-gradient(115deg,rgba(200,240,49,.16) 0 10px,transparent 10px 24px);clip-path:polygon(18% 0,100% 0,82% 100%,0 100%);opacity:.9}
.hv .kb{position:relative;width:min(300px,64%);filter:drop-shadow(0 30px 40px rgba(200,240,49,.22))}.hv .kb svg{width:100%;height:auto;display:block}
.next{position:absolute;left:0;bottom:0;right:6%;background:#181b1f;border-radius:16px;padding:16px 18px;box-shadow:0 24px 40px -18px rgba(0,0,0,.8),inset 0 0 0 1px #2a2e33}
.next small{display:flex;gap:7px;align-items:center;font:600 13px var(--f1);letter-spacing:.14em;text-transform:uppercase;color:#aeb2b5}.next small svg{width:15px;height:15px;color:var(--pri)}.next b{display:block;font:800 30px/1.05 var(--f1);text-transform:uppercase;margin-top:4px}.next span{display:block;margin-top:4px;color:#b8bcbf;font-size:14.5px}.next em{font-style:normal;color:var(--pri);font-weight:700}
.sec{padding-block:clamp(44px,7vw,92px)}
.sec>h2,.pl>h2,.co h2{font:800 clamp(2.4rem,5.4vw,4.4rem)/.95 var(--f1);text-transform:uppercase;letter-spacing:.005em}.lead{margin:12px 0 28px;max-width:52ch;color:#b8bcbf}
.bar{display:flex;gap:14px 24px;flex-wrap:wrap;align-items:center;justify-content:space-between;margin-bottom:18px}
.days{position:relative;display:inline-flex;gap:2px;padding:4px;border-radius:12px;background:#181b1f;max-width:100%;overflow-x:auto;isolation:isolate}.days .ind{position:absolute;z-index:-1;top:4px;bottom:4px;left:0;border-radius:9px;background:var(--pri);transition:transform .36s var(--ease-io),width .36s var(--ease-io)}.days button{padding:10px 18px;border-radius:9px;font:700 17px var(--f1);letter-spacing:.08em;text-transform:uppercase;color:#aeb2b5;white-space:nowrap;transition:color .2s}.days button small{display:block;font:500 12px var(--f2);letter-spacing:0;opacity:.8}.days button[aria-selected=true]{color:#0e1012}
.fl{display:flex;gap:6px;flex-wrap:wrap}.chip{padding:9px 16px;border-radius:99px;font:600 15px var(--f1);letter-spacing:.08em;text-transform:uppercase;color:#aeb2b5;box-shadow:inset 0 0 0 1.5px #343a40}.chip:hover{color:#fff;box-shadow:inset 0 0 0 1.5px #6d7378}.chip[aria-pressed=true]{background:#fff;color:#0e1012;box-shadow:none}
.list{display:grid;gap:8px}
.cl{display:grid;grid-template-columns:96px minmax(0,1fr) minmax(0,.7fr) auto;gap:16px 24px;align-items:center;padding:16px 20px;background:#14171a;border-radius:16px;box-shadow:inset 0 0 0 1px #23272c;animation:rise .45s var(--ease) both;animation-delay:calc(var(--i,0)*50ms);transition:background .25s,box-shadow .25s}.cl:hover{background:#181b1f}.cl.mine{background:#1b2208;box-shadow:inset 0 0 0 1.5px var(--pri)}.cl.past{opacity:.45}
@keyframes rise{from{opacity:0;transform:translateY(10px)}}
.cl .h{font:800 38px var(--f1);letter-spacing:.01em}.cl .h small{display:block;font:500 13px var(--f2);color:#8e9397;letter-spacing:0}
.cl b{display:block;font:800 28px/1 var(--f1);text-transform:uppercase}.cl .cc{color:#aeb2b5;font-size:14.5px;margin-top:3px}
.sp{font-size:13.5px;color:#aeb2b5;font-weight:600}.sp i{display:block;height:6px;border-radius:99px;background:#262a2f;margin:7px 0 0;overflow:hidden}.sp i b{display:block;height:100%;border-radius:99px;background:var(--pri);transition:width .5s var(--ease)}.sp.low{color:#ffb454}.sp.low i b{background:#ffb454}.sp.full{color:#ff7a6b}.sp.full i b{background:#ff7a6b}
.cl .btn{min-width:150px;padding:12px 20px;font-size:17px}.cl .btn.on{background:transparent;color:var(--pri);box-shadow:inset 0 0 0 2px var(--pri)}.cl .btn.wait{background:#262a2f;color:#d4d7da}
.mine-bar{position:fixed;left:50%;bottom:16px;z-index:60;width:min(640px,calc(100% - 28px));transform:translate(-50%,160%);background:var(--pri);color:#0e1012;border-radius:16px;padding:12px 14px 12px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:0 20px 50px -10px rgba(0,0,0,.7);transition:transform .38s var(--ease-drawer)}.mine-bar.on{transform:translate(-50%,0)}.mine-bar b{font:800 22px var(--f1);text-transform:uppercase}.mine-bar span{display:block;font-size:13.5px;font-weight:600;opacity:.8}.mine-bar .btn{background:#0e1012;color:var(--pri);padding:12px 18px;font-size:16px}.mine-bar .btn:hover{background:#000}
.pl .tg{display:inline-grid;grid-template-columns:1fr 1fr;gap:2px;padding:4px;border-radius:12px;background:#181b1f;margin:6px 0 30px;position:relative;isolation:isolate}.tg .ind{position:absolute;z-index:-1;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);border-radius:9px;background:var(--pri);transition:transform .36s var(--ease-io)}.tg[data-m=tri] .ind{transform:translateX(100%)}.tg button{padding:10px 20px;border-radius:9px;font:700 16px var(--f1);letter-spacing:.08em;text-transform:uppercase;color:#aeb2b5;transition:color .2s}.tg button[aria-pressed=true]{color:#0e1012}.tg button small{font:600 11px var(--f2);letter-spacing:.02em;margin-left:6px;opacity:.85}
.pg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
.pn{display:flex;flex-direction:column;padding:28px;border-radius:22px;background:#14171a;box-shadow:inset 0 0 0 1px #262a2f}.pn h3{font:800 30px var(--f1);text-transform:uppercase}.pn .d{color:#aeb2b5;font-size:15px;margin:2px 0 18px}.pn .p{font:800 clamp(2.6rem,4.2vw,3.6rem)/1 var(--f1)}.pn .p small{font:500 15px var(--f2);color:#8e9397}.pn ul{list-style:none;margin:20px 0 26px;display:grid;gap:10px;font-weight:500}.pn li{display:flex;gap:10px;align-items:flex-start}.pn li svg{width:18px;height:18px;color:var(--pri);flex:none;margin-top:4px}.pn .btn{margin-top:auto;width:100%}
.pn.f{background:var(--pri);color:#0e1012;box-shadow:0 30px 60px -30px rgba(200,240,49,.5);transform:translateY(-12px)}.pn.f .d,.pn.f .p small{color:#31380d}.pn.f li svg{color:#0e1012}.pn.f .btn{background:#0e1012;color:var(--pri)}.pn.f .btn:hover{background:#000}.pn .fl2{align-self:flex-start;padding:4px 12px;border-radius:99px;background:#0e1012;color:var(--pri);font:700 13px var(--f1);letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px}
.co ul{list-style:none;margin-top:26px;border-top:1.5px solid #343a40}.co li{display:grid;grid-template-columns:64px minmax(0,1fr) minmax(0,1.1fr);gap:20px;align-items:center;padding:20px 0;border-bottom:1px solid #262a2f}.co .m{width:56px;height:56px;border-radius:14px;background:var(--pri);color:#0e1012;display:grid;place-items:center;font:800 26px var(--f1)}.co b{font:800 30px var(--f1);text-transform:uppercase}.co p{color:#b8bcbf}
.fin{background:var(--pri);color:#0e1012;padding:clamp(40px,6vw,70px) 0;margin-top:30px}.fin .w{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap}.fin h2{font:800 clamp(2.4rem,5.6vw,4.4rem)/.95 var(--f1);text-transform:uppercase;max-width:14ch}.fin p{font-weight:600;max-width:34ch}.fin .btn{background:#0e1012;color:var(--pri);font-size:22px;padding:18px 32px}.fin .btn:hover{background:#000}
footer{padding:36px 0 92px;color:#8e9397;font-size:14px}footer .w{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}footer b{font:800 24px var(--f1);color:#fff;letter-spacing:.04em;text-transform:uppercase}
@media(max-width:900px){.hd nav{display:none}.hero{grid-template-columns:minmax(0,1fr)}.hv{max-width:360px;margin:0 auto 40px}.pg{grid-template-columns:minmax(0,1fr)}.pn.f{transform:none}.co li{grid-template-columns:56px minmax(0,1fr)}.co li p{grid-column:2}}
@media(max-width:640px){.cl{grid-template-columns:76px minmax(0,1fr);gap:6px 16px;padding:16px}.cl .sp{grid-column:2}.cl .btn{grid-column:1/-1;width:100%}.cl .h{font-size:32px}.next{right:0}}
@media(max-width:560px){.hd .btn{padding:10px 16px;font-size:14px;white-space:nowrap}.logo{white-space:nowrap}}
"""

BODY = f'''
<header class="hd" id="hd"><div class="w hd-in"><a class="logo" href="#top">Box <i>Norte</i></a><nav aria-label="Principal"><a href="#clases">Clases</a><a href="#planes">Planes</a><a href="#coaches">Coaches</a></nav><a class="btn press" href="#clases">Clase gratis</a></div></header>
<main id="top"><section class="w hero"><div><h1 data-rv>Entrená fuerte.<span>Entrená acá.</span></h1><p data-rv style="--d:1">Box de funcional y fuerza en Núñez. Clases de 60 minutos con coach, grupos chicos y tu primera clase sin cargo.</p><div class="cta" data-rv style="--d:2"><a class="btn press" href="#clases">Reservar mi clase</a><a class="btn o press" href="#planes">Ver planes</a></div></div>
<div class="hv" data-rv style="--d:1"><div class="kb">{PESA}</div><div class="next" id="next" aria-live="polite"></div></div></section>
<section class="w sec" id="clases"><h2 data-rv>Clases de la semana</h2><p class="lead" data-rv style="--d:1">Elegí el día, tocá la clase y reservá tu lugar. Los cupos son de 14 personas.</p>
<div class="bar"><div class="days" id="days" role="tablist" aria-label="Día de la semana"><span class="ind" id="ind"></span></div><div class="fl" id="fl" role="group" aria-label="Tipo de clase"></div></div>
<div class="list" id="list" aria-live="polite"></div></section>
<section class="w sec pl" id="planes"><h2 data-rv>Planes</h2><div class="tg" id="tg" data-m="men" role="group" aria-label="Periodo"><span class="ind"></span><button type="button" data-m="men" aria-pressed="true" class="press">Mensual</button><button type="button" data-m="tri" aria-pressed="false" class="press">Trimestral<small>-10 %</small></button></div>
<div class="pg" id="pg"></div></section>
<section class="w sec co" id="coaches"><h2 data-rv>Tus coaches</h2><ul data-rv style="--d:1"><li><span class="m">N</span><b>Nico</b><p>Fuerza y barra olímpica. Te enseña la técnica antes de sumar peso.</p></li><li><span class="m">L</span><b>Lu</b><p>Funcional y movilidad. Adapta cada ejercicio a tu nivel y a tus lesiones.</p></li><li><span class="m">F</span><b>Fran</b><p>WOD y preparación física. Entrenamientos intensos con escalas para todos.</p></li></ul></section></main>
<section class="fin"><div class="w"><h2>Tu primera clase es gratis.</h2><div><p>Probá una clase, conocé al grupo y decidí después. Sin matrícula y pagando la cuota con Mercado Pago.</p><div style="margin-top:18px"><a class="btn press" href="#clases">Reservar clase gratis</a></div></div></div></section>
<footer><div class="w"><div><b>Box Norte</b><p>Av. del Libertador 7400, Núñez · Lunes a sábado</p></div><p>Las clases y los precios de esta página son un ejemplo.</p></div></footer>
<div class="mine-bar" id="mine" role="status"><div><b id="mn"></b><span id="mt"></span></div><button class="btn press" id="mgo">Confirmar por WhatsApp</button></div>
'''

JS = r"""
(function(){
var C=@@C@@,CAP=14,DN=['Lun','Mar','Mié','Jue','Vie','Sáb'],OK='@@OK@@',CLK='@@CLK@@';
var hd=$('#hd');addEventListener('scroll',function(){hd.classList.toggle('sc',scrollY>8)},{passive:true});
function dia(d){return d===5?C.sab:C.sem}
function tomados(d,i){return 3+((d*7+i*5)%12)}
var res={};
function key(d,i){return d+'-'+i}
var now=new Date(),hoy=(now.getDay()+6)%7;if(hoy>5)hoy=0;
var sel=hoy,tipo='Todas';
/* próxima clase con la hora real */
function proxima(){var n=new Date(),m=n.getHours()*60+n.getMinutes(),d0=(n.getDay()+6)%7;
 for(var k=0;k<7;k++){var d=(d0+k)%7;if(d>5)continue;var l=dia(d);for(var i=0;i<l.length;i++){var t=l[i][0].split(':'),mm=+t[0]*60+ +t[1];if(k>0||mm>m)return{d:d,i:i,hoy:k===0,k:k}}}return{d:0,i:0,k:1}}
function next(){var p=proxima(),c=dia(p.d)[p.i],left=CAP-tomados(p.d,p.i)-(res[key(p.d,p.i)]?1:0)*0,cuando=p.k===0?'Hoy':p.k===1?'Mañana':DN[p.d];
 $('#next').innerHTML='<small>'+CLK+'Próxima clase</small><b>'+cuando+' '+c[0]+' · '+c[1]+'</b><span>Coach '+c[2]+' · <em>'+(left>0?left+' lugares':'Completa')+'</em></span>'}
/* días */
var dd=$('#days');dd.insertAdjacentHTML('beforeend',DN.map(function(n,i){var f=new Date();f.setDate(f.getDate()+((i-hoy+7)%7));return'<button type="button" role="tab" data-d="'+i+'" aria-selected="'+(i===sel)+'">'+n+'<small class="num">'+f.getDate()+'</small></button>'}).join(''));
function ind(){var a=$('[aria-selected=true]',dd),i=$('#ind');i.style.width=a.offsetWidth+'px';i.style.transform='translateX('+a.offsetLeft+'px)'}
dd.onclick=function(e){var b=e.target.closest('button');if(!b)return;sel=+b.dataset.d;$$('button',dd).forEach(function(x){x.setAttribute('aria-selected',x===b)});ind();list()};
var T=['Todas','Fuerza','Funcional','WOD','Movilidad'];$('#fl').innerHTML=T.map(function(t){return'<button type="button" class="chip press" aria-pressed="'+(t===tipo)+'" data-t="'+t+'">'+t+'</button>'}).join('');
$('#fl').onclick=function(e){var b=e.target.closest('button');if(!b)return;tipo=b.dataset.t;$$('button',this).forEach(function(x){x.setAttribute('aria-pressed',x===b)});list()};
/* lista */
function pasada(d,h){if(d!==hoy)return false;var t=h.split(':'),n=new Date();return +t[0]*60+ +t[1]<=n.getHours()*60+n.getMinutes()&&(n.getDay()+6)%7===hoy}
function list(){var l=dia(sel),h='',n=0;l.forEach(function(c,i){if(tipo!=='Todas'&&c[1]!==tipo)return;n++;var k=key(sel,i),mine=!!res[k],tom=tomados(sel,i)+(mine?1:0),left=CAP-tom,p=pasada(sel,c[0]);
 var cls=left<=0?' full':left<=3?' low':'',lab=left<=0?'Completa':left+(left===1?' lugar':' lugares')+' libres';
 h+='<div class="cl'+(mine?' mine':'')+(p?' past':'')+'" style="--i:'+n+'"><div class="h num">'+c[0]+'<small>'+c[3]+' min</small></div><div><b>'+c[1]+'</b><div class="cc">Coach '+c[2]+'</div></div><div class="sp'+cls+'"><span class="num">'+lab+'</span><i><b style="width:'+Math.min(100,tom/CAP*100)+'%"></b></i></div>'
  +(p?'<button class="btn" disabled>Ya pasó</button>':mine?'<button class="btn on press" data-k="'+k+'" aria-pressed="true">Reservado '+OK+'</button>':left<=0?'<button class="btn wait press" data-k="'+k+'" data-w="1">Lista de espera</button>':'<button class="btn press" data-k="'+k+'" aria-pressed="false">Reservar lugar</button>')+'</div>'});
 $('#list').innerHTML=h||'<p class="lead">No hay clases de ese tipo este día. Probá con otro día o con «Todas».</p>'}
$('#list').onclick=function(e){var b=e.target.closest('button[data-k]');if(!b)return;var k=b.dataset.k;if(b.dataset.w){say('Te anotamos en la lista de espera. Si se libera un lugar, te avisamos por WhatsApp.');return}if(res[k])delete res[k];else res[k]=1;list();mine();next()};
function mine(){var ks=Object.keys(res),b=$('#mine');b.classList.toggle('on',ks.length>0);if(!ks.length)return;
 var tx=ks.sort().map(function(k){var p=k.split('-'),c=dia(+p[0])[+p[1]];return DN[+p[0]]+' '+c[0]+' '+c[1]}),n=ks.length;$('#mn').textContent=n+(n===1?' clase reservada':' clases reservadas');$('#mt').textContent=tx.join(' · ');$('#mgo').dataset.wa='Hola Box Norte, quiero reservar: '+tx.join(', ')+'.'}
/* planes */
var PL=[{n:'2 por semana',d:'Para arrancar sin apuro.',p:38000,f:['8 clases por mes','Coach en cada clase','Reservá por esta web']},{n:'Libre',d:'Todas las clases que quieras.',p:52000,f:['Clases ilimitadas','Zona de pesas libre','Débito automático','Una clase para invitar'],star:1},{n:'Personalizado',d:'Con plan a tu medida.',p:78000,f:['Rutina a medida','Control mensual','Prioridad en las clases']}],per='men';
function planes(){$('#pg').innerHTML=PL.map(function(x,i){return'<article class="pn'+(x.star?' f':'')+'" data-rv>'+(x.star?'<span class="fl2">Más elegido</span>':'')+'<h3>'+x.n+'</h3><p class="d">'+x.d+'</p><div class="p num"><span class="pv" data-v="'+x.p+'" data-i="'+i+'">'+money(x.p)+'</span><small> /mes</small></div><ul>'+x.f.map(function(f){return'<li>'+OK+f+'</li>'}).join('')+'</ul><button class="btn press" data-wa="Hola Box Norte, quiero el plan '+x.n+'">Elegir</button></article>'}).join('');
 $$('#pg [data-rv]').forEach(function(e){e.classList.add('in')})}
$('#tg').onclick=function(e){var b=e.target.closest('button');if(!b)return;per=b.dataset.m;this.dataset.m=per;$$('button',this).forEach(function(x){x.setAttribute('aria-pressed',x===b)});$$('.pv').forEach(function(s){var v=PL[+s.dataset.i].p*(per==='tri'?.9:1);tween(s,v,money,420)})};
planes();list();next();mine();ind();addEventListener('resize',ind);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(ind);
})();
"""

def main():
    js = JS.replace("@@C@@", json.dumps(CLASES, ensure_ascii=False)).replace("@@OK@@", I_OK).replace("@@CLK@@", I_CLK)
    escribir("gimnasio", shell("Box Norte", FUENTES, TOKENS, CSS, BODY, js))
    print("OK · gimnasio (pro)")

if __name__ == "__main__":
    main()

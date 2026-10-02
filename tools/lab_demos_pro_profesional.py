#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lic. Carolina Díaz (psicóloga, inventada). Mundo: papel cálido, verde apagado y terracota; tono sereno y claro.
Orientador de tres preguntas que recomienda la modalidad, primera consulta sin cargo con elección de día y horario, y preguntas frecuentes."""
import json
from lab_demos_pro_lib import shell, escribir
from lab_demos_ilus import CONSULTA

TOKENS = dict(bg="#f4eee4", ink="#2a2420", pri="#2f4a3a", ring="#2f4a3a", sel="#2f4a3a", sb="rgba(47,74,58,.4)", f1="'Young Serif',Georgia,serif", f2="'Figtree',system-ui,sans-serif")
FUENTES = "family=Young+Serif&family=Figtree:wght@400;500;600;700"

def ic(d, w=1.8): return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{d}</svg>'
I_OK = ic('<path d="m5 12.500 4.500 4.500L19 7.500"/>', 2.2)
I_BACK = ic('<path d="M15 6 9 12l6 6"/>', 2)
I_PIN = ic('<path d="M12 21s7-6 7-11.200a7 7 0 0 0-14 0C5 15 12 21 12 21Z"/><circle cx="12" cy="10" r="2.500"/>')
I_VID = ic('<rect x="3" y="6" width="13" height="12" rx="2.500"/><path d="m16 10.500 5-3v9l-5-3"/>')

CSS = r"""
.hd{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--bg) 95%,#fff);border-bottom:1px solid transparent;transition:border-color .25s}.hd.sc{border-color:#ddd0b8}
.hd-in{display:flex;align-items:center;justify-content:space-between;height:72px;gap:18px}.logo{font:400 21px var(--f1);line-height:1.1}.logo small{display:block;font:500 12.5px var(--f2);color:#5b5248;margin-top:2px}
.hd nav{display:flex;gap:28px;font-weight:500;font-size:15px}.hd nav a{position:relative;padding:6px 0}.hd nav a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1.5px;background:var(--pri);transform:scaleX(0);transform-origin:left;transition:transform .3s var(--ease)}.hd nav a:hover::after{transform:scaleX(1)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:14px 24px;border-radius:99px;background:var(--pri);color:#fff;font-weight:600;font-size:15.5px}.btn:hover{background:#223a2c}.btn:disabled{background:#b8c4bb;cursor:not-allowed}.btn.o{background:transparent;color:var(--pri);box-shadow:inset 0 0 0 1.5px var(--pri)}.btn.o:hover{background:rgba(47,74,58,.08)}.btn.t{background:#b8613f}.btn.t:hover{background:#9c4f31}
.hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:clamp(20px,4vw,64px);align-items:center;padding-block:clamp(28px,5vw,64px) clamp(44px,6vw,84px)}
.hero h1{font:400 clamp(2.9rem,6.4vw,5.6rem)/1 var(--f1);letter-spacing:-.025em}.hero h1 em{font-style:italic;color:#b8613f}
.hero p{margin:22px 0 30px;max-width:44ch;font-size:clamp(1.05rem,1vw + .8rem,1.25rem);color:#4a4137}
.cta{display:flex;gap:14px;flex-wrap:wrap}.hero .meta{display:flex;gap:10px 24px;flex-wrap:wrap;margin-top:30px;font-size:14.5px;font-weight:500;color:#4a4137}.meta span{display:flex;gap:8px;align-items:center}.meta svg{width:18px;height:18px;color:var(--pri)}
.vis{position:relative;max-width:420px;margin:0 auto}.vis svg{width:100%;height:auto;display:block;filter:drop-shadow(0 30px 36px rgba(60,40,20,.2))}
.sec{padding-block:clamp(44px,7vw,92px)}
.sec>h2,.abt h2,.faq h2{font:400 clamp(2rem,4.2vw,3.4rem)/1.04 var(--f1);letter-spacing:-.02em}.lead{margin:12px 0 28px;max-width:54ch;color:#4a4137}
.pick{background:#fffaf1;border-radius:32px;padding:clamp(22px,3.4vw,44px);box-shadow:0 2px 0 #e7dcc6,0 40px 60px -40px rgba(60,40,20,.4);max-width:880px}
.prog{display:flex;gap:6px;margin-bottom:26px}.prog i{flex:1;height:5px;border-radius:99px;background:#e7dcc6;position:relative;overflow:hidden}.prog i::after{content:"";position:absolute;inset:0;background:var(--pri);transform:scaleX(0);transform-origin:left;transition:transform .45s var(--ease)}.prog i.on::after{transform:scaleX(1)}
.stp{animation:slide .4s var(--ease) both}@keyframes slide{from{opacity:0;transform:translateX(18px)}}.stp.back{animation-name:slideb}@keyframes slideb{from{opacity:0;transform:translateX(-18px)}}
.stp h3{font:400 clamp(1.6rem,3vw,2.3rem)/1.1 var(--f1);margin-bottom:20px}
.opts{display:grid;gap:10px}.opt{display:flex;justify-content:space-between;align-items:center;gap:14px;text-align:left;padding:18px 20px;border-radius:18px;background:#fff;box-shadow:inset 0 0 0 1.5px #ddd0b8;font-weight:600;font-size:17px;transition:box-shadow .2s,transform .16s var(--ease),background .2s}.opt:hover{box-shadow:inset 0 0 0 2px var(--pri);background:#f7faf7}.opt:active{transform:scale(.985)}.opt svg{width:20px;height:20px;color:var(--pri);opacity:0;transform:translateX(-6px);transition:opacity .2s,transform .25s var(--ease)}.opt:hover svg{opacity:1;transform:none}
.bk{display:inline-flex;gap:6px;align-items:center;margin-top:18px;font-weight:600;color:#5b5248;padding:8px 10px 8px 4px;border-radius:10px}.bk:hover{color:var(--ink)}.bk svg{width:18px;height:18px}
.rs h3{font:400 clamp(1.9rem,3.6vw,2.8rem)/1.05 var(--f1)}.rs .mt{display:inline-block;margin:10px 0 14px;padding:6px 14px;border-radius:99px;background:#e1ebe3;color:#223a2c;font-weight:700;font-size:14px}.rs>p{max-width:56ch;color:#3b342c}
.rs h4{font:400 20px var(--f1);margin:22px 0 10px}.rs ul{list-style:none;display:grid;gap:9px}.rs li{display:flex;gap:10px;align-items:flex-start;font-weight:500}.rs li svg{width:19px;height:19px;color:#2f8a55;flex:none;margin-top:3px}
.rs .row{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px;align-items:center}
.mod{margin-top:6px}.mod details{border-top:1px solid #d6c9af}.mod details:last-child{border-bottom:1px solid #d6c9af}.mod summary{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:18px;align-items:center;padding:22px 0;cursor:pointer;list-style:none}.mod summary::-webkit-details-marker{display:none}.mod summary b{font:400 clamp(1.4rem,2.4vw,1.9rem)/1.1 var(--f1)}.mod summary span{color:#5b5248;font-size:14.5px;font-weight:500}.mod summary::after{content:"+";font:400 28px var(--f2);transition:transform .3s var(--ease)}.mod details[open] summary::after{transform:rotate(45deg)}.mod p{padding:0 0 22px;max-width:62ch;color:#3b342c}
.abt{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(24px,5vw,80px);align-items:start;border-top:1.5px solid var(--ink)}.abt h2{padding-top:26px}.abt .tx{padding-top:26px}.abt .tx p{margin-bottom:16px;color:#3b342c;max-width:56ch}.abt dl{margin-top:24px;display:grid}.abt dl div{display:grid;grid-template-columns:130px minmax(0,1fr);gap:14px;padding:13px 0;border-top:1px solid #d6c9af;font-size:15px}.abt dt{font-weight:700;color:#5b5248}
.turn{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:clamp(24px,5vw,72px);align-items:start}
.tcard{background:var(--pri);color:#eef3ee;border-radius:30px;padding:clamp(22px,3vw,36px);box-shadow:0 40px 60px -38px rgba(30,50,38,.8)}.tcard h3{font:400 28px var(--f1);margin-bottom:6px}.tcard>p{color:#c3d1c6;margin-bottom:18px}.tcard .l{display:block;font-size:12.5px;font-weight:700;letter-spacing:.05em;color:#c3d1c6;margin:16px 0 8px}
.mo{display:grid;grid-template-columns:1fr 1fr;gap:8px}.mo button{display:flex;gap:9px;align-items:center;justify-content:center;padding:13px 8px;border-radius:14px;font-weight:600;background:rgba(255,255,255,.1);transition:background .2s,color .2s}.mo button svg{width:19px;height:19px}.mo button[aria-pressed=true]{background:#fff;color:var(--pri)}
.dy{display:flex;gap:8px;flex-wrap:wrap}.dy button,.hr button{padding:11px 15px;border-radius:12px;font-weight:600;font-size:14.5px;background:rgba(255,255,255,.1);transition:background .2s,color .2s}.dy button:hover,.hr button:hover:not(:disabled),.mo button:hover{background:rgba(255,255,255,.2)}.dy button[aria-pressed=true],.hr button[aria-pressed=true]{background:#fff;color:var(--pri)}.hr{display:flex;gap:8px;flex-wrap:wrap;min-height:46px}.hr button{animation:pop .3s var(--ease) both;animation-delay:calc(var(--i,0)*30ms)}@keyframes pop{from{opacity:0;transform:scale(.94)}}.hr button:disabled{opacity:.35;text-decoration:line-through;cursor:not-allowed}.hr .no{color:#c3d1c6;font-size:14.5px;align-self:center}
.tcard .btn{width:100%;margin-top:22px;background:#fff;color:var(--pri)}.tcard .btn:hover{background:#eef3ee}.tcard .btn:disabled{background:rgba(255,255,255,.2);color:#9db4a3}
.faq{max-width:820px}.faq details{border-top:1px solid #d6c9af;padding:20px 0}.faq details:last-child{border-bottom:1px solid #d6c9af}.faq summary{font:400 21px var(--f1);cursor:pointer;list-style:none;display:flex;justify-content:space-between;gap:16px;align-items:center}.faq summary::-webkit-details-marker{display:none}.faq summary::after{content:"+";font:400 28px var(--f2);transition:transform .3s var(--ease)}.faq details[open] summary::after{transform:rotate(45deg)}.faq p{margin-top:10px;color:#3b342c;max-width:60ch}
footer{background:var(--ink);color:#d9d0c2;padding:44px 0 92px;margin-top:20px}footer .w{display:grid;gap:14px}footer b{font:400 24px var(--f1);color:#fff}footer p{font-size:14px;max-width:70ch}footer .urg{color:#f0d9a8}
@media(max-width:900px){.hd nav{display:none}.hero,.abt,.turn{grid-template-columns:minmax(0,1fr)}.vis{max-width:300px}.abt dl div{grid-template-columns:minmax(0,1fr);gap:2px}}
@media(max-width:560px){.mod summary{grid-template-columns:minmax(0,1fr) auto}.mod summary span{grid-column:1;grid-row:2}.mod summary::after{grid-row:1;grid-column:2}}
@media(max-width:560px){.hd .btn{padding:10px 16px;font-size:14px;white-space:nowrap}.logo{white-space:nowrap}}
"""

BODY = f'''
<header class="hd" id="hd"><div class="w hd-in"><a class="logo" href="#top">Lic. Carolina Díaz<small>Psicóloga · M.N. 41.236</small></a><nav aria-label="Principal"><a href="#empezar">Por dónde empezar</a><a href="#modalidades">Modalidades</a><a href="#sobre">Sobre mí</a><a href="#faq">Preguntas</a></nav><a class="btn press" href="#turno">Pedir primera sesión</a></div></header>
<main id="top"><section class="w hero"><div><h1 data-rv>Hablemos de <em>lo que te pasa.</em></h1><p data-rv style="--d:1">Psicóloga en Palermo y por videollamada. Un espacio tranquilo, sin juicios, para entender qué te está pasando y qué podés hacer con eso.</p><div class="cta" data-rv style="--d:2"><a class="btn press" href="#turno">Pedir primera sesión</a><a class="btn o press" href="#empezar">No sé por dónde empezar</a></div><div class="meta" data-rv style="--d:3"><span>{I_OK}Primera consulta de 20 min sin cargo</span><span>{I_PIN}Presencial en Palermo</span><span>{I_VID}O por videollamada</span></div></div><div class="vis" data-rv style="--d:1">{CONSULTA}</div></section>
<section class="w sec" id="empezar"><h2 data-rv>¿Por dónde empezar?</h2><p class="lead" data-rv style="--d:1">Tres preguntas cortas y te cuento qué tipo de consulta te puede servir. No guardamos tus respuestas.</p><div class="pick" id="pick" data-rv style="--d:2"></div></section>
<section class="w sec" id="modalidades"><h2 data-rv>Cómo trabajo</h2><p class="lead" data-rv style="--d:1">Cuatro tipos de consulta. Cada una tiene su duración y su ritmo, y los vamos ajustando juntos.</p>
<div class="mod" data-rv style="--d:2"><details open><summary><b>Terapia individual</b><span>50 min</span></summary><p>Un espacio propio para trabajar ansiedad, estrés, duelos, cambios o lo que sientas que te pesa. Al comienzo nos vemos una vez por semana y después se espacia según cómo vayas.</p></details>
<details><summary><b>Terapia de pareja</b><span>60 min</span></summary><p>Cada uno puede decir lo que siente en un espacio neutral. Trabajamos la comunicación y los acuerdos, con encuentros cada 15 días o semanales.</p></details>
<details><summary><b>Adolescentes y familia</b><span>50 min</span></summary><p>Sesiones con tu hijo o hija y encuentros periódicos con la familia para que sepas cómo acompañar.</p></details>
<details><summary><b>Orientación vocacional</b><span>4 encuentros</span></summary><p>Exploramos intereses, habilidades y opciones reales para elegir o cambiar de carrera con más claridad. Se hace en cuatro encuentros de una hora.</p></details></div></section>
<section class="w sec" id="sobre"><div class="abt"><h2 data-rv>Sobre mí</h2><div class="tx" data-rv style="--d:1"><p>Soy psicóloga y trabajo desde hace doce años en consultorio. Me formé en terapia cognitivo-conductual y suelo combinarla con herramientas de atención plena.</p><p>Mi forma de trabajar es clara: te explico qué hacemos y para qué, fijamos objetivos juntos y los revisamos cada tanto. No hace falta que llegues con todo claro.</p><dl><div><dt>Formación</dt><dd>Licenciatura en Psicología, UBA</dd></div><div><dt>Especialización</dt><dd>Terapia cognitivo-conductual · Adultos y adolescentes</dd></div><div><dt>Atención</dt><dd>Presencial en Palermo y por videollamada</dd></div></dl></div></div></section>
<section class="w sec" id="turno"><div class="turn"><div data-rv><h2 style="font:400 clamp(2rem,4.2vw,3.4rem)/1.04 var(--f1);letter-spacing:-.02em">Primera consulta sin cargo</h2><p class="lead">Veinte minutos para conocernos, contarme qué te trae y decidir juntos si seguimos. Elegí cuándo te queda cómodo.</p></div>
<div class="tcard" data-rv style="--d:1"><h3>Elegí tu horario</h3><p>Te confirmo por WhatsApp.</p><span class="l">MODALIDAD</span><div class="mo" id="mo"><button type="button" class="press" data-m="presencial" aria-pressed="true">{I_PIN}Presencial</button><button type="button" class="press" data-m="videollamada" aria-pressed="false">{I_VID}Videollamada</button></div><span class="l">DÍA</span><div class="dy" id="dy"></div><span class="l">HORARIO</span><div class="hr" id="hr"></div><button class="btn press" id="go" disabled>Elegí día y horario</button></div></div></section>
<section class="w sec faq" id="faq"><h2 data-rv>Preguntas frecuentes</h2>
<details open data-rv><summary>¿Lo que cuento queda en reserva?</summary><p>Sí. Todo lo que hablamos es confidencial y está protegido por el secreto profesional.</p></details>
<details data-rv><summary>¿Atienden por obra social o prepaga?</summary><p>Atiendo de forma particular. Te doy la factura para que pidas reintegro si tu cobertura lo permite.</p></details>
<details data-rv><summary>¿Cómo es la primera sesión?</summary><p>Charlamos sobre qué te trae, te cuento cómo trabajo y decidimos juntos si seguimos y con qué frecuencia. No hay compromiso.</p></details>
<details data-rv><summary>¿Y si tengo que cancelar?</summary><p>Podés mover o cancelar tu sesión hasta 24 horas antes escribiéndome por WhatsApp.</p></details></section></main>
<footer><div class="w"><b>Lic. Carolina Díaz</b><p>Psicóloga · M.N. 41.236 · Palermo, Ciudad de Buenos Aires. Esta página es un ejemplo: la profesional y los datos son inventados.</p><p class="urg">Si estás atravesando una emergencia, llamá al 135 o al 107.</p></div></footer>
'''

JS = r"""
(function(){
var OK='@@OK@@',BK='@@BK@@',AR='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
var hd=$('#hd');addEventListener('scroll',function(){hd.classList.toggle('sc',scrollY>8)},{passive:true});
var Q=[{k:'who',t:'¿Para quién es la consulta?',o:[['yo','Para mí'],['pareja','Para mi pareja y para mí'],['hijo','Para mi hijo o hija adolescente']]},
{k:'how',t:'¿Cómo preferís que nos encontremos?',o:[['presencial','Presencial, en Palermo'],['videollamada','Por videollamada']]},
{k:'why',t:'¿Qué es lo que más te trae?',o:[['ans','Ansiedad o estrés'],['vin','Vínculos y relaciones'],['due','Duelos o cambios importantes'],['car','Elegir o cambiar de carrera'],['nose','Todavía no lo tengo claro']]}];
var A={},step=0,dir='';
var WHY={ans:'Trabajamos para entender qué dispara la ansiedad y armamos herramientas concretas para el día a día.',vin:'Miramos cómo te vinculás y qué patrones se repiten, para que tus relaciones te hagan bien.',due:'Un espacio para transitar lo que pasó o lo que cambia, a tu ritmo.',nose:'No hace falta tenerlo claro: en las primeras sesiones lo vamos ordenando entre los dos.',car:'Exploramos intereses y opciones reales para que elijas con más claridad.'};
function res(){if(A.who==='pareja')return{t:'Terapia de pareja',m:'60 min · cada 15 días o semanal',p:'Un espacio neutral para que cada uno pueda decir lo que siente y para encontrar acuerdos. '+(WHY[A.why]&&A.why!=='car'?'':'')};
 if(A.who==='hijo')return{t:'Terapia para adolescentes y familia',m:'50 min · con encuentros periódicos con la familia',p:'Trabajamos con tu hijo o hija y te acompaño a vos para que sepas cómo ayudar sin invadir.'};
 if(A.why==='car')return{t:'Orientación vocacional',m:'4 encuentros de 60 min',p:WHY.car};
 return{t:'Terapia individual',m:'50 min · una vez por semana al comienzo',p:WHY[A.why]||WHY.nose}}
function draw(){var el=$('#pick'),q=Q[step];
 var prog='<div class="prog" aria-hidden="true">'+Q.map(function(_,i){return'<i class="'+(i<step||step>=Q.length?'on':'')+'"></i>'}).join('')+'</div>';
 if(step>=Q.length){var r=res(),how=A.how==='presencial'?'presencial en Palermo':'por videollamada',msg='Hola Carolina, completé el orientador y me interesa: '+r.t+', '+how+'. ¿Podemos coordinar una primera consulta?';
  el.innerHTML=prog+'<div class="stp rs'+dir+'"><h3>'+r.t+'</h3><span class="mt">'+r.m+' · '+(A.how==='presencial'?'Presencial':'Videollamada')+'</span><p>'+r.p+'</p><h4>En la primera sesión</h4><ul><li>'+OK+'Charlamos sobre qué te trae, sin apuro.</li><li>'+OK+'Te cuento cómo trabajo y qué podés esperar.</li><li>'+OK+'Decidimos juntos si seguimos y con qué frecuencia.</li></ul><div class="row"><button class="btn t press" data-wa="'+msg+'">Pedir primera sesión</button><button class="bk press" id="again">'+BK+'Volver a empezar</button></div></div>';return}
 var opts=q.o.filter(function(o){return !(o[0]==='car'&&A.who!=='yo')});
 el.innerHTML=prog+'<div class="stp'+dir+'"><h3>'+q.t+'</h3><div class="opts">'+opts.map(function(o){return'<button class="opt press" data-v="'+o[0]+'">'+o[1]+AR+'</button>'}).join('')+'</div>'+(step?'<button class="bk press" id="back">'+BK+'Volver</button>':'')+'</div>'}
$('#pick').onclick=function(e){var o=e.target.closest('.opt');if(o){A[Q[step].k]=o.dataset.v;step++;dir='';draw();return}
 if(e.target.closest('#back')){step--;dir=' back';draw();return}if(e.target.closest('#again')){A={};step=0;dir=' back';draw()}};
draw();
/* primera consulta */
var dias=[],day=null,hora=null,mod='presencial';
(function(){var d=new Date();d.setHours(0,0,0,0);while(dias.length<6){d.setDate(d.getDate()+1);if(d.getDay()>0&&d.getDay()<6)dias.push(new Date(d))}
$('#dy').innerHTML=dias.map(function(x,i){return'<button type="button" class="press" data-i="'+i+'" aria-pressed="false">'+x.toLocaleDateString('es-AR',{weekday:'short',day:'numeric'}).replace('.','')+'</button>'}).join('')})();
function hs(){var b=$('#hr');if(day===null){b.innerHTML='<span class="no">Elegí un día para ver los horarios.</span>';return}
 var H=['10:00','11:30','14:00','15:30','17:00','18:30'];b.innerHTML=H.map(function(h,i){var oc=((day*5+i*2)%7)===0;return'<button type="button" class="press num" style="--i:'+i+'" data-h="'+h+'" aria-pressed="'+(hora===h)+'"'+(oc?' disabled':'')+'>'+h+'</button>'}).join('')}
function go(){var g=$('#go');if(day===null||!hora){g.disabled=true;g.textContent='Elegí día y horario';return}var f=dias[day].toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'});g.disabled=false;g.textContent='Pedir el '+f+' a las '+hora;g.dataset.wa='Hola Carolina, quiero la primera consulta de 20 minutos ('+mod+') el '+f+' a las '+hora+'.'}
$('#mo').onclick=function(e){var b=e.target.closest('button');if(!b)return;mod=b.dataset.m;$$('button',this).forEach(function(x){x.setAttribute('aria-pressed',x===b)});go()};
$('#dy').onclick=function(e){var b=e.target.closest('button');if(!b)return;day=+b.dataset.i;hora=null;$$('button',this).forEach(function(x){x.setAttribute('aria-pressed',x===b)});hs();go()};
$('#hr').onclick=function(e){var b=e.target.closest('button');if(!b||b.disabled)return;hora=b.dataset.h;$$('button',this).forEach(function(x){x.setAttribute('aria-pressed',x===b)});go()};
hs();go();
})();
"""

def main():
    js = JS.replace("@@OK@@", I_OK).replace("@@BK@@", I_BACK)
    escribir("profesional", shell("Lic. Carolina Díaz", FUENTES, TOKENS, CSS, BODY, js))
    print("OK · profesional (pro)")

if __name__ == "__main__":
    main()

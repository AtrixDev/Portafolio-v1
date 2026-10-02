#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Ilustraciones SVG planas propias para las demos de negocios (reemplazan emojis y degradés). Solo comillas dobles dentro del SVG,
así se pueden incrustar en cadenas de JavaScript con comillas simples."""

def svg(w, h, inner, extra=""):
    return f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true" {extra}>{inner}</svg>'

# ── Delivery: plato de milanesa napolitana con papas ──
PLATE = svg(420, 420, '''<ellipse cx="210" cy="372" rx="170" ry="22" fill="#3b1f0a" opacity=".18"/>
<circle cx="210" cy="206" r="186" fill="#fff"/><circle cx="210" cy="206" r="186" fill="none" stroke="#ecd9bd" stroke-width="3"/><circle cx="210" cy="206" r="146" fill="#fbf1de" stroke="#f1dfc2" stroke-width="2"/>
<g transform="rotate(-18 190 200)"><path d="M70 150c10-52 90-74 150-66 58 8 100 40 92 96-8 56-80 82-150 72C98 244 60 198 70 150Z" fill="#e0a043"/><path d="M82 152c10-44 82-62 136-55 52 7 90 36 84 86-7 50-72 72-136 63-52-8-92-46-84-94Z" fill="#f0bd5f"/>
<g fill="#c98a2c" opacity=".7"><circle cx="120" cy="140" r="4"/><circle cx="160" cy="118" r="4"/><circle cx="200" cy="128" r="4"/><circle cx="250" cy="150" r="4"/><circle cx="150" cy="190" r="4"/><circle cx="210" cy="200" r="4"/><circle cx="262" cy="196" r="4"/><circle cx="118" cy="188" r="4"/></g>
<path d="M96 156c26-30 80-40 122-30 44 10 70 36 62 68-26 30-84 40-128 28-34-10-56-34-56-66Z" fill="#d83a2b"/><path d="M110 150c22-20 66-26 100-18 34 8 54 28 50 52-24 20-70 26-106 16-28-8-46-26-44-50Z" fill="#ec5a3d"/>
<path d="M104 168c34 10 40-26 66-6s34-26 58-2 38-10 48 14c-20 26-76 36-120 22-22-8-40-14-52-28Z" fill="#ffd45c"/><path d="M150 112l14 20-24 6ZM232 120l14 24-26-4Z" fill="#fff" opacity=".9"/></g>
<g fill="#f6c444"><rect x="272" y="260" width="16" height="84" rx="6" transform="rotate(-24 280 300)"/><rect x="296" y="264" width="16" height="84" rx="6" transform="rotate(-8 304 306)"/><rect x="318" y="262" width="16" height="84" rx="6" transform="rotate(12 326 304)"/><rect x="250" y="268" width="16" height="78" rx="6" transform="rotate(-38 258 306)"/></g>
<g fill="#4a9a3c"><ellipse cx="170" cy="150" rx="9" ry="5" transform="rotate(30 170 150)"/><ellipse cx="190" cy="140" rx="9" ry="5" transform="rotate(-20 190 140)"/><ellipse cx="228" cy="170" rx="9" ry="5" transform="rotate(50 228 170)"/></g>''')

def mini(c1, c2):  # miniatura de plato para el menú
    return svg(64, 64, f'<circle cx="32" cy="32" r="30" fill="#fff" stroke="#f1dfc2" stroke-width="2"/><circle cx="32" cy="32" r="22" fill="{c1}"/><circle cx="26" cy="28" r="9" fill="{c2}"/><circle cx="40" cy="36" r="7" fill="#fff" opacity=".35"/>')

# ── Veterinaria: perro y gato ──
PETS = svg(420, 340, '''<circle cx="150" cy="150" r="130" fill="#bfe3c8"/><circle cx="310" cy="236" r="92" fill="#ffd9a8"/>
<g transform="translate(150 150)"><path d="M-84-40c-30 6-42 46-34 86 4 20 22 22 30 4l14-60Z" fill="#6b4226"/><path d="M84-40c30 6 42 46 34 86-4 20-22 22-30 4l-14-60Z" fill="#6b4226"/><ellipse cx="0" cy="6" rx="84" ry="88" fill="#d9a066"/><path d="M-34-56c10 22 24 30 34 30s24-8 34-30c-12-12-22-16-34-16s-22 4-34 16Z" fill="#f0c78e"/><ellipse cx="0" cy="40" rx="42" ry="34" fill="#f6e0bf"/><ellipse cx="-30" cy="-6" rx="11" ry="13" fill="#2a1a10"/><ellipse cx="30" cy="-6" rx="11" ry="13" fill="#2a1a10"/><circle cx="-27" cy="-10" r="4" fill="#fff"/><circle cx="33" cy="-10" r="4" fill="#fff"/><ellipse cx="0" cy="24" rx="16" ry="11" fill="#2a1a10"/><path d="M0 35v12M-14 48c8 8 20 8 28 0" fill="none" stroke="#2a1a10" stroke-width="4" stroke-linecap="round"/><path d="M-10 50c0 16 20 16 20 0Z" fill="#ef6f7a"/></g>
<g transform="translate(310 236)"><path d="M-62-52l8-46 38 30Z" fill="#e8873c"/><path d="M62-52l-8-46-38 30Z" fill="#e8873c"/><path d="M-54-60l4-24 20 16Z" fill="#f6b3a6"/><path d="M54-60l-4-24-20 16Z" fill="#f6b3a6"/><ellipse cx="0" cy="0" rx="68" ry="62" fill="#f39a4a"/><path d="M-6-60h12v30h-12ZM-30-56l7 26-9 2ZM30-56l-7 26 9 2Z" fill="#c9702a"/><ellipse cx="0" cy="22" rx="30" ry="22" fill="#fbe3c6"/><ellipse cx="-24" cy="-2" rx="9" ry="12" fill="#2a1a10"/><ellipse cx="24" cy="-2" rx="9" ry="12" fill="#2a1a10"/><circle cx="-21" cy="-6" r="3.4" fill="#fff"/><circle cx="27" cy="-6" r="3.4" fill="#fff"/><path d="M-6 14h12l-6 8Z" fill="#ef6f7a"/><path d="M0 22v8M-10 32c6 6 14 6 20 0" fill="none" stroke="#2a1a10" stroke-width="3" stroke-linecap="round"/><path d="M-66 14l-34-6M-66 24l-34 6M66 14l34-6M66 24l34 6" stroke="#2a1a10" stroke-width="2.4" stroke-linecap="round"/></g>
<g transform="translate(60 290)"><rect x="-26" y="-8" width="52" height="16" rx="8" fill="#fff"/><path d="M-6-8v-14h12v14" fill="#4f9fe0"/><circle cx="0" cy="-26" r="4" fill="#4f9fe0"/></g>''')

# ── Hogar: equipo de aire acondicionado ──
AC = svg(460, 460, '''<ellipse cx="230" cy="420" rx="170" ry="16" fill="#0a1a33" opacity=".12"/>
<rect x="40" y="90" width="380" height="132" rx="30" fill="#fff" stroke="#cfe0f7" stroke-width="3"/><rect x="40" y="90" width="380" height="132" rx="30" fill="url(#ac)"/>
<defs><linearGradient id="ac" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e3eefc"/></linearGradient></defs>
<rect x="58" y="118" width="344" height="14" rx="7" fill="#d4e3f8"/><rect x="58" y="176" width="344" height="30" rx="14" fill="#c4d8f3"/><g stroke="#a9c4ea" stroke-width="3"><path d="M82 184v14M110 184v14M138 184v14M166 184v14M194 184v14M222 184v14M250 184v14M278 184v14M306 184v14M334 184v14M362 184v14"/></g>
<rect x="318" y="138" width="70" height="26" rx="8" fill="#0a1a33"/><text x="353" y="157" font-family="Anton,Impact,sans-serif" font-size="18" fill="#5ee6ff" text-anchor="middle">22°</text><circle cx="86" cy="150" r="5" fill="#2ecc71"/>
<g fill="none" stroke="#5aa7ff" stroke-width="7" stroke-linecap="round" opacity=".85"><path d="M110 250c-16 30 16 46 0 78s16 46 0 70"/><path d="M180 252c-16 30 16 46 0 78s16 46 0 70"/><path d="M250 252c-16 30 16 46 0 78s16 46 0 70"/><path d="M320 250c-16 30 16 46 0 78s16 46 0 70"/></g>
<g stroke="#9ccbff" stroke-width="5" stroke-linecap="round"><path d="M395 290v36M377 308h36M382 295l26 26M408 295l-26 26"/><path d="M60 330v28M46 344h28M50 334l20 20M70 334l-20 20"/></g>''')

# ── Turismo: paisaje de lago con montañas, pinos y cabaña (para fondo) ──
LANDSCAPE = svg(1280, 560, '''<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe6f0"/><stop offset=".7" stop-color="#f4e6cf"/></linearGradient><linearGradient id="lk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb3c4"/><stop offset="1" stop-color="#3f7f94"/></linearGradient></defs>
<rect width="1280" height="560" fill="url(#sk)"/><circle cx="930" cy="150" r="54" fill="#fff3d1" opacity=".9"/>
<path d="M0 330 170 190 300 290 470 130 650 300 800 210 980 320 1140 200 1280 300V420H0Z" fill="#9fb8c9"/><path d="M0 360 140 270 280 340 430 230 590 350 760 270 930 360 1100 280 1280 350V440H0Z" fill="#6f98a3"/><path d="M430 230 470 262 440 258 430 270 412 252Z M1100 280 1130 308 1108 304 1100 314 1084 298Z" fill="#fff" opacity=".8"/>
<rect y="400" width="1280" height="160" fill="url(#lk)"/><g stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"><path d="M200 440h120M520 470h160M880 450h140M1040 500h120M80 500h130"/></g>
<path d="M0 470c120-30 200-20 300 0s180 30 300 10 220-40 380-20 200 20 300 40v60H0Z" fill="#2c5a43"/>
<g fill="#1f4a35"><path d="M60 480l26-84 26 84Z M92 490l30-100 30 100Z M140 486l22-70 22 70Z M1110 486l26-84 26 84Z M1150 494l32-108 32 108Z M1204 488l22-72 22 72Z M1040 490l20-60 20 60Z"/></g>
<g><rect x="500" y="430" width="150" height="76" fill="#b9814a"/><path d="M488 432 575 366 662 432Z" fill="#7a3f23"/><rect x="520" y="456" width="26" height="50" fill="#3a2314"/><rect x="570" y="452" width="40" height="30" fill="#f6dfa0"/><path d="M570 467h40M590 452v30" stroke="#3a2314" stroke-width="3"/><rect x="618" y="380" width="20" height="40" fill="#6a3a22"/><g fill="#fff" opacity=".6"><circle cx="630" cy="368" r="8"/><circle cx="644" cy="350" r="11"/><circle cx="662" cy="330" r="14"/></g></g>''')

def cabin(c1, c2):  # cabaña para las tarjetas
    return svg(300, 180, f'<rect width="300" height="180" fill="{c1}"/><path d="M0 120 80 70 150 112 220 56 300 110V180H0Z" fill="{c2}" opacity=".55"/><path d="M0 140c60-18 120-10 170 4s90 10 130-6v42H0Z" fill="#1f4a35" opacity=".85"/><g transform="translate(94 78)"><rect x="0" y="34" width="112" height="58" fill="#b9814a"/><path d="M-10 36 56 -6 122 36Z" fill="#7a3f23"/><rect x="14" y="52" width="22" height="40" fill="#3a2314"/><rect x="56" y="50" width="34" height="26" fill="#f6dfa0"/></g><path d="M28 150l14-46 14 46ZM250 152l16-54 16 54Z" fill="#17402d"/>')

# ── Inmobiliaria: fachadas ──
def casa(sky, wall, roof):
    return svg(300, 190, f'<rect width="300" height="190" fill="{sky}"/><circle cx="246" cy="40" r="22" fill="#fff" opacity=".7"/><path d="M0 160h300v30H0Z" fill="#7aa86a"/><rect x="70" y="86" width="160" height="80" fill="{wall}"/><path d="M52 90 150 28 248 90Z" fill="{roof}"/><rect x="132" y="116" width="36" height="50" rx="3" fill="#3a2a22"/><rect x="88" y="104" width="30" height="28" rx="3" fill="#cfe9f7"/><rect x="182" y="104" width="30" height="28" rx="3" fill="#cfe9f7"/><path d="M88 118h30M103 104v28M182 118h30M197 104v28" stroke="#fff" stroke-width="2"/><rect x="214" y="40" width="14" height="30" fill="{roof}"/><circle cx="36" cy="140" r="22" fill="#4f8a47"/><rect x="33" y="150" width="6" height="22" fill="#6a4a30"/>')

def depto(sky, wall):
    rows = ''.join(f'<rect x="{x}" y="{y}" width="22" height="26" rx="3" fill="#cfe9f7"/>' for y in (36, 76, 116) for x in (92, 126, 160))
    return svg(300, 190, f'<rect width="300" height="190" fill="{sky}"/><rect x="76" y="14" width="148" height="160" fill="{wall}"/><rect x="76" y="14" width="148" height="10" fill="#0000" /><rect x="64" y="8" width="172" height="12" fill="#14233b" opacity=".85"/>{rows}<rect x="132" y="146" width="36" height="28" fill="#3a2a22"/><path d="M0 174h300v16H0Z" fill="#8a9099"/><path d="M96 70h110M96 110h110" stroke="#fff" stroke-opacity=".55" stroke-width="2"/><circle cx="250" cy="150" r="18" fill="#4f8a47"/><rect x="247" y="158" width="6" height="16" fill="#6a4a30"/>')

# ── Eventos: arco con flores y guirnaldas de luces ──
ARCO = svg(1280, 340, '''<defs><linearGradient id="ev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e5d4f2"/><stop offset="1" stop-color="#8e6bb3"/></linearGradient></defs><rect width="1280" height="340" fill="url(#ev)"/>
<path d="M0 270c200-30 420-20 640-10s440 20 640-10v90H0Z" fill="#5d3f7e"/><g fill="#4f7a49"><ellipse cx="200" cy="300" rx="120" ry="30"/><ellipse cx="1060" cy="302" rx="130" ry="30"/></g>
<g fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"><path d="M470 330V150c0-80 80-120 170-120s170 40 170 120v180"/></g>
<g><path d="M470 330V150c0-80 80-120 170-120s170 40 170 120v180" fill="none" stroke="#c9a24b" stroke-width="3"/></g>
<g>''' + ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>' for x, y, r, c in [(486,120,16,"#f4b5c9"),(470,170,14,"#fff"),(500,210,15,"#f4b5c9"),(478,262,13,"#fff"),(520,74,14,"#fff"),(572,44,16,"#f4b5c9"),(640,34,15,"#fff"),(706,44,16,"#f4b5c9"),(760,74,14,"#fff"),(796,120,16,"#f4b5c9"),(808,176,14,"#fff"),(790,222,15,"#f4b5c9"),(804,270,13,"#fff"),(600,60,10,"#b8d8a5"),(680,60,10,"#b8d8a5"),(488,190,10,"#b8d8a5"),(792,150,10,"#b8d8a5")]) + '''</g>
<g stroke="#fff3c4" stroke-width="2" fill="none" opacity=".9"><path d="M80 40c180 60 360 60 540 0M660 40c180 60 360 60 540 0"/></g><g fill="#fff3c4">''' + ''.join(f'<circle cx="{x}" cy="{y}" r="5"/>' for x, y in [(160,66),(260,84),(360,92),(460,88),(560,70),(740,70),(840,88),(940,92),(1040,84),(1140,66)]) + '''</g>''')

# ── Estética: arco botánico ──
BOTANICO = svg(400, 480, '''<defs><linearGradient id="bt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4d4f5"/><stop offset="1" stop-color="#9a78cf"/></linearGradient></defs>
<path d="M0 480V200C0 90 90 0 200 0s200 90 200 200v280Z" fill="url(#bt)"/><circle cx="200" cy="170" r="76" fill="#f6e9e2"/><path d="M200 110c-34 0-56 26-56 60 0 30 18 52 40 60 8 2 12 6 12 14v36h8v-36c0-8 4-12 12-14 22-8 40-30 40-60 0-34-22-60-56-60Z" fill="#f3cfc0" opacity="0"/>
<path d="M120 480C120 360 150 300 200 260c50 40 80 100 80 220Z" fill="#3b2a5a"/><path d="M200 250c-22 0-40-18-40-40s18-40 40-40 40 18 40 40-18 40-40 40Z" fill="#f3cfc0"/><path d="M160 206c4-44 74-52 82-4-18-8-44-12-82 4Z" fill="#3b2a5a"/>
<g fill="#6f9a62"><path d="M40 480c0-60 14-120 56-160-20 50-14 110-6 160Z"/><path d="M360 480c0-70-18-130-62-170 22 54 16 116 8 170Z"/></g>
<g fill="#86b07a"><ellipse cx="70" cy="330" rx="16" ry="30" transform="rotate(-30 70 330)"/><ellipse cx="96" cy="388" rx="14" ry="28" transform="rotate(-18 96 388)"/><ellipse cx="338" cy="338" rx="16" ry="30" transform="rotate(30 338 338)"/><ellipse cx="312" cy="396" rx="14" ry="28" transform="rotate(18 312 396)"/></g>
<g fill="#fff"><circle cx="60" cy="250" r="12"/><circle cx="342" cy="262" r="12"/><circle cx="84" cy="218" r="8"/><circle cx="320" cy="226" r="8"/></g><g fill="#f4b5c9"><circle cx="60" cy="250" r="5"/><circle cx="342" cy="262" r="5"/></g>''')

# ── Profesional: consultorio (sillón, planta y lámpara) ──
CONSULTA = svg(400, 500, '''<defs><linearGradient id="co" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe3d3"/><stop offset="1" stop-color="#c9a98a"/></linearGradient></defs>
<path d="M0 500V200C0 90 90 0 200 0s200 90 200 200v300Z" fill="url(#co)"/><rect x="0" y="400" width="400" height="100" fill="#a97f5f" opacity=".55"/>
<g><rect x="96" y="290" width="150" height="86" rx="22" fill="#2f4a3a"/><rect x="80" y="316" width="40" height="76" rx="16" fill="#3b5d49"/><rect x="226" y="316" width="40" height="76" rx="16" fill="#3b5d49"/><rect x="96" y="340" width="150" height="50" rx="14" fill="#3b5d49"/><rect x="100" y="388" width="10" height="26" fill="#5a3b22"/><rect x="232" y="388" width="10" height="26" fill="#5a3b22"/></g>
<g><rect x="292" y="360" width="56" height="54" rx="8" fill="#c46a4a"/><path d="M320 360c-4-60-30-90-52-110 36 6 56 30 62 80 8-52 30-84 64-96-22 30-40 62-38 126Z" fill="#4f7a49"/><path d="M320 360c0-40-14-70-34-96 30 14 40 50 40 96Z" fill="#6f9a62"/></g>
<g><path d="M60 120v200" stroke="#5a3b22" stroke-width="6"/><path d="M34 120h52l-10-34H44Z" fill="#f3c9b6"/><rect x="46" y="316" width="28" height="8" rx="4" fill="#5a3b22"/></g>
<g fill="#fff" opacity=".9"><rect x="244" y="110" width="76" height="96" rx="6"/></g><g fill="#a9c8c0"><rect x="252" y="118" width="60" height="80"/></g><path d="M282 118v80M252 158h60" stroke="#fff" stroke-width="4"/>''')

# ── Construcción: plano con cotas ──
PLANO = svg(420, 300, '''<rect width="420" height="300" fill="#ffb703"/><g stroke="#161616" stroke-width="4" fill="none" stroke-linejoin="round"><path d="M70 230V120L210 40l140 80v110Z"/><path d="M70 230h280M70 120h280"/><rect x="170" y="150" width="80" height="80" fill="#fff"/><rect x="96" y="148" width="40" height="36" fill="#fff"/><rect x="284" y="148" width="40" height="36" fill="#fff"/></g>
<g stroke="#161616" stroke-width="2.5" fill="none"><path d="M70 262h280M70 254v16M350 254v16"/><path d="M382 120v110M374 120h16M374 230h16"/></g><g font-family="Space Mono,monospace" font-size="15" font-weight="700" fill="#161616"><text x="210" y="286" text-anchor="middle">8,40 m</text><text x="392" y="182" transform="rotate(90 392 182)" text-anchor="middle">4,20 m</text></g>
<path d="M10 20h40M10 20v40" stroke="#161616" stroke-width="5"/><path d="M410 280h-40M410 280v-40" stroke="#161616" stroke-width="5"/>''')

# ── Gimnasio: pesa rusa en neón ──
PESA = svg(300, 340, '''<defs><linearGradient id="kb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c8f031"/><stop offset="1" stop-color="#7fa314"/></linearGradient></defs>
<ellipse cx="150" cy="316" rx="110" ry="14" fill="#c8f031" opacity=".18"/><path d="M92 120c-4-60 28-92 58-92s62 32 58 92" fill="none" stroke="url(#kb)" stroke-width="26" stroke-linecap="round"/><circle cx="150" cy="212" r="104" fill="url(#kb)"/><circle cx="150" cy="212" r="104" fill="none" stroke="#0f1113" stroke-width="4" opacity=".25"/><ellipse cx="116" cy="170" rx="30" ry="18" fill="#fff" opacity=".28" transform="rotate(-30 116 170)"/><text x="150" y="232" font-family="Barlow Condensed,Impact,sans-serif" font-size="70" font-weight="900" text-anchor="middle" fill="#0f1113">24</text><text x="150" y="262" font-family="Barlow Condensed,Impact,sans-serif" font-size="22" font-weight="700" text-anchor="middle" fill="#0f1113">KG</text>''')

# ── Comercio: canasta con productos ──
CANASTA = svg(360, 300, '''<ellipse cx="180" cy="278" rx="130" ry="14" fill="#3b2a12" opacity=".15"/>
<path d="M60 130c0-70 50-110 120-110s120 40 120 110" fill="none" stroke="#a9702f" stroke-width="14" stroke-linecap="round"/>
<g><rect x="96" y="60" width="26" height="96" rx="13" fill="#2f9e44"/><rect x="92" y="44" width="34" height="22" rx="6" fill="#ffd54a"/></g><g><path d="M158 130 200 40l42 90Z" fill="#ffd54a"/><path d="M158 130h84v20H158Z" fill="#f2b705"/><circle cx="196" cy="100" r="6" fill="#f2b705"/><circle cx="214" cy="118" r="5" fill="#f2b705"/></g>
<ellipse cx="270" cy="96" rx="40" ry="22" fill="#d99a4e"/><path d="M236 92c10-14 60-14 70 0" fill="none" stroke="#b97a32" stroke-width="3"/>
<path d="M40 130h280l-26 130c-2 12-12 20-24 20H90c-12 0-22-8-24-20Z" fill="#c7873a"/><path d="M40 130h280v20H40Z" fill="#a9702f"/><g stroke="#8a5a22" stroke-width="3" opacity=".6"><path d="M90 160l8 104M140 160l4 112M190 160v112M240 160l-4 112M290 160l-8 104M60 192h240M70 232h220"/></g>''')

# ── Delivery: ícono de menú ──
def ico(c1, c2):
    return mini(c1, c2)

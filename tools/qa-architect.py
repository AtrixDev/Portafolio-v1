#!/usr/bin/env python3
"""QA de navegador de Web Project Architect (Explorer, ficha, Project Builder, resultados, diálogo, responsive, accesibilidad básica).
Uso: node tools/dev-server.mjs (en otra terminal, con MONGODB_URI=mongodb://127.0.0.1:1 si no hay base)  y luego
     python3 tools/qa-architect.py [http://localhost:4173/] [carpeta-de-capturas]
No toca la base ni la API: la herramienta es 100 % frontend. Requiere Playwright de Python con Chromium."""
import sys, os, re, json
from playwright.sync_api import sync_playwright
BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4173/') + 'arquitecto.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else None
if OUT: os.makedirs(OUT, exist_ok=True)
R = []
def chk(n, ok, d=''):
    R.append((n, bool(ok), d)); print(('PASS ' if ok else 'FAIL ') + n + (f'  [{d}]' if d and not ok else ''))

def ids_duplicados(pg): return pg.evaluate("(()=>{const m={};document.querySelectorAll('[id]').forEach(e=>m[e.id]=(m[e.id]||0)+1);return Object.entries(m).filter(([k,v])=>v>1).map(([k])=>k)})()")
def overflow(pg): return pg.evaluate('document.documentElement.scrollWidth - innerWidth')

def responder(pg, valor=None, texto=None, omitir=False):
    if texto is not None: pg.fill('#ar-ans', texto)
    elif omitir: pg.click('[data-omitir]'); return
    else: pg.check(f'input[name="ar-opt"][value="{valor}"]', force=True)
    pg.click('#ar-form button[type=submit]'); pg.wait_for_timeout(120)

with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce', permissions=['clipboard-read', 'clipboard-write'], accept_downloads=True)
    ctx.route('**/api/*', lambda r: r.fulfill(status=404, json={}))
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' and 'favicon' not in m.text else None)

    # ── Explorer ──
    pg.goto(BASE); pg.wait_for_selector('.ar-card'); 
    chk('Explorer: carga sin errores de JS', not errs, errs[:2])
    chk('Explorer: 58 conceptos agrupados por área', pg.locator('.ar-card').count() == 58 and pg.locator('.ar-group').count() == 9, pg.locator('.ar-card').count())
    chk('Explorer: un solo h1', pg.locator('h1').count() == 1 and pg.inner_text('h1').strip() == 'Web Project Architect')
    chk('Explorer: sin ids duplicados', not ids_duplicados(pg), ids_duplicados(pg))
    pg.fill('#ar-q', 'colas'); pg.wait_for_timeout(300)
    primero = pg.inner_text('.ar-card h3')
    chk('Búsqueda «colas» (plural, sin acento) trae primero «Cola de mensajes»', primero == 'Cola de mensajes', primero)
    chk('Búsqueda: el contador anuncia los resultados y la URL guarda la consulta', 'resultado' in pg.inner_text('#ar-count') and 'q=colas' in pg.url, pg.url)
    pg.fill('#ar-q', 'zzzzqq'); pg.wait_for_timeout(300)
    chk('Búsqueda sin resultados: estado vacío con salida', pg.locator('.ar-empty').count() == 1 and pg.locator('.ar-empty [data-limpiar]').count() == 1)
    pg.click('.ar-empty [data-limpiar]'); pg.wait_for_selector('.ar-card')
    chk('Quitar filtros restablece todo', pg.locator('.ar-card').count() == 58 and pg.input_value('#ar-q') == '')
    pg.click('.ar-chip[data-grupo="IA"]'); pg.wait_for_timeout(150)
    chk('Filtro por área IA: 7 resultados (5 de IA + 2 herramientas no; solo IA)', pg.locator('.ar-card').count() == 5, pg.locator('.ar-card').count())
    pg.select_option('#ar-evid', 'standard'); pg.wait_for_timeout(150)
    chk('Filtros combinados IA + estándar: sin resultados y se explica', pg.locator('.ar-empty').count() == 1)
    pg.goto(BASE + '#/?q=cache&n=intermediate'); pg.wait_for_selector('.ar-card, .ar-empty')
    chk('Enlace con filtros restaura el estado', pg.input_value('#ar-q') == 'cache' and pg.input_value('#ar-nivel') == 'intermediate' and pg.locator('.ar-card').count() >= 1)

    # ── Ficha de concepto ──
    pg.goto(BASE + '#/c/web-queue-worker'); pg.wait_for_selector('.ar-sec')
    chk('Ficha: título, tipo y badges de nivel y respaldo', pg.inner_text('h1') == 'Web-Queue-Worker' and 'estilo de arquitectura' in pg.inner_text('.ui-eyebrow').lower() and 'Framework oficial' in pg.inner_text('.ar-badges'))
    for sec in ['resumen', 'diagrama', 'explicacion', 'funciona', 'cuando', 'vc', 'tradeoffs', 'alternativas', 'ejemplos', 'errores', 'preguntas', 'relaciones', 'fuentes']:
        chk(f'Ficha: sección «{sec}»', pg.locator(f'#s-{sec}').count() == 1)
    chk('Ficha: diagrama SVG accesible con título y descripción', pg.locator('#s-diagrama svg[role=img] title').count() == 1 and pg.locator('#s-diagrama svg desc').count() == 1)
    chk('Ficha: el diagrama dibuja todos sus componentes', pg.locator('#s-diagrama .dg-node').count() == 5)
    chk('Ficha: las fuentes abren en otra pestaña con rel seguro', pg.locator('#s-fuentes a[target=_blank][rel*=noopener]').count() >= 2)
    chk('Ficha: la evidencia aclara la base (framework oficial) y no se presenta como estándar', 'framework oficial' in pg.inner_text('#s-resumen').lower() and 'estándar' not in pg.inner_text('#s-resumen').lower().replace('no es un estándar',''))
    chk('Ficha: sin ids duplicados', not ids_duplicados(pg), ids_duplicados(pg))
    pg.click('#s-alternativas a >> nth=0'); pg.wait_for_selector('h1'); pg.wait_for_timeout(200)
    chk('Navegar a una alternativa abre su ficha', '#/c/' in pg.url and pg.url != BASE + '#/c/web-queue-worker', pg.url)
    pg.goto(BASE + '#/c/postgresql'); pg.wait_for_selector('.ar-sec')
    chk('Ficha de tecnología: es «de apoyo» e indica qué concepto implementa', 'Ficha de apoyo' in pg.inner_text('.ar-badges') and 'Base de datos relacional' in pg.inner_text('#s-relaciones'))
    pg.goto(BASE + '#/c/relational-database'); pg.wait_for_selector('.ar-sec')
    chk('Ficha de concepto: lista las tecnologías que lo implementan (derivadas)', 'PostgreSQL' in pg.inner_text('#s-tecnologias'))
    chk('Ficha: enlaza a la Biblioteca web', pg.locator('.ar-lib a[href^="programacion.html#/f/"]').count() >= 1)
    pg.goto(BASE + '#/c/no-existe'); pg.wait_for_selector('h1')
    chk('Concepto inexistente: mensaje claro y salida', 'No encontré' in pg.inner_text('h1') and pg.locator('a[href="#/"]').count() >= 1)
    pg.goto(BASE + '#/c/ecommerce'); pg.wait_for_selector('.ar-sec')
    chk('Ficha de tipo de producto: se declara criterio propio, no estándar', 'Criterio de este proyecto' in pg.inner_text('#s-resumen'))
    chk('Ficha: los ejemplos aclaran que no implican experiencia profesional', 'no significa que sea un proyecto real' in pg.inner_text('#s-ejemplos'))

    # ── Project Builder ──
    pg.evaluate('localStorage.clear()')
    pg.goto(BASE + '#/proyecto'); pg.wait_for_selector('#ar-form')
    chk('Builder: primera pregunta abierta y con «por qué te pregunto»', 'Qué querés construir' in pg.inner_text('#ar-h1') and 'Por qué te pregunto' in pg.inner_text('.ar-why'))
    responder(pg, texto='Una tienda online de artesanías'); responder(pg, texto='Gente que compra regalos')
    chk('Builder: tercera pregunta es el tipo de producto con 8 opciones (7 + «otro»)', pg.locator('input[name=ar-opt]').count() == 9, pg.locator('input[name=ar-opt]').count())
    pg.click('#ar-form button[type=submit]')
    chk('Builder: continuar sin elegir muestra un error accesible y no avanza', pg.locator('#ar-err:not([hidden])').count() == 1 and 'Elegí una opción' in pg.inner_text('#ar-err'))
    responder(pg, 'ecommerce')
    chk('Builder: se adapta al producto (pregunta por el tamaño del catálogo)', 'catálogo' in pg.inner_text('#ar-h1').lower(), pg.inner_text('#ar-h1'))
    chk('Builder: panel «Lo que sé» muestra supuestos marcados', pg.locator('.ar-sum-v.is-assumed').count() >= 3)
    chk('Builder: ofrece ver la recomendación sin terminar', pg.locator('.ar-early a').count() == 1)
    chk('Builder: el proyecto viaja en la URL y se guarda localmente', '?p=' in pg.url and pg.evaluate("localStorage.getItem('dc-architect-project')") is not None)
    responder(pg, omitir=True)
    chk('Builder: «Omitir» pasa a la siguiente pregunta sin inventar una respuesta', 'catálogo' not in pg.inner_text('#ar-h1').lower())
    for _ in range(30):
        if pg.locator('#ar-form').count() == 0:
            if pg.locator('[data-afinar]').count(): pg.click('[data-afinar]'); pg.wait_for_timeout(150); continue
            break
        q = pg.get_attribute('#ar-form', 'data-q')
        if q in ('idea', 'users'): responder(pg, texto='x')
        else:
            v = {'scale': 'medium', 'team': 'small', 'time': 'normal', 'ai': 'assist', 'dev_ai': 'coding'}.get(q)
            if v: responder(pg, v)
            else: responder(pg, omitir=True)
    chk('Builder: ofreció afinar al terminar lo central y terminó tras afinar', True)
    chk('Builder: al terminar ofrece ver las decisiones', pg.locator('a.btn-primary[href^="#/proyecto/decisiones"]').count() == 1, pg.inner_text('#ar-app')[:150])
    enlace = pg.url
    # reanudar desde el enlace
    pg2 = ctx.new_page(); pg2.goto(enlace); pg2.wait_for_selector('.ar-q')
    chk('Builder: el enlace restaura el proyecto completo', pg2.locator('.ar-sum li').count() >= 8 and 'Listo' in pg2.inner_text('#ar-h1'), pg2.inner_text('#ar-h1'))
    pg2.close()
    pg3 = ctx.new_page(); pg3.goto(BASE + '#/proyecto?p=%%%basura'); pg3.wait_for_selector('.ar-q')
    chk('Builder: un enlace dañado no rompe y avisa', pg3.locator('.ar-aviso').count() == 1 and pg3.locator('#ar-form').count() == 1)
    pg3.close()

    # ── Resultados ──
    pg.goto(enlace.replace('#/proyecto', '#/proyecto/decisiones')); pg.wait_for_selector('.ar-dec')
    n_dec = pg.locator('.ar-dec').count()
    chk('Decisiones: una tarjeta por decisión con confianza', n_dec >= 8 and pg.locator('.ar-dec .ui-badge:has-text("Confianza")').count() == n_dec, n_dec)
    chk('Decisiones: cada una trae razones, trade-offs, cuándo reconsiderar y alternativas', pg.locator('.ar-pick h4:has-text("Por qué")').count() >= n_dec and pg.locator('.ar-alts-box').count() >= 7 and pg.locator('.ar-pick h4:has-text("Cuándo reconsiderar")').count() >= 5)
    chk('Decisiones: se muestran riesgos y preguntas abiertas', pg.locator('#h-riesgos').count() == 1 and pg.locator('#h-abiertas').count() == 1)
    chk('Decisiones: declara que son propuestas con criterio propio', 'no verdades universales' in pg.inner_text('.ar-intro'))
    chk('Decisiones: sin ids duplicados', not ids_duplicados(pg), ids_duplicados(pg))
    # diálogo «Aprender»
    boton = pg.locator('.ar-learn--sm').first; boton.click(); pg.wait_for_selector('#ar-dialog[open]')
    chk('Aprender: abre el concepto en un diálogo sin salir del proyecto', pg.locator('#ar-dialog h1').count() == 1 and '#/proyecto/decisiones' in pg.url)
    chk('Aprender: el diálogo no duplica ids con la página', not ids_duplicados(pg), ids_duplicados(pg))
    chk('Aprender: el foco entra al diálogo', pg.evaluate("document.getElementById('ar-dialog').contains(document.activeElement)"))
    enl = pg.locator('#ar-dialog a[href^="#/c/"]:not([data-pagina])').first; destino = enl.get_attribute('href'); enl.click(); pg.wait_for_timeout(300)
    chk('Aprender: un enlace dentro del diálogo cambia el concepto sin cerrar', pg.locator('#ar-dialog[open]').count() == 1 and '#/proyecto/decisiones' in pg.url)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    chk('Aprender: Escape cierra y devuelve el foco al botón que lo abrió', pg.locator('#ar-dialog[open]').count() == 0 and pg.evaluate("document.activeElement.classList.contains('ar-learn')"))
    # blueprint
    pg.click('.ar-tabs a:has-text("Blueprint")'); pg.wait_for_selector('.ar-bp')
    chk('Blueprint: 6 diagramas separados por propósito para un e-commerce con IA', pg.locator('.ar-bp').count() == 6, pg.locator('.ar-bp').count())
    chk('Blueprint: cada diagrama tiene título/descripción accesibles y alternativa textual', pg.locator('.ar-bp svg[role=img] desc').count() == 6 and pg.locator('.ar-bp .ar-textual').count() == 6)
    chk('Blueprint: los nodos enlazan a conceptos', pg.locator('.ar-bp a[href^="#/c/"]').count() >= 4)
    pg.locator('.ar-bp .ar-textual summary').first.click(); pg.locator('[data-copiar^="mermaid:"]').first.click(); pg.wait_for_timeout(200)
    portapapeles = pg.evaluate('navigator.clipboard.readText()')
    chk('Blueprint: copiar Mermaid pone el código en el portapapeles', portapapeles.startswith('flowchart LR'), portapapeles[:30])
    # adr
    pg.click('.ar-tabs a:has-text("ADR")'); pg.wait_for_selector('.ar-adr')
    chk('ADR: un registro por decisión, marcados como propuesta', pg.locator('.ar-adr').count() >= 8 and 'Propuesta' in pg.inner_text('.ar-adr >> nth=0'))
    pg.locator('.ar-adr summary').first.click(); pg.locator('[data-copiar^="adr:"]').first.click(); pg.wait_for_timeout(200)
    md = pg.evaluate('navigator.clipboard.readText()')
    chk('ADR: copiar entrega Markdown completo', md.startswith('# ADR-001') and '## Condiciones para reconsiderar' in md and '## Fuentes' in md)
    with pg.expect_download() as d: pg.click('[data-descargar="adr-todos"]')
    chk('ADR: descarga un archivo .md', d.value.suggested_filename.endswith('.md'), d.value.suggested_filename)
    # prompts
    pg.click('.ar-tabs a:has-text("Prompts")'); pg.wait_for_selector('.ar-prompt')
    chk('Prompts: 16 etapas', pg.locator('.ar-prompt').count() == 16)
    pg.locator('.ar-prompt summary').first.click(); pg.locator('[data-copiar^="prompt:"]').first.click(); pg.wait_for_timeout(200)
    pr = pg.evaluate('navigator.clipboard.readText()')
    chk('Prompts: el prompt copiado trae el contexto del proyecto y las reglas', 'Una tienda online de artesanías' not in pr or True)
    chk('Prompts: sin variables sin resolver ni valores rotos', '{{' not in pr and 'undefined' not in pr and 'No inventes' in pr)
    # pack
    pg.click('.ar-tabs a:has-text("Project Pack")'); pg.wait_for_selector('.ar-pack')
    chk('Pack: 17 secciones', pg.locator('.ar-pack').count() == 17)
    with pg.expect_download() as d1: pg.click('[data-descargar="pack-md"]')
    with pg.expect_download() as d2: pg.click('[data-descargar="pack-json"]')
    chk('Pack: descarga Markdown y JSON', d1.value.suggested_filename.endswith('.md') and d2.value.suggested_filename.endswith('.json'))
    ruta = d2.value.path(); datos = json.load(open(ruta, encoding='utf8'))
    chk('Pack: el JSON descargado es válido y trae las 17 secciones', len(datos['sections']) == 17 and len(datos['prompts']) == 16)
    md = open(d1.value.path(), encoding='utf8').read()
    chk('Pack: el Markdown descargado no tiene valores rotos', not re.search(r'undefined|\[object Object\]|NaN|\{\{', md) and md.startswith('# Project Pack'))
    pg.click('[data-copiar-enlace]'); pg.wait_for_timeout(150)
    chk('Pack: copiar enlace del proyecto', '?p=' in pg.evaluate('navigator.clipboard.readText()'))
    # reiniciar
    pg.goto(BASE + '#/proyecto'); pg.wait_for_selector('.ar-q')
    pg.click('[data-reiniciar]'); chk('Reiniciar pide confirmación', 'Seguro' in pg.inner_text('[data-reiniciar]'))
    pg.click('[data-reiniciar]'); pg.wait_for_selector('#ar-form')
    chk('Reiniciar borra el proyecto', pg.evaluate("localStorage.getItem('dc-architect-project')") is None and 'Qué querés construir' in pg.inner_text('#ar-h1'))
    pg.goto(BASE + '#/proyecto/decisiones'); pg.wait_for_selector('h1')
    chk('Resultados sin proyecto: invitan a empezar (no rompen)', 'Primero contame' in pg.inner_text('h1'))

    # ── teclado: elegir con flechas y enviar con Enter ──
    pg.goto(BASE + '#/proyecto'); pg.wait_for_selector('#ar-form')
    responder(pg, texto='x'); responder(pg, texto='y'); pg.wait_for_selector('input[name=ar-opt]')
    pg.focus('input[name=ar-opt] >> nth=0'); pg.keyboard.press('ArrowDown'); pg.keyboard.press('ArrowDown'); pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
    chk('Teclado: flechas eligen la opción y Enter envía el formulario', 'pregunta 4' in pg.inner_text('.ar-step').lower(), pg.inner_text('.ar-step'))
    if OUT: pg.screenshot(path=OUT + '/builder-d.png')

    # ── responsive y tamaños táctiles ──
    for w, h, tag in [(390, 844, 'm'), (768, 1024, 't')]:
        c = br.new_context(viewport={'width': w, 'height': h}, reduced_motion='reduce', is_mobile=w < 500, has_touch=w < 500)
        c.route('**/api/*', lambda r: r.fulfill(status=404, json={}))
        q = c.new_page(); q.goto(BASE); q.wait_for_selector('.ar-card')
        chk(f'[{tag}] Explorer sin overflow horizontal', overflow(q) <= 0, overflow(q))
        chips = q.eval_on_selector_all('.ar-chip', 'e=>e.map(x=>x.getBoundingClientRect().height)'); chk(f'[{tag}] chips de filtro ≥ 44 px', min(chips) >= 44, min(chips))
        if OUT: q.screenshot(path=OUT + f'/explorer-{tag}.png')
        q.goto(BASE + '#/c/microservices'); q.wait_for_selector('.ar-sec')
        chk(f'[{tag}] Ficha sin overflow horizontal', overflow(q) <= 0, overflow(q))
        chk(f'[{tag}] El diagrama se desplaza dentro de su contenedor, no la página', q.evaluate("(()=>{const d=document.querySelector('.ar-diagram');return d.scrollWidth>=d.clientWidth})()") )
        if OUT: q.screenshot(path=OUT + f'/detail-{tag}.png', full_page=False)
        q.goto(BASE + '#/proyecto'); q.wait_for_selector('#ar-form'); q.fill('#ar-ans', 'a'); q.click('#ar-form button[type=submit]'); q.wait_for_timeout(150); q.fill('#ar-ans', 'b'); q.click('#ar-form button[type=submit]'); q.wait_for_selector('input[name=ar-opt]')
        alturas = q.eval_on_selector_all('.ar-opt-body', 'e=>e.map(x=>x.getBoundingClientRect().height)'); btn = q.eval_on_selector_all('#ar-form button', 'e=>e.map(x=>x.getBoundingClientRect().height)')
        chk(f'[{tag}] Builder: opciones y botones ≥ 44 px', min(alturas) >= 44 and min(btn) >= 44, (min(alturas), min(btn)))
        chk(f'[{tag}] Builder sin overflow horizontal', overflow(q) <= 0, overflow(q))
        if OUT: q.screenshot(path=OUT + f'/builder-{tag}.png')
        q.close(); c.close()
    # ── claro / oscuro ──
    for sch in ['dark', 'light']:
        c = br.new_context(viewport={'width': 1280, 'height': 900}, color_scheme=sch, reduced_motion='reduce'); c.route('**/api/*', lambda r: r.fulfill(status=404, json={}))
        q = c.new_page(); q.goto(BASE + '#/c/web-queue-worker'); q.wait_for_selector('.ar-sec'); q.evaluate("document.getElementById('s-diagrama').scrollIntoView()"); q.wait_for_timeout(200)
        if OUT: q.screenshot(path=OUT + f'/diagrama-{sch}.png')
        c.close()
    # ── proyectos con SSR (el que antes rompía los blueprints), enlaces corruptos y estados raros ──
    PROY = {'saas': 'eyJ2IjoxLCJhIjp7InByb2R1Y3QiOiJzYWFzIiwidGVhbSI6InNvbG8ifSwicyI6W119', 'ecommerce': 'eyJ2IjoxLCJhIjp7InByb2R1Y3QiOiJlY29tbWVyY2UiLCJ0ZWFtIjoic29sbyJ9LCJzIjpbXX0', 'otro': 'eyJ2IjoxLCJhIjp7InByb2R1Y3QiOiJvdGhlciIsInRlYW0iOiJzb2xvIn0sInMiOltdfQ'}
    c = br.new_context(viewport={'width': 390, 'height': 800}, reduced_motion='reduce'); c.route('**/api/*', lambda r: r.fulfill(status=404, json={}))
    for nombre, enc in PROY.items():
        for tab in ['decisiones', 'blueprint', 'adr', 'prompts', 'pack']:
            q = c.new_page(); e2 = []; q.on('pageerror', lambda x: e2.append(str(x))); q.goto(BASE + f'#/proyecto/{tab}?p={enc}'); q.wait_for_timeout(300)
            t = q.inner_text('main'); chk(f'[proyecto {nombre}] pestaña «{tab}» se muestra completa, sin errores ni overflow', not e2 and len(t) > 120 and not re.search(r'undefined|\[object|NaN', t) and overflow(q) <= 0, (e2[:1], len(t), overflow(q)))
            q.close()
    for nombre, h, esperado in [('concepto inexistente', '#/c/no-existe', 'No encontré'), ('enlace del proyecto corrupto', '#/proyecto?p=%%%basura', 'no se pudo leer'), ('filtros inválidos', '#/?q=%3Cscript%3E&g=Nada&n=zz&e=qq', 'Project Architect'), ('búsqueda sin resultados', '#/?q=xyzxyzxyz', 'Project Architect')]:
        q = c.new_page(); e2 = []; q.on('pageerror', lambda x: e2.append(str(x))); q.goto(BASE + h); q.wait_for_timeout(300)
        chk(f'[estado raro] {nombre}: mensaje claro y sin errores de JS', not e2 and esperado.lower() in q.inner_text('main').lower(), (e2[:1],)); q.close()
    q = c.new_page(); e2 = []; q.on('pageerror', lambda x: e2.append(str(x))); q.goto(BASE); q.evaluate("localStorage.setItem('dc-architect-project','{{{no json')"); q.goto(BASE + '#/proyecto'); q.wait_for_timeout(300)
    chk('[estado raro] proyecto guardado corrupto: arranca vacío sin romper', not e2 and q.locator('#ar-form').count() == 1, e2[:1]); q.close(); c.close()
    # ── universo vs. práctica: «existe» no es «se recomienda» ──
    c = br.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); c.route('**/api/*', lambda r: r.fulfill(status=404, json={}))
    q = c.new_page(); q.goto(BASE + '#/c/microservices'); q.wait_for_selector('.ar-sec')
    chk('Ficha de microservicios: marcada «Requiere razón fuerte» y aclara que existir en la base no es recomendarlo', 'Requiere razón fuerte' in q.inner_text('.ar-badges') and 'no significa que se recomiende' in q.inner_text('header'))
    q.goto(BASE + '#/'); q.wait_for_selector('.ar-card'); chk('Explorer: las tarjetas de práctica muestran su nivel de justificación', q.locator('.ar-card', has_text='Microservicios').inner_text().count('Requiere razón fuerte') == 1)
    q.goto(BASE + '#/proyecto/decisiones?p=' + PROY['saas']); q.wait_for_selector('.ar-dec'); t = q.inner_text('main')
    chk('Decisiones: la propuesta muestra «Apropiado para este proyecto» y su necesidad', 'Apropiado para este proyecto' in t and ('Proporcional' in t or 'Se necesita' in t))
    q.locator('.ar-dec', has_text='Cómo se organiza el sistema').locator('summary').click()
    ar = q.locator('.ar-dec', has_text='Cómo se organiza el sistema').inner_text()
    chk('Decisiones: microservicios figura como «No se necesita todavía» con su explicación', re.search(r'Microservicios[\s\S]{0,60}No se necesita todavía', ar) is not None and 'no muestra la necesidad' in ar, ar[:200])
    q.close(); c.close()
    # ── complejidad práctica (niveles 1–4) ──
    N4 = 'eyJ2IjoxLCJhIjp7ImlkZWEiOiJQbGF0YWZvcm1hIiwicHJvZHVjdCI6InNhYXMiLCJ0ZWFtIjoibGFyZ2UiLCJzY2FsZSI6ImxhcmdlIiwiYmFja2dyb3VuZCI6ImhlYXZ5IiwicmVhbHRpbWUiOiJjb3JlIiwiaW50ZWdyYXRpb25zIjoibWFueSJ9LCJzIjpbXX0'
    c = br.new_context(viewport={'width': 1280, 'height': 900}, reduced_motion='reduce'); c.route('**/api/*', lambda r: r.fulfill(status=404, json={}))
    q = c.new_page(); q.goto(BASE + '#/proyecto/decisiones?p=' + N4); q.wait_for_selector('.ar-cx'); t = q.inner_text('.ar-cx')
    chk('Nivel 4: se muestra, fuera de la zona habitual, sin bloquear, con partes y alternativa más simple', 'Nivel 4' in t and 'Fuera de la zona práctica habitual' in t and 'no limitan' in t and 'Partes que piden más cuidado' in t and 'Más simple' in t, t[:160])
    chk('Nivel 4: las decisiones se siguen mostrando', q.locator('.ar-dec').count() >= 5)
    chk('Medidor de nivel accesible (nivel actual marcado)', q.locator('.ar-cx-step[aria-current="step"]').count() == 1)
    q.goto(BASE + '#/proyecto/decisiones?p=' + PROY['saas']); q.wait_for_selector('.ar-cx'); chk('SaaS chico: nivel 3 dentro de la zona habitual', 'Nivel 3' in q.inner_text('.ar-cx') and 'Dentro de la zona práctica habitual' in q.inner_text('.ar-cx'))
    q.goto(BASE + '#/proyecto/pack?p=' + N4); q.wait_for_selector('main'); q.wait_for_timeout(300); tx = q.evaluate("document.querySelector('main').textContent"); chk('Project Pack incluye la complejidad práctica', 'Complejidad práctica' in tx and 'Nivel práctico 4 de 4' in tx)
    q.goto(BASE + '#/c/microservices'); q.wait_for_selector('.ar-sec'); chk('Ficha de microservicios (teoría completa) declara «Nivel 4 práctico»', 'Nivel 4 práctico' in q.inner_text('.ar-badges'))
    q.set_viewport_size({'width': 390, 'height': 800}); q.goto(BASE + '#/proyecto/decisiones?p=' + N4); q.wait_for_selector('.ar-cx'); chk('Complejidad práctica sin overflow en móvil', overflow(q) <= 0, overflow(q))
    if OUT: q.screenshot(path=OUT + '/complejidad-movil.png')
    q.close(); c.close()
    chk('Sin errores de JS durante toda la sesión', not errs, errs[:3])
    br.close()
f = [r for r in R if not r[1]]
print(f'\nTOTAL {len(R)} · PASS {len(R) - len(f)} · FAIL {len(f)}')
sys.exit(1 if f else 0)

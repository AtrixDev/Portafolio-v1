import json, re, sys
from playwright.sync_api import sync_playwright

B = 'http://localhost:4173/'
R = []   # (nombre, ok, detalle)
def chk(n, ok, d=''):
    R.append((n, bool(ok), d)); print(('PASS ' if ok else 'FAIL ') + n + (f'  [{d}]' if d and not ok else ''))

MOCK_CHEQUEO = {'rapido': True, 'resultadoId': 'mockid123', 'resumen': {'etiqueta': 'Publicación', 'titulo': 'Resultado simulado', 'veredicto': 'v', 'puntos': [{'t': 'Fotos', 's': '5', 'ok': False}]}}
MOCK_R_RENT = {'herramienta': 'rentabilidad', 'id': 'mockrent'}
MOCK_R_CHQ = {'herramienta': 'chequeo', 'id': 'mockchq', 'resumen': {'etiqueta': 'Publicación', 'titulo': 'Guardado simulado', 'puntos': []}}
llamadas = []

def mock(route):
    u = route.request.url
    if '/api/' not in u: return route.continue_()
    llamadas.append((route.request.method, u.split(':4173')[1]))
    if '/api/audit' in u and route.request.method == 'POST' and 'action=' not in u:
        return route.fulfill(json=MOCK_CHEQUEO)
    if '/api/audit?action=estado' in u:
        return route.fulfill(json={'estado': 'listo', 'nombre': 'Ana', 'nickname': 'TEST', 'resumen': {'salud': 71, 'activas': 3, 'totalHallazgos': 1, 'areas': [{'area': 'Fotos', 'valor': 70}], 'hallazgos': [{'titulo': 'X', 'publicaciones': 1}], 'sinCostos': False}})
    if 'action=resultado&id=mockrent' in u: return route.fulfill(json=MOCK_R_RENT)
    if 'action=resultado&id=mockchq' in u: return route.fulfill(json=MOCK_R_CHQ)
    if '/api/herramientas' in u or '/api/audit' in u or '/api/contact' in u:
        return route.fulfill(status=404, json={'error': 'simulado'})
    return route.continue_()   # tracker demo, academia, content: del dev-server

with sync_playwright() as p:
    br = p.chromium.launch()

    # ── páginas: cargan y no tiran errores de JS ──
    ctx = br.new_context(viewport={'width': 1366, 'height': 800}); ctx.route('**/*', mock)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    paginas = ['index', 'herramientas', 'rentabilidad', 'importar', 'perdida', 'informe-muestra', 'sistema', 'lab', 'acos', 'anatomia', 'excels', 'imagenes', 'metricas', 'pricing', 'reputacion', 'seo', 'web', 'armar', 'programacion', 'contacto', 'vinculado', '404', 'admin']
    for n in paginas:
        errs.clear(); r = pg.goto(B + n + '.html', wait_until='load'); pg.wait_for_timeout(300)
        chk(f'carga {n}.html', r.status == 200 and not errs, f'{r.status} {errs[:2]}')

    # ── header desktop ──
    pg.goto(B + 'acos.html'); pg.wait_for_timeout(200)
    top = pg.eval_on_selector_all('.nav-links > li', 'els=>els.map(e=>e.querySelector("a").textContent.trim())')
    chk('header: 4 elementos principales', top == ['Trayectoria', 'Mercado Libre', 'Desarrollo web', 'Contacto'], top)
    hrefs = pg.eval_on_selector_all('.nav-links > li > a', 'els=>els.map(e=>e.getAttribute("href"))')
    chk('header: padres son enlaces reales', hrefs == ['index.html#experiencia', 'herramientas.html', 'web.html', 'contacto.html'], hrefs)
    ml = pg.locator('.nav-group[data-grupo=ml]'); sub = pg.locator('#nav-sub-ml')
    chk('submenú cerrado al inicio', not sub.is_visible())
    ml.hover(); pg.wait_for_timeout(150)
    chk('hover abre ML', sub.is_visible())
    textos = pg.eval_on_selector_all('#nav-sub-ml a', 'els=>els.map(e=>e.textContent.trim())')
    chk('ML: Hacer/Aprender/Entender completos', textos == ['Herramientas', 'Chequeo de publicación', 'Rentabilidad', 'Importación', 'Pérdida en publicidad', 'Auditoría de cuenta', 'Informe de muestra', 'Guías', 'Cómo trabajo'], textos)
    pg.mouse.move(5, 400); pg.wait_for_timeout(150)
    chk('al salir el mouse se cierra', not sub.is_visible())
    # teclado
    pg.goto(B + 'seo.html'); pg.wait_for_timeout(200)
    pg.locator('.skip-link').focus()
    for _ in range(4): pg.keyboard.press('Tab')   # logo, Trayectoria, ML, ▾
    foco = pg.evaluate('document.activeElement.className')
    chk('teclado: Tab llega al botón ▾ de ML', 'nav-toggle' in foco, foco)
    chk('teclado: foco por teclado abre el submenú', pg.locator('#nav-sub-ml').is_visible())
    pg.keyboard.press('Tab'); f2 = pg.evaluate('document.activeElement.textContent.trim()')
    chk('teclado: Tab entra al submenú', f2 == 'Herramientas', f2)
    ol = pg.evaluate('getComputedStyle(document.activeElement).outlineStyle')
    chk('foco visible en enlaces del submenú', ol != 'none', ol)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    chk('Escape cierra y devuelve el foco al padre', (not pg.locator('#nav-sub-ml').is_visible()) and 'nav-parent' in pg.evaluate('document.activeElement.className'))
    # resaltado: guía → padre ML y «Guías» actual
    cur = pg.eval_on_selector_all('#nav-sub-ml a[aria-current=page]', 'els=>els.map(e=>e.textContent)')
    chk('en una guía: «Guías» marcado actual', cur == ['Guías'], cur)
    chk('en una guía: padre ML marcado (aria-current=true)', pg.get_attribute('.nav-group[data-grupo=ml] > a', 'aria-current') == 'true')
    # clic en padre navega
    pg.click('.nav-group[data-grupo=web] > a'); pg.wait_for_load_state()
    chk('clic en padre «Desarrollo web» navega a web.html', pg.url.endswith('/web.html'), pg.url)

    # ── dropdown estando en herramientas: Chequeo abre la ficha (hashchange) ──
    pg.goto(B + 'herramientas.html'); pg.wait_for_timeout(500)
    chk('herramientas: por defecto abre tracker', pg.locator('#hr-stage').inner_text().strip() != '' and not pg.locator('#hd-chk').count())
    pg.hover('.nav-group[data-grupo=ml]'); pg.click('#nav-sub-ml a:has-text("Chequeo de publicación")'); pg.wait_for_timeout(500)
    chk('desde el menú, #chequeo abre el Chequeo sin recargar', pg.locator('#hd-chk').count() == 1)
    # Chequeo real (API simulada)
    pg.fill('#hd-url', 'https://www.mercadolibre.com.ar/p/MLA27077244');
    chk('botón del Chequeo ya no dice «Mirar»', pg.inner_text('#hd-chk button').strip() == 'Chequear')
    pg.click('#hd-chk button'); pg.wait_for_timeout(600)
    chk('Chequeo: renderiza el resultado', 'Resultado simulado' in pg.inner_text('#hd-chk-out'))
    chk('Chequeo: ofrece guardar/compartir (resultadoId)', pg.locator('#hd-chk-out button, #hd-chk-out a').count() > 0)
    # #chequeo directo
    pg.goto(B + 'herramientas.html#chequeo'); pg.wait_for_timeout(500)
    chk('herramientas.html#chequeo abre el Chequeo', pg.locator('#hd-chk').count() == 1)
    # ?r=
    pg.goto(B + 'herramientas.html?r=mockrent'); pg.wait_for_url('**/rentabilidad.html?r=mockrent', timeout=4000)
    chk('?r= de rentabilidad redirige a rentabilidad.html?r=', 'rentabilidad.html?r=mockrent' in pg.url, pg.url)
    pg.goto(B + 'herramientas.html?r=mockchq'); pg.wait_for_timeout(700)
    chk('?r= de chequeo se dibuja en herramientas', 'Guardado simulado' in pg.inner_text('#hd-chk-out'))

    # ── Rentabilidad (motor en navegador, sin API) ──
    pg.goto(B + 'rentabilidad.html'); pg.wait_for_timeout(400)
    pg.click('button:has-text("Cargar un ejemplo")'); pg.wait_for_timeout(600)
    res = pg.inner_text('#resultado') if pg.locator('#resultado').count() else ''
    chk('Rentabilidad: el ejemplo calcula un resultado', len(res) > 40, res[:80])

    # ── sistema: anchors, orden, Chequeo duplicado fuera, Auditoría presente ──
    pg.goto(B + 'sistema.html'); pg.wait_for_timeout(900)
    orden = pg.eval_on_selector_all('main ~ *, body > div.cs', 'els=>els.map(e=>e.id).filter(Boolean)')
    esperado = ['demo', 'diagnostico', 'metodo', 'skills', 'sistemas', 'prompts', 'stack', 'auditar', 'tendencias']
    chk('sistema: orden de bloques', orden == esperado, orden)
    for a in ['auditar', 'demo', 'diagnostico', 'tendencias']:
        chk(f'sistema: ancla #{a} existe', pg.locator('#' + a).count() == 1)
    chk('sistema: sin formulario de Chequeo duplicado', pg.locator('#au-form, #au-url, #au-go').count() == 0)
    chk('sistema: CTA a herramientas.html#chequeo', pg.locator('#auditar a[href="herramientas.html#chequeo"]').count() == 1)
    chk('sistema: Auditoría intacta (au-cform, au-out, au-caminos)', all(pg.locator('#' + i).count() == 1 for i in ['au-cform', 'au-out', 'au-caminos', 'au-cerr']))
    chk('sistema: demo del Tracker cargó', pg.locator('#dm .dm-chip, #dm table, #dm article, #dm li').count() > 0 or 'Cargando' not in pg.inner_text('#dm'), pg.inner_text('#dm')[:60])
    chk('sistema: título h1 «Cómo trabajo»', pg.inner_text('h1').replace('\n', ' ').startswith('Cómo trabajo'))
    # retorno OAuth (parte cliente): cancelada / error / pedido válido
    pg.goto(B + 'sistema.html?auditoria=cancelada#auditar'); pg.wait_for_timeout(500)
    chk('retorno ?auditoria=cancelada muestra el mensaje', 'Cancelaste la conexión' in pg.inner_text('#au-out'))
    pg.goto(B + 'sistema.html?auditoria=error#auditar'); pg.wait_for_timeout(500)
    chk('retorno ?auditoria=error muestra el mensaje', 'no terminó la conexión' in pg.inner_text('#au-out'))
    pg.goto(B + 'sistema.html?auditoria=' + 'a' * 32 + '#auditar'); pg.wait_for_timeout(1800)
    chk('retorno ?auditoria=<id> consulta el estado y muestra la salud', 'esta es la salud de TEST' in pg.inner_text('#au-out'), pg.inner_text('#au-out')[:80])
    chk('la consulta fue a /api/audit?action=estado', any('action=estado' in u for _, u in llamadas))

    # ── contacto: ?asunto= y ?pub= ──
    for asunto, frag in [('rentabilidad', 'rentabilidad'), ('importacion', 'import'), ('acos', 'ACOS'), ('opiniones', 'opiniones')]:
        pg.goto(B + f'contacto.html?asunto={asunto}'); pg.wait_for_timeout(300)
        v = pg.input_value('textarea'); chk(f'contacto ?asunto={asunto} precarga mensaje', len(v) > 20 and frag.lower() in v.lower(), v[:70])
    pub = 'https://articulo.mercadolibre.com.ar/MLA-123456'
    pg.goto(B + 'contacto.html?motivo=consulta&asunto=auditoria&pub=' + pub); pg.wait_for_timeout(300)
    v = pg.input_value('textarea'); chk('contacto ?asunto=auditoria&pub= incluye la publicación', pub in v, v[:120])
    pg.goto(B + 'contacto.html?asunto=' + 'Quiero algo así: Landing'); pg.wait_for_timeout(300)
    v = pg.input_value('textarea'); chk('contacto «Quiero algo así» dice Biblioteca web', 'Biblioteca web' in v, v[:100])

    # ── redirects ──
    pg.goto(B + 'ia.html'); pg.wait_for_url('**/sistema.html', timeout=4000); chk('ia.html → sistema.html', pg.url.endswith('/sistema.html'), pg.url)
    pg.goto(B + 'tracker.html'); pg.wait_for_url('**/herramientas.html#tracker', timeout=4000); chk('tracker.html → herramientas.html#tracker', pg.url.endswith('herramientas.html#tracker'), pg.url)
    r = pg.goto(B + 'esta-no-existe'); chk('ruta inexistente responde 404 (el dev-server no sirve 404.html; Vercel sí)', r.status == 404, r.status)
    pg.goto(B + '404.html'); chk('404.html: muestra el código', '404' in pg.inner_text('.nf-code'))
    chk('404: enlaces actualizados', pg.eval_on_selector_all('.nf-actions a', 'e=>e.map(a=>a.textContent.trim())') == ['Ir al inicio', 'Herramientas', 'Guías', 'Desarrollo web', 'Biblioteca web'])

    # ── vinculado: salida ──
    pg.goto(B + 'vinculado.html?estado=ok&nick=Test'); chk('vinculado: link «Ir al inicio»', pg.locator('a[href="index.html"]').count() == 1)

    # ── nombres públicos ──
    pg.goto(B + 'programacion.html'); pg.wait_for_timeout(800)
    chk('programacion: h1 «Biblioteca web»', pg.inner_text('h1').strip() == 'Biblioteca web', pg.inner_text('h1'))
    chk('programacion: title nuevo', pg.title().startswith('Biblioteca web'), pg.title())
    pg.goto(B + 'index.html'); pg.wait_for_timeout(600)
    chk('home: sección «Lo que construí» con 4 enlaces', pg.locator('#construi .bu-list a').count() == 4)
    ids = pg.eval_on_selector_all('[id^=el-]', 'e=>e.map(x=>x.id)')
    chk('home: ids administrables = los del baseline (solo el-csub; el resto ya no existía antes de esta fase)', ids == ['el-csub'], ids)
    chk('home: orden — #construi entre #habilidades y #valor-prop', pg.evaluate('''()=>{const o=[...document.querySelectorAll("section[id]")].map(s=>s.id);return o.indexOf("habilidades")+1===o.indexOf("construi")&&o.indexOf("construi")+1===o.indexOf("valor-prop")}'''))
    # nombres viejos fuera de lo visible
    for n in ['index', 'lab', 'sistema', 'web', 'contacto', 'herramientas']:
        pg.goto(B + n + '.html'); pg.wait_for_timeout(300)
        t = pg.inner_text('body')
        chk(f'sin «Lab ML»/«Base de datos»/«Lab de Programación» visibles en {n}', not re.search(r'Lab ML|Base de datos|Lab de Programaci', t), re.findall(r'.{20}(?:Lab ML|Base de datos|Lab de Programaci).{10}', t)[:2])

    # ── footer: 4 columnas con enlaces esperados ──
    pg.goto(B + 'web.html')
    cols = pg.eval_on_selector_all('.footer-col', 'els=>els.map(e=>[e.querySelector("h2").textContent,[...e.querySelectorAll("a")].map(a=>a.textContent.trim())])')
    chk('footer: 4 columnas', [c[0] for c in cols] == ['Darío Colángelo', 'Mercado Libre', 'Desarrollo web', 'Contacto'], cols)
    chk('footer: contenido según spec', cols[1][1] == ['Chequeo de publicación', 'Rentabilidad', 'Importación', 'Pérdida en publicidad', 'Auditoría de cuenta', 'Informe de muestra', 'Guías', 'Cómo trabajo'] and cols[2][1] == ['Revisá tu web', 'Armá tu web', 'Biblioteca web'] and cols[3][1] == ['WhatsApp', 'Email', 'Formulario'] and cols[0][1] == ['Trayectoria', 'Casos', 'CV en PDF', 'LinkedIn'], cols)

    # ── enlaces internos del menú y del pie: todos responden 200 y las anclas existen ──
    pg.goto(B + 'seo.html')
    links = set(pg.eval_on_selector_all('#site-nav a, .footer-index a, #mobileMenu a', 'e=>e.map(a=>a.getAttribute("href"))'))
    links = {l for l in links if not l.startswith(('http', 'mailto', 'tel'))}
    mal = []
    for l in sorted(links):
        path, _, frag = l.partition('#')
        rr = ctx.request.get(B + (path or 'seo.html'))
        if rr.status != 200: mal.append((l, rr.status))
        elif frag and path.endswith('.html') and path not in ('herramientas.html',):
            if f'id="{frag}"' not in rr.text(): mal.append((l, 'sin ancla'))
    chk(f'menú+pie: {len(links)} enlaces internos válidos', not mal, mal)
    ctx.close()

    # ── móvil ──
    m = br.new_context(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True); m.route('**/*', mock)
    mp = m.new_page(); mp.goto(B + 'lab.html'); mp.wait_for_timeout(300)
    chk('móvil: menú de escritorio oculto, hamburguesa visible', (not mp.locator('.nav-links').is_visible()) and mp.locator('#hamburger').is_visible())
    mp.tap('#hamburger'); mp.wait_for_timeout(400)
    chk('móvil: hamburguesa abre el menú', mp.locator('#mobileMenu.open').count() == 1)
    chk('móvil: grupo de la página actual (ML) abierto, el otro cerrado', mp.locator('#mm-sub-ml').is_visible() and not mp.locator('#mm-sub-web').is_visible())
    mp.tap('.mm-toggle[aria-controls=mm-sub-web]'); mp.wait_for_timeout(200)
    chk('móvil: ▾ abre «Desarrollo web»', mp.locator('#mm-sub-web').is_visible() and mp.get_attribute('.mm-toggle[aria-controls=mm-sub-web]', 'aria-expanded') == 'true')
    mp.tap('.mm-toggle[aria-controls=mm-sub-web]'); mp.wait_for_timeout(200)
    chk('móvil: ▾ vuelve a cerrar', not mp.locator('#mm-sub-web').is_visible())
    sw = mp.evaluate('document.documentElement.scrollWidth <= innerWidth')
    chk('móvil: sin scroll horizontal', sw)
    mp.screenshot(path=sys.argv[1] + '/mobile-menu.png')
    mp.tap('.mm-toggle[aria-controls=mm-sub-web]'); mp.tap('#mm-sub-web a:has-text("Armá tu web")'); mp.wait_for_url('**/armar.html', timeout=4000)
    chk('móvil: enlace del submenú navega', mp.url.endswith('/armar.html'), mp.url)
    for pgn in ['index', 'herramientas', 'sistema']:
        mp.goto(B + pgn + '.html'); mp.wait_for_timeout(500)
        chk(f'móvil: {pgn} sin scroll horizontal', mp.evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), mp.evaluate('document.documentElement.scrollWidth'))
    m.close()

    # ── sin JavaScript ──
    nj = br.new_context(viewport={'width': 1366, 'height': 800}, java_script_enabled=False)
    jp = nj.new_page(); jp.goto(B + 'acos.html')
    jp.hover('.nav-group[data-grupo=ml]'); jp.wait_for_timeout(200)
    chk('sin JS: hover abre el submenú (CSS)', jp.locator('#nav-sub-ml').is_visible())
    jp.mouse.move(5, 400)
    jp.click('.nav-group[data-grupo=ml] > a'); jp.wait_for_load_state()
    chk('sin JS: el padre navega a herramientas.html', jp.url.endswith('/herramientas.html'), jp.url)
    jp.goto(B + 'acos.html'); jp.locator('.nav-links a:has-text("Trayectoria")').focus(); jp.keyboard.press('Tab')
    chk('sin JS: foco por teclado abre el submenú (CSS)', jp.locator('#nav-sub-ml').is_visible())
    jp.goto(B + 'acos.html'); ok = jp.locator('.footer-index a[href="herramientas.html#chequeo"]').count() == 1
    chk('sin JS: el pie sigue entregando el índice completo', ok)
    nj.close()
    br.close()

# captura de escritorio abierto
with sync_playwright() as p:
    br = p.chromium.launch(); c = br.new_context(viewport={'width': 1366, 'height': 700}); pg = c.new_page()
    pg.goto(B + 'sistema.html'); pg.wait_for_timeout(500); pg.hover('.nav-group[data-grupo=ml]'); pg.wait_for_timeout(250)
    pg.screenshot(path=sys.argv[1] + '/desktop-menu.png', clip={'x': 0, 'y': 0, 'width': 1366, 'height': 480}); br.close()

f = [r for r in R if not r[1]]
print(f'\nTOTAL {len(R)} · PASS {len(R)-len(f)} · FAIL {len(f)}')
json.dump(R, open(sys.argv[1] + '/qa-resultado.json', 'w'), ensure_ascii=False, indent=1)

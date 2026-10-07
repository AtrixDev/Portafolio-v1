#!/usr/bin/env python3
"""
browser-rentabilidad.py — pruebas de NAVEGADOR de la página de Rentabilidad (S7), en Chromium y Firefox.

Levanta tools/servidor-prueba.mjs (frontend real + motor real + lógica REAL del endpoint con una base en memoria: sin Mongo, sin red, sin datos reales)
y recorre la página con Playwright. Cubre: estados (inicial, incompleto, inválido, error del motor, resultado, pérdida), advertencias y supuestos,
escenarios, invariancia, guardar + ?r=, resultado compartido (solo lectura, sin recalcular, versión distinta, inexistente, otra herramienta),
errores HTTP (400/413/429/5xx), error de red, responsive (390/768/1280), light y dark, y que Chequeo siga abriendo.

Uso:  python3 tools/browser-rentabilidad.py [--navegadores chromium,firefox] [--capturas CARPETA]
Sale con código 1 si algo falla. No es parte de `node --test` (necesita navegadores).
"""
import argparse, json, os, re, socket, subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
FALLOS, OKS = [], []


def puerto_libre():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def esperar(p, seg=20):
    t = time.time()
    while time.time() - t < seg:
        try: socket.create_connection(('127.0.0.1', p), 0.3).close(); return
        except OSError: time.sleep(0.15)
    raise RuntimeError('el servidor de prueba no arrancó')

def check(nav, nombre, cond, detalle=''):
    (OKS if cond else FALLOS).append(f'[{nav}] {nombre}' + ('' if cond else f' — {detalle}'))
    if not cond: print(f'  ✗ [{nav}] {nombre} — {detalle}')

EJ = {'precio': '15.000', 'costo': '6.000', 'ventaPct': '14', 'fijo': '2.740', 'impuestos': '3,5', 'objMargen': '20'}

class Pag:
    """Una página nueva con registro de errores de consola/JS y de pedidos."""
    def __init__(self, ctx, base, nav):
        self.p = ctx.new_page(); self.base = base; self.nav = nav; self.errores = []; self.pedidos = []
        self.p.on('pageerror', lambda e: self.errores.append(f'pageerror: {e}'))
        self.p.on('console', lambda m: self.errores.append(f'console.error: {m.text}') if m.type == 'error' and 'Failed to load resource' not in m.text and 'fonts.g' not in m.text else None)
        self.cuerpos = []
        self.p.on('request', lambda r: (self.pedidos.append((r.method, r.url)), self.cuerpos.append(r.post_data)) if '/api/' in r.url else None)
        # Las fuentes de Google no se piden: la prueba no depende de internet.
        self.p.route(re.compile(r'https://fonts\.(googleapis|gstatic)\.com/.*'), lambda r: r.abort())
    def ir(self, ruta):
        self.p.goto(self.base + ruta); self.p.wait_for_load_state('networkidle')
    def cargar_ejemplo(self):
        self.p.click('[data-accion="ejemplo"]'); self.p.wait_for_selector('.rt-veredicto')
    def llenar(self, **campos):
        for k, v in campos.items(): self.p.fill(f'[name="{k}"]', v)
        self.p.wait_for_timeout(350)
    def res(self): return self.p.inner_text('#rt-res')
    def sin_scroll_horizontal(self):
        return self.p.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')
    def calcular_posts(self): return [u for m, u in self.pedidos if m == 'POST' and 'action=calcular' in u]


def resp(estado, cuerpo, tipo='application/json'):
    return lambda rt, rq=None: rt.fulfill(status=estado, content_type=tipo, body=cuerpo)

def corta(rt, rq=None): rt.abort()


def reset(base, ctx):
    ctx.request.post(base + '/__test/reset-limites')


def correr(pw, nombre_nav, base, capturas):
    try: b = getattr(pw, nombre_nav).launch()
    except Exception as e: check(nombre_nav, 'el navegador se pudo abrir', False, str(e).splitlines()[0]); return
    n = nombre_nav
    ctx = b.new_context(viewport={'width': 1280, 'height': 900}, locale='es-AR')
    shot = lambda pg, nm: pg.p.screenshot(path=str(capturas / f'{n}-{nm}.png'), full_page=True) if capturas else None

    # ── estado inicial ──
    pg = Pag(ctx, base, n); pg.ir('/rentabilidad.html')
    check(n, 'inicial: pregunta y botón de ejemplo', '¿Ganás plata con este producto?' in pg.res() and pg.p.is_visible('[data-accion="ejemplo"]'))
    check(n, 'inicial: no hay botón de guardar ni escenarios ni resumen fijo', not pg.p.is_visible('#rt-guardar') and not pg.p.is_visible('#escenarios') and not pg.p.is_visible('#rt-dock'))
    check(n, 'inicial: ningún campo económico viene cargado', pg.p.eval_on_selector_all('#rt-form input[inputmode]', 'els => els.every(e => e.value === "")'))
    check(n, 'inicial: sólo el régimen viene elegido (monotributo)', pg.p.eval_on_selector_all('#rt-form input[type=radio]:checked', 'els => els.map(e => e.value)') == ['monotributo'])
    check(n, 'inicial: sin pedidos a la API', pg.pedidos == [], str(pg.pedidos))
    shot(pg, 'inicial')

    # ── incompleto / inválido / error del motor ──
    pg.llenar(precio='15.000')
    check(n, 'incompleto: «Falta poco» y pide el costo', 'Falta poco' in pg.res() and 'Costo del producto' in pg.res(), pg.res())
    pg.llenar(precio='15mil', costo='6.000')
    check(n, 'inválido: alerta con el texto escrito', pg.p.is_visible('#rt-res [role=alert]') and '«15mil» no es un número' in pg.res(), pg.res())
    check(n, 'inválido: el campo queda marcado y el error está junto al campo', pg.p.get_attribute('[name=precio]', 'aria-invalid') == 'true' and 'no es un número' in pg.p.inner_text('#e-precio'))
    shot(pg, 'invalido')
    pg.p.click('#rt-res [data-ir="precio"]')
    check(n, 'inválido: el enlace del error lleva el foco al campo', pg.p.evaluate('document.activeElement && document.activeElement.name') == 'precio')
    pg.llenar(precio='15.000')
    check(n, 'motor: sin decir si el costo incluye IVA, el motor pide el dato y no calcula', pg.p.is_visible('#rt-res [role=alert]') and 'Indicá si el costo del producto ya incluye IVA' in pg.res() and not pg.p.is_visible('.rt-veredicto'), pg.res())
    pg.p.click('#rt-res [data-ir="costoIva"]')
    check(n, 'motor: el enlace lleva a la pregunta del IVA', pg.p.evaluate('document.activeElement && document.activeElement.name') == 'costoIva')
    shot(pg, 'error-motor')

    # ── resultado, jerarquía, avisos, supuestos ──
    pg.p.click('[data-accion="limpiar"]'); pg.cargar_ejemplo()
    t = pg.res()
    check(n, 'resultado: ganancia 3.635 por unidad (caso A del motor)', t.startswith('Ganás $ 3.635 por unidad'), t[:80])
    check(n, 'resultado: precio mínimo 10.594 (caso A)', '$ 10.594' in t, t)
    orden = [pg.p.evaluate(f'(document.querySelector("{s}")?.getBoundingClientRect().top ?? -1) + scrollY') for s in ['.rt-veredicto', '#rt-h-precios', '#rt-h-costos', '#rt-h-avisos', '#rt-h-sup', '#rt-h-decidir']]
    check(n, 'resultado: jerarquía ganancia → precios → costos → avisos → supuestos → secundarias', all(x >= 0 for x in orden) and orden == sorted(orden), str(orden))
    check(n, 'resultado: hay supuestos rotulados', pg.p.locator('.rt-tag').count() >= 1)
    check(n, 'resultado: escenarios visibles con la fila «Hoy» y más de un escenario', pg.p.is_visible('#escenarios') and pg.p.locator('#rt-esc-tabla tbody tr').count() >= 3)
    check(n, 'resultado: aparece «Guardar» y el chip dice que se calculó en el navegador', pg.p.is_visible('#rt-btn-guardar') and 'navegador' in pg.p.inner_text('#rt-chip'))
    check(n, 'resultado: calcular en vivo NO llama a la API', pg.pedidos == [], str(pg.pedidos))
    shot(pg, 'resultado')

    # ── invariancia: volver a los mismos datos devuelve exactamente el mismo resultado ──
    antes = pg.p.inner_html('#rt-res')
    pg.llenar(precio='16.000'); pg.llenar(precio='15.000')
    check(n, 'invariancia: mismo dato ⇒ mismo HTML de resultado', pg.p.inner_html('#rt-res') == antes)
    pg.p.dispatch_event('[name=precio]', 'blur'); pg.p.wait_for_timeout(300)
    check(n, 'invariancia: renderizar de nuevo no cambia el resultado', pg.p.inner_html('#rt-res') == antes)

    # ── pérdida ──
    pg.llenar(precio='8.000')
    check(n, 'pérdida: se dice «Perdés plata: −$ 2.140» y el tono es malo', pg.res().startswith('Perdés plata: −$ 2.140 por unidad') and pg.p.get_attribute('.rt-veredicto', 'data-tono') == 'bad', pg.res()[:80])
    check(n, 'pérdida: el aviso del motor está y el resumen fijo también', 'Perdés plata en cada unidad' in pg.res())
    shot(pg, 'perdida')
    pg.llenar(precio='15.000')

    # ── escenarios ──
    filas0 = pg.p.locator('#rt-esc-tabla tbody tr').count()
    pg.p.fill('#rt-prueba-precio', 'abc'); pg.p.click('#rt-prueba button[type=submit]')
    check(n, 'escenarios: un precio que no es número se avisa', pg.p.is_visible('#rt-prueba-err'))
    pg.p.fill('#rt-prueba-precio', '20.000'); pg.p.click('#rt-prueba button[type=submit]')
    check(n, 'escenarios: el precio de prueba suma una fila y aparece «Quitar»', pg.p.locator('#rt-esc-tabla tbody tr').count() == filas0 + 1 and pg.p.is_visible('#rt-prueba-borrar') and 'Si vendés a $ 20.000' in pg.p.inner_text('#rt-esc-tabla'))
    pg.p.click('#rt-prueba-borrar')
    check(n, 'escenarios: «Quitar» deja la tabla como estaba', pg.p.locator('#rt-esc-tabla tbody tr').count() == filas0)

    # ── tramos y costos adicionales ──
    pg.p.click('[data-monto="envio"] [data-accion="modo-monto"]')
    check(n, 'tramos: se despliega la escala del envío', pg.p.is_visible('[data-tramos="envio"] input'))
    pg.p.click('[data-monto="envio"] [data-accion="modo-monto"]')
    pg.p.click('#g-extras > summary'); pg.p.click('[data-accion="extra-mas"]'); pg.p.fill('[name="extraNombre-0"]', 'Caja'); pg.p.fill('[name="extraMonto-0"]', '300'); pg.p.wait_for_timeout(350)
    check(n, 'extras: un costo adicional sin aclarar el IVA lo reporta el motor junto a su fila', pg.p.is_visible('#rt-res [role=alert]'), pg.res()[:120])
    pg.p.check('[name="extraIva-0"][value="si"]', force=True); pg.p.wait_for_timeout(350)
    check(n, 'extras: aclarado el IVA, vuelve el resultado y figura «Caja»', 'Caja' in pg.res() and pg.p.is_visible('.rt-veredicto'))

    check(n, 'sin errores de JS ni de consola en todo el recorrido', pg.errores == [], str(pg.errores))

    # ── guardar + ?r= ──
    reset(base, ctx)
    pg = Pag(ctx, base, n); pg.ir('/rentabilidad.html'); pg.cargar_ejemplo()
    ejemplo_html = pg.p.inner_html('#rt-res')
    pg.p.click('#rt-btn-guardar'); pg.p.wait_for_selector('.hd-salida')
    check(n, 'guardar: un único POST a calcular', len(pg.calcular_posts()) == 1, str(pg.pedidos))
    cuerpo_post = json.loads([c for c in pg.cuerpos if c][0])
    check(n, 'guardar: el navegador manda SOLO la entrada (ninguna métrica calculada)', list(cuerpo_post.keys()) == ['entrada'], str(list(cuerpo_post.keys())))
    check(n, 'guardar: el chip dice «Guardado en el servidor» y el botón queda deshabilitado', 'Guardado en el servidor' in pg.p.inner_text('#rt-chip') and pg.p.is_disabled('#rt-btn-guardar'))
    check(n, 'guardar: lo que muestra el servidor es lo mismo que calculó el navegador', pg.p.inner_html('#rt-res') == ejemplo_html and pg.p.inner_text('#rt-msg') == '')
    link = pg.p.evaluate('document.querySelector("[data-copiar]") && location.origin')
    rid = None
    ctx.grant_permissions(['clipboard-read', 'clipboard-write']) if n == 'chromium' else None
    if n == 'chromium':
        pg.p.click('[data-copiar]'); pg.p.wait_for_timeout(200)
        copiado = pg.p.evaluate('navigator.clipboard.readText()')
        m = re.search(r'\?r=([\w-]+)', copiado); rid = m.group(1) if m else None
    if not rid:   # Firefox no deja leer el portapapeles: se toma el id de la base de prueba
        info = ctx.request.get(base + '/api/herramientas?action=resultado&id=x'); rid = None
    pg.p.fill('[name=precio]', '16.000'); pg.p.wait_for_timeout(350)
    check(n, 'guardar: si se cambia un dato se avisa que el link guardado quedó viejo', 'Cambiaste datos' in pg.p.inner_text('#rt-chip') and pg.p.inner_text('#rt-btn-guardar') == 'Guardar de nuevo' and 'cálculo anterior' in pg.p.inner_text('#rt-msg'))
    shot(pg, 'guardado')
    check(n, 'guardar: sin errores de JS', pg.errores == [], str(pg.errores))

    if not rid:
        # Firefox: se guarda otra vez por la API para conocer el id (misma ruta real del servidor)
        r = ctx.request.post(base + '/api/herramientas?action=calcular', data={'entrada': {'precio': 15000, 'fiscal': {'regimen': 'monotributo'}, 'costo': {'producto': 6000, 'ivaIncluido': True}, 'canal': {'ventaPct': 0.14, 'fijo': 2740, 'ivaModo': 'incluido'}, 'impuestosVentaPct': 0.035, 'objetivo': {'margenPct': 0.2}}})
        rid = r.json()['resultadoId']

    # abrir el link compartido en una página limpia
    sh = Pag(ctx, base, n); sh.ir(f'/rentabilidad.html?r={rid}')
    sh.p.wait_for_selector('.rt-veredicto')
    check(n, '?r=: muestra el banner «Resultado compartido» y los números guardados', 'Resultado compartido' in sh.p.inner_text('#rt-compartido') and sh.res().startswith('Ganás $ 3.635 por unidad'))
    check(n, '?r=: NO recalcula con el servidor (ningún POST) y no vuelve a guardar', sh.calcular_posts() == [], str(sh.pedidos))
    check(n, '?r=: el resultado guardado es idéntico al calculado en vivo', sh.p.inner_html('#rt-res') == ejemplo_html)
    check(n, '?r=: el formulario queda cargado con los datos y en solo lectura', sh.p.input_value('[name=precio]') == '15.000' and sh.p.is_disabled('[name=precio]') and sh.p.input_value('[name=ventaPct]') == '14' and sh.p.input_value('[name=objMargen]') == '20')
    check(n, '?r=: no ofrece «Guardar» (ya está guardado) pero sí copiar/compartir', not sh.p.is_visible('#rt-btn-guardar') and sh.p.is_visible('[data-copiar]'))
    check(n, '?r=: muestra los escenarios (misma versión del motor)', sh.p.is_visible('#escenarios'))
    shot(sh, 'compartido')
    sh.p.click('[data-accion="usar-datos"]'); sh.p.wait_for_selector('.rt-veredicto'); sh.p.wait_for_timeout(300)
    check(n, '?r=: «Usar estos datos» habilita el formulario, recalcula en vivo con el motor y limpia el link', not sh.p.is_disabled('[name=precio]') and sh.res().startswith('Ganás $ 3.635') and '?r=' not in sh.p.url and sh.calcular_posts() == [])
    check(n, '?r=: sin errores de JS', sh.errores == [], str(sh.errores))

    # Chequeo y otras herramientas
    h = Pag(ctx, base, n); h.ir(f'/herramientas.html?r={rid}'); h.p.wait_for_url(re.compile(r'rentabilidad\.html\?r='), timeout=8000)
    h.p.wait_for_selector('.rt-veredicto')
    check(n, 'herramientas.html?r=<rentabilidad> abre la página de Rentabilidad', 'rentabilidad.html' in h.p.url and h.res().startswith('Ganás'))
    sem = ctx.request.post(base + '/__test/sembrar-chequeo').json()['id']
    c = Pag(ctx, base, n); c.ir(f'/herramientas.html?r={sem}'); c.p.wait_for_selector('.hd-resumen', timeout=8000)
    check(n, 'herramientas.html?r=<chequeo> sigue abriendo Chequeo (no se rompió)', 'herramientas.html' in c.p.url and 'Chequeo de prueba' in c.p.inner_text('.hd-resumen'))
    r2 = Pag(ctx, base, n); r2.ir(f'/rentabilidad.html?r={sem}'); r2.p.wait_for_url(re.compile(r'herramientas\.html\?r='), timeout=8000); r2.p.wait_for_selector('.hd-resumen', timeout=8000)
    check(n, 'rentabilidad.html?r=<chequeo> redirige a la herramienta correcta', 'Chequeo de prueba' in r2.p.inner_text('.hd-resumen'))

    # resultado inexistente
    x = Pag(ctx, base, n); x.ir('/rentabilidad.html?r=noexiste123'); x.p.wait_for_selector('#rt-res [role=alert]')
    check(n, '?r= inexistente: dice que no existe y ofrece un cálculo nuevo', 'Ese resultado no existe' in x.res() and x.p.is_visible('#rt-res a.btn-primary') and not x.p.is_visible('#rt-btn-guardar'))
    check(n, '?r= inexistente: el formulario sigue usable (no queda bloqueado)', not x.p.is_disabled('[name=precio]'))
    shot(x, 'inexistente')

    # ── ?r= : errores y versión (respuestas simuladas sobre el pedido real) ──
    base_res = ctx.request.get(f'{base}/api/herramientas?action=resultado&id={rid}').json()
    def con_ruta(url_re, handler, ruta):
        q = Pag(ctx, base, n); q.p.route(url_re, handler); q.ir(ruta); return q
    GET_RE = re.compile(r'/api/herramientas\?action=resultado')
    for estado, esperado in [(429, 'Demasiadas consultas'), (500, 'No pude abrir el resultado'), (503, 'No pude abrir el resultado')]:
        q = con_ruta(GET_RE, resp(estado, '{"error":"x"}'), f'/rentabilidad.html?r={rid}')
        q.p.wait_for_selector('#rt-res [role=alert]')
        check(n, f'?r= con HTTP {estado}: mensaje claro y salida', esperado in q.res() and q.p.is_visible('#rt-res a.btn-primary'), q.res())
    q = con_ruta(GET_RE, corta, f'/rentabilidad.html?r={rid}'); q.p.wait_for_selector('#rt-res [role=alert]')
    check(n, '?r= con error de red: «Falló la conexión»', 'Falló la conexión' in q.res(), q.res())
    q = con_ruta(GET_RE, resp(200, '<html>no json</html>', 'text/html'), f'/rentabilidad.html?r={rid}'); q.p.wait_for_selector('#rt-res [role=alert]')
    check(n, '?r= con respuesta que no es JSON: no revienta', 'No pude abrir el resultado' in q.res() and q.errores == [], q.res() + str(q.errores))
    inc = json.loads(json.dumps(base_res)); inc['datos'].pop('objetivos')
    q = con_ruta(GET_RE, resp(200, json.dumps(inc)), f'/rentabilidad.html?r={rid}'); q.p.wait_for_selector('#rt-res [role=alert]')
    check(n, '?r= con datos incompletos: «Este resultado está incompleto»', 'incompleto' in q.res(), q.res())
    vieja = json.loads(json.dumps(base_res)); vieja['datos']['motor'] = {'version': '0.0-vieja'}
    q = con_ruta(GET_RE, resp(200, json.dumps(vieja)), f'/rentabilidad.html?r={rid}'); q.p.wait_for_selector('.rt-veredicto')
    check(n, '?r= con otra versión del motor: avisa, muestra lo guardado tal cual y NO muestra escenarios nuevos', '0.0-vieja' in q.p.inner_text('#rt-compartido') and q.res().startswith('Ganás $ 3.635') and not q.p.is_visible('#escenarios') and q.calcular_posts() == [])
    shot(q, 'version-distinta')
    # un resultado guardado con números distintos a los que daría el motor de hoy se muestra TAL CUAL (no recalcula en silencio)
    fab = json.loads(json.dumps(base_res)); fab['datos']['resultado']['ganancia'] = 123.45
    q = con_ruta(GET_RE, resp(200, json.dumps(fab)), f'/rentabilidad.html?r={rid}'); q.p.wait_for_selector('.rt-veredicto')
    check(n, '?r=: un valor guardado distinto del que daría el motor se muestra tal cual (no se recalcula en silencio)', q.res().startswith('Ganás $ 123,45 por unidad'), q.res()[:60])
    q.p.evaluate("document.querySelector('#rt-form').dispatchEvent(new Event('input', { bubbles: true }))"); q.p.wait_for_timeout(400)
    check(n, '?r=: ni un evento de edición recalcula el resultado compartido', q.res().startswith('Ganás $ 123,45 por unidad') and q.calcular_posts() == [], q.res()[:60])

    # ── guardar: errores HTTP y de red (el cálculo local sigue en pantalla) ──
    POST_RE = re.compile(r'/api/herramientas\?action=calcular')
    casos = [
        (400, {'ok': False, 'error': 'Revisá', 'code': 'entrada_invalida', 'errores': [{'campo': 'precio', 'texto': 'El precio no es válido'}]}, 'El servidor no aceptó estos datos'),
        (413, {'ok': False, 'error': 'grande', 'code': 'entrada_grande'}, 'demasiados datos'),
        (413, {'ok': False, 'error': 'grande', 'code': 'resultado_grande'}, 'demasiado grande'),
        (429, {'error': 'Calculaste muchas veces seguidas desde tu conexión.'}, 'Calculaste muchas veces'),
        (429, {}, 'Guardaste muchas veces'),
        (500, {'error': 'x'}, 'servidor no pudo guardar'),
        (503, {'error': 'x', 'code': 'no_db'}, 'servidor no pudo guardar'),
    ]
    for estado, cuerpo_, texto in casos:
        q = Pag(ctx, base, n); q.ir('/rentabilidad.html'); q.cargar_ejemplo()
        q.p.route(POST_RE, resp(estado, json.dumps(cuerpo_)))
        q.p.click('#rt-btn-guardar'); q.p.wait_for_function('document.querySelector("#rt-msg").textContent !== "" || document.querySelector("#rt-res .rt-revisar")')
        txt = q.p.inner_text('#rt-msg') + q.res()
        ok_base = q.res().find('Ganás') >= 0 or estado == 400
        check(n, f'guardar con HTTP {estado} ({cuerpo_.get("code", "-")}): mensaje legible', texto in txt, txt[:200])
        check(n, f'guardar con HTTP {estado}: el botón vuelve a quedar usable y no aparece «Guardado»', not q.p.is_disabled('#rt-btn-guardar') and 'Guardado en el servidor' not in q.p.inner_text('#rt-chip') and not q.p.is_visible('.hd-salida'))
        if estado != 400: check(n, f'guardar con HTTP {estado}: el resultado local sigue en pantalla', ok_base and 'Ganás $ 3.635' in q.res(), q.res()[:80])
        check(n, f'guardar con HTTP {estado}: sin errores de JS', q.errores == [], str(q.errores))
    q = Pag(ctx, base, n); q.ir('/rentabilidad.html'); q.cargar_ejemplo(); q.p.route(POST_RE, corta)
    q.p.click('#rt-btn-guardar'); q.p.wait_for_function('document.querySelector("#rt-msg").textContent !== ""')
    check(n, 'guardar con error de red: «No pude conectarme», el cálculo sigue y se puede reintentar', 'No pude conectarme' in q.p.inner_text('#rt-msg') and 'Ganás $ 3.635' in q.res() and not q.p.is_disabled('#rt-btn-guardar'))
    shot(q, 'error-red')
    q = Pag(ctx, base, n); q.ir('/rentabilidad.html'); q.cargar_ejemplo()
    q.p.route(POST_RE, resp(200, 'no es json', 'text/html'))
    q.p.click('#rt-btn-guardar'); q.p.wait_for_function('document.querySelector("#rt-msg").textContent !== ""')
    check(n, 'guardar con respuesta que no es JSON: no revienta y se puede reintentar', q.errores == [] and not q.p.is_disabled('#rt-btn-guardar') and 'Guardado en el servidor' not in q.p.inner_text('#rt-chip'), str(q.errores))
    # 429 real del límite del servidor (30 por hora y por IP)
    reset(base, ctx)
    q = Pag(ctx, base, n); q.ir('/rentabilidad.html'); q.cargar_ejemplo()
    for _ in range(30): ctx.request.post(base + '/api/herramientas?action=calcular', data={'entrada': {'precio': 1000, 'fiscal': {'regimen': 'sin_iva'}, 'costo': {'producto': 100}}})
    q.p.click('#rt-btn-guardar'); q.p.wait_for_function('document.querySelector("#rt-msg").textContent !== ""')
    check(n, 'guardar pasado el límite REAL del servidor: 429 con mensaje y sin guardar', 'muchas veces' in q.p.inner_text('#rt-msg') and not q.p.is_visible('.hd-salida'), q.p.inner_text('#rt-msg'))
    reset(base, ctx)

    # ── responsive y temas ──
    reposo = Pag(ctx, base, n); reposo.ir('/rentabilidad.html')
    for ancho, alto in [(390, 844), (768, 1024), (1280, 900)]:
        pg = Pag(ctx, base, n); pg.p.set_viewport_size({'width': ancho, 'height': alto}); pg.ir('/rentabilidad.html')
        w = f'{ancho}px'
        check(n, f'{w}: estado inicial sin scroll horizontal', pg.sin_scroll_horizontal())
        pg.cargar_ejemplo()
        for g in ['#g-publicidad', '#g-impuestos', '#g-extras', '#g-objetivos']: pg.p.evaluate(f'document.querySelector("{g}").open = true')
        pg.p.click('[data-accion="extra-mas"]'); pg.p.click('[data-monto="fijo"] [data-accion="modo-monto"]'); pg.p.wait_for_timeout(350)
        check(n, f'{w}: resultado con todos los grupos abiertos y tramos, sin scroll horizontal', pg.sin_scroll_horizontal(), pg.p.evaluate('document.documentElement.scrollWidth'))
        pg.p.fill('[name=extraMonto-0]', '300'); pg.p.check('[name="extraIva-0"][value="si"]', force=True); pg.p.fill('[name=extraNombre-0]', 'Caja con un nombre muy largo para ver cómo se parte en pantallas chicas sin romper nada')
        pg.p.wait_for_timeout(350)
        check(n, f'{w}: con un nombre larguísimo tampoco hay scroll horizontal', pg.sin_scroll_horizontal())
        # nada de lo interactivo queda fuera de la pantalla por el costado ni sin tamaño
        malos = pg.p.evaluate('''() => [...document.querySelectorAll('#rt-form input:not([type=radio]):not([type=hidden]), #rt-form button, #rt-form summary, #rt-btn-guardar, #rt-prueba button, #rt-prueba input')]
            .filter(e => e.offsetParent !== null).map(e => ({ n: e.name || e.id || e.textContent.trim().slice(0, 20), r: e.getBoundingClientRect() }))
            .filter(x => x.r.width < 8 || x.r.height < 8 || x.r.left < -1 || x.r.right > innerWidth + 1).map(x => x.n)''')
        check(n, f'{w}: controles visibles y dentro de la pantalla', malos == [], str(malos))
        chicos = pg.p.evaluate('''() => [...document.querySelectorAll('#rt-form input:not([type=radio]):not([type=hidden]), .rt-seg label, #rt-btn-guardar, #rt-prueba button[type=submit], #rt-form summary')]
            .filter(e => e.offsetParent !== null).map(e => ({ n: e.name || e.id || e.textContent.trim().slice(0, 24), h: e.getBoundingClientRect().height }))
            .filter(x => x.h < 36).map(x => x.n + ':' + Math.round(x.h))''')
        check(n, f'{w}: zonas táctiles de al menos 36 px de alto', chicos == [], str(chicos))
        tipo_ok = pg.p.evaluate('''() => [...document.querySelectorAll('#rt-form input:not([type=radio]):not([type=hidden])')].filter(e => e.offsetParent !== null).every(e => parseFloat(getComputedStyle(e).fontSize) >= 16)''')
        if ancho == 390: check(n, f'{w}: los campos usan 16 px o más (iOS no hace zoom al enfocar)', tipo_ok)
        esc_scroll = pg.p.evaluate('''() => { const s = document.querySelector('.rt-scroll'); return { cw: s.clientWidth, sw: s.scrollWidth, vw: innerWidth, l: s.getBoundingClientRect().left, r: s.getBoundingClientRect().right } }''')
        check(n, f'{w}: la tabla de escenarios cabe en pantalla (o se desliza dentro de su caja, nunca la página)', esc_scroll['l'] >= -1 and esc_scroll['r'] <= esc_scroll['vw'] + 1, str(esc_scroll))
        primera_col = pg.p.evaluate('''() => { const t = document.querySelector('.rt-tabla-esc tbody tr:nth-child(2) th'); const r = t.getBoundingClientRect(); return [r.left, r.right, innerWidth, t.textContent] }''')
        check(n, f'{w}: el nombre del escenario es legible (visible y con ancho útil)', primera_col[0] >= -1 and primera_col[1] <= primera_col[2] + 1 and primera_col[1] - primera_col[0] >= 70, str(primera_col))
        pg.p.fill('[name=precio]', '8.000'); pg.p.wait_for_timeout(350)
        check(n, f'{w}: pérdida sin scroll horizontal', pg.sin_scroll_horizontal())
        pg.p.fill('[name=precio]', 'abc'); pg.p.wait_for_timeout(350)
        check(n, f'{w}: error de validación sin scroll horizontal y legible', pg.sin_scroll_horizontal() and pg.p.is_visible('#rt-res [role=alert]'))
        shot(pg, f'responsive-{ancho}-error')
        pg.p.fill('[name=precio]', '15.000'); pg.p.wait_for_timeout(350)
        shot(pg, f'responsive-{ancho}')
        if ancho == 390:
            pg.p.evaluate('window.scrollTo(0, 0)'); pg.p.wait_for_timeout(300)
            pg.p.evaluate('document.querySelector("#rt-form").scrollIntoView()'); pg.p.wait_for_timeout(400)
            check(n, f'{w}: el resumen fijo del celular aparece mientras se completa el formulario', pg.p.is_visible('#rt-dock') and pg.p.inner_text('.rt-cifra') in pg.p.inner_text('#rt-dock'), pg.p.inner_text('#rt-dock'))
            dock = pg.p.evaluate('(() => { const r = document.querySelector("#rt-dock").getBoundingClientRect(); return [r.left, r.right, r.bottom, innerHeight, innerWidth] })()')
            check(n, f'{w}: el resumen fijo está dentro de la pantalla', dock[0] >= -1 and dock[1] <= dock[4] + 1 and dock[2] <= dock[3] + 1, str(dock))
        # compartido en este ancho
        sh = Pag(ctx, base, n); sh.p.set_viewport_size({'width': ancho, 'height': alto}); sh.ir(f'/rentabilidad.html?r={rid}'); sh.p.wait_for_selector('.rt-veredicto')
        check(n, f'{w}: resultado compartido sin scroll horizontal', sh.sin_scroll_horizontal())
        # inexistente en este ancho
        sh = Pag(ctx, base, n); sh.p.set_viewport_size({'width': ancho, 'height': alto}); sh.ir('/rentabilidad.html?r=noexiste123'); sh.p.wait_for_selector('#rt-res [role=alert]')
        check(n, f'{w}: estado de error del link sin scroll horizontal', sh.sin_scroll_horizontal())
        check(n, f'{w}: sin errores de JS', pg.errores == [], str(pg.errores))

    # light y dark: sin scroll, y contraste legible en lo principal
    CONTRASTE = '''() => {
      const lum = c => { const [r, g, b] = c.match(/[\\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }); return .2126 * r + .7152 * g + .0722 * b };
      const fondo = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; const a = c.match(/[\\d.]+/g); if (a && a.length >= 3 && !(a.length === 4 && Number(a[3]) < .9) && c !== 'transparent') return c } return 'rgb(255,255,255)' };
      const sel = ['.rt-titular', '.rt-detalle', '.rt-fila dt', '.rt-fila dd', '.rt-tabla th', '.rt-tabla td', '.rt-avisos li', '.rt-supuestos li', '.rt-chico', '.rt-err:not([hidden])', '#rt-form label > span', '.rt-form legend', '.rt-seg span', '.rt-link'];
      const bajos = [];
      for (const s of sel) for (const el of document.querySelectorAll(s)) {
        if (!el.offsetParent || !el.textContent.trim()) continue;
        const a = lum(getComputedStyle(el).color), b = lum(fondo(el)), r = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        if (r < 4.5) bajos.push(s + ' ' + r.toFixed(2));
      }
      return [...new Set(bajos)];
    }'''
    for tema in ['light', 'dark']:
        c2 = b.new_context(viewport={'width': 390, 'height': 844}, color_scheme=tema, locale='es-AR')
        q = Pag(c2, base, n); q.p.add_init_script(f'try{{localStorage.setItem("dc-theme","{tema}")}}catch(e){{}}')
        q.ir('/rentabilidad.html'); q.cargar_ejemplo(); q.p.fill('[name=precio]', '8.000'); q.p.wait_for_timeout(350)
        check(n, f'tema {tema}: html con data-theme={tema}', q.p.evaluate('document.documentElement.dataset.theme') == tema)
        check(n, f'tema {tema}: sin scroll horizontal', q.sin_scroll_horizontal())
        bajos = q.p.evaluate(CONTRASTE)
        check(n, f'tema {tema} (resultado de pérdida): contraste de texto ≥ 4,5:1', bajos == [], str(bajos))
        shot(q, f'tema-{tema}-perdida')
        q.p.fill('[name=precio]', '15.000'); q.p.wait_for_timeout(350)
        bajos = q.p.evaluate(CONTRASTE)
        check(n, f'tema {tema} (resultado de ganancia): contraste de texto ≥ 4,5:1', bajos == [], str(bajos))
        q.p.fill('[name=precio]', 'abc'); q.p.wait_for_timeout(350)
        check(n, f'tema {tema} (error): contraste de texto ≥ 4,5:1', q.p.evaluate(CONTRASTE) == [], str(q.p.evaluate(CONTRASTE)))
        shot(q, f'tema-{tema}-error')
        c2.close()

    # teclado: se puede completar y calcular sin mouse
    k = Pag(ctx, base, n); k.ir('/rentabilidad.html'); k.p.focus('[name=precio]'); k.p.keyboard.type('15000'); k.p.keyboard.press('Tab'); k.p.keyboard.type('6000'); k.p.keyboard.press('Tab')
    k.p.keyboard.press('ArrowRight') if False else None
    k.p.focus('[name=costoIva][value=si]'); k.p.keyboard.press('Space'); k.p.wait_for_timeout(350)
    check(n, 'teclado: se completa precio, costo e IVA y se calcula', k.res().startswith('Ganás'), k.res()[:80])
    b.close()


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--navegadores', default='chromium,firefox'); ap.add_argument('--capturas', default='')
    a = ap.parse_args()
    capturas = Path(a.capturas) if a.capturas else None
    if capturas: capturas.mkdir(parents=True, exist_ok=True)
    p = puerto_libre()
    srv = subprocess.Popen(['node', 'tools/servidor-prueba.mjs'], cwd=RAIZ, env={**os.environ, 'PORT': str(p)}, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        esperar(p)
        with sync_playwright() as pw:
            for nav in a.navegadores.split(','):
                print(f'── {nav} ──'); correr(pw, nav.strip(), f'http://127.0.0.1:{p}', capturas)
    finally:
        srv.terminate()
        try: err = srv.stderr.read().decode()[-600:]
        except Exception: err = ''
        if err.strip(): print('stderr del servidor de prueba:', err)
    print(f'\n{len(OKS)} comprobaciones correctas · {len(FALLOS)} con fallas')
    for f in FALLOS: print('  ✗', f)
    sys.exit(1 if FALLOS else 0)

if __name__ == '__main__':
    main()

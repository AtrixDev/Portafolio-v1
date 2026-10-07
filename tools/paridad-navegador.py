#!/usr/bin/env python3
"""
paridad-navegador.py — demuestra que el motor económico da EXACTAMENTE lo mismo en Node y en navegadores.

Ejecuta tools/motor-corpus.mjs (224 entradas × validar, evaluar, inversas, escenarios, barridos y la presentación (vista)) en Node y dentro de
Chromium y Firefox, cargando el motor como lo hará el sitio: módulos ES desde /js/motor/*.js. Compara versión, exportaciones,
registro de supuestos y la huella de cada resultado. Hace falta un solo texto de código: no hay segunda implementación.

Orígenes que prueba:
  dev    el servidor local (tools/dev-server.mjs), que sirve /js/motor/ desde backend/lib/motor
  build  la salida REAL de tools/build-deploy.py (lo que se publica), servida como archivos estáticos
  (--autoprueba: sirve una copia con un error a propósito y exige que la comparación lo detecte)

Uso:  python3 tools/paridad-navegador.py [--solo dev|build] [--navegadores chromium,firefox] [--autoprueba]
Requiere: node, python playwright con Chromium (y Firefox, si se pide). No es parte de la suite de `node --test`: depende de navegadores.
"""
import argparse, hashlib, json, os, shutil, socket, subprocess, sys, tempfile, time
from pathlib import Path
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent
MOTOR = RAIZ / 'backend' / 'lib' / 'motor'
MODULOS = ['validar', 'economia', 'inversas', 'escenarios', 'supuestos', 'version', 'vista']


def puerto_libre():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); p = s.getsockname()[1]; s.close(); return p

def esperar(puerto, seg=20):
    t = time.time()
    while time.time() - t < seg:
        try: socket.create_connection(('127.0.0.1', puerto), 0.3).close(); return
        except OSError: time.sleep(0.15)
    raise RuntimeError(f'el servidor no respondió en el puerto {puerto}')

def node(*args):
    r = subprocess.run(['node', str(RAIZ / 'tools' / 'motor-corpus.mjs'), *args], capture_output=True, text=True, cwd=RAIZ)
    if r.returncode: raise RuntimeError('node falló: ' + r.stderr[-400:])
    return r.stdout

def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()


class Servidores:
    def __init__(self): self.procs = []
    def dev(self):
        p = puerto_libre(); self.procs.append(subprocess.Popen(['node', 'tools/dev-server.mjs'], cwd=RAIZ, env={**os.environ, 'PORT': str(p)}, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
        esperar(p); return f'http://127.0.0.1:{p}'
    def estatico(self, carpeta):
        p = puerto_libre(); self.procs.append(subprocess.Popen([sys.executable, '-m', 'http.server', str(p), '--bind', '127.0.0.1', '--directory', str(carpeta)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
        esperar(p); return f'http://127.0.0.1:{p}'
    def cerrar(self):
        for p in self.procs: p.terminate()
        for p in self.procs:
            try: p.wait(5)
            except Exception: p.kill()


def primera_diferencia(a, b, ruta=''):
    if type(a) != type(b): return f'{ruta}: {a!r} ≠ {b!r}'
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if k not in a or k not in b: return f'{ruta}.{k}: falta de un lado'
            d = primera_diferencia(a[k], b[k], f'{ruta}.{k}')
            if d: return d
        return None
    if isinstance(a, list):
        if len(a) != len(b): return f'{ruta}: largo {len(a)} ≠ {len(b)}'
        for i, (x, y) in enumerate(zip(a, b)):
            d = primera_diferencia(x, y, f'{ruta}[{i}]')
            if d: return d
        return None
    return None if a == b else f'{ruta}: {a!r} ≠ {b!r}'


def probar(pw, nombre_nav, origen, etiqueta, ref, fuente):
    """Corre el corpus en un navegador contra `origen` y lo compara con la referencia de Node."""
    res = {'origen': etiqueta, 'navegador': nombre_nav, 'ok': False, 'detalle': []}
    try: b = getattr(pw, nombre_nav).launch()
    except Exception as e: res['detalle'].append(f'no se pudo abrir {nombre_nav}: {str(e).splitlines()[0]}'); res['no_disponible'] = True; return res
    res['motor_js'] = b.version
    ctx = b.new_context(); pg = ctx.new_page()
    errores, modulos = [], {}
    pg.on('console', lambda m: errores.append('consola: ' + m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errores.append('error de página: ' + str(e)))
    pg.on('requestfailed', lambda r: errores.append('pedido fallido: ' + r.url))
    pg.on('response', lambda r: modulos.__setitem__(r.url.rsplit('/', 1)[-1], (r.status, r.headers.get('content-type', ''))) if '/js/motor/' in r.url else None)
    try:
        # Página mínima del MISMO origen (no es una página del sitio) que carga el motor como lo hará el sitio: <script type="module">
        pagina = '<!doctype html><meta charset="utf-8"><title>arnés</title><script type="module">import { MOTOR_VERSION } from "/js/motor/version.js"; window.__version = MOTOR_VERSION;</script>'
        pg.route(origen + '/__arnes.html', lambda r: r.fulfill(status=200, content_type='text/html; charset=utf-8', body=pagina))
        pg.goto(origen + '/__arnes.html'); pg.wait_for_function('window.__version !== undefined')
        if pg.evaluate('window.__version') != ref['version']: res['detalle'].append('el <script type="module"> vio otra versión del motor')
        salida = pg.evaluate(f'({fuente})', '/js/motor/')
        got = json.loads(salida)
        for m in MODULOS:                                  # los 6 módulos llegaron como JavaScript
            s = modulos.get(f'{m}.js')
            if not s or s[0] != 200 or 'javascript' not in s[1]: res['detalle'].append(f'{m}.js: {s}')
        res['version'] = got['version']; res['casos'] = got['totalCasos']
        for clave in ('version', 'exportaciones', 'registro', 'metricas', 'totalCasos', 'muestra'):
            d = primera_diferencia(ref[clave], got[clave], clave)
            if d: res['detalle'].append(d)
        malos = [(r, g) for r, g in zip(ref['casos'], got['casos']) if r['h'] != g['h'] or r['nombre'] != g['nombre']]
        res['difieren'] = len(malos)
        for r, g in malos[:3]:
            piezas = [k for k in r['h'] if r['h'][k] != g['h'].get(k)]
            n = json.loads(node('--detalle', str(r['i']))); br = json.loads(pg.evaluate(f'(async (b) => await ({fuente})(b, {{ detalle: {r["i"]} }}))', '/js/motor/'))
            res['detalle'].append(f'caso {r["i"]} «{r["nombre"]}» difiere en {piezas}: ' + str(primera_diferencia(n, br)))
        res['detalle'] += errores
        res['ok'] = not res['detalle'] and res['difieren'] == 0
    except Exception as e:
        res['detalle'].append('excepción: ' + str(e)[:300])
    finally:
        b.close()
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--solo', choices=['dev', 'build']); ap.add_argument('--navegadores', default='chromium,firefox'); ap.add_argument('--autoprueba', action='store_true')
    a = ap.parse_args()
    navs = a.navegadores.split(',')
    ref = json.loads(node()); fuente = node('--fuente')
    print(f'Node {subprocess.run(["node", "--version"], capture_output=True, text=True).stdout.strip()} · motor {ref["version"]} · {ref["totalCasos"]} casos · {sum(len(v) for v in ref["exportaciones"].values())} exportaciones')
    srv = Servidores(); resultados = []; extra = []
    try:
        origenes = []
        if a.autoprueba:
            tmp = Path(tempfile.mkdtemp()); destino = tmp / 'js' / 'motor'; shutil.copytree(MOTOR, destino, ignore=shutil.ignore_patterns('*.md'))
            f = destino / 'inversas.js'; f.write_text(f.read_text().replace('Math.ceil(p - AJUSTE)', 'Math.floor(p)', 1))        # error a propósito
            (destino / 'version.js').write_text((destino / 'version.js').read_text().replace("'0.1.0'", "'9.9.9'"))
            origenes.append(('AUTOPRUEBA (copia rota a propósito)', srv.estatico(tmp)))
        else:
            if a.solo in (None, 'dev'): origenes.append(('dev (dev-server.mjs)', srv.dev()))
            if a.solo in (None, 'build'):
                r = subprocess.run([sys.executable, 'tools/build-deploy.py'], cwd=RAIZ, capture_output=True, text=True)
                if r.returncode: raise RuntimeError('build-deploy.py falló: ' + r.stderr[-400:])
                base = RAIZ / '.deploy' / 'dariocolangelo-portfolio' / 'v2'
                pub, lib = base / 'public' / 'js' / 'motor', base / 'lib' / 'motor'
                fuentes = sorted(p.name for p in MOTOR.glob('*.js'))
                extra.append(('la copia del sitio público es idéntica a la fuente (sha256)', sorted(p.name for p in pub.glob('*')) == fuentes and all(sha(pub / n) == sha(MOTOR / n) for n in fuentes)))
                extra.append(('la copia del servidor (lib/motor) es idéntica a la fuente (sha256)', sorted(p.name for p in lib.glob('*.js')) == fuentes and all(sha(lib / n) == sha(MOTOR / n) for n in fuentes)))
                extra.append(('no se copió documentación (*.md) al sitio público', not list(pub.glob('*.md'))))
                origenes.append(('build (salida de build-deploy.py)', srv.estatico(base / 'public')))
        with sync_playwright() as pw:
            for etiqueta, origen in origenes:
                for nav in navs: resultados.append(probar(pw, nav, origen, etiqueta, ref, fuente))
    finally:
        srv.cerrar()

    print()
    print(f'{"origen":<38}{"navegador":<11}{"motor JS":<16}{"casos":<7}{"difieren":<10}{"resultado"}')
    for r in resultados:
        estado = 'NO DISPONIBLE' if r.get('no_disponible') else 'OK' if r['ok'] else 'DIFIERE'
        print(f'{r["origen"]:<38}{r["navegador"]:<11}{r.get("motor_js", "—"):<16}{r.get("casos", "—")!s:<7}{r.get("difieren", "—")!s:<10}{estado}')
        for d in r['detalle']: print('     ·', d)
    for txt, ok in extra: print(('OK     ' if ok else 'FALLA  ') + txt)
    ok = all(r['ok'] for r in resultados if not r.get('no_disponible')) and all(o for _, o in extra) and any(r['ok'] for r in resultados)
    if a.autoprueba:
        detectado = any(not r['ok'] and not r.get('no_disponible') for r in resultados)
        print('\nAUTOPRUEBA:', 'la comparación DETECTÓ el error (correcto)' if detectado else 'NO detectó el error (la prueba no sirve)')
        sys.exit(0 if detectado else 1)
    print('\nPARIDAD NODE ↔ NAVEGADOR:', 'OK' if ok else 'FALLA')
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()

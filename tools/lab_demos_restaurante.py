#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Restaurante (Brasa): parte del experimento con skill y le suma una sección con la parrilla dibujada, en la misma tinta
(grano y borde irregular del filtro #tinta ya definido en el sitio). Las demás secciones quedan idénticas al experimento."""
from pathlib import Path
RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "frontend/experimentos/impeccable/con/index.html"
DESTINO = RAIZ / "frontend/prog-ejemplos/negocios/restaurante.html"

PARRILLA = '''<svg class="grabado" viewBox="0 0 560 360" role="img" aria-labelledby="grab-t">
<title id="grab-t">Una parrilla a leña con un ojo de bife sobre las brasas</title>
<g filter="url(#tinta)">
  <g fill="#971a10">
    <path d="M280 20c30 46 70 70 70 118 0 36-26 58-52 66 10-24 4-44-18-62-6 22-24 34-34 54-30-14-44-40-36-70 6-22 26-34 34-60 8 16 18 22 24 34 6-26 4-50 12-80Z"/>
    <path d="M168 96c18 30 44 44 44 78 0 22-14 36-30 42 6-16 0-30-14-40-4 14-14 22-20 34-20-10-28-26-22-46 4-14 16-22 20-38 6 10 12 14 16 22 4-18 2-34 6-52Z"/>
    <path d="M404 80c14 26 36 38 36 66 0 20-12 32-26 38 4-14 0-26-12-34-4 12-12 18-16 28-18-8-24-22-18-38 4-12 14-20 18-34 4 8 10 12 14 18 2-16 0-28 4-44Z"/>
  </g>
  <g fill="#f3e3c8"><path d="M286 96c12 20 28 30 28 52 0 14-8 24-20 28 4-12 0-22-10-28-4 10-10 14-12 24-12-6-18-16-14-30 3-9 10-14 12-24 6 6 8 10 12 14 3-12 3-22 4-36Z"/>
  <path d="M178 150c8 14 20 20 20 36 0 10-6 16-14 20 2-8 0-14-6-18-2 6-6 10-8 16-8-4-12-12-10-20 2-6 8-10 8-18 4 4 6 6 8 10 2-8 2-14 2-26Z"/></g>
  <g fill="#6a120b"><ellipse cx="280" cy="228" rx="150" ry="30"/></g>
  <g fill="#971a10"><path d="M150 224c0-30 52-52 132-52s140 24 140 54-60 46-138 46-134-18-134-48Z"/></g>
  <g fill="none" stroke="#f3e3c8" stroke-width="6" stroke-linecap="round"><path d="M196 206l48 40M250 200l50 46M308 200l48 44M360 208l34 30"/></g>
  <circle cx="378" cy="226" r="14" fill="#f3e3c8"/><circle cx="378" cy="226" r="6" fill="#971a10"/>
  <g fill="none" stroke="#6a120b" stroke-width="9" stroke-linecap="round"><path d="M70 286H490M70 308H490M96 286v54M464 286v54M180 286v54M380 286v54"/></g>
  <g fill="#971a10"><circle cx="118" cy="330" r="5"/><circle cx="214" cy="344" r="4"/><circle cx="300" cy="334" r="5"/><circle cx="418" cy="342" r="4"/><circle cx="504" cy="326" r="4"/><circle cx="52" cy="318" r="3"/></g>
</g></svg>'''

SECCION = '''
  <section class="seccion fuego-sec" aria-labelledby="fuego-t">
    <div class="fuego-g">
      <figure class="fuego-fig">''' + PARRILLA + '''</figure>
      <div>
        <h2 class="impreso-grande" id="fuego-t">Brasa baja, sin apuro.</h2>
        <p class="texto">Todo sale de una parrilla a leña. Cortes de la semana, achuras y verduras, cocinados al ritmo de la brasa y no del reloj.</p>
        <p class="mano fuego-n">El ojo de bife se pide a punto, jugoso o bien cocido.</p>
      </div>
    </div>
  </section>
'''

CSS = '''
.fuego-g { display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); gap: clamp(2rem, 5vw, 5rem); align-items: center; }
.fuego-fig { margin: 0; }
.grabado { display: block; width: 100%; height: auto; max-width: 34rem; margin-inline: auto; overflow: visible; }
.fuego-sec .impreso-grande { font-size: clamp(2.8rem, 1.6rem + 4.4vw, 5rem); text-wrap: balance; }
.fuego-sec .texto { margin-top: 1.1rem; max-width: 34ch; color: var(--rojo-tinta); font-size: 1.15rem; line-height: 1.5; }
.fuego-n { margin-top: 1.4rem; color: var(--birome); font-size: 1.35rem; transform: rotate(-1.5deg); }
@media (max-width: 760px) { .fuego-g { grid-template-columns: minmax(0, 1fr); } }
'''

def main():
    h = ORIGEN.read_text(encoding="utf-8")
    ancla = '  <section class="seccion" id="reservar"'
    assert ancla in h and "</style>" in h
    h = h.replace(ancla, SECCION + "\n" + ancla, 1).replace("</style>", CSS + "</style>", 1)
    DESTINO.write_text(h, encoding="utf-8")
    print("OK · restaurante.html con la parrilla dibujada")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Núcleo de los pares de fuentes: el "qué es" sale de los datos de cada par (tipografías y carácter); lo demás es texto de Claude (borrador, sin validar).
"Cuándo sí" y "aporta" originales se conservan."""
import json
from pathlib import Path
from lab_nucleo_suma import S

# id: (qué problema resuelve, cuándo no)
TP = {
"classic-elegant": ("Un título elegante sobre un texto neutro transmite sofisticación sin sacrificar la lectura.", "Marcas informales, cercanas o lúdicas."),
"modern-professional": ("Combina la presencia geométrica de los títulos con un texto amable y muy legible.", "Cuando buscás una identidad de marca marcada: es un par seguro y neutro."),
"tech-startup": ("Le da a un producto tecnológico un carácter propio sin perder legibilidad.", "Rubros tradicionales o formales."),
"editorial-classic": ("Con todo en serif se logra un aire editorial y literario consistente.", "Interfaces de aplicaciones o paneles, donde el serif cansa."),
"minimal-swiss": ("Una sola familia con distintos pesos resuelve toda la jerarquía con máxima simplicidad.", "Cuando necesitás contraste y personalidad entre títulos y texto."),
"playful-creative": ("Las formas redondeadas transmiten cercanía y juego.", "Rubros serios como legal, finanzas o salud."),
"bold-statement": ("Una tipografía de titulares muy marcada llama la atención de entrada.", "Textos largos: la fuente de títulos es solo para encabezados."),
"wellness-calm": ("Las curvas orgánicas con un texto simple transmiten calma.", "Marcas tecnológicas o de impacto."),
"developer-mono": ("Una monoespaciada para el código y una sans para la interfaz refuerzan una identidad técnica.", "Sitios para público general, donde lo monoespaciado se siente frío."),
"retro-vintage": ("Un titular de alto impacto con aire vintage le da carácter a una marca nostálgica.", "Marcas modernas, minimalistas o corporativas."),
"geometric-modern": ("Dos geométricas que se llevan bien: una con más personalidad para los títulos y otra neutra para leer.", "Cuando buscás contraste fuerte entre títulos y texto."),
"luxury-serif": ("Un serif fino con una sans geométrica da elegancia y precisión.", "Marcas masivas o accesibles."),
"friendly-saas": ("Una sola familia versátil y amable resuelve toda la interfaz.", "Cuando querés algo más distintivo que lo habitual en SaaS."),
"news-editorial": ("Un serif pensado para textos largos con una sans neutra para la interfaz mejora la lectura prolongada.", "Landings cortas o marcas visuales."),
"handwritten-charm": ("Un toque manuscrito aporta calidez y cercanía.", "Para texto corrido: la manuscrita solo funciona en acentos."),
"corporate-trust": ("Una fuente diseñada para la legibilidad transmite seriedad y es accesible.", "Marcas creativas o con identidad visual fuerte."),
"brutalist-raw": ("Todo en monoespaciada da una estética cruda y consistente.", "Mucho texto o públicos que no son técnicos."),
"fashion-forward": ("Un titular con carácter único y un texto claro dan una identidad de moda vanguardista.", "Rubros conservadores."),
"soft-rounded": ("Dos redondeadas dan una sensación suave y amigable.", "Marcas formales o técnicas."),
"premium-sans": ("Dos sans modernas dan un aspecto premium sin recargar. Ojo: dos de las fuentes están en Fontshare y no en Google Fonts.", "Cuando necesitás cargarlas solo desde Google Fonts: usá la alternativa DM Sans."),
"vietnamese-friendly": ("Tiene soporte completo de los caracteres del vietnamita.", "Si no necesitás ese soporte: hay opciones más distintivas."),
"legal-professional": ("Un serif clásico transmite autoridad y una sans limpia deja leer.", "Marcas jóvenes o informales."),
"medical-clean": ("Fuentes limpias y accesibles generan confianza en contextos de salud.", "Marcas que buscan diferenciarse con carácter visual."),
"financial-trust": ("Una familia técnica que transmite seriedad y se lee muy bien en datos.", "Marcas creativas o informales."),
"real-estate-luxury": ("Un titular clásico en mayúsculas con un texto moderno da una imagen de alta gama.", "Inmobiliarias populares o de barrio."),
"restaurant-menu": ("Una serif en versalitas para los encabezados de la carta con un texto amable.", "Marcas de comida rápida o informales."),
"art-deco": ("Una titular decorativa de los años 20 le da una atmósfera de época.", "Cualquier uso fuera de lo temático: es muy particular."),
"magazine-style": ("Una serif de alto contraste con una sans pública dan una voz de revista.", "Aplicaciones, o textos muy chicos donde el serif fino se pierde."),
"crypto-web3": ("Una display futurista para los títulos refuerza la identidad tecnológica.", "Marcas que buscan sobriedad o confianza tradicional."),
"gaming-bold": ("Fuentes anchas y fuertes transmiten energía de competencia.", "Marcas formales o relajadas."),
"indie-craft": ("Una display artesanal con un texto legible da un aire hecho a mano.", "Marcas corporativas."),
"startup-bold": ("Una display audaz con una sans moderna transmite seguridad e innovación. Ojo: Clash Display está en Fontshare.", "Si solo podés usar Google Fonts: Outfit es la alternativa."),
"e-commerce-clean": ("Fuentes limpias y legibles ayudan a leer descripciones de producto.", "Marcas de lujo o de identidad muy marcada."),
"academic-research": ("Un serif erudito con una sans diseñada para la accesibilidad ayudan a leer textos densos.", "Marcas comerciales o juveniles."),
"dashboard-data": ("Una familia con versión de código y de texto da coherencia entre datos y etiquetas.", "Sitios de marketing o de contenido."),
"music-entertainment": ("Una display enérgica con una sans amigable da una identidad de espectáculo.", "Marcas sobrias."),
"minimalist-portfolio": ("Dos sans con personalidad suave dan un portfolio limpio y artístico.", "Cuando la marca necesita un carácter tipográfico fuerte."),
"kids-education": ("Fuentes divertidas y redondeadas mantienen a chicos interesados.", "Públicos adultos o formales."),
"wedding-romance": ("Una script elegante para acentos con una serif legible da romance.", "Texto corrido o interfaces: la script solo va en detalles."),
"science-tech": ("Una display tech con una monoespaciada para código y datos da un aire científico.", "Marcas amables o cálidas."),
"accessibility-first": ("Una fuente diseñada para máxima legibilidad ayuda a quienes tienen baja visión o dislexia.", "Cuando la identidad visual importa más que la legibilidad."),
"sports-fitness": ("Una condensada para titulares de impacto con su familia regular para el texto.", "Marcas delicadas o de bienestar tranquilo."),
"luxury-minimalist": ("Un serif de alto contraste con una sans geométrica da lujo sobrio.", "Marcas accesibles o cercanas."),
"tech-hud-mono": ("Una monoespaciada con aire de ciencia ficción para interfaces futuristas.", "Contenido de lectura larga."),
"pixel-retro": ("Una fuente de píxeles es la identidad de los juegos retro. La de títulos es muy ancha: la otra funciona mejor para el texto.", "Cualquier uso no temático: se lee mal en tamaños chicos."),
"neubrutalist-bold": ("Una display con peso variable y mucho carácter para diseños neobrutalistas.", "Marcas sobrias o delicadas."),
"academic-archival": ("Dos serifs clásicas que dan un aire de archivo y se leen bien.", "Productos tecnológicos o juveniles."),
"spatial-clear": ("Una fuente optimizada para leerse sobre fondos dinámicos y translúcidos.", "Cuando buscás una identidad tipográfica distintiva."),
"kinetic-motion": ("Una display ancha que funciona bien con efectos de movimiento.", "Textos largos o interfaces estáticas."),
"gen-z-brutal": ("Una condensada impactante para stickers, badges y consignas.", "Marcas formales."),
"bauhaus-geometric": ("Un sistema de una sola familia con títulos en mayúsculas pesadas y tracking cerrado da carácter geométrico.", "Textos largos en mayúsculas: cuestan leerse."),
"minimalist-monochrome-editorial": ("Tres familias con jerarquía editorial austera dan un look de revista en blanco y negro.", "Marcas coloridas o interfaces con mucho dato."),
"modern-dark-cinema-inter-system": ("Un sistema de una sola familia de precisión para interfaces oscuras y técnicas.", "Marcas cálidas o juguetonas."),
"saas-mobile-boutique-calistoga-inter": ("Un titular con calidez humana sobre una sans neutra da carácter a un SaaS móvil.", "Sitios de escritorio con mucho dato: está pensada para móvil."),
"terminal-cli-monospace": ("Una sola monoespaciada para toda la interfaz recrea una terminal.", "Públicos no técnicos o textos largos."),
"kinetic-brutalism-space-grotesk": ("Una sola familia en pesos extremos para un brutalismo con movimiento.", "Marcas sobrias."),
"flat-design-mobile-system-bold": ("Una sola familia con respaldo del sistema para apps multiplataforma planas.", "Marcas que quieren una voz tipográfica propia."),
"material-you-md3-roboto-system": ("La escala tipográfica de Material Design 3 con Roboto para apps Android coherentes.", "Marcas que no siguen las convenciones de Android."),
"neo-brutalism-mobile-space-grotesk-heavy": ("Solo los pesos más fuertes (700 y 900) dan un look neobrutalista contundente.", "Cualquier contexto que pida delicadeza."),
"bold-typography-mobile-inter-tight-poster": ("El texto como protagonista, con estética de afiche editorial.", "Marcas que quieren dejar protagonismo a imágenes."),
"academia-mobile-cormorant-crimson-cinzel": ("Tres serifs clásicas con un aire de biblioteca y erudición.", "Productos modernos o juveniles."),
"cyberpunk-mobile-orbitron-jetbrains-mono": ("Una display futurista con una monoespaciada para una interfaz cyberpunk.", "Marcas sobrias."),
"web3-bitcoin-defi-space-grotesk-inter-mono": ("Tres familias para una identidad de fintech cripto con precisión.", "Marcas tradicionales de finanzas."),
"claymorphism-mobile-nunito-dm-sans": ("Redondeadas con pesos pesados para una interfaz de arcilla amigable.", "Marcas formales."),
"enterprise-saas-mobile-plus-jakarta-sans": ("Una sola familia legible y cercana, que combina con el texto dinámico de iOS.", "Marcas con identidad tipográfica distintiva."),
"sketch-hand-drawn-mobile-kalam-patrick-hand": ("Dos manuscritas para dar la sensación de boceto a mano.", "Interfaces con mucho texto: la manuscrita cansa."),
"neumorphism-mobile-plus-jakarta-sans-system": ("Una sola familia o la del sistema acompaña la estética suave del neumorfismo.", "Cuando el contraste es crítico."),
}

def _cargar():
    d = json.load(open(Path(__file__).resolve().parent.parent / "frontend/data/weblab/tipografias.json", encoding="utf-8"))
    return d if isinstance(d, list) else d.get("items", d.get("fichas", list(d.values())))

SUMA_TP = {}
try:
    for e in _cargar():
        i = e["id"]
        if i not in TP: continue
        f = e.get("fonts") or {}
        h, b = f.get("heading", ""), f.get("body", "")
        par = f"{h} para los títulos y {b} para el texto" if h and b and h != b else f"{h or b} en todo el sitio"
        car = e.get("summary", "")
        que = f"Un par de fuentes: {par}. Carácter: {car}."
        prob, no = TP[i]
        SUMA_TP[("tipografias", i)] = S(que=que, problema=prob, no=no)
except Exception as ex:   # sin fuente de datos no hay "qué es": se avisa en el migrador
    print("AVISO tipografías:", ex)

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Completa huecos del núcleo en fichas que ya tenían buen texto (borrador de Claude, sin validar). No reemplaza nada existente."""
def S(problema=None, si=None, que=None, aporta=None, no=None, como=None):
    d = {}
    for k, v in (("problema", problema), ("cuando_si", si), ("que_es", que), ("cuando_no", no), ("como", como)):
        if v: d[k] = [{"l": "", "x": v}]
    if aporta: d["aporta"] = [{"l": a, "x": b} for a, b in aporta]
    return d

SUMA = {}
ARQ = {
 "estatico": S("Un sitio que no cambia con cada visita no necesita un servidor armando cada página: solo agrega costo y puntos de falla."),
 "jamstack": S("Un sitio con contenido que se edita seguido (blog, catálogo) suele volverse lento si cada visita consulta una base de datos.", "Blogs, catálogos y sitios de contenido que cambian de a ratos y necesitan buen SEO."),
 "spa-api": S("Una aplicación con mucha interacción se siente lenta si cada clic recarga la página.", "Paneles y aplicaciones con mucha interacción, o cuando la misma API tiene que servir también a una app móvil."),
 "ssr": S("Cuando el contenido cambia todo el tiempo y tiene que aparecer en Google, una página estática queda desactualizada y una SPA llega vacía al buscador.", "Tiendas y sitios con contenido que cambia seguido y tienen que posicionar en buscadores."),
 "hibrida": S("No todas las páginas de un sitio son iguales: una landing casi no cambia, un panel cambia siempre. Tratarlas igual obliga a elegir mal.", "Sitios grandes con páginas de distinto tipo, como una tienda con landing estática y carrito dinámico."),
 "serverless": S("Un sitio que solo necesita una función (enviar un formulario, consultar una API) no justifica un servidor encendido todo el día.", "Formularios, integraciones y APIs chicas con tráfico bajo o irregular."),
 "monolito": S("Dividir una aplicación en muchas piezas antes de tiempo agrega trabajo sin dar nada a cambio.", "Equipos chicos, proyectos nuevos y aplicaciones donde todo se despliega junto."),
 "baas": S("Armar login, base de datos y archivos desde cero demora semanas antes de ver la primera pantalla.", "Prototipos, MVPs y aplicaciones con login y datos simples que tienen que salir rápido."),
 "headless-cms": S("Si el contenido está dentro del código, cada cambio de texto necesita un programador.", "Sitios donde el cliente o un equipo de contenido edita textos e imágenes sin tocar el código."),
 "ecommerce-saas": S("Programar una tienda con carrito, pagos, stock y envíos es caro y lleva meses cuando lo que se quiere es vender ya.", "Comercios que quieren vender online rápido, sin desarrollo a medida."),
 "microservicios": S("Cuando un sistema es muy grande, un solo bloque se vuelve difícil de cambiar sin romper otras partes y los equipos se pisan."),
}
SUMA.update({("arquitecturas", k): v for k, v in ARQ.items()})

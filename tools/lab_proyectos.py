#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fichas de proyectos reales y de funcionalidades de Programación v2.

REGLA: solo información comprobada (ver docs/lab/proyectos-verificables.md). Cada dato lleva su fuente.
Nada se completa por inferencia. Lo que no está comprobado figura en "pendiente".

Lo que falta autorización (Odontología Almagro) vive en lab_proyectos_privado.py, que NO va a git ni se emite.
"""

# Las funcionalidades referencian proyectos por id; los proyectos referencian fichas existentes como "coleccion/id" (resueltas al migrar)
PROYECTOS = [
    {
        "id": "ml-tracker", "nombre": "ML Tracker", "areas": ["ia-datos"], "temas": ["mercado-libre"],
        "resumen": "Análisis de cuentas de Mercado Libre conectadas por la API oficial. Privado, con demo pública sobre una cuenta simulada.",
        "estado": "En producción (uso privado; la demo pública usa datos simulados)",
        "nucleo": {
            "que_es": ["Conexión por OAuth con la API oficial de Mercado Libre y análisis de publicaciones y cuentas: series diarias, cambios de precio, rentabilidad, recomendación y decisión de precio, pruebas estadísticas de conteos y proporciones."],
            "como": ["Acciones del endpoint: sync, cuenta, cuentas, item, ficha, costos, competencia, opiniones, tendencias, invitar, desvincular, demo y cron."],
        },
        "tecnologias": ["Node.js (funciones serverless)", "MongoDB Atlas", "API de Mercado Libre (OAuth)", "JavaScript sin framework", "Vercel"],
        "usa": ["servicios/vercel", "servicios/mongodb-atlas", "arquitecturas/serverless", "stacks/vanilla"],
        "implementa": ["analisis-de-cuenta-mercado-libre"],
        "fuente": "backend/api/tracker.js, backend/lib/tracker.js, frontend/js/herr.js, PRODUCT.md",
        "pendiente": ["La demo pública usa una cuenta simulada: no es una cuenta real de un cliente."],
        "enlaces": [["Demo", "sistema.html#demo"]],
    },
    {
        "id": "este-portfolio", "nombre": "Este portfolio", "areas": ["desarrollo-web"], "temas": [],
        "resumen": "Sitio personal con herramientas propias, auditoría pública, diagnóstico de webs y esta base de datos.",
        "estado": "En producción",
        "nucleo": {
            "que_es": ["Sitio con páginas públicas, guías de Mercado Libre, Sistema con auditoría pública, diagnóstico de la web de un negocio, la base de Programación, formulario de contacto y un administrador privado."],
        },
        "tecnologias": ["HTML, CSS y JavaScript sin framework", "Node.js (funciones serverless)", "MongoDB Atlas", "Vercel"],
        "usa": ["servicios/vercel", "servicios/mongodb-atlas", "arquitecturas/serverless", "stacks/vanilla"],
        "implementa": [],
        "fuente": "frontend/*.html, backend/api/*.js (audit, contact, content, login), backend/lib/diagnostico-web.js, PRODUCT.md",
        "pendiente": [],
        "enlaces": [["Ver el sitio", "index.html"]],
    },
    {
        "id": "tenshi", "nombre": "Tenshi TCG", "areas": ["desarrollo-web"], "temas": ["e-commerce"],
        "resumen": "Tienda online de producto sellado de Pokémon TCG japonés, con preventas, calendario de lanzamientos y cartas destacadas.",
        "estado": "Proyecto propio, construido y no publicado",
        "nucleo": {
            "que_es": ["E-commerce de producto sellado japonés (booster boxes, sobres, sets especiales) con preventas con seña, calendario de lanzamientos con cuenta regresiva y cartas destacadas traídas de TCGdex. Parte de la base técnica de otra tienda propia: Next.js, Prisma, Mercado Pago, panel de administración."],
            "aporta": [
                "Dos temas (oscuro y claro) con interruptor.",
                "Preventas con seña: cada producto define el porcentaje; el carrito, el checkout y el pedido separan lo que se paga hoy del saldo.",
                "Calculadora de precio de yenes a pesos (tipo de cambio, importación y margen en Configuración).",
                "Límite de compra por persona, controlado por email en el servidor (según su README).",
            ],
        },
        "tecnologias": ["Next.js 14", "Prisma", "Mercado Pago", "Resend (mails)", "TCGdex", "jose y bcryptjs (acceso)", "zod", "sharp"],
        "usa": ["stacks/nextjs", "servicios/mercadopago", "servicios/resend"],
        "implementa": ["pagos-mercado-pago", "carrito-y-checkout", "panel-de-administracion", "cuentas-de-cliente", "preventas-con-sena", "calculadora-precio-yen-pesos"],
        "fuente": "tenshi-store: README.md, PRODUCT.md, DESIGN.md, package.json, prisma/schema.prisma, rutas de src/app y archivos de src/lib",
        "pendiente": [
            "No está publicado (confirmado por Darío): faltan datos de contacto, alias bancario, política de preventas, precios y stock reales, fotos propias y costos de envío, según su README.",
            "Hay rutas y modelos de proveedores, campañas, piezas de contenido y colección digital sin documentación: no se describen hasta que Darío lo confirme.",
        ],
        "enlaces": [],
    },
    {
        "id": "tienda-de-coleccionables", "nombre": "Tienda de coleccionables", "areas": ["desarrollo-web"], "temas": ["e-commerce"],
        "resumen": "Tienda online completa con catálogo con filtros, carrito, checkout con Mercado Pago, seguimiento de pedidos y panel de administración.",
        "estado": "Proyecto construido y no publicado. Se muestra sin marca ni logo (sin autorización de la marca).",
        "nucleo": {
            "que_es": ["Tienda online completa que reemplaza una tienda alojada en una plataforma de plantillas con una web propia: catálogo con filtros, carrito, checkout con Mercado Pago, seguimiento de pedidos y panel de administración."],
        },
        "tecnologias": ["Next.js 14", "TypeScript", "Prisma (SQLite en local; PostgreSQL previsto para producción según su README)", "Mercado Pago", "jose y bcryptjs (acceso)", "zod", "sharp", "CSS Modules"],
        "usa": ["stacks/nextjs", "servicios/mercadopago"],
        "implementa": ["pagos-mercado-pago", "carrito-y-checkout", "panel-de-administracion"],
        "fuente": "README.md, package.json, prisma/schema.prisma, rutas de src/app, IDEAS.md (del proyecto de la tienda)",
        "pendiente": [
            "No envía emails de confirmación aunque el checkout lo promete: el propio proyecto lo registra como pendiente.",
            "Preventa y seña automatizadas y otras ideas están postergadas por decisión de Darío (según el archivo de ideas del proyecto).",
        ],
        "enlaces": [],
    },
]

# Funcionalidades con respaldo comprobado en al menos un proyecto PÚBLICO (sin texto inventado).
# "nivel_ev": A = código y documentación; B = solo código (se aclara en la ficha).
FUNCIONALIDADES = [
    {"id": "pagos-mercado-pago", "nombre": "Cobro con Mercado Pago", "temas": ["e-commerce"],
     "resumen": "Checkout con Mercado Pago y un webhook que recibe el aviso de pago.",
     "que_es": "Checkout con Mercado Pago (Checkout Pro) y un webhook que recibe el aviso de pago.",
     "en": [("tienda-de-coleccionables", "A", "README, ruta api/mercadopago/webhook, lib/mercadopago.ts"), ("tenshi", "A", "README, ruta api/mercadopago/webhook, lib/mercadopago.ts")],
     "usa": ["servicios/mercadopago"]},
    {"id": "carrito-y-checkout", "nombre": "Carrito y checkout", "temas": ["e-commerce"],
     "resumen": "Carrito guardado en el navegador, con cajón lateral, y checkout que arma el pedido.",
     "que_es": "Carrito que se guarda en el navegador (localStorage) con un cajón lateral, y un checkout que arma el pedido.",
     "en": [("tienda-de-coleccionables", "A", "README, components/carrito, ruta /checkout"), ("tenshi", "A", "ruta /checkout, README")],
     "usa": []},
    {"id": "panel-de-administracion", "nombre": "Panel de administración con login", "temas": [],
     "resumen": "Panel protegido por login para gestionar el negocio.",
     "que_es": "Panel protegido por login (token firmado en cookie httpOnly) para gestionar productos, categorías, pedidos, clientes, cupones, envíos y más.",
     "en": [("tienda-de-coleccionables", "A", "README, rutas /admin/*"), ("tenshi", "A", "rutas /admin/*, README")],
     "usa": []},
    {"id": "cuentas-de-cliente", "nombre": "Cuentas de cliente con login", "temas": [],
     "resumen": "Registro, verificación por código, login (incluido Google) y recuperación de contraseña para clientes.",
     "que_es": "Registro, verificación por código, ingreso (con Google también) y recuperación de contraseña para clientes, según las rutas y modelos del proyecto.",
     "nota": "Comprobado solo en el código (rutas y modelos); el proyecto no lo describe en su documentación.",
     "en": [("tenshi", "B", "rutas /cuenta/*, api/cuenta/*; modelos Customer y EmailCode")],
     "usa": []},
    {"id": "preventas-con-sena", "nombre": "Preventas con seña", "temas": ["e-commerce"],
     "resumen": "Cada producto define el porcentaje de seña; el pedido separa lo que se paga hoy del saldo.",
     "que_es": "Cada producto define el porcentaje de seña (100 = pago total). El carrito, el checkout, Mercado Pago y el pedido separan lo que se paga hoy del saldo al llegar.",
     "en": [("tenshi", "A", "README")], "usa": []},
    {"id": "calculadora-precio-yen-pesos", "nombre": "Calculadora de precio en yenes", "temas": ["e-commerce"],
     "resumen": "Convierte el precio de yenes a pesos con tipo de cambio, importación y margen configurables.",
     "que_es": "Calculadora de precio de yenes a pesos, con tipo de cambio, importación y margen configurables desde el panel.",
     "en": [("tenshi", "A", "README, lib/dolar.ts, lib/importacion.ts, lib/precios.ts")], "usa": []},
    {"id": "analisis-de-cuenta-mercado-libre", "nombre": "Análisis de cuenta de Mercado Libre", "temas": ["mercado-libre"],
     "resumen": "Conexión con la API oficial y análisis de publicaciones y cuenta.",
     "que_es": "Conexión por la API oficial de Mercado Libre (OAuth) y análisis de publicaciones y cuenta: series diarias, cambios de precio, rentabilidad y recomendación de precio.",
     "en": [("ml-tracker", "A", "backend/api/tracker.js, backend/lib/tracker.js")], "usa": ["servicios/mercadopago"][:0]},
]

# Herramientas de herramientas.html que se publican como proyecto (las 8 que funcionan, además del ML Tracker)
HERRAMIENTAS_PROYECTO = ["auditoria", "chequeo", "simulador", "diagnostico", "opiniones", "importacion", "informe", "perdida"]

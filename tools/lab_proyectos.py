#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fichas de proyectos reales y de funcionalidades de Programación v2.

REGLA: solo información comprobada (ver docs/lab/proyectos-verificables.md). Cada dato lleva su fuente.
Nada se completa por inferencia. Lo que no está comprobado figura en "pendiente".

Odontología Almagro: Darío confirmó (01/10) que es un proyecto suyo, hecho por él para el consultorio de su papá, y autoriza mostrarlo.
Se muestran el sitio público y sus funcionalidades. NUNCA datos de pacientes ni capturas del panel con datos.
"""
IMG = "prog-ejemplos/proyectos/"


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
        "capturas": [["Portada, tema claro", IMG + "tenshi/inicio.webp"], ["Portada, tema oscuro", IMG + "tenshi/inicio-oscuro.webp"], ["Catálogo", IMG + "tenshi/productos.webp"],
                     ["Calendario de lanzamientos", IMG + "tenshi/lanzamientos.webp"], ["Ficha de una preventa", IMG + "tenshi/producto.webp"], ["En el celular", IMG + "tenshi/movil.webp"]],
        "nota_capturas": "Capturas tomadas en mi computadora, con los productos de ejemplo que trae el proyecto. Todavía no está publicado.",
        "pendiente": [
            "No está publicado (confirmado por Darío): faltan datos de contacto, alias bancario, política de preventas, precios y stock reales, fotos propias y costos de envío, según su README.",
            "Hay rutas y modelos de proveedores, campañas, piezas de contenido y colección digital sin documentación: no se describen hasta que Darío lo confirme.",
        ],
        "enlaces": [],
    },
    {
        "id": "odontologia-almagro", "nombre": "Odontología Almagro", "areas": ["desarrollo-web"], "temas": [],
        "resumen": "Web completa de un consultorio odontológico, con sistema de gestión del consultorio y portal para pacientes. En producción.",
        "estado": "En producción, con dominio propio. Hecho por mí para el consultorio.",
        "nucleo": {
            "que_es": ["Sitio público del consultorio (servicios, estimador de precios, quiz diagnóstico, casos antes/después, blog, testimonios y contacto), un sistema de gestión (pacientes con odontograma, agenda de turnos, presupuestos, aranceles, mensajes, estadísticas y más) y un portal para que los pacientes vean sus turnos, presupuestos y pagos."],
            "aporta": [
                "Una sola base para el sitio, la gestión del consultorio y el portal del paciente.",
                "El estimador de precios se alimenta de los aranceles que se cargan en el panel: el precio que ve el paciente sale del mismo lugar que usa el consultorio.",
                "Seguridad cuidada: doble verificación por email para el administrador, límite de intentos, y las sesiones se pueden invalidar (según su documentación).",
            ],
        },
        "tecnologias": ["Next.js 14", "Node.js con Express", "MongoDB (Mongoose)", "Cloudinary", "jsPDF (presupuestos en PDF)", "Tiptap (editor del blog)", "JWT", "Render y Vercel"],
        "usa": ["stacks/nextjs", "servicios/mongodb-atlas", "servicios/vercel"],
        "implementa": ["agenda-de-turnos", "confirmacion-de-turno-por-enlace", "estimador-de-precios", "ficha-clinica-con-odontograma", "presupuestos-con-pdf", "casos-antes-despues", "blog-con-editor", "panel-de-administracion", "cuentas-de-cliente"],
        "fuente": "sdv4: ESTADO_PROYECTO.txt, README.md, STRUCTURE.md, CIERRE.md, backend/index.js (151 endpoints), backend/models/index.js (23 modelos), rutas del frontend",
        "capturas": [["Portada", IMG + "odontologia-almagro/inicio.webp"], ["Estimador de precios", IMG + "odontologia-almagro/estimador.webp"], ["Quiz diagnóstico", IMG + "odontologia-almagro/quiz.webp"],
                     ["Página de un servicio", IMG + "odontologia-almagro/servicio.webp"], ["Blog", IMG + "odontologia-almagro/blog.webp"], ["En el celular", IMG + "odontologia-almagro/movil.webp"]],
        "nota_capturas": "Capturas del sitio público en producción. El panel de gestión no se muestra porque trabaja con datos de pacientes.",
        "pendiente": [
            "El panel de gestión y el portal del paciente no se muestran (datos de salud). Sus funciones se describen en texto.",
            "No existe todavía, según el propio proyecto: cobro de seña con Mercado Pago al reservar, reserva automática con Google Calendar y recordatorios por la API de WhatsApp Business.",
            "El portal ya no permite solicitar turnos: esa función se eliminó (la documentación del proyecto está desactualizada en ese punto).",
            "Hay funciones en el código (mensajes con plantillas, encuestas post-turno, referidos, respaldos) que todavía no están descriptas: se agregan cuando se confirme qué hacen.",
        ],
        "enlaces": [["Ver el sitio en producción", "https://www.odontologiaalmagro.com.ar"]],
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
        "capturas": [["Portada", IMG + "tienda-de-coleccionables/inicio.webp"], ["Catálogo", IMG + "tienda-de-coleccionables/productos.webp"],
                     ["Ficha de producto", IMG + "tienda-de-coleccionables/producto.webp"], ["En el celular", IMG + "tienda-de-coleccionables/movil.webp"]],
        "nota_capturas": "Capturas tomadas en mi computadora, con la marca y el logo ocultados (no hay autorización de la marca para mostrarla). Todavía no está publicado.",
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
     "en": [("tienda-de-coleccionables", "A", "README, rutas /admin/*"), ("tenshi", "A", "rutas /admin/*, README"), ("odontologia-almagro", "A", "ESTADO_PROYECTO §3, endpoints admin/*")],
     "usa": []},
    {"id": "cuentas-de-cliente", "nombre": "Cuentas de cliente con login", "temas": [],
     "resumen": "Registro, verificación por código, login (incluido Google) y recuperación de contraseña para clientes.",
     "que_es": "Registro, verificación por código, ingreso (con Google también) y recuperación de contraseña para clientes, según las rutas y modelos del proyecto.",
     "nota": "Comprobado solo en el código (rutas y modelos); el proyecto no lo describe en su documentación.",
     "en": [("tenshi", "B", "rutas /cuenta/*, api/cuenta/*; modelos Customer y EmailCode"), ("odontologia-almagro", "A", "ESTADO_PROYECTO §2, endpoints paciente/*, rutas /mi-cuenta")],
     "usa": []},
    {"id": "preventas-con-sena", "nombre": "Preventas con seña", "temas": ["e-commerce"],
     "resumen": "Cada producto define el porcentaje de seña; el pedido separa lo que se paga hoy del saldo.",
     "que_es": "Cada producto define el porcentaje de seña (100 = pago total). El carrito, el checkout, Mercado Pago y el pedido separan lo que se paga hoy del saldo al llegar.",
     "en": [("tenshi", "A", "README")], "usa": []},
    {"id": "calculadora-precio-yen-pesos", "nombre": "Calculadora de precio en yenes", "temas": ["e-commerce"],
     "resumen": "Convierte el precio de yenes a pesos con tipo de cambio, importación y margen configurables.",
     "que_es": "Calculadora de precio de yenes a pesos, con tipo de cambio, importación y margen configurables desde el panel.",
     "en": [("tenshi", "A", "README, lib/dolar.ts, lib/importacion.ts, lib/precios.ts")], "usa": []},
    {"id": "agenda-de-turnos", "nombre": "Agenda de turnos", "temas": ["automatizacion"],
     "resumen": "Agenda con vistas de mes, semana y día, estados por color y mensajes de confirmación.",
     "que_es": "Agenda visual con vistas de mes, semana y día, estados por color, un mensaje de WhatsApp de confirmación o recordatorio con un clic y un enlace de confirmación de un solo uso.",
     "en": [("odontologia-almagro", "A", "ESTADO_PROYECTO §3, endpoints admin/turnos")], "usa": []},
    {"id": "confirmacion-de-turno-por-enlace", "nombre": "Confirmación de turno por enlace", "temas": ["automatizacion"],
     "resumen": "Un enlace de un solo uso para que el paciente confirme su turno.",
     "que_es": "Enlace con token de un solo uso, que vence a los 7 días, para que el paciente confirme su turno sin escribir.",
     "en": [("odontologia-almagro", "A", "ESTADO_PROYECTO, endpoints turno/confirmar")], "usa": []},
    {"id": "estimador-de-precios", "nombre": "Estimador de precios", "temas": ["conversion"],
     "resumen": "Estimador público de precios por tratamiento, alimentado por los aranceles del panel.",
     "que_es": "Estimador público de precios por tratamiento (con variantes) que se alimenta de los aranceles cargados en el panel de gestión.",
     "en": [("odontologia-almagro", "A", "ESTADO_PROYECTO §1 y §3, endpoint aranceles/estimador")], "usa": []},
    {"id": "ficha-clinica-con-odontograma", "nombre": "Ficha clínica con odontograma", "temas": [],
     "resumen": "Ficha de cada paciente con odontograma interactivo, tratamientos y pagos.",
     "que_es": "Ficha de cada paciente con un odontograma interactivo de 32 dientes y 12 condiciones, tratamientos realizados, pagos y deuda.",
     "en": [("odontologia-almagro", "A", "ESTADO_PROYECTO §3, endpoints admin/pacientes")], "usa": []},
    {"id": "presupuestos-con-pdf", "nombre": "Presupuestos con PDF", "temas": [],
     "resumen": "Presupuestos armados desde el catálogo, con PDF descargable y envío por email.",
     "que_es": "Presupuestos que toman sus ítems del catálogo de tratamientos, con PDF descargable y envío por email al paciente.",
     "en": [("odontologia-almagro", "A", "ESTADO_PROYECTO §3, endpoints admin/presupuestos")], "usa": []},
    {"id": "casos-antes-despues", "nombre": "Casos antes/después", "temas": [],
     "resumen": "Galería pública de casos con slider arrastrable y filtros.",
     "que_es": "Galería pública de casos antes/después con un slider arrastrable y filtros, administrable desde el panel.",
     "en": [("odontologia-almagro", "A", "README, ESTADO_PROYECTO §1, endpoint cases")], "usa": []},
    {"id": "blog-con-editor", "nombre": "Blog con editor", "temas": [],
     "resumen": "Blog con categorías y editor de texto enriquecido en el panel.",
     "que_es": "Blog público con categorías y un editor de texto enriquecido (negrita, títulos, listas, citas y enlaces) en el panel de gestión.",
     "en": [("odontologia-almagro", "A", "ESTADO_PROYECTO §3 y §10")], "usa": []},
    {"id": "analisis-de-cuenta-mercado-libre", "nombre": "Análisis de cuenta de Mercado Libre", "temas": ["mercado-libre"],
     "resumen": "Conexión con la API oficial y análisis de publicaciones y cuenta.",
     "que_es": "Conexión por la API oficial de Mercado Libre (OAuth) y análisis de publicaciones y cuenta: series diarias, cambios de precio, rentabilidad y recomendación de precio.",
     "en": [("ml-tracker", "A", "backend/api/tracker.js, backend/lib/tracker.js")], "usa": ["servicios/mercadopago"][:0]},
]

# Herramientas de herramientas.html que se publican como proyecto (las 8 que funcionan, además del ML Tracker)
HERRAMIENTAS_PROYECTO = ["auditoria", "chequeo", "simulador", "diagnostico", "opiniones", "importacion", "informe", "perdida"]

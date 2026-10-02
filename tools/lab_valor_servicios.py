#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valor validado por Darío (01/10, tanda 2) de servicios y stacks.
Criterio de Darío: Pro = lo que permite construir páginas y funciones a medida; Base = lo que resuelve algo ya armado o dónde se publica."""
B_HOST = "Es dónde se publica el sitio: necesario, pero no te diferencia."
VALOR_SS = {
 # servicios
 ("servicios", "vercel"): ("base", B_HOST),
 ("servicios", "netlify"): ("base", B_HOST),
 ("servicios", "cloudflare-pages"): ("base", B_HOST),
 ("servicios", "github-pages"): ("base", B_HOST),
 ("servicios", "railway"): ("base", B_HOST),
 ("servicios", "render"): ("base", B_HOST),
 ("servicios", "tiendanube"): ("base", "Te da la tienda ya armada: sirve para entregar rápido, pero no es construir algo a medida."),
 ("servicios", "wordpress"): ("base", "Resuelve el sitio con algo ya armado y plugins: útil, pero no es trabajo a medida."),
 ("servicios", "formspree"): ("base", "Resuelve un formulario sin servidor: simple y reemplazable."),
 ("servicios", "ga4"): ("base", "Es el estándar y casi todos lo tienen. Medir con criterio diferencia, pero instalarlo no."),
 ("servicios", "plausible"): ("base", "Es una analítica simple y alternativa: útil, no te diferencia."),
 ("servicios", "nic-ar"): ("base", "Es un trámite necesario para tener el dominio, no una habilidad."),
 ("servicios", "cloudinary"): ("base", "Optimiza imágenes: útil, pero se resuelve de otras maneras."),
 ("servicios", "firebase"): ("base", "Hoy hay alternativas más usadas; para tu trabajo no es lo central."),
 ("servicios", "stripe"): ("base", "Cobra en el exterior: no es lo que más pide el cliente argentino."),
 ("servicios", "groq"): ("base", "Sirve para tareas de IA livianas: complemento, no pieza central."),
 ("servicios", "mercadopago"): ("imprescindible", "Cobrar en pesos con cuotas es lo que más necesita el cliente argentino, y es relativamente fácil de integrar a una web a medida, justo lo que no te dan las plataformas armadas."),
 ("servicios", "mongodb-atlas"): ("pro", "Es la base de datos que permite hacer funciones a medida: contenido, usuarios, mensajes y paneles."),
 ("servicios", "supabase"): ("pro", "Da base de datos, login y archivos para construir aplicaciones a medida."),
 ("servicios", "resend"): ("pro", "Permite enviar avisos y confirmaciones desde una web a medida."),
 ("servicios", "clerk"): ("pro", "Resuelve el login de una aplicación a medida sin reinventarlo."),
 ("servicios", "sanity"): ("pro", "Permite que el cliente edite el contenido de un sitio hecho a medida."),
 ("servicios", "claude-api"): ("pro", "Permite sumar IA a una aplicación propia: es una especialización técnica."),
 ("servicios", "sentry"): ("pro", "Detecta fallos en una aplicación en producción: una especialización de mantenimiento."),
 ("servicios", "clarity"): ("pro", "Muestra dónde se pierden los usuarios y permite mejorar una página con evidencia."),
 # stacks
 ("stacks", "vanilla"): ("imprescindible", "Es el cimiento de toda web: sin dominar HTML, CSS y JavaScript no hay nada a medida, y todo lo demás se apoya en esto."),
 ("stacks", "node-express"): ("pro", "Es la lógica de servidor de las funciones a medida: formularios, integraciones y paneles."),
 ("stacks", "nextjs"): ("pro", "Permite hacer tiendas y aplicaciones a medida con buen SEO."),
 ("stacks", "astro"): ("pro", "Permite hacer sitios de contenido muy rápidos y a medida."),
 ("stacks", "shadcn"): ("pro", "Permite armar paneles y aplicaciones con una interfaz prolija a medida."),
 ("stacks", "react-vite"): ("base", "Es lo más difundido: hay que conocerlo, pero no te separa del resto."),
 ("stacks", "tailwind"): ("base", "Hoy lo reemplaza en buena medida la creación con IA: no marca diferencia por sí solo."),
 ("stacks", "vue"): ("base", "Es una alternativa menos usada que React: no te diferencia."),
 ("stacks", "sveltekit"): ("base", "Es de nicho: sirve, pero no te diferencia."),
 ("stacks", "mern"): ("base", "Es un stack conocido y difundido: no te diferencia."),
}

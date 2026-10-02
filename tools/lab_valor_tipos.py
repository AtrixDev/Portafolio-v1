#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Valor confirmado por Darío (02/10): tipos de web, patrones de página y de panel, y funcionalidades.
Criterio de Darío: Pro = lo que se construye a medida / pide ingeniería real; Base = receta o componente aislado que cualquier plantilla trae;
Imprescindible = hay que tenerlo y marca diferencia. Los proyectos no llevan valor (no son una habilidad)."""
import lab_demos_patrones as DP

VALOR_TIPOS = {
    ("soluciones", "landing"): ("base", "Es lo más básico del desarrollo web: casi cualquier plantilla la resuelve."),
    ("soluciones", "catalogo"): ("base", "Un catálogo sin carrito es de lo más simple de construir."),
    ("soluciones", "portfolio"): ("base", "Como tipo de web es simple. Lo que hace especial a este sitio no cambia el valor del tipo."),
    ("soluciones", "blog"): ("imprescindible", "Armar un blog es fácil, pero una estrategia de contenido pensada para buscadores y para respuestas de IA diferencia hoy."),
    ("soluciones", "docs"): ("pro", "Una documentación bien resuelta (buscador, índice, versiones) es compleja de construir y de mantener."),
    ("soluciones", "marketplace"): ("pro", "Juntar oferta y demanda con pagos, reputación y moderación es de lo más complejo que hay."),
    ("soluciones", "interna"): ("pro", "Una herramienta interna se construye a medida y exige entender el proceso del equipo."),
}
NIVEL_TIPOS = {("soluciones", "institucional"): 2}   # el nivel es del tipo en general; el techo es Odontología Almagro

PRO_PAG = {"interactive-3d-configurator", "ai-personalization-landing", "interactive-product-demo", "immersive-interactive-experience"}
PRO_PANEL = {"real-time-monitoring", "predictive-analytics", "drill-down-analytics"}
PANELES = set(DP.LIB.DASH)

VALOR_PATRONES = {}
for (col, pid) in DP.PATRONES:
    if pid in PANELES:
        if pid in PRO_PANEL: VALOR_PATRONES[(col, pid)] = ("pro", "Detrás del panel hay datos y lógica reales (en vivo, modelos o jerarquías de datos), no solo un diseño.")
        else: VALOR_PATRONES[(col, pid)] = ("base", "Visualmente es un componente aislado: el trabajo está en los datos, que acá son de ejemplo.")
    elif pid in PRO_PAG: VALOR_PATRONES[(col, pid)] = ("pro", "Lleva ingeniería real (interacción, 3D o personalización), no es solo acomodar secciones.")
    else: VALOR_PATRONES[(col, pid)] = ("base", "Es una receta de acomodo de secciones que cualquier plantilla trae: un componente aislado.")

VALOR_FUNCIONES = {
    "pagos-mercado-pago": ("imprescindible", "Cobrar en pesos con cuotas es lo que más necesita un negocio argentino, y se integra a medida."),
    "carrito-y-checkout": ("pro", "Un carrito y un checkout propios llevan lógica de stock, envíos, cupones y pagos."),
    "panel-de-administracion": ("pro", "Un panel con login y gestión de datos se construye a medida."),
    "cuentas-de-cliente": ("pro", "Cuentas con registro, verificación y recuperación llevan seguridad y bastante lógica."),
    "preventas-con-sena": ("pro", "Separar lo que se paga hoy del saldo exige lógica de pedidos propia."),
    "calculadora-precio-yen-pesos": ("pro", "Combina tipo de cambio, importación y margen configurable."),
    "agenda-de-turnos": ("pro", "Una agenda con estados, vistas y mensajes es una aplicación en sí misma."),
    "confirmacion-de-turno-por-enlace": ("base", "Un enlace con un token de un solo uso es sencillo de armar."),
    "estimador-de-precios": ("pro", "Se alimenta de los aranceles del panel: conecta datos reales con una herramienta pública."),
    "ficha-clinica-con-odontograma": ("pro", "Un odontograma interactivo con tratamientos y pagos es una pieza compleja."),
    "presupuestos-con-pdf": ("base", "Generar un PDF a partir de ítems es una función conocida y acotada."),
    "casos-antes-despues": ("base", "Una galería con un deslizador es una función simple."),
    "blog-con-editor": ("base", "Un blog con editor de texto es una función estándar."),
    "analisis-de-cuenta-mercado-libre": ("pro", "Conectar la API oficial de Mercado Libre y analizar datos reales exige OAuth y criterio de negocio."),
}

NUCLEO_AGREGA = {
    ("soluciones", "blog"): {
        "aporta": [("Posicionamiento en buscadores (SEO).", "Cada nota responde una duda que la gente busca y puede aparecer en Google."),
                   ("Presencia en respuestas de IA (GEO).", "Los buscadores con IA suelen tomar contenido claro, ordenado y con fuente. Un blog bien estructurado aumenta las chances de ser citado, aunque nadie puede garantizarlo.")],
        "como": [("Estructura que ayuda.", "Títulos jerárquicos, la respuesta directa al principio de cada nota, datos estructurados (schema.org), autor y fecha visibles, y actualizar las notas con el tiempo.")]},
    ("soluciones", "institucional"): {
        "aporta": [("El techo de lo que hice.", "Odontología Almagro es un sitio institucional con sistema de gestión del consultorio y portal de pacientes: un institucional puede ser una página simple o un sistema completo.")]},
}

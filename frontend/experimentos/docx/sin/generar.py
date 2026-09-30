from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_COLOR_INDEX
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

AZUL = RGBColor(0x1F, 0x3A, 0x5F)
GRIS = RGBColor(0x59, 0x59, 0x59)

doc = Document()
sec = doc.sections[0]
sec.page_height, sec.page_width = Cm(29.7), Cm(21.0)
sec.top_margin = sec.bottom_margin = Cm(1.8)
sec.left_margin = sec.right_margin = Cm(2.0)

normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(10.5)
normal.paragraph_format.space_after = Pt(4)
normal.paragraph_format.line_spacing = 1.1


def sombrear(celda, color):
    tcPr = celda._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color)
    tcPr.append(shd)


def agregar(p, texto, bold=False, color=None, size=None, italic=False):
    """Agrega texto; lo que va entre [[ ]] queda resaltado como campo a completar."""
    partes = texto.replace("]]", "[[").split("[[")
    for i, parte in enumerate(partes):
        if not parte:
            continue
        r = p.add_run(f"[{parte}]" if i % 2 else parte)
        r.bold = bold or bool(i % 2)
        r.italic = italic
        if size:
            r.font.size = Pt(size)
        if i % 2:
            r.font.highlight_color = WD_COLOR_INDEX.YELLOW
        elif color:
            r.font.color.rgb = color
    return p


def parrafo(texto, **kw):
    return agregar(doc.add_paragraph(), texto, **kw)


def titulo(texto):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    agregar(p, texto, bold=True, color=AZUL, size=13)
    pPr = p._p.get_or_add_pPr()
    bdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    for k, v in {"w:val": "single", "w:sz": "6", "w:space": "1", "w:color": "1F3A5F"}.items():
        bottom.set(qn(k), v)
    bdr.append(bottom)
    pPr.append(bdr)


def vineta(texto, negrita=None):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(2)
    if negrita:
        agregar(p, negrita, bold=True)
    agregar(p, texto)


def tabla(filas, anchos, encabezado=True, cebra=True):
    t = doc.add_table(rows=len(filas), cols=len(filas[0]))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    grid = t._tbl.tblGrid
    for j, gc in enumerate(grid.findall(qn("w:gridCol"))):
        gc.set(qn("w:w"), str(int(anchos[j].twips)))
    for i, fila in enumerate(filas):
        for j, texto in enumerate(fila):
            c = t.cell(i, j)
            c.width = anchos[j]
            p = c.paragraphs[0]
            p.paragraph_format.space_after = Pt(1)
            es_enc = encabezado and i == 0
            agregar(p, texto, bold=es_enc, color=RGBColor(0xFF, 0xFF, 0xFF) if es_enc else None, size=10)
            if es_enc:
                sombrear(c, "1F3A5F")
            elif cebra and i % 2 == 0:
                sombrear(c, "EEF2F7")
    return t


# ---------- Encabezado ----------
p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(0)
agregar(p, "PROPUESTA COMERCIAL", bold=True, color=GRIS, size=10)
p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(2)
agregar(p, "Gestión de cuenta en Mercado Libre — Cocina Norte", bold=True, color=AZUL, size=20)
p = doc.add_paragraph()
agregar(p, "Preparada por: [[Nombre / agencia]]   ·   Fecha: [[dd/mm/aaaa]]   ·   Validez: 15 días",
        color=GRIS, size=9.5)

# ---------- 1. Contexto ----------
titulo("1. Contexto y objetivo")
parrafo("Cocina Norte ya tiene una cuenta activa en Mercado Libre con un catálogo de artículos de cocina. "
        "En una categoría tan competida, pequeñas mejoras en títulos, fotos, fichas técnicas y publicidad "
        "hacen una diferencia concreta en visibilidad y conversión.")
parrafo("Te proponemos hacernos cargo de la gestión de la cuenta durante 3 meses, con un objetivo claro: "
        "ordenar la cuenta, mejorar la calidad de las publicaciones que más importan y poner en marcha "
        "Product Ads con seguimiento mensual, para que tomes decisiones con datos.")

# ---------- 2. Alcance ----------
titulo("2. Alcance del servicio")
vineta(" revisamos reputación, métricas de ventas y visitas, calidad de publicaciones, precios frente a la "
       "competencia, envíos, preguntas y reclamos. Entregamos un diagnóstico con prioridades y el listado "
       "de las 40 publicaciones a optimizar, acordado con vos.", "Auditoría inicial:")
vineta(" títulos con las palabras que usan los compradores, fichas técnicas completas, descripciones "
       "claras, orden y calidad de fotos, variantes (colores, medidas) y revisión de categoría. "
       "Todos los cambios se revisan con vos antes de publicarse.", "Optimización de 40 publicaciones:")
vineta(" configuración y administración de campañas, selección de productos a promocionar, ajuste de "
       "presupuesto y ACOS objetivo, y pausa de lo que no rinde. La inversión publicitaria se paga "
       "directamente a Mercado Libre y no está incluida en los honorarios.", "Product Ads:")
vineta(" ventas, visitas, conversión, rendimiento de Product Ads (inversión, ventas atribuidas, ACOS), "
       "estado de las publicaciones optimizadas y próximos pasos. Incluye una reunión de 30 minutos "
       "para repasarlo.", "Informe mensual:")

# ---------- 3. Plan de trabajo ----------
titulo("3. Plan de trabajo")
tabla([
    ["Etapa", "Qué hacemos", "Entregable"],
    ["Mes 1", "Auditoría inicial (semanas 1–2). Optimización de las primeras 15 publicaciones. "
              "Armado y lanzamiento de campañas de Product Ads.", "Diagnóstico + informe mensual 1"],
    ["Mes 2", "Optimización de 15 publicaciones más. Ajuste de campañas según resultados.",
     "Informe mensual 2"],
    ["Mes 3", "Optimización de las últimas 10 publicaciones. Ajuste fino de Product Ads. "
              "Recomendaciones para continuar.", "Informe final con balance del trimestre"],
], [Cm(2.2), Cm(10.0), Cm(4.8)])

# ---------- 4. Qué necesitamos ----------
doc.add_page_break()
titulo("4. Qué necesitamos de Cocina Norte")
vineta("Acceso a la cuenta de Mercado Libre como colaborador, con los permisos necesarios.")
vineta("Información de producto: medidas, materiales, fotos disponibles y stock.")
vineta("Definición del presupuesto mensual para Product Ads.")
vineta("Una persona de contacto que apruebe cambios en un plazo de 48 horas hábiles.")

# ---------- 5. Inversión ----------
titulo("5. Inversión")
tabla([
    ["Concepto", "Importe"],
    ["Auditoría inicial (pago único)", "$ [[COMPLETAR]]"],
    ["Honorario mensual de gestión (optimización, Product Ads e informe)", "$ [[COMPLETAR]] / mes"],
    ["Total por los 3 meses", "$ [[COMPLETAR]]"],
    ["Presupuesto de Product Ads (se paga directo a Mercado Libre)", "$ [[COMPLETAR]] / mes"],
], [Cm(12.0), Cm(5.0)])
p = parrafo("Los importes son en pesos argentinos y [[incluyen / no incluyen]] IVA. "
            "Forma de pago: [[COMPLETAR, por ej. 50 % al inicio y saldo mensual]].", size=9.5, color=GRIS)
p.paragraph_format.space_before = Pt(4)

# ---------- 6. Condiciones ----------
titulo("6. Condiciones")
vineta("Duración: 3 meses desde la fecha de inicio. Al cierre, evaluamos juntos si conviene continuar.")
vineta("Las publicaciones optimizadas y todo el material generado quedan en la cuenta de Cocina Norte.")
vineta("Los resultados de ventas dependen también de factores externos (precio, stock, competencia, "
       "estacionalidad y cambios de Mercado Libre); nos comprometemos con el trabajo y la transparencia "
       "en los datos.")

# ---------- 7. Próximos pasos ----------
titulo("7. Próximos pasos")
parrafo("Si la propuesta te cierra, confirmanos por escrito, coordinamos el acceso a la cuenta y "
        "arrancamos con la auditoría la semana siguiente. Cualquier duda, escribinos a "
        "[[email]] o al [[teléfono]].")

doc.add_paragraph()
tf = tabla([
    ["Por Cocina Norte", "Por [[Nombre / agencia]]"],
    ["\n\nFirma: ____________________", "\n\nFirma: ____________________"],
    ["Aclaración: ________________", "Aclaración: ________________"],
    ["Fecha: ____ / ____ / ______", "Fecha: ____ / ____ / ______"],
], [Cm(8.5), Cm(8.5)], encabezado=False, cebra=False)
for fila in tf.rows:
    for c in fila.cells:
        tcPr = c._tc.get_or_add_tcPr()
        b = OxmlElement("w:tcBorders")
        for lado in ("top", "left", "bottom", "right"):
            e = OxmlElement(f"w:{lado}")
            e.set(qn("w:val"), "nil")
            b.append(e)
        tcPr.append(b)
        for r in c.paragraphs[0].runs:
            if not r.font.highlight_color:
                r.font.color.rgb = None
for c in tf.rows[0].cells:
    for r in c.paragraphs[0].runs:
        r.bold = True

doc.save("propuesta.docx")

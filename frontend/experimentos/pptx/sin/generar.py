from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

NAVY = RGBColor(0x1F, 0x24, 0x5C)
YELLOW = RGBColor(0xFF, 0xE6, 0x00)
INK = RGBColor(0x22, 0x26, 0x33)
GREY = RGBColor(0x6B, 0x70, 0x80)
LIGHT = RGBColor(0xF3, 0xF4, 0xF7)
PALE = RGBColor(0xC9, 0xCC, 0xD6)
GREEN = RGBColor(0x1E, 0x9E, 0x5A)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
FONT = "Arial"

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]
W, H = prs.slide_width, prs.slide_height


def rect(slide, x, y, w, h, fill, shape=MSO_SHAPE.RECTANGLE):
    s = slide.shapes.add_shape(shape, x, y, w, h)
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    s.shadow.inherit = False
    return s


def text(slide, x, y, w, h, runs, size=18, color=INK, bold=False,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=None):
    """runs: str, or list of paragraphs; each paragraph a str or list of (text, overrides) tuples."""
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    paras = [runs] if isinstance(runs, str) else runs
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        if spacing:
            p.space_after = Pt(spacing)
        parts = [(para, {})] if isinstance(para, str) else para
        for t, o in parts:
            r = p.add_run()
            r.text = t
            f = r.font
            f.name = FONT
            f.size = Pt(o.get("size", size))
            f.bold = o.get("bold", bold)
            f.color.rgb = o.get("color", color)
    return tb


def header(slide, kicker, title, n):
    rect(slide, 0, 0, W, Inches(0.12), YELLOW)
    text(slide, Inches(0.7), Inches(0.55), Inches(11), Inches(0.4), kicker.upper(),
         size=13, color=GREY, bold=True)
    text(slide, Inches(0.7), Inches(0.9), Inches(12), Inches(0.9), title,
         size=32, color=NAVY, bold=True)
    text(slide, Inches(0.7), H - Inches(0.55), Inches(8), Inches(0.3),
         "Tiendas oficiales en Mercado Libre · Junio–noviembre 2025", size=10, color=GREY)
    text(slide, W - Inches(1.2), H - Inches(0.55), Inches(0.5), Inches(0.3), str(n),
         size=10, color=GREY, align=PP_ALIGN.RIGHT)


# ---------- 1. Portada ----------
s = prs.slides.add_slide(BLANK)
rect(s, 0, 0, W, H, NAVY)
rect(s, Inches(0.8), Inches(2.35), Inches(1.2), Inches(0.12), YELLOW)
text(s, Inches(0.8), Inches(2.7), Inches(11), Inches(1.8),
     ["Seis meses en Mercado Libre:", "vendemos más y gastamos mejor"],
     size=44, color=WHITE, bold=True)
text(s, Inches(0.8), Inches(4.45), Inches(11), Inches(0.6),
     "Resultados de la gestión de las tiendas oficiales · Junio a noviembre de 2025",
     size=20, color=PALE)
text(s, Inches(0.8), H - Inches(1.0), Inches(8), Inches(0.4),
     "Presentación para la Dirección", size=14, color=YELLOW, bold=True)

# ---------- 2. Resumen ----------
s = prs.slides.add_slide(BLANK)
header(s, "Resumen", "Cuatro números que resumen el semestre", 2)
kpis = [
    ("+38,9%", "en ventas", "Crecimiento de la facturación en Mercado Libre"),
    ("+32,4%", "en unidades", "Más volumen, no solo más precio"),
    ("12%", "ACOS de Product Ads (era 30%)", "Cada $100 vendidos con anuncios cuestan $12, no $30"),
    ("+200", "publicaciones rehechas", "Fotos, títulos y fichas técnicas nuevas"),
]
cw, gap, top = Inches(2.8), Inches(0.24), Inches(2.25)
for i, (big, label, desc) in enumerate(kpis):
    x = Inches(0.7) + i * (cw + gap)
    rect(s, x, top, cw, Inches(3.9), LIGHT)
    rect(s, x, top, cw, Inches(0.1), YELLOW)
    text(s, x + Inches(0.3), top + Inches(0.55), cw - Inches(0.5), Inches(1.0), big,
         size=40 if len(big) < 8 else 32, color=NAVY, bold=True, anchor=MSO_ANCHOR.BOTTOM)
    text(s, x + Inches(0.3), top + Inches(1.7), cw - Inches(0.5), Inches(0.5), label,
         size=18, color=INK, bold=True)
    text(s, x + Inches(0.3), top + Inches(2.35), cw - Inches(0.5), Inches(1.3), desc,
         size=14, color=GREY)

# ---------- 3. Ventas y unidades ----------
s = prs.slides.add_slide(BLANK)
header(s, "Crecimiento comercial", "Las ventas crecieron casi 40% y el volumen acompañó", 3)

# Barras comparativas (base = 100)
bars = [("Ventas", 138.9, "+38,9%"), ("Unidades", 132.4, "+32,4%")]
bx, by, bw_max = Inches(0.7), Inches(2.4), Inches(6.2)
text(s, bx, by - Inches(0.5), Inches(6), Inches(0.3),
     "Índice: situación inicial = 100", size=12, color=GREY)
for i, (lab, val, pct) in enumerate(bars):
    y = by + i * Inches(1.75)
    text(s, bx, y, Inches(3), Inches(0.35), lab, size=16, color=INK, bold=True)
    rect(s, bx, y + Inches(0.45), int(bw_max * 100 / 140), Inches(0.42), PALE)
    text(s, bx + int(bw_max * 100 / 140) + Inches(0.12), y + Inches(0.45), Inches(1.5),
         Inches(0.42), "Base · 100", size=12, color=GREY, anchor=MSO_ANCHOR.MIDDLE)
    rect(s, bx, y + Inches(0.95), int(bw_max * val / 140), Inches(0.42), NAVY)
    text(s, bx + int(bw_max * val / 140) + Inches(0.12), y + Inches(0.95), Inches(1.6),
         Inches(0.42), [[("Ahora · ", {"color": GREY, "bold": False}), (pct, {})]],
         size=14, color=GREEN, bold=True, anchor=MSO_ANCHOR.MIDDLE)

# Lectura
px = Inches(8.4)
rect(s, px, Inches(1.95), Inches(4.25), Inches(4.4), LIGHT)
rect(s, px, Inches(1.95), Inches(0.1), Inches(4.4), YELLOW)
text(s, px + Inches(0.4), Inches(2.25), Inches(3.6), Inches(4.0), [
    [("Qué nos dice", {"size": 18, "color": NAVY})],
    [("El crecimiento es de volumen: ", {"bold": True}),
     ("vendemos un tercio más de unidades, no solo a mejor precio.", {})],
    [("Las ventas crecen más que las unidades, ", {"bold": True}),
     ("así que el ticket promedio también subió (≈ +4,9%).", {})],
    [("Y con publicidad más eficiente: ", {"bold": True}),
     ("el ACOS bajó a menos de la mitad (siguiente lámina).", {})],
], size=15, color=INK, spacing=14)

# ---------- 4. Product Ads ----------
s = prs.slides.add_slide(BLANK)
header(s, "Publicidad", "Product Ads: el ACOS bajó de 30% a 12%", 4)

cx, base_y, bar_w, scale = Inches(1.3), Inches(6.2), Inches(1.7), Inches(3.4) / 30
for i, (lab, val, col, tcol) in enumerate([("Junio 2025", 30, PALE, INK),
                                            ("Noviembre 2025", 12, NAVY, NAVY)]):
    x = cx + i * Inches(2.6)
    h = int(scale * val)
    rect(s, x, base_y - h, bar_w, h, col)
    text(s, x, base_y - h - Inches(0.75), bar_w, Inches(0.65), f"{val}%",
         size=36, color=tcol, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.BOTTOM)
    text(s, x, base_y + Inches(0.12), bar_w, Inches(0.35), lab,
         size=13, color=GREY, align=PP_ALIGN.CENTER)
rect(s, cx - Inches(0.3), base_y, Inches(5.6), Emu(12700), GREY)
text(s, cx - Inches(0.3), Inches(1.95), Inches(5.6), Inches(0.35),
     "ACOS: inversión publicitaria / ventas por anuncios", size=12, color=GREY)

px = Inches(7.6)
text(s, px, Inches(2.1), Inches(5.0), Inches(1.2), [
    [("−18 puntos", {"size": 40, "color": NAVY})],
    [("de ACOS: el costo publicitario por venta bajó 60%", {"size": 16, "bold": False, "color": INK})],
], bold=True, spacing=4)
text(s, px, Inches(3.75), Inches(5.0), Inches(2.6), [
    [("Antes: ", {"bold": True}), ("por cada $100 vendidos con anuncios, se invertían $30.", {})],
    [("Hoy: ", {"bold": True}), ("se invierten $12. Los $18 de diferencia quedan como margen.", {})],
    [("En otras palabras: ", {"bold": True}),
     ("cada peso invertido en anuncios hoy genera 2,5 veces más ventas que en junio.", {})],
], size=15, color=INK, spacing=12)

# ---------- 5. Publicaciones y cierre ----------
s = prs.slides.add_slide(BLANK)
header(s, "Catálogo", "Más de 200 publicaciones rehechas", 5)
cols = [
    ("Fotos", "Imágenes nuevas que muestran mejor el producto y generan más clics."),
    ("Títulos", "Reescritos con las palabras que usa el comprador para buscar."),
    ("Fichas técnicas", "Atributos completos para aparecer en filtros y comparar mejor."),
]
cw, gap, top = Inches(3.8), Inches(0.3), Inches(2.1)
for i, (t, d) in enumerate(cols):
    x = Inches(0.7) + i * (cw + gap)
    rect(s, x, top, cw, Inches(2.2), LIGHT)
    num = rect(s, x + Inches(0.35), top + Inches(0.35), Inches(0.55), Inches(0.55), YELLOW,
               MSO_SHAPE.OVAL)
    tf = num.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.paragraphs[0].alignment = PP_ALIGN.CENTER
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    r = tf.paragraphs[0].add_run()
    r.text = str(i + 1)
    r.font.name, r.font.size, r.font.bold, r.font.color.rgb = FONT, Pt(18), True, NAVY
    text(s, x + Inches(1.1), top + Inches(0.38), cw - Inches(1.3), Inches(0.5), t,
         size=20, color=NAVY, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    text(s, x + Inches(0.35), top + Inches(1.1), cw - Inches(0.7), Inches(1.0), d,
         size=14, color=INK)

rect(s, Inches(0.7), Inches(4.75), W - Inches(1.4), Inches(1.65), NAVY)
text(s, Inches(1.1), Inches(4.75), W - Inches(2.2), Inches(1.65), [
    [("En síntesis: ", {"color": YELLOW}),
     ("mejores publicaciones convierten más, eso hace rendir la publicidad y el resultado "
      "es +38,9% en ventas con un ACOS 60% más bajo.", {"color": WHITE, "bold": False})],
], size=20, bold=True, anchor=MSO_ANCHOR.MIDDLE)

prs.save("resultados.pptx")

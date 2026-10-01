"""Hot Sale · Cocina Norte — pieza para Instagram 1080 x 1350 (Brasa Cardinal)."""
import math
import os

import cairo
import numpy as np
from fontTools.pens.basePen import BasePen
from fontTools.ttLib import TTFont
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, ".claude/skills/canvas-design/canvas-fonts")
W, H, S = 1080, 1350, 3  # lienzo final y factor de supermuestreo

EMBER = (0.890, 0.196, 0.082)
IRON = (0.086, 0.066, 0.058)
IVORY = (0.972, 0.929, 0.866)
DEEP = (0.520, 0.086, 0.035)

CX, CY = 540, 668          # centro de la sartén
R_RIM, R_FLAT = 318, 262   # borde exterior y fondo plano
MARGIN = 72


class CairoPen(BasePen):
    def __init__(self, glyphset, ctx):
        super().__init__(glyphset)
        self.ctx = ctx

    def _moveTo(self, p):
        self.ctx.move_to(*p)

    def _lineTo(self, p):
        self.ctx.line_to(*p)

    def _curveToOne(self, a, b, c):
        self.ctx.curve_to(*a, *b, *c)

    def _closePath(self):
        self.ctx.close_path()


class Face:
    def __init__(self, name):
        self.font = TTFont(os.path.join(FONTS, name + ".ttf"))
        self.upm = self.font["head"].unitsPerEm
        self.cap = self.font["OS/2"].sCapHeight
        self.cmap = self.font.getBestCmap()
        self.glyphs = self.font.getGlyphSet()
        self.hmtx = self.font["hmtx"]

    def size_for_cap(self, cap_px):
        return cap_px * self.upm / self.cap

    def width(self, text, size, track=0.0):
        k = size / self.upm
        adv = sum(self.hmtx[self.cmap[ord(c)]][0] for c in text) * k
        return adv + track * size * (len(text) - 1)

    def draw(self, ctx, text, x, y, size, color, track=0.0, anchor="l", alpha=1.0):
        """Dibuja texto con la línea base en y. anchor: l / c / r."""
        w = self.width(text, size, track)
        if anchor == "c":
            x -= w / 2
        elif anchor == "r":
            x -= w
        k = size / self.upm
        for c in text:
            g = self.cmap[ord(c)]
            ctx.save()
            ctx.translate(x, y)
            ctx.scale(k, -k)
            ctx.new_path()
            self.glyphs[g].draw(CairoPen(self.glyphs, ctx))
            ctx.restore()
            ctx.set_source_rgba(*color, alpha)
            ctx.fill()
            x += self.hmtx[g][0] * k + track * size
        return w


def ring(ctx, r, width, color, alpha=1.0):
    ctx.new_path()
    ctx.arc(CX, CY, r, 0, 2 * math.pi)
    ctx.set_line_width(width)
    ctx.set_source_rgba(*color, alpha)
    ctx.stroke()


def main():
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W * S, H * S)
    ctx = cairo.Context(surf)
    ctx.scale(S, S)
    ctx.set_antialias(cairo.ANTIALIAS_BEST)

    display = Face("BigShoulders-Bold")
    mono = Face("GeistMono-Regular")
    mono_b = Face("GeistMono-Bold")

    # --- campo de brasa: se enciende hacia el centro, se enfría hacia los bordes
    g = cairo.RadialGradient(CX, CY, 120, CX, CY, 980)
    g.add_color_stop_rgb(0.00, 1.000, 0.470, 0.110)
    g.add_color_stop_rgb(0.34, 0.965, 0.300, 0.086)
    g.add_color_stop_rgb(0.62, *EMBER)
    g.add_color_stop_rgb(1.00, 0.760, 0.130, 0.055)
    ctx.set_source(g)
    ctx.paint()

    # --- ondas de calor: anillos que se abren y se apagan con la distancia
    r, step, i = 414.0, 26.0, 0
    while r < 1000:
        ring(ctx, r, 1.4, (1.0, 0.66, 0.36), 0.36 * math.exp(-i / 7.0) + 0.05)
        step *= 1.085
        r += step
        i += 1

    # --- limbo: cien marcas, un cuarto encendido (25 de 100)
    r0 = 344
    for n in range(100):
        a = -math.pi / 2 + 2 * math.pi * n / 100
        major = n % 5 == 0
        lit = n <= 25
        r1 = r0 + (26 if major else 16)
        ctx.new_path()
        ctx.move_to(CX + r0 * math.cos(a), CY + r0 * math.sin(a))
        ctx.line_to(CX + r1 * math.cos(a), CY + r1 * math.sin(a))
        ctx.set_line_cap(cairo.LINE_CAP_BUTT)
        if lit:
            ctx.set_line_width(4.2 if major else 3.0)
            ctx.set_source_rgba(*IVORY, 1)
        else:
            ctx.set_line_width(2.6 if major else 1.8)
            ctx.set_source_rgba(*DEEP, 0.78)
        ctx.stroke()

    # rótulos del limbo
    lab = 19
    cap = lab * mono.cap / mono.upm
    mono_b.draw(ctx, "25", CX + r0 + 38, CY + cap / 2, lab, IVORY, 0.06)
    mono.draw(ctx, "50", CX, CY + r0 + 38 + cap, lab, DEEP, 0.06, "c", 0.9)
    mono.draw(ctx, "75", CX - r0 - 38, CY + cap / 2, lab, DEEP, 0.06, "r", 0.9)

    # --- mango: el eje que apunta al norte
    top, base = 78, CY - R_RIM + 34
    w_tip, w_base = 31, 23
    ctx.new_path()
    ctx.arc(CX, top + w_tip, w_tip, math.pi, 2 * math.pi)
    ctx.line_to(CX + w_base, base)
    ctx.line_to(CX - w_base, base)
    ctx.close_path()
    ctx.set_source_rgb(*IRON)
    ctx.fill()
    # ojal para colgar
    ctx.new_path()
    ctx.arc(CX, top + w_tip, 10.5, 0, 2 * math.pi)
    ctx.set_source_rgb(0.930, 0.235, 0.085)
    ctx.fill()
    # la N del rumbo
    mono_b.draw(ctx, "N", CX, top + 2 * w_tip + 34, 22, IVORY, 0, "c")

    # --- sartén vista desde arriba
    ctx.new_path()
    ctx.arc(CX, CY, R_RIM, 0, 2 * math.pi)
    ctx.set_source_rgb(*IRON)
    ctx.fill()
    # pared torneada: anillos finos entre el borde y el fondo
    rr = R_FLAT + 7.0
    while rr < R_RIM - 8:
        ring(ctx, rr, 1.0, (1.0, 0.86, 0.74), 0.085)
        rr += 7.0
    ring(ctx, R_RIM - 5, 1.6, (1.0, 0.86, 0.74), 0.20)
    # fondo plano, con un resto de calor en el centro
    ctx.new_path()
    ctx.arc(CX, CY, R_FLAT, 0, 2 * math.pi)
    g = cairo.RadialGradient(CX, CY, 0, CX, CY, R_FLAT)
    g.add_color_stop_rgb(0.0, 0.150, 0.108, 0.092)
    g.add_color_stop_rgb(1.0, 0.098, 0.074, 0.065)
    ctx.set_source(g)
    ctx.fill()
    ring(ctx, R_FLAT, 1.4, (1.0, 0.86, 0.74), 0.16)
    # remaches
    for dx in (-10, 10):
        ctx.new_path()
        ctx.arc(CX + dx, CY - R_RIM + 17, 3.6, 0, 2 * math.pi)
        ctx.set_source_rgba(*IVORY, 0.55)
        ctx.fill()

    # --- la cifra
    cap25 = 196
    s25 = display.size_for_cap(cap25)
    w25 = display.width("25%", s25, -0.004)
    cap_off, gap = 44, 40
    s_off = display.size_for_cap(cap_off)
    block = cap25 + gap + cap_off
    y25 = CY - block / 2 + cap25
    display.draw(ctx, "25%", CX, y25, s25, IVORY, -0.004, "c")
    # OFF entre dos filetes, al ancho exacto de la cifra
    y_off = y25 + gap + cap_off
    w_off = display.width("OFF", s_off, 0.30)
    display.draw(ctx, "OFF", CX, y_off, s_off, IVORY, 0.30, "c")
    rule_y = y_off - cap_off / 2
    for sx in (-1, 1):
        ctx.new_path()
        ctx.move_to(CX + sx * (w_off / 2 + 22), rule_y)
        ctx.line_to(CX + sx * (w25 / 2 - 4), rule_y)
        ctx.set_line_width(2.2)
        ctx.set_source_rgba(*IVORY, 0.9)
        ctx.stroke()

    # --- HOT | SALE, partido por el eje
    cap_h = 172
    s_h = display.size_for_cap(cap_h)
    gutter = 60
    display.draw(ctx, "HOT", CX - gutter, top + cap_h, s_h, IRON, 0.012, "r")
    display.draw(ctx, "SALE", CX + gutter, top + cap_h, s_h, IRON, 0.012, "l")

    # --- pie: tres datos y la firma
    y_rule = 1114
    ctx.new_path()
    ctx.move_to(MARGIN, y_rule)
    ctx.line_to(W - MARGIN, y_rule)
    ctx.set_line_width(2.0)
    ctx.set_source_rgb(*IRON)
    ctx.stroke()

    cols = [("EN", "OLLAS Y SARTENES"), ("DEL", "12 AL 14 DE MAYO"), ("CON", "ENVÍO GRATIS")]
    cap_v = 35
    s_v = display.size_for_cap(cap_v)
    widths = [display.width(v, s_v, 0.03) for _, v in cols]
    # columnas proporcionales al contenido: el aire sobrante se reparte por igual
    pad = (W - 2 * MARGIN - sum(widths)) / 4
    y_val = y_rule + 54 + cap_v
    x = MARGIN
    for n, (k, v) in enumerate(cols):
        if n:
            ctx.new_path()
            ctx.move_to(x, y_rule)
            ctx.line_to(x, y_val)
            ctx.set_line_width(2.0)
            ctx.set_source_rgb(*IRON)
            ctx.stroke()
            x += pad
        mono_b.draw(ctx, k, x, y_rule + 34, 19, IVORY, 0.14)
        display.draw(ctx, v, x, y_val, s_v, IRON, 0.03)
        x += widths[n] + pad

    y_sig = H - MARGIN
    s_s = display.size_for_cap(24)
    display.draw(ctx, "COCINA NORTE", MARGIN, y_sig, s_s, IRON, 0.18)
    display.draw(ctx, "TIENDA OFICIAL", W - MARGIN, y_sig, s_s, IRON, 0.18, "r")

    # --- salida: reducción de alta calidad + grano de imprenta apenas visible
    buf = np.frombuffer(surf.get_data(), np.uint8).reshape(H * S, W * S, 4)
    img = Image.fromarray(np.ascontiguousarray(buf[:, :, [2, 1, 0]])).resize((W, H), Image.LANCZOS)
    arr = np.asarray(img).astype(np.float32)
    rng = np.random.default_rng(14)
    arr += rng.normal(0, 2.6, (H, W, 1)).astype(np.float32)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(
        os.path.join(HERE, "hotsale.png"), optimize=True)


if __name__ == "__main__":
    main()

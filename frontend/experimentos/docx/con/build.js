const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
  AlignmentType, LevelFormat, BorderStyle, HeadingLevel, Footer, PageNumber, TabStopType } = require('docx');

const ACCENT = "C0501F", DARK = "2B2B2B", MUTED = "6B6B6B", LIGHT = "F6EDE7";
const FONT = "Calibri";

const t = (text, o = {}) => new TextRun({ text, font: FONT, ...o });
const ph = (text) => new TextRun({ text, font: FONT, bold: true, highlight: "yellow" });
const p = (runs, o = {}) => new Paragraph({ children: Array.isArray(runs) ? runs : [t(runs)], spacing: { after: 100, line: 276 }, ...o });
const h = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [t(text)],
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 2 } } });
const bullet = (runs) => new Paragraph({ numbering: { reference: "b", level: 0 }, spacing: { after: 60, line: 264 },
  children: Array.isArray(runs) ? runs : [t(runs)] });

const TW = 9638; // A4 con márgenes de 2 cm
const border = { style: BorderStyle.SINGLE, size: 4, color: "D9CFC8" };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (content, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA }, borders,
  margins: { top: 70, bottom: 70, left: 110, right: 110 },
  shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
  children: (Array.isArray(content) ? content : [content]).map(c =>
    typeof c === "string" ? new Paragraph({ alignment: o.align, children: [t(c, { bold: o.bold, color: o.color, size: 19 })] }) : c),
});
const table = (widths, rows) => new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: widths,
  rows: rows.map(r => new TableRow({ children: r })) });
const head = (cols, widths) => cols.map((c, i) => cell(c, widths[i], { fill: ACCENT, bold: true, color: "FFFFFF" }));
const small = (runs) => new Paragraph({ children: runs.map(r => typeof r === "string" ? t(r, { size: 19 }) : r) });

// Cronograma
const wC = [1500, 8138];
const crono = table(wC, [
  head(["Etapa", "Qué hacemos"], wC),
  [cell("Mes 1", wC[0], { bold: true, fill: LIGHT }), cell("Auditoría inicial de la cuenta y entrega del diagnóstico. Optimización de las primeras 15 publicaciones (las de mayor potencial). Configuración y lanzamiento de las campañas de Product Ads.", wC[1])],
  [cell("Mes 2", wC[0], { bold: true, fill: LIGHT }), cell("Optimización de 15 publicaciones más. Ajuste de campañas según rendimiento (presupuestos, pausas, nuevos productos). Primer informe mensual.", wC[1])],
  [cell("Mes 3", wC[0], { bold: true, fill: LIGHT }), cell("Optimización de las 10 publicaciones restantes (40 en total). Escalado de las campañas que funcionan. Informe final con resultados del trimestre y recomendaciones para seguir.", wC[1])],
]);

// Inversión
const wI = [6338, 3300];
const inv = table(wI, [
  head(["Concepto", "Valor"], wI),
  [cell("Auditoría inicial de la cuenta (pago único)", wI[0]), cell(small([t("$ ", { size: 19 }), ph("[COMPLETAR]")]), wI[1])],
  [cell("Gestión mensual: optimización de publicaciones, administración de Product Ads e informe", wI[0]), cell(small([t("$ ", { size: 19 }), ph("[COMPLETAR]"), t(" por mes", { size: 19 })]), wI[1])],
  [cell("Total del servicio (3 meses)", wI[0], { bold: true, fill: LIGHT }), cell(small([t("$ ", { size: 19, bold: true }), ph("[COMPLETAR]")]), wI[1], { fill: LIGHT })],
]);

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: DARK } } },
    paragraphStyles: [{ id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
      run: { size: 26, bold: true, color: ACCENT, font: FONT }, paragraph: { keepNext: true, keepLines: true, spacing: { before: 240, after: 120 }, outlineLevel: 0 } }],
  },
  numbering: { config: [{ reference: "b", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 400, hanging: 260 } }, run: { color: ACCENT } } }] }] },
  sections: [{
    properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [t("Propuesta comercial · Cocina Norte · Página ", { size: 16, color: MUTED }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED, font: FONT })] })] }) },
    children: [
      p([t("PROPUESTA COMERCIAL", { size: 18, bold: true, color: ACCENT, characterSpacing: 40 })], { spacing: { after: 40 } }),
      p([t("Gestión de cuenta en Mercado Libre", { size: 40, bold: true })], { spacing: { after: 40 } }),
      p([t("Preparada para ", { color: MUTED }), t("Cocina Norte", { bold: true, color: MUTED }), t(" · Duración: 3 meses · Fecha: ", { color: MUTED }), ph("[COMPLETAR]")],
        { spacing: { after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "D9CFC8", space: 8 } } }),

      h("Contexto y objetivo"),
      p("Cocina Norte ya tiene productos que se venden en Mercado Libre. El desafío ahora es que aparezcan más arriba en las búsquedas, conviertan mejor cada visita y que la inversión en publicidad se traduzca en ventas medibles."),
      p([t("Te proponemos hacernos cargo de la gestión de tu cuenta durante "), t("3 meses", { bold: true }),
        t(" con un objetivo concreto: ordenar la cuenta, mejorar tus publicaciones principales y poner a trabajar Product Ads con criterio, para que puedas ver mes a mes qué está pasando y por qué.")]),

      h("Qué incluye el servicio"),
      bullet([t("Auditoría inicial. ", { bold: true }), t("Revisamos reputación, métricas de ventas y visitas, catálogo, precios frente a la competencia, envíos y preguntas frecuentes. Te entregamos un diagnóstico con prioridades claras.")]),
      bullet([t("Optimización de 40 publicaciones. ", { bold: true }), t("Títulos pensados para la búsqueda, fichas técnicas completas, descripciones claras, orden y calidad de fotos, variantes y compatibilidad con catálogo cuando corresponda.")]),
      bullet([t("Product Ads. ", { bold: true }), t("Armado de la estructura de campañas, definición de presupuestos y objetivos de ACOS, y seguimiento semanal para mover la inversión hacia los productos que más rinden.")]),
      bullet([t("Informe mensual. ", { bold: true }), t("Un reporte con ventas, visitas, conversión, rendimiento de la publicidad y trabajo realizado, más las acciones previstas para el mes siguiente. Lo repasamos juntos en una reunión breve.")]),

      h("Cómo lo vamos a trabajar"),
      crono,

      h("Qué vas a recibir"),
      bullet("Documento de auditoría con diagnóstico y plan de acción priorizado."),
      bullet("40 publicaciones optimizadas y publicadas en tu cuenta."),
      bullet("Campañas de Product Ads configuradas y administradas durante los 3 meses."),
      bullet("3 informes mensuales con métricas, conclusiones y próximos pasos."),

      h("Inversión"),
      p([t("Los valores están expresados en pesos argentinos. ", { size: 19, color: MUTED }), ph("[COMPLETAR: aclarar si incluyen IVA]")], { keepNext: true, spacing: { after: 100 } }),
      inv,
      p([t("Importante: ", { bold: true, size: 19 }), t("el presupuesto de Product Ads (lo que Mercado Libre cobra por los clics) no está incluido en los honorarios y se paga directamente desde la cuenta de Cocina Norte. Presupuesto publicitario sugerido: ", { size: 19 }), ph("$ [COMPLETAR]"), t(" por mes.", { size: 19 })], { spacing: { before: 120, after: 100 } }),

      h("Condiciones"),
      bullet([t("Forma de pago: "), ph("[COMPLETAR]"), t(".")]),
      bullet("Necesitamos acceso a la cuenta de Mercado Libre como colaborador, con permisos para publicaciones y publicidad."),
      bullet("Cocina Norte se encarga del stock, la atención posventa y la entrega de fotos o datos técnicos que falten."),
      bullet([t("Esta propuesta tiene una validez de "), ph("[COMPLETAR]"), t(" días desde su fecha de emisión.")]),

      h("Próximos pasos"),
      p("Si la propuesta te cierra, confirmanos por escrito y coordinamos una reunión de arranque para definir accesos y prioridades. La auditoría comienza dentro de la semana siguiente a la confirmación."),
      new Paragraph({ spacing: { before: 200 }, children: [t("Contacto: ", { bold: true }), ph("[COMPLETAR: nombre, teléfono y email]")] }),
    ],
  }],
});

Packer.toBuffer(doc).then(b => fs.writeFileSync("propuesta.docx", b));

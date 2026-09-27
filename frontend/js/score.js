/* ============================================================
   SCORE.JS — Algoritmo de score de salud de ML Tracker, en el navegador.
   Es el mismo que corre en backend/lib/audit.js (scorePublicacion + planDeAccion):
   si cambiás los pesos o umbrales allá, cambialos también acá.
   Lo usan el simulador del CV, el de tracker.html y la auditoría de ejemplo.
   ============================================================ */

window.DCScore = (function () {
  const PESOS = { fotos: 25, titulo: 20, descripcion: 20, stock: 15, estado: 10, atributos: 5, garantia: 5 };
  const U = { fotos_optimo: 7, fotos_bueno: 4, fotos_minimo: 1, titulo_optimo: 60, titulo_bueno: 40, titulo_minimo: 20, atributos_bueno: 5, stock_bajo: 3 };

  function score(item) {
    const problemas = [], mejoras = [], checks = {};
    let s = 100;
    const parcial = !!item._datos_parciales;

    const fotos = item.pictures?.length || 0;
    checks.fotoHero = fotos >= U.fotos_minimo;
    checks.fotos7   = fotos >= U.fotos_optimo;
    if (fotos === 0) { s -= PESOS.fotos; problemas.push('Sin fotos: impacto crítico en conversión'); }
    else if (fotos < U.fotos_bueno) { s -= PESOS.fotos * 0.5; mejoras.push(`${fotos} foto${fotos > 1 ? 's' : ''}: completá la secuencia de 7`); }
    else if (fotos < U.fotos_optimo) { s -= PESOS.fotos * 0.15; mejoras.push(`${fotos} fotos: podés agregar hasta 7 para máxima conversión`); }

    const len = (item.title || '').length;
    checks.titulo = len >= U.titulo_bueno;
    if (len < U.titulo_minimo) { s -= PESOS.titulo; problemas.push('Título demasiado corto: no rankea en búsquedas'); }
    else if (len < U.titulo_bueno) { s -= PESOS.titulo * 0.4; mejoras.push('Título corto: expandí con características y beneficios'); }
    else if (len < U.titulo_optimo) { s -= PESOS.titulo * 0.1; mejoras.push('Título bueno: podés aprovechar más caracteres para más keywords'); }

    const tieneDesc = (item.descripcion?.length || 0) > 50;
    checks.descripcion = parcial ? null : tieneDesc;
    if (!tieneDesc && !parcial) { s -= PESOS.descripcion; problemas.push('Sin descripción: pierde conversión en el paso final'); }

    const qty = item.available_quantity ?? null;
    checks.stock = qty === null ? null : qty > 0;
    if (qty === 0) { s -= PESOS.stock; problemas.push('Sin stock: publicación invisible en búsquedas'); }
    else if (qty !== null && qty < U.stock_bajo) { s -= PESOS.stock * 0.4; mejoras.push(`Stock bajo (${qty} unidades): reponelo pronto`); }

    checks.activa = item.status === 'active' || item.status === undefined;
    if (item.status === 'paused') { s -= PESOS.estado * 0.6; problemas.push('Publicación pausada: no genera ventas'); }
    else if (item.status === 'closed' || item.status === 'inactive') { s -= PESOS.estado; problemas.push('Publicación cerrada: requiere reactivación'); }

    const attrs = item.attributes?.length || 0;
    checks.atributos = parcial ? null : attrs >= U.atributos_bueno;
    if (!parcial) {
      if (attrs < 2) { s -= PESOS.atributos; problemas.push('Sin atributos: ML penaliza el catálogo incompleto'); }
      else if (attrs < U.atributos_bueno) { s -= PESOS.atributos * 0.5; mejoras.push(`Solo ${attrs} atributos: completá hasta al menos 5`); }
    }

    checks.garantia = parcial ? null : !!item.warranty;
    if (!item.warranty && !parcial) { s -= PESOS.garantia; mejoras.push('Sin garantía: reduce la confianza del comprador'); }

    return { score: Math.round(Math.max(0, Math.min(100, s))), problemas, mejoras, checks };
  }

  function plan(item, s, problemas, mejoras) {
    const acciones = [];
    const fotos = item.pictures?.length || 0;
    const tituloL = item.title?.length || 0;
    const tieneDesc = (item.descripcion?.length || 0) > 50;
    const attrs = item.attributes?.length || 0;
    const parcial = !!item._datos_parciales;

    if (!tieneDesc && !parcial) acciones.push({
      titulo: 'Escribir una descripción estructurada', impacto: 'alto', impacto_pts: 20,
      como: 'Cuatro bloques: (1) beneficio principal, (2) características técnicas, (3) casos de uso y para quién es, (4) garantía y contenido de la caja. Incluí las keywords del título de forma natural.',
      tiempo_estimado: '10-20 min',
    });
    if (fotos < 7 && !parcial) {
      const faltan = 7 - fotos;
      const min = fotos >= 4 ? faltan * 5 : fotos >= 1 ? faltan * 8 : 30;
      const max = fotos >= 4 ? faltan * 10 : fotos >= 1 ? faltan * 15 : 50;
      acciones.push({
        titulo: fotos === 0 ? 'Agregar galería completa' : `Agregar ${faltan} foto${faltan > 1 ? 's' : ''} (${fotos}/7)`,
        impacto: fotos < 4 ? 'alto' : 'medio', impacto_pts: fotos === 0 ? 25 : fotos < 4 ? 15 : 8,
        como: 'Secuencia sugerida: (1) producto sobre fondo blanco, (2) dimensiones, (3) uso en acción / lifestyle, (4-5) accesorios incluidos, (6) infografía de beneficios, (7) certificaciones o garantía.',
        tiempo_estimado: `${min}-${max} min`,
      });
    }
    if (tituloL < 55) acciones.push({
      titulo: `Expandir título (${tituloL} → 55-60 caracteres)`, impacto: tituloL < 30 ? 'alto' : 'medio', impacto_pts: tituloL < 30 ? 18 : 8,
      como: `Fórmula: [Producto] [Marca] [Característica 1] [Característica 2] [Material]. Te faltan ${55 - tituloL} caracteres. Validá antes qué keywords tienen más volumen de búsqueda.`,
      tiempo_estimado: '10 min',
    });
    else if (tituloL > 60) acciones.push({
      titulo: 'Revisá que las keywords principales estén en los primeros 60 caracteres', impacto: 'bajo', impacto_pts: 2,
      como: `El título tiene ${tituloL} caracteres. En los resultados de búsqueda se ven los primeros 60 ("${item.title.slice(0, 60)}…"). Poné lo más buscado primero.`,
      tiempo_estimado: '5 min',
    });
    if (attrs < 5 && !parcial) acciones.push({
      titulo: `Completar atributos (${attrs} de mínimo 5)`, impacto: attrs < 2 ? 'medio' : 'bajo', impacto_pts: attrs < 2 ? 5 : 3,
      como: 'Editar → Características → completar todo lo disponible. Prioridad: marca, modelo, material, color, dimensiones. ML usa los atributos para los filtros de búsqueda.',
      tiempo_estimado: '5-8 min',
    });
    if (!item.warranty && !parcial) acciones.push({
      titulo: 'Agregar garantía', impacto: 'bajo', impacto_pts: 5,
      como: 'Editar → "Garantía del vendedor". Aunque sean 3 meses: baja las preguntas y sube la confianza del comprador.',
      tiempo_estimado: '3-5 min',
    });

    acciones.sort((a, b) => b.impacto_pts - a.impacto_pts);
    acciones.forEach((a, i) => { a.prioridad = i + 1; });

    const potencial = Math.min(100, s + acciones.reduce((t, a) => t + a.impacto_pts, 0));
    const estado = s < 40 ? 'crítico' : s < 60 ? 'mejorable' : s < 80 ? 'bueno' : 'óptimo';
    const nums = t => [...t.matchAll(/(\d+)/g)].map(m => +m[1]);
    const minT = acciones.reduce((t, a) => t + (nums(a.tiempo_estimado)[0] || 10), 0);
    const maxT = acciones.reduce((t, a) => { const n = nums(a.tiempo_estimado); return t + (n[1] || n[0] || 10); }, 0);
    const tiempo = !acciones.length ? 'Sin acciones necesarias'
      : maxT < 60 ? (minT === maxT ? `${minT} min` : `${minT}-${maxT} min`)
      : `${Math.round(minT / 6) / 10}-${Math.round(maxT / 6) / 10} horas`;
    const primero = (problemas[0] || mejoras[0] || '').toLowerCase();

    return {
      resumen: (primero
        ? `El score de ${s}/100 indica que la publicación está ${({ 'crítico': 'en estado crítico', mejorable: 'mejorable', bueno: 'en buen estado', 'óptimo': 'en estado óptimo' })[estado]}. Lo de mayor impacto: ${primero}.`
        : `El score de ${s}/100 indica que la publicación está en buen estado.`) + (potencial > s ? ` Con estas acciones puede llegar a ${potencial}/100.` : ''),
      titulo_optimizado: null, acciones, score_potencial: potencial, tiempo_total: tiempo, fuente: 'reglas',
    };
  }

  const band = s => s >= 80 ? { label: 'Óptima', tone: 'ok' }
                  : s >= 60 ? { label: 'Mejorable', tone: 'warn' }
                  : s >= 40 ? { label: 'Urgente', tone: 'orange' }
                  : { label: 'Crítica', tone: 'bad' };

  // Publicación de ejemplo: la ficha optimizada del caso Borner (datos cargados a mano,
  // se usan cuando la auditoría en vivo no está disponible).
  const EJEMPLO = {
    id: 'MLA99934916665',
    title: 'Mandolina Cortadora Borner V5 Multibox | Profesional Alemán | 5 Placas | Cuchilla Inox | Apto Lavavajillas',
    price: null,
    status: 'active',
    available_quantity: 48,
    pictures: [
      'https://http2.mlstatic.com/D_NQ_NP_891002-MLA99934916665_112025-O.webp',
      'https://http2.mlstatic.com/D_NQ_NP_644799-MLA91259375564_092025-O.webp',
      'https://http2.mlstatic.com/D_NQ_NP_929170-MLA91655081453_092025-O.webp',
      'https://http2.mlstatic.com/D_NQ_NP_797826-MLA91655061463_092025-O.webp',
      'https://http2.mlstatic.com/D_NQ_NP_662348-MLA91259188238_092025-O.webp',
      'https://http2.mlstatic.com/D_NQ_NP_662413-MLA91655051977_092025-O.webp',
    ],
    attributes: new Array(14).fill({}),
    descripcion: 'Descripción estructurada en cuatro bloques: beneficio, especificaciones, usos y garantía.',
    warranty: 'Garantía de fábrica: 5 años',
    permalink: 'https://www.mercadolibre.com.ar/p/MLA27077244',
  };

  // Arma la misma respuesta que /api/audit a partir de un item
  function auditar(item) {
    const r = score(item);
    return {
      mla_id: item.id, item: {
        ...item, pictures: item.pictures.slice(0, 5), pictures_count: item.pictures.length,
        attributes_count: item.attributes?.length ?? null,
      },
      score: r.score, problemas: r.problemas, mejoras: r.mejoras, checks: r.checks,
      ai: plan(item, r.score, r.problemas, r.mejoras),
    };
  }

  return { PESOS, score, plan, band, auditar, EJEMPLO };
})();

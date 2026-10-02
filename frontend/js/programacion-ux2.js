/* ============================================================
   PROGRAMACION-UX2.JS — 49 demos "Así no / Así sí" que completan las Buenas prácticas UX del Lab.
   Mismo mecanismo y mismas clases que programacion-ux.js. Contenido de ejemplo, rotulado como tal.
   ============================================================ */
(function () {
  if (!window.WLDemos) return;
  const { bloque, notas } = WLDemos.util;
  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const par = (tipo, prueba, malo, bueno) => `<div class="ux" data-ux="${tipo}">
    <p class="ux-prueba"><b>Probá:</b> ${prueba}</p>
    <div class="ux-par">
      <section class="ux-lado" data-lado="mal"><h4>Así no</h4><div class="ux-in">${malo}</div></section>
      <section class="ux-lado" data-lado="bien"><h4>Así sí</h4><div class="ux-in">${bueno}</div></section>
    </div></div>`;

  const P1 = 'Juntá tus cuentas y mirá cuánto te queda en el mes. Plata ordena tus gastos por categoría, te avisa cuando te pasás y te deja ponerte metas con fecha, sin planillas ni vueltas.';
  const P2 = 'Cada persona usa el dinero distinto, por eso la app se adapta: podés ver todo junto o separar por cuenta, por tarjeta o por persona, y compartir solo lo que quieras.';
  const kb = (tipo) => tipo === 'num'
    ? '<div class="ux2-kb ux2-kb-num">' + '123456789'.split('').map(k => `<i>${k}</i>`).join('') + '<i></i><i>0</i><i>⌫</i></div>'
    : tipo === 'email'
      ? '<div class="ux2-kb"><div>' + 'qwertyuiop'.split('').map(k => `<i>${k}</i>`).join('') + '</div><div>' + 'asdfghjkl'.split('').map(k => `<i>${k}</i>`).join('') + '</div><div><i class="w">⇧</i>' + 'zxcvbnm'.split('').map(k => `<i>${k}</i>`).join('') + '<i class="w">⌫</i></div><div><i class="w">123</i><i class="at">@</i><i class="sp">espacio</i><i class="at">.</i><i class="w">↵</i></div></div>'
      : '<div class="ux2-kb"><div>' + 'qwertyuiop'.split('').map(k => `<i>${k}</i>`).join('') + '</div><div>' + 'asdfghjkl'.split('').map(k => `<i>${k}</i>`).join('') + '</div><div><i class="w">⇧</i>' + 'zxcvbnm'.split('').map(k => `<i>${k}</i>`).join('') + '<i class="w">⌫</i></div><div><i class="w">123</i><i class="sp">espacio</i><i class="w">↵</i></div></div>';
  const campo = (rot, ph, extra = '') => `<label class="ux2-f"><span>${rot}</span><input ${extra} placeholder="${ph}"></label>`;

  const D = {}, RES = {};
  const R = (id, prueba, tipo, malo, bueno, res, pie, ns) => {
    D['ux/' + id] = () => {
      let i = 0;
      const h = par(tipo, prueba, malo, bueno).replace(/<h4>(Así no|Así sí)<\/h4>/g, m => `${m}<p class="ux-res">${res[i++] ?? ''}</p>`);
      return bloque('Probalo', h + notas('Por qué', ns), pie);
    };
  };

  // ───── Navegación ─────
  R('2-sticky-navigation', 'bajá un poco en cada panel y fijate qué pasa con el título.', 'est',
    '<div class="ux2-fixwrap"><div class="ux2-bar ux2-over">Plata · Menú</div><div class="ux2-sc"><h5>Tus cuentas</h5><p>' + P1 + '</p><p>' + P2 + '</p></div></div>',
    '<div class="ux2-fixwrap"><div class="ux2-bar">Plata · Menú</div><div class="ux2-sc ux2-pt"><h5>Tus cuentas</h5><p>' + P1 + '</p><p>' + P2 + '</p></div></div>',
    ['El menú fijo tapa el título de la sección', 'El contenido arranca debajo del menú'],
    'Una barra fija se saca del flujo de la página: si no se le reserva su alto, tapa lo primero que se lee.',
    [['', 'Se reserva su alto', 'Un padding-top igual a la altura del menú (o scroll-padding-top para los saltos a secciones).']]);

  R('3-active-state', 'tocá las pestañas en cada panel.', 'activo',
    '<div class="ux2-tabs"><a href="#">Cuentas</a><a href="#">Gastos</a><a href="#">Metas</a></div><p class="ux2-out" data-out>Estás en: ¿?</p>',
    '<div class="ux2-tabs"><a href="#" class="on" data-nav>Cuentas</a><a href="#" data-nav>Gastos</a><a href="#" data-nav>Metas</a></div><p class="ux2-out" data-out>Estás en: Cuentas</p>',
    ['Todos los links se ven igual: no sabés dónde estás', 'La pestaña actual se marca'],
    'En un sitio con varias secciones, marcar la actual evita preguntarse en qué parte se está.',
    [['', 'aria-current', 'Además del estilo, aria-current="page" se lo cuenta a los lectores de pantalla.']]);

  R('5-deep-linking', 'elegí un filtro y mirá la dirección de arriba.', 'url',
    '<div class="ux2-url" data-url>plata.com/gastos</div><div class="ux2-chips"><button class="ux-chip" data-f="comida">Comida</button><button class="ux-chip" data-f="transporte">Transporte</button><button class="ux-chip" data-f="ocio">Ocio</button></div><p class="ux2-out">Mostrando: <b data-cur>todo</b></p>',
    '<div class="ux2-url" data-url data-vivo>plata.com/gastos</div><div class="ux2-chips"><button class="ux-chip" data-f="comida">Comida</button><button class="ux-chip" data-f="transporte">Transporte</button><button class="ux-chip" data-f="ocio">Ocio</button></div><p class="ux2-out">Mostrando: <b data-cur>todo</b></p>',
    ['La dirección nunca cambia: no se puede compartir lo que ves', 'La dirección refleja el filtro: se puede compartir'],
    'Si el estado está en la URL, se puede copiar, guardar en favoritos y volver con «atrás».',
    [['', 'Parámetros o hash', 'Con ?filtro=comida o #comida y history.pushState, sin recargar la página.']]);

  R('6-breadcrumbs', 'mirá cuál de las dos pantallas te dice dónde estás.', 'est',
    '<div class="ux2-pag"><h5>Zapatillas running azules</h5><p class="ux2-mut">Estás tres niveles adentro, pero nada lo dice.</p></div>',
    '<div class="ux2-pag"><nav class="ux2-bc" aria-label="Ubicación"><a>Inicio</a> › <a>Calzado</a> › <a>Zapatillas</a> › <b>Running azules</b></nav><h5>Zapatillas running azules</h5><p class="ux2-mut">Cada nivel es un link para volver.</p></div>',
    ['Nada indica en qué parte del sitio estás', 'La ruta se ve y cada nivel es un atajo'],
    'En sitios con tres o más niveles, la ruta evita perderse y ahorra clics para volver.',
    [['', 'Solo si hay profundidad', 'En sitios de un solo nivel sobra: no lo pongas por costumbre.']]);

  // ───── Layout ─────
  R('16-overflow-hidden', 'intentá leer el final de la lista en cada panel.', 'est',
    '<div class="ux2-box" style="overflow:hidden"><p><b>Condiciones del plan</b></p><p>1. Se renueva cada mes.</p><p>2. Podés cancelar cuando quieras.</p><p>3. Sin costo de baja.</p><p>4. El soporte es de lunes a sábado.</p><p>5. Los precios incluyen impuestos.</p><p>6. Los datos se cifran.</p></div>',
    '<div class="ux2-box" style="overflow:auto"><p><b>Condiciones del plan</b></p><p>1. Se renueva cada mes.</p><p>2. Podés cancelar cuando quieras.</p><p>3. Sin costo de baja.</p><p>4. El soporte es de lunes a sábado.</p><p>5. Los precios incluyen impuestos.</p><p>6. Los datos se cifran.</p></div>',
    ['El contenido se corta y no hay forma de llegar', 'Aparece el scroll y se llega a todo'],
    'overflow: hidden recorta lo que no entra y no avisa. Es útil para bordes redondeados, no para contenido que puede crecer.',
    [['', 'Probalo con el contenido más largo', 'Y en un celular con la letra agrandada.']]);

  R('17-fixed-positioning', 'mirá cuánto contenido queda visible en cada pantalla.', 'est',
    '<div class="ux2-cel"><div class="ux2-fx" style="top:0">Menú</div><div class="ux2-fx" style="top:14px;background:#d93025">Promo −30 %</div><div class="ux2-fx" style="bottom:0;background:#188038">Chat</div><div class="ux2-fx" style="bottom:14px;background:#7b1fa2">Cookies</div><div class="ux2-cel-c"><b>Tu resumen</b><p>Lo importante queda tapado por cuatro barras fijas.</p></div></div>',
    '<div class="ux2-cel"><div class="ux2-fx" style="top:0">Menú</div><div class="ux2-fx" style="bottom:0;background:#188038">Chat</div><div class="ux2-cel-c" style="padding:30px 10px"><b>Tu resumen</b><p>Un menú arriba y una barra abajo: el resto es contenido.</p></div></div>',
    ['Cuatro elementos fijos tapan casi todo', 'Dos elementos fijos, con espacio entre ambos'],
    'En un celular cada barra fija le saca altura al contenido. Con pocas, ordenadas y sin superponerse, la página sigue siendo legible.',
    [['', 'Contemplá las zonas seguras', 'En iPhone, env(safe-area-inset-bottom) evita que la barra quede bajo el gesto de inicio.']]);

  R('18-stacking-context', 'mirá si el menú desplegado queda por delante o por detrás de la tarjeta de abajo.', 'est',
    '<div class="ux2-ctx"><div class="ux2-ctx-a" style="position:relative;transform:translateZ(0);z-index:1"><button class="ux-btn" type="button">Opciones ▾</button><div class="ux2-drop" style="z-index:9999">Editar<br>Duplicar<br>Borrar</div></div><div class="ux2-ctx-b" style="position:relative;z-index:2">Tarjeta de abajo</div></div>',
    '<div class="ux2-ctx"><div class="ux2-ctx-a" style="position:relative;z-index:3"><button class="ux-btn" type="button">Opciones ▾</button><div class="ux2-drop" style="z-index:9999">Editar<br>Duplicar<br>Borrar</div></div><div class="ux2-ctx-b" style="position:relative;z-index:2">Tarjeta de abajo</div></div>',
    ['z-index: 9999 y aun así queda detrás', 'El contenedor está por delante: el menú se ve'],
    'El z-index solo compite dentro de su propio contexto de apilamiento. Si el contenedor tiene un z-index menor que el de su vecino, ningún valor de adentro lo arregla.',
    [['', 'Se arregla en el padre', 'Subí el z-index del contenedor, no el del menú. Un transform, una opacidad menor a 1 o un filtro también crean contexto.']]);

  R('20-viewport-units', 'mirá si el botón de abajo se ve en cada celular.', 'est',
    '<div class="ux2-cel ux2-vh"><div class="ux2-chrome">navegador</div><div class="ux2-vh-c" style="height:calc(100% + 34px)"><b>Tu resumen</b><button class="ux-btn ux2-vh-b" type="button">Continuar</button></div></div>',
    '<div class="ux2-cel ux2-vh"><div class="ux2-chrome">navegador</div><div class="ux2-vh-c" style="height:calc(100% - 34px)"><b>Tu resumen</b><button class="ux-btn ux2-vh-b" type="button">Continuar</button></div></div>',
    ['100vh incluye la barra del navegador: el botón queda tapado', 'dvh se ajusta a lo que realmente se ve'],
    'En celulares, 100vh mide la pantalla con la barra del navegador desplegada, así que lo que está abajo se corta. dvh usa la altura visible en cada momento.',
    [['', 'Alternativas', 'min-height: 100dvh, o 100svh si querés la altura mínima segura.']]);

  R('21-container-width', 'compará cuál de los dos textos se lee más cómodo.', 'est',
    '<p class="ux2-wide">' + P1 + ' ' + P2 + '</p>',
    '<p class="ux2-narrow">' + P1 + ' ' + P2 + '</p>',
    ['Renglones larguísimos: cuesta no perderse', 'Un ancho de lectura cómodo'],
    'En pantallas anchas el ojo pierde el renglón al volver de una línea a la siguiente.',
    [['', 'Entre 60 y 75 caracteres', 'max-width: 65ch (o max-w-prose en Tailwind) en los bloques de texto.']]);

  R('23-touch-spacing', 'tocá los botones de cada panel e intentá acertar el del medio.', 'eco',
    '<div class="ux2-btns" style="gap:0">' + ['Pagar', 'Cancelar', 'Guardar'].map(t => `<button class="ux-btn ux2-b" data-b="${t}" type="button" style="border-radius:0">${t}</button>`).join('') + '</div><p class="ux2-out">Tocaste: <b data-eco>nada</b></p>',
    '<div class="ux2-btns" style="gap:12px">' + ['Pagar', 'Cancelar', 'Guardar'].map(t => `<button class="ux-btn ux2-b" data-b="${t}" type="button">${t}</button>`).join('') + '</div><p class="ux2-out">Tocaste: <b data-eco>nada</b></p>',
    ['Botones pegados: es fácil tocar el equivocado', 'Separación suficiente para el dedo'],
    'Con el dedo, la precisión baja. Un botón vecino a milímetros genera errores, y «Cancelar» al lado de «Pagar» es el peor lugar para equivocarse.',
    [['', 'Mínimo 8 px', 'Y que el área táctil mida al menos 44×44 px.']]);

  R('24-gesture-conflicts', 'mirá cuál de los dos carruseles te deja seguir bajando con el dedo.', 'est',
    '<div class="ux2-car"><div class="ux2-car-t" style="width:300%">' + [1, 2, 3].map(n => `<div class="ux2-slide" style="width:33.33%">Tarjeta ${n}</div>`).join('') + '</div><p class="ux2-mut">Ocupa todo el ancho y captura el gesto horizontal: no hay dónde apoyar el dedo para bajar.</p></div>',
    '<div class="ux2-car"><div class="ux2-car-t" style="width:130%">' + [1, 2, 3].map(n => `<div class="ux2-slide" style="width:30%;margin-right:3%">Tarjeta ${n}</div>`).join('') + '</div><p class="ux2-mut">La siguiente tarjeta asoma: se entiende que se desliza, y queda margen para el scroll vertical.</p></div>',
    ['El carrusel captura el dedo en toda la pantalla', 'La próxima tarjeta asoma y deja margen'],
    'Los gestos propios pueden chocar con los del sistema (volver, scroll). Mostrar un pedazo de lo que sigue comunica el deslizamiento sin hacerlo obligatorio.',
    [['', 'touch-action', 'Con touch-action: pan-y le dejás el scroll vertical al navegador.']]);

  R('25-tap-delay', 'tocá el botón en cada panel y mirá cuánto tarda en responder.', 'retraso',
    '<button class="ux-btn" data-r="300" type="button">Pagar</button><p class="ux2-out" data-out>Tocá el botón…</p>',
    '<button class="ux-btn" data-r="0" type="button">Pagar</button><p class="ux2-out" data-out>Tocá el botón…</p>',
    ['Espera 300 ms antes de reaccionar (simulado)', 'Responde al instante'],
    'Los navegadores móviles viejos esperaban 300 ms por si venía un doble toque. Hoy se evita con el meta viewport y touch-action: manipulation.',
    [['', 'Qué hacer', 'width=device-width en el meta viewport y touch-action: manipulation en los elementos que se tocan.']]);

  R('26-pull-to-refresh', 'mirá qué le pasa a la lista de cada panel al llegar arriba y seguir tirando.', 'est',
    '<div class="ux2-cel"><div class="ux2-refresh">↻ Se recargó la página sin querer</div><div class="ux2-cel-c"><b>Tu carga a medias</b><p>Estabas completando un formulario largo…</p></div></div>',
    '<div class="ux2-cel"><div class="ux2-cel-c" style="padding-top:34px"><b>Tu carga a medias</b><p>overscroll-behavior: contain evita que el gesto recargue todo.</p></div></div>',
    ['Un tirón de más recarga la página y perdés lo cargado', 'El gesto no recarga si no hace falta'],
    'Deslizar hacia abajo desde arriba recarga la página en muchos navegadores. En pantallas con formularios o flujos largos eso borra el trabajo hecho.',
    [['', 'Solo donde no corresponde', 'overscroll-behavior-y: contain en esa pantalla; en feeds de contenido, dejalo como está.']]);

  // ───── Interacción ─────
  R('29-hover-states', 'pasá el mouse por las filas de cada panel.', 'est',
    '<ul class="ux2-list">' + ['Alquiler', 'Supermercado', 'Sueldo'].map(t => `<li>${t}</li>`).join('') + '</ul>',
    '<ul class="ux2-list ux2-hv">' + ['Alquiler', 'Supermercado', 'Sueldo'].map(t => `<li>${t}</li>`).join('') + '</ul>',
    ['Nada cambia: no se nota qué se puede tocar', 'La fila se resalta y el cursor cambia'],
    'El hover le dice al mouse «esto responde». Sin él, hay que adivinar qué es un botón.',
    [['', 'Ojo en celulares', 'No existe el hover al tacto: no lo uses como único aviso (ver la regla «Hover o toque»).']]);

  R('30-active-states', 'mantené apretado cada botón.', 'est',
    '<button class="ux-btn ux2-nopress" type="button">Pagar $ 12.500</button>',
    '<button class="ux-btn ux2-press" type="button">Pagar $ 12.500</button>',
    ['Al apretar no pasa nada visible', 'El botón se hunde mientras lo apretás'],
    'Un cambio inmediato al presionar confirma que la interfaz «escuchó», aun si la acción tarda en terminar.',
    [['', 'Chico y rápido', 'transform: scale(.97) en :active, de 100 a 160 ms.']]);

  R('31-disabled-states', 'tocá el botón «Pagar» en cada panel.', 'eco',
    '<button class="ux-btn" data-b="No pasó nada: ¿está roto?" type="button">Pagar</button><p class="ux2-out" data-eco>Faltan datos para pagar</p>',
    '<button class="ux-btn" data-b="" type="button" disabled style="opacity:.45;cursor:not-allowed">Pagar</button><p class="ux2-out" data-eco>Completá tu dirección para activarlo</p>',
    ['Se ve activo pero no hace nada', 'Se ve apagado y dice qué falta'],
    'Un botón que parece activo y no responde se vive como un error. Mostrarlo apagado, con la razón al lado, evita el clic en vano.',
    [['', 'Con motivo', 'Mejor que solo apagarlo: decir qué falta para habilitarlo.']]);

  R('34-success-feedback', 'tocá «Guardar» en cada panel.', 'guardar',
    '<button class="ux-btn" data-g="" type="button">Guardar meta</button><div class="ux2-toastbox" data-t></div>',
    '<button class="ux-btn" data-g="✓ Meta guardada" type="button">Guardar meta</button><div class="ux2-toastbox" data-t></div>',
    ['Termina en silencio: ¿se guardó?', 'Una confirmación breve avisa que salió bien'],
    'Si la acción termina sin ninguna señal, la persona duda y repite el clic.',
    [['', 'Breve y cerca', 'Un tilde o un aviso que se va solo, junto al botón que se tocó.']]);

  R('39-heading-hierarchy', 'compará el «índice» que arma cada página.', 'est',
    '<div class="ux2-outline"><b>Cómo lo lee un lector de pantalla</b><div style="margin-left:0">h1 Plata</div><div style="margin-left:36px">h4 Gastos</div><div style="margin-left:0">h1 Metas</div><div style="margin-left:72px">h6 Alertas</div></div>',
    '<div class="ux2-outline"><b>Cómo lo lee un lector de pantalla</b><div>h1 Plata</div><div style="margin-left:18px">h2 Gastos</div><div style="margin-left:36px">h3 Por categoría</div><div style="margin-left:18px">h2 Metas</div></div>',
    ['Salta de h1 a h4 y repite h1: el índice no se entiende', 'h1, h2 y h3 en orden: un índice claro'],
    'Quien usa lector de pantalla salta de título en título como si fuera un índice. Los saltos de nivel y los títulos usados solo por el tamaño lo rompen.',
    [['', 'El estilo es aparte', 'Elegí el nivel por la estructura y dale el tamaño con CSS.']]);

  R('42-screen-reader', 'compará lo que «ve» un lector de pantalla en cada versión.', 'est',
    '<div class="ux2-outline"><b>Lo que anuncia</b><div>grupo</div><div>grupo</div><div>grupo</div><div>grupo</div><div>texto</div></div>',
    '<div class="ux2-outline"><b>Lo que anuncia</b><div>navegación</div><div>contenido principal</div><div>artículo: Tus gastos</div><div>pie de página</div></div>',
    ['Todo es «grupo»: no se puede navegar por zonas', 'Cada zona tiene nombre y se salta directo'],
    'Los elementos semánticos (nav, main, article, footer) le dan nombre a cada zona. Con div para todo, no hay mapa de la página.',
    [['', 'Primero HTML, después ARIA', 'Un <button> ya trae rol, foco y teclado; un div con onclick, nada de eso.']]);

  R('45-skip-links', 'apretá «Tab» en cada panel hasta llegar al contenido.', 'saltar',
    '<div class="ux2-skp" data-skp="mal"><div class="ux2-nv">' + Array.from({ length: 8 }, (_, i) => `<i data-i>${['Inicio', 'Cuentas', 'Tarjetas', 'Préstamos', 'Inversiones', 'Seguros', 'Blog', 'Ayuda'][i]}</i>`).join('') + '</div><div class="ux2-ct" data-ct>Contenido principal</div><button class="ux-btn" data-tab type="button">Tab ⇥</button><p class="ux2-out" data-out>Tabulaciones: 0</p></div>',
    '<div class="ux2-skp" data-skp="bien"><div class="ux2-nv"><i data-i data-saltar>Saltar al contenido</i>' + Array.from({ length: 8 }, (_, i) => `<i data-i>${['Inicio', 'Cuentas', 'Tarjetas', 'Préstamos', 'Inversiones', 'Seguros', 'Blog', 'Ayuda'][i]}</i>`).join('') + '</div><div class="ux2-ct" data-ct>Contenido principal</div><button class="ux-btn" data-tab type="button">Tab ⇥</button><p class="ux2-out" data-out>Tabulaciones: 0</p></div>',
    ['Hay que pasar por todos los links en cada página', 'El primer Tab ofrece saltar directo'],
    'Quien navega con teclado tiene que recorrer todo el menú en cada página. Un enlace inicial «Saltar al contenido» lo resuelve en un paso.',
    [['', 'Visible al enfocar', 'Puede estar oculto hasta recibir el foco, pero tiene que aparecer.']]);

  // ───── Formularios ─────
  R('55-error-placement', 'enviá el formulario vacío en cada panel.', 'enviar',
    '<form class="ux2-form" novalidate><div class="ux2-errtop" data-top hidden></div>' + campo('Nombre', 'Tu nombre') + campo('Email', 'tu@correo.com') + campo('Teléfono', '11 2345 6789') + '<button class="ux-btn" type="submit">Enviar</button></form>',
    '<form class="ux2-form" novalidate>' + ['Nombre|Tu nombre|Escribí tu nombre', 'Email|tu@correo.com|Escribí un email válido', 'Teléfono|11 2345 6789|Escribí tu teléfono'].map(s => { const [a, b, c] = s.split('|'); return campo(a, b) + `<p class="ux-err ux2-e" data-e hidden>${c}</p>`; }).join('') + '<button class="ux-btn" type="submit">Enviar</button></form>',
    ['Un solo mensaje arriba: hay que buscar qué campo falla', 'El error aparece debajo de cada campo'],
    'Un mensaje general obliga a recorrer el formulario para entender qué está mal. Al lado del campo, se corrige sin buscar.',
    [['', 'Con texto, no solo color', 'Que el error diga qué hacer, no solo «inválido».']]);

  R('56-inline-validation', 'escribí un email sin arroba y salí del campo.', 'blur',
    '<form class="ux2-form" novalidate onsubmit="return false">' + campo('Email', 'tu@correo.com', 'data-v') + '<p class="ux-err ux2-e" data-e hidden>Falta la arroba</p><button class="ux-btn" type="submit">Crear cuenta</button></form>',
    '<form class="ux2-form" novalidate onsubmit="return false">' + campo('Email', 'tu@correo.com', 'data-v data-blur') + '<p class="ux-err ux2-e" data-e hidden>Falta la arroba</p><button class="ux-btn" type="submit">Crear cuenta</button></form>',
    ['Recién te avisa al apretar el botón', 'Te avisa al salir del campo'],
    'Enterarse de los errores al final, todos juntos, es frustrante. Validar al salir de cada campo permite corregir en el momento.',
    [['', 'Ni muy pronto ni muy tarde', 'Mejor al salir del campo que mientras se escribe la primera letra.']]);

  R('57-input-types', 'mirá el teclado que aparece en el celular para escribir un email.', 'est',
    '<div class="ux2-cel ux2-k"><label class="ux2-f"><span>Email (type="text")</span><input placeholder="tu@correo.com"></label>' + kb('text') + '</div>',
    '<div class="ux2-cel ux2-k"><label class="ux2-f"><span>Email (type="email")</span><input placeholder="tu@correo.com"></label>' + kb('email') + '</div>',
    ['Teclado común: la arroba está escondida', 'El teclado trae @ y el punto a mano'],
    'El tipo del campo cambia el teclado del celular y activa la validación del navegador, sin una línea de JavaScript.',
    [['', 'Tipos útiles', 'email, tel, number, url, date y search.']]);

  R('58-autofill-support', 'apretá «Autocompletar» para simular lo que hace el navegador.', 'autofill',
    '<form class="ux2-form" autocomplete="off" onsubmit="return false">' + campo('Nombre', 'Tu nombre', 'autocomplete="off" data-a="Lucía Fernández"') + campo('Email', 'tu@correo.com', 'autocomplete="off" data-a="lucia@correo.com"') + '<button class="ux-btn" data-auto data-bloq type="button">Autocompletar</button><p class="ux2-out" data-out></p></form>',
    '<form class="ux2-form" onsubmit="return false">' + campo('Nombre', 'Tu nombre', 'autocomplete="name" data-a="Lucía Fernández"') + campo('Email', 'tu@correo.com', 'autocomplete="email" data-a="lucia@correo.com"') + '<button class="ux-btn" data-auto type="button">Autocompletar</button><p class="ux2-out" data-out></p></form>',
    ['autocomplete="off": el navegador no completa nada', 'autocomplete correcto: se completa en un toque'],
    'Escribir de nuevo datos que el navegador ya conoce hace abandonar el formulario, y en el celular es doloroso.',
    [['', 'Los valores existen', 'name, email, tel, street-address, postal-code, cc-number…']]);

  R('59-required-indicators', 'mirá cuál de los dos formularios deja claro qué se puede dejar vacío.', 'est',
    '<div class="ux2-form">' + campo('Nombre', '') + campo('Email', '') + campo('Teléfono', '') + campo('Comentario', '') + '</div>',
    '<div class="ux2-form">' + campo('Nombre <b class="ux2-req" title="obligatorio">*</b>', '') + campo('Email <b class="ux2-req" title="obligatorio">*</b>', '') + campo('Teléfono <small>(opcional)</small>', '') + campo('Comentario <small>(opcional)</small>', '') + '<small class="ux2-mut">* Obligatorio</small></div>',
    ['Hay que adivinar cuáles hay que completar', 'Los obligatorios están marcados y se explica el asterisco'],
    'Sin marcar nada, se prueba a enviar y recién ahí aparecen los errores.',
    [['', 'Marcá lo menos común', 'Si casi todo es obligatorio, marcá los opcionales con «(opcional)».']]);

  R('60-password-visibility', 'escribí una contraseña en cada panel.', 'pass',
    '<form class="ux2-form" onsubmit="return false"><label class="ux2-f"><span>Contraseña</span><input type="password" placeholder="Mínimo 8 caracteres"></label></form>',
    '<form class="ux2-form" onsubmit="return false"><label class="ux2-f"><span>Contraseña</span><span class="ux2-pw"><input type="password" placeholder="Mínimo 8 caracteres" data-pw><button type="button" data-ver aria-pressed="false">Ver</button></span></label></form>',
    ['Siempre oculta: escribís a ciegas', 'Un botón la muestra cuando querés'],
    'En el celular, equivocarse al escribir una contraseña oculta es muy común, y termina en «Olvidé mi clave».',
    [['', 'Con estado', 'El botón dice «Ver» u «Ocultar» y usa aria-pressed.']]);

  R('62-input-affordance', 'mirá cuál de los dos formularios se entiende como formulario.', 'est',
    '<div class="ux2-form"><div class="ux2-ghost">Tu nombre</div><div class="ux2-ghost">tu@correo.com</div><span class="ux-btn" style="background:none;color:inherit;padding:0">Enviar</span></div>',
    '<div class="ux2-form">' + campo('Nombre', 'Tu nombre') + campo('Email', 'tu@correo.com') + '<button class="ux-btn" type="button">Enviar</button></div>',
    ['Los campos parecen texto suelto', 'Los campos tienen borde y se ven escribibles'],
    'Un campo tiene que parecer un campo. Un borde o un fondo diferenciado alcanzan para saber dónde tocar.',
    [['', 'Contraste del borde', 'El borde también tiene que cumplir al menos 3:1 contra el fondo.']]);

  R('63-mobile-keyboards', 'mirá el teclado que aparece para escribir un código postal.', 'est',
    '<div class="ux2-cel ux2-k"><label class="ux2-f"><span>Código postal</span><input placeholder="1405"></label>' + kb('text') + '</div>',
    '<div class="ux2-cel ux2-k"><label class="ux2-f"><span>Código postal</span><input placeholder="1405"></label>' + kb('num') + '</div>',
    ['Teclado de letras para escribir números', 'Teclado numérico, directo'],
    'Con inputmode, el celular muestra el teclado que corresponde sin cambiar el tipo del campo.',
    [['', 'Sirve para códigos y números', 'inputmode="numeric" para códigos y "decimal" para importes.']]);

  // ───── Responsive ─────
  R('64-mobile-first', 'compará cómo se ve cada versión en un celular angosto.', 'est',
    '<div class="ux2-cel ux2-nar"><div class="ux2-cols3"><i>Cuentas</i><i>Gastos</i><i>Metas</i></div><p class="ux2-mut">Se diseñó para escritorio: tres columnas apretadas.</p></div>',
    '<div class="ux2-cel ux2-nar"><div class="ux2-stk"><i>Cuentas</i><i>Gastos</i><i>Metas</i></div><p class="ux2-mut">Se diseñó para el celular: una columna, y crece en pantallas grandes.</p></div>',
    ['Escritorio primero: en el celular queda apretado', 'Celular primero: se amplía en pantallas grandes'],
    'Es más fácil sumar espacio y columnas que quitarlos. Empezar por lo angosto obliga a quedarse con lo importante.',
    [['', 'min-width, no max-width', 'Estilos base para el celular y @media (min-width: …) para ampliar.']]);

  R('65-breakpoint-testing', 'compará cuántos anchos se probaron en cada caso.', 'est',
    '<div class="ux2-bps"><div class="ux2-bp ok" style="width:120px"><b>1440</b>Se ve bien</div><div class="ux2-bp ko" style="width:80px"><b>768</b>Se rompe</div><div class="ux2-bp ko" style="width:48px"><b>375</b>Roto</div></div>',
    '<div class="ux2-bps"><div class="ux2-bp ok" style="width:120px"><b>1440</b>Bien</div><div class="ux2-bp ok" style="width:80px"><b>768</b>Bien</div><div class="ux2-bp ok" style="width:48px"><b>375</b>Bien</div></div>',
    ['Se desarrolló en una sola pantalla', 'Se probó en varios anchos'],
    'Un diseño que solo se vio en la pantalla de quien lo hizo suele romperse en otras.',
    [['', 'Anchos típicos', '320, 375, 414, 768, 1024 y 1440.']]);

  R('70-image-scaling', 'achicá el panel con el control y mirá qué pasa con la imagen.', 'resize',
    '<label class="ux2-rg">Ancho <input type="range" min="140" max="320" value="320" data-rg></label><div class="ux2-rz" data-rz><img class="ux2-img" style="width:300px;max-width:none" alt="Ejemplo de imagen fija" src="data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="140"><rect width="300" height="140" fill="#cfe0ff"/><circle cx="70" cy="60" r="26" fill="#2563eb"/><path d="M0 140 L100 70 L180 120 L240 80 L300 130 V140Z" fill="#7aa2f7"/></svg>') + '"></div>',
    '<label class="ux2-rg">Ancho <input type="range" min="140" max="320" value="320" data-rg></label><div class="ux2-rz" data-rz><img class="ux2-img" style="max-width:100%;height:auto" alt="Ejemplo de imagen que escala" src="data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="140"><rect width="300" height="140" fill="#cfe0ff"/><circle cx="70" cy="60" r="26" fill="#2563eb"/><path d="M0 140 L100 70 L180 120 L240 80 L300 130 V140Z" fill="#7aa2f7"/></svg>') + '"></div>',
    ['El ancho fijo se desborda y corta', 'La imagen se adapta al contenedor'],
    'Una imagen con ancho fijo no se entera de que la pantalla es más chica y se sale del diseño.',
    [['', 'Dos propiedades', 'max-width: 100% y height: auto.']]);

  R('71-table-handling', 'deslizá la tabla de cada panel con el dedo o la rueda.', 'est',
    '<div class="ux2-tw ux2-tw-mal"><table class="ux2-tb"><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Ahorro</th><th>Meta</th><th>Estado</th></tr><tr><td>Julio</td><td>$1.250.000</td><td>$890.000</td><td>$360.000</td><td>$400.000</td><td>Cerca</td></tr><tr><td>Agosto</td><td>$1.250.000</td><td>$840.000</td><td>$410.000</td><td>$400.000</td><td>Lograda</td></tr></table></div>',
    '<div class="ux2-tw" style="overflow-x:auto"><table class="ux2-tb"><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Ahorro</th><th>Meta</th><th>Estado</th></tr><tr><td>Julio</td><td>$1.250.000</td><td>$890.000</td><td>$360.000</td><td>$400.000</td><td>Cerca</td></tr><tr><td>Agosto</td><td>$1.250.000</td><td>$840.000</td><td>$410.000</td><td>$400.000</td><td>Lograda</td></tr></table></div>',
    ['La tabla se sale y recorta las columnas', 'La tabla se desplaza dentro de su caja'],
    'Una tabla ancha en un celular rompe el diseño de toda la página o queda cortada.',
    [['', 'Dos salidas', 'Un contenedor con overflow-x: auto, o pasar cada fila a una tarjeta en pantallas chicas.']]);

  // ───── Tipografía ─────
  R('72-line-height', 'leé el párrafo de cada panel.', 'est',
    '<p style="line-height:1">' + P1 + ' ' + P2 + '</p>', '<p style="line-height:1.65">' + P1 + ' ' + P2 + '</p>',
    ['Renglones pegados: cuesta seguir la lectura', 'Un interlineado de 1,5 a 1,75'],
    'Con renglones muy apretados el ojo se salta de línea; con demasiado aire, el párrafo se disgrega.',
    [['', 'Para texto corrido', 'Entre 1,5 y 1,75; en títulos grandes, menos (1,1 a 1,2).']]);

  R('73-line-length', 'compará la comodidad de leer los dos bloques.', 'est',
    '<p class="ux2-wide">' + P1 + ' ' + P2 + ' ' + P1 + '</p>', '<p class="ux2-narrow">' + P1 + ' ' + P2 + ' ' + P1 + '</p>',
    ['Más de 120 caracteres por renglón', 'Entre 65 y 75 caracteres'],
    'Las líneas muy largas hacen perder el renglón al volver al inicio.',
    [['', 'Con ch', 'max-width: 65ch limita el ancho según la letra, no según la pantalla.']]);

  R('74-font-size-scale', 'mirá cuál de las dos jerarquías se entiende de un vistazo.', 'est',
    '<div class="ux2-esc"><div style="font-size:23px">Tus gastos del mes</div><div style="font-size:15px">Resumen por categoría</div><div style="font-size:19px">Supermercado</div><div style="font-size:13px">Detalle de movimientos</div><div style="font-size:17px">Total</div></div>',
    '<div class="ux2-esc"><div style="font-size:24px;font-weight:700">Tus gastos del mes</div><div style="font-size:18px;font-weight:600">Resumen por categoría</div><div style="font-size:16px">Supermercado</div><div style="font-size:16px">Detalle de movimientos</div><div style="font-size:14px;color:#5f6368">Total</div></div>',
    ['Tamaños sueltos: no se sabe qué importa más', 'Una escala corta: 14, 16, 18 y 24'],
    'Cinco tamaños casi iguales no marcan jerarquía. Una escala corta hace que cada nivel se note.',
    [['', 'Pocos pasos', 'Entre 5 y 7 tamaños para todo el sitio, como variables.']]);

  R('77-heading-clarity', 'escaneá cada página con la vista: ¿dónde empieza cada parte?', 'est',
    '<div class="ux2-hd"><span>Tus cuentas</span><p>' + P2 + '</p><span>Tus metas</span><p>' + P2 + '</p></div>',
    '<div class="ux2-hd"><b style="font-size:20px">Tus cuentas</b><p>' + P2 + '</p><b style="font-size:20px">Tus metas</b><p>' + P2 + '</p></div>',
    ['Los títulos se confunden con el texto', 'Los títulos se destacan por tamaño y peso'],
    'Quien lee en pantalla escanea los títulos para ubicarse. Si no se distinguen, hay que leer todo.',
    [['', 'Dos señales', 'Tamaño y peso, y más espacio arriba que abajo.']]);

  // ───── Feedback y contenido ─────
  R('79-empty-states', 'mirá qué ve alguien que todavía no cargó nada.', 'est',
    '<div class="ux2-vac" style="min-height:130px"></div>',
    '<div class="ux2-vac"><b>Todavía no tenés metas</b><p>Poné una meta con fecha y Plata te dice cuánto apartar por mes.</p><button class="ux-btn" type="button">Crear mi primera meta</button></div>',
    ['Un espacio en blanco: ¿cargó o falló?', 'Explica qué falta y ofrece el primer paso'],
    'Una pantalla vacía sin texto parece rota. Es la primera impresión de quien recién llega.',
    [['', 'Qué decir', 'Qué iría ahí, por qué conviene y un botón para empezar.']]);

  R('80-error-recovery', 'tocá el botón del panel que lo tenga.', 'reintentar',
    '<div class="ux2-erbox"><b>⚠ Error al cargar tus movimientos</b></div>',
    '<div class="ux2-erbox"><b>⚠ No pudimos cargar tus movimientos</b><p>Revisá tu conexión y probá de nuevo.</p><button class="ux-btn" data-retry type="button">Reintentar</button> <a href="#" class="ux2-lnk">Hablar con soporte</a><p class="ux2-out" data-out></p></div>',
    ['Solo informa el error: no hay salida', 'Dice qué pasó y ofrece reintentar o pedir ayuda'],
    'Un error sin salida es un callejón. Lo que ayuda es decir qué pasó y qué se puede hacer ahora.',
    [['', 'Siempre un próximo paso', 'Reintentar, volver o contactar a alguien.']]);

  R('81-progress-indicators', 'mirá cuál de los dos flujos te dice cuánto falta.', 'est',
    '<div class="ux2-flow"><b>Tus datos</b><p class="ux2-mut">Nombre, email y teléfono.</p><button class="ux-btn" type="button">Siguiente</button></div>',
    '<div class="ux2-flow"><div class="ux2-steps"><i class="on">1</i><i class="on">2</i><i>3</i><i>4</i></div><small class="ux2-mut">Paso 2 de 4 · Tus datos</small><p class="ux2-mut">Nombre, email y teléfono.</p><button class="ux-btn" type="button">Siguiente</button></div>',
    ['No se sabe cuántos pasos quedan', 'Paso 2 de 4, con avance visible'],
    'En procesos de varios pasos, no saber cuánto falta es una razón para abandonar.',
    [['', 'Texto y gráfico', 'La barra no alcanza para quien usa lector de pantalla: sumá «Paso 2 de 4».']]);

  R('82-toast-notifications', 'tocá «Enviar» varias veces en cada panel.', 'toast',
    '<button class="ux-btn" data-toast="mal" type="button">Enviar</button><div class="ux2-toastbox" data-t></div>',
    '<button class="ux-btn" data-toast="bien" type="button">Enviar</button><div class="ux2-toastbox" data-t></div>',
    ['Los avisos se acumulan y no se van', 'El aviso desaparece solo a los 3 segundos'],
    'Los avisos permanentes tapan la pantalla; los que desaparecen demasiado rápido se pierden. Para información no crítica, unos segundos alcanzan.',
    [['', 'Los importantes, no', 'Un error que bloquea no debería desaparecer solo.']]);

  R('83-confirmation-messages', 'tocá «Pagar» en cada panel.', 'guardar',
    '<button class="ux-btn" data-g="" type="button">Pagar $ 12.500</button><div class="ux2-toastbox" data-t></div>',
    '<button class="ux-btn" data-g="✓ Pago realizado" type="button">Pagar $ 12.500</button><div class="ux2-toastbox" data-t></div>',
    ['Se paga y la pantalla no dice nada', 'Un mensaje breve confirma el pago'],
    'Confirmar el resultado evita que la persona repita la acción por si acaso, y en un pago eso importa.',
    [['', 'Dónde', 'Cerca de lo que se tocó, y que quede un registro (un comprobante, un mail).']]);

  R('84-truncation', 'tocá «ver más» donde esté.', 'vermas',
    '<div class="ux2-trunc"><b>Reseña de Lucía</b><p>' + P1 + ' ' + P2 + ' ' + P1 + '</p></div>',
    '<div class="ux2-trunc"><b>Reseña de Lucía</b><p class="ux2-cl" data-cl>' + P1 + ' ' + P2 + ' ' + P1 + '</p><a href="#" data-mas>Ver más</a></div>',
    ['El texto largo estira toda la tarjeta', 'Se muestran dos líneas y se puede expandir'],
    'El contenido largo hace crecer unas tarjetas más que otras y rompe la grilla. Cortar y ofrecer «ver más» mantiene el orden.',
    [['', 'line-clamp', 'line-clamp: 2 y un botón para expandir; el texto completo sigue en el HTML.']]);

  R('85-date-formatting', 'leé cada fecha y decí qué día es.', 'est',
    '<ul class="ux2-list"><li>01/02/03</li><li>3/2/1</li><li>2026-10-02T14:00:00Z</li></ul>',
    '<ul class="ux2-list"><li>Hace 2 horas</li><li>2 de octubre de 2026</li><li>Vie 2 oct · 14:00</li></ul>',
    ['¿Es el 1 de febrero o el 2 de enero?', 'Texto claro, en el formato de la región'],
    '«01/02/03» se lee distinto según el país. Un formato con el mes escrito, o relativo, no deja dudas.',
    [['', 'Intl', 'Intl.DateTimeFormat y Intl.RelativeTimeFormat lo resuelven según el idioma.']]);

  R('86-number-formatting', 'compará cuál de los dos importes se lee más rápido.', 'est',
    '<ul class="ux2-list"><li>1234567</li><li>48900000</li><li>0.4825</li></ul>',
    '<ul class="ux2-list"><li>$ 1.234.567</li><li>$ 48,9 M</li><li>48,3 %</li></ul>',
    ['Números largos sin separadores', 'Separadores de miles y unidades'],
    'Un número largo sin formato obliga a contar los dígitos para entender su magnitud.',
    [['', 'Intl.NumberFormat', 'Con la opción de moneda, porcentaje o notación compacta.']]);

  R('87-placeholder-content', 'leé las dos propuestas como las vería un cliente.', 'est',
    '<div class="ux2-card"><b>Lorem ipsum dolor</b><p>Consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.</p><span class="ux-btn" style="pointer-events:none">Botón</span></div>',
    '<div class="ux2-card"><b>Ahorrá para tu primer viaje</b><p>Elegí un monto y una fecha: Plata te dice cuánto apartar cada mes.</p><span class="ux-btn" style="pointer-events:none">Crear mi meta</span></div>',
    ['Texto de relleno: no se puede juzgar el diseño', 'Texto real: se ve cómo funciona de verdad'],
    'El lorem ipsum oculta problemas de largo, de tono y de jerarquía que solo aparecen con el contenido verdadero.',
    [['', 'Aunque sea provisorio', 'Mejor un texto real y corto que uno falso y perfecto.']]);

  R('88-user-freedom', 'tocá «Siguiente» en cada panel y buscá la salida.', 'pasos',
    '<div class="ux2-tour" data-tour><p data-tp>Paso 1 de 3: Bienvenida</p><button class="ux-btn" data-next type="button">Siguiente</button></div>',
    '<div class="ux2-tour" data-tour><p data-tp>Paso 1 de 3: Bienvenida</p><button class="ux-btn" data-next type="button">Siguiente</button> <a href="#" data-skip class="ux2-lnk">Saltar tutorial</a></div>',
    ['No hay forma de salir: hay que hacerlo entero', 'Se puede saltar en cualquier momento'],
    'Un recorrido obligatorio frustra a quien ya sabe usar la app o tiene apuro.',
    [['', 'Siempre con salida', 'Saltar, volver atrás y retomarlo después desde la ayuda.']]);

  R('89-autocomplete', 'escribí «cu» en cada panel.', 'sugerir',
    '<label class="ux2-f"><span>Cuenta de destino</span><input placeholder="Escribí el nombre completo"></label><p class="ux2-mut">Hay que escribir todo y acertar.</p>',
    '<label class="ux2-f"><span>Cuenta de destino</span><input placeholder="Escribí el nombre" data-sug autocomplete="off"></label><ul class="ux2-sug" data-lst hidden></ul>',
    ['Hay que escribir todo, sin ayuda', 'Aparecen sugerencias mientras escribís'],
    'Escribir de memoria el nombre exacto es lento y propenso a errores, sobre todo en el celular.',
    [['', 'Con medida', 'Esperar un instante al escribir (debounce) y poder elegir con teclado.']]);

  R('90-no-results', 'compará lo que pasa cuando buscar «zapatila» no encuentra nada.', 'est',
    '<div class="ux2-nr"><div class="ux2-bus">🔍 zapatila</div><p><b>No se encontraron resultados.</b></p></div>',
    '<div class="ux2-nr"><div class="ux2-bus">🔍 zapatila</div><p><b>No encontramos «zapatila»</b></p><p class="ux2-mut">Probá con «calzado» o revisá la ortografía.</p><div class="ux2-chips"><span class="ux-chip">Calzado</span><span class="ux-chip">Ropa deportiva</span><span class="ux-chip">Ver todo</span></div></div>',
    ['Un mensaje seco y nada más', 'Sugiere alternativas y caminos'],
    'Una búsqueda vacía es un callejón. Ofrecer otro camino mantiene a la persona en el sitio.',
    [['', 'Qué sumar', 'Sugerencias parecidas, categorías populares o cómo contactar a alguien.']]);

  R('97-asset-weight', 'mirá cuánto pesa y cuánto tarda cada versión en cargar.', 'est',
    '<div class="ux2-peso"><div class="ux2-pb" style="width:100%;background:#d93025"><b>48 MB</b></div><p class="ux2-mut">Modelo 3D sin comprimir · en 4G tarda unos 40 s</p></div>',
    '<div class="ux2-peso"><div class="ux2-pb" style="width:6%;background:#188038"><b>3 MB</b></div><p class="ux2-mut">Comprimido y cargado en diferido · menos de 3 s</p></div>',
    ['Archivos enormes: carga lenta y mucho gasto de datos', 'Comprimido y cargado cuando se necesita'],
    'Los recursos pesados hacen lenta la página y consumen datos y energía en el celular de quien visita.',
    [['', 'Cómo', 'Comprimir (Draco para 3D, WebP o AVIF para imágenes) y cargar en diferido lo que no se ve al entrar.']]);

  // ───── Montadores ─────
  const M = {
    est: () => {},
    eco: el => el.querySelectorAll('.ux-lado').forEach(l => l.addEventListener('click', e => { const b = e.target.closest('[data-b]'); if (b) { l.querySelector('[data-eco]').textContent = b.dataset.b || '—'; } })),
    activo: el => el.querySelectorAll('.ux-lado').forEach(l => l.addEventListener('click', e => {
      const a = e.target.closest('.ux2-tabs a'); if (!a) return; e.preventDefault();
      if (!a.hasAttribute('data-nav')) return;
      l.querySelectorAll('.ux2-tabs a').forEach(x => x.classList.toggle('on', x === a)); l.querySelector('[data-out]').textContent = 'Estás en: ' + a.textContent;
    })),
    url: el => el.querySelectorAll('.ux-lado').forEach(l => l.addEventListener('click', e => {
      const b = e.target.closest('[data-f]'); if (!b) return; const u = l.querySelector('[data-url]');
      l.querySelectorAll('[data-f]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      l.querySelector('[data-cur]').textContent = b.textContent; if (u.hasAttribute('data-vivo')) u.textContent = 'plata.com/gastos?filtro=' + b.dataset.f;
    })),
    retraso: el => el.querySelectorAll('.ux-lado').forEach(l => l.querySelector('[data-r]').addEventListener('click', e => {
      const d = +e.currentTarget.dataset.r, out = l.querySelector('[data-out]'), t0 = performance.now(); out.textContent = 'Procesando…';
      setTimeout(() => { out.textContent = 'Respondió en ' + Math.round(performance.now() - t0) + ' ms'; }, d);
    })),
    guardar: el => el.querySelectorAll('.ux-lado').forEach(l => l.querySelector('[data-g]').addEventListener('click', e => {
      const t = l.querySelector('[data-t]'), msg = e.currentTarget.dataset.g; t.innerHTML = msg ? `<span class="ux2-toast">${msg}</span>` : '';
      if (msg) setTimeout(() => { t.innerHTML = ''; }, reduce() ? 3000 : 2400);
    })),
    saltar: el => el.querySelectorAll('[data-skp]').forEach(w => {
      const items = [...w.querySelectorAll('[data-i]')], out = w.querySelector('[data-out]'), ct = w.querySelector('[data-ct]'), bien = w.dataset.skp === 'bien'; let n = 0;
      w.querySelector('[data-tab]').addEventListener('click', () => {
        n++; items.forEach(i => i.classList.remove('on')); ct.classList.remove('on');
        if (bien && n === 1) items[0].classList.add('on'); else if (bien && n === 2) { ct.classList.add('on'); out.textContent = 'Llegaste al contenido en 2 pasos (Tab + Enter)'; return; }
        else if (!bien && n <= items.length) items[n - 1].classList.add('on'); else if (!bien) { ct.classList.add('on'); out.textContent = 'Llegaste al contenido en ' + n + ' tabulaciones'; return; }
        out.textContent = 'Tabulaciones: ' + n;
      });
    }),
    enviar: el => el.querySelectorAll('.ux-lado').forEach(l => l.querySelector('form').addEventListener('submit', e => {
      e.preventDefault(); const top = l.querySelector('[data-top]');
      if (top) { top.hidden = false; top.textContent = 'Hay errores en el formulario. Revisá los campos.'; }
      l.querySelectorAll('[data-e]').forEach(x => { x.hidden = false; }); l.querySelectorAll('input').forEach(i => i.classList.add('is-err'));
    })),
    blur: el => el.querySelectorAll('.ux-lado').forEach(l => {
      const i = l.querySelector('[data-v]'), er = l.querySelector('[data-e]'), chk = () => { const mal = !i.value.includes('@'); er.hidden = !mal; i.classList.toggle('is-err', mal); };
      if (i.hasAttribute('data-blur')) i.addEventListener('blur', () => { if (i.value) chk(); });
      l.querySelector('form').addEventListener('submit', e => { e.preventDefault(); chk(); });
    }),
    autofill: el => el.querySelectorAll('.ux-lado').forEach(l => l.querySelector('[data-auto]').addEventListener('click', e => {
      const bloq = e.currentTarget.hasAttribute('data-bloq'), out = l.querySelector('[data-out]');
      if (bloq) { out.textContent = 'El navegador no sugiere nada (autocomplete="off")'; return; }
      l.querySelectorAll('[data-a]').forEach(i => { i.value = i.dataset.a; }); out.textContent = 'Completado en un toque';
    })),
    pass: el => { const b = el.querySelector('[data-ver]'), i = el.querySelector('[data-pw]'); b.addEventListener('click', () => { const v = i.type === 'password'; i.type = v ? 'text' : 'password'; b.textContent = v ? 'Ocultar' : 'Ver'; b.setAttribute('aria-pressed', String(v)); }); },
    resize: el => { const sl = el.querySelectorAll('[data-rg]'); sl.forEach(s => s.addEventListener('input', () => el.querySelectorAll('[data-rz]').forEach(z => { z.style.width = s.value + 'px'; })));
      el.querySelectorAll('.ux-lado').forEach(l => { const s = l.querySelector('[data-rg]'), z = l.querySelector('[data-rz]'); s.addEventListener('input', () => { z.style.width = s.value + 'px'; }); }); },
    reintentar: el => { const b = el.querySelector('[data-retry]'); if (b) b.addEventListener('click', () => { const o = el.querySelector('[data-out]'); o.textContent = 'Cargando…'; setTimeout(() => { o.textContent = '✓ Listo: movimientos cargados'; }, 700); }); },
    toast: el => el.querySelectorAll('.ux-lado').forEach(l => l.querySelector('[data-toast]').addEventListener('click', e => {
      const box = l.querySelector('[data-t]'), bien = e.currentTarget.dataset.toast === 'bien', n = document.createElement('span'); n.className = 'ux2-toast'; n.textContent = '✓ Mensaje enviado';
      if (bien) box.innerHTML = ''; box.appendChild(n); if (bien) setTimeout(() => n.remove(), 3000);
    })),
    vermas: el => { const c = el.querySelector('[data-cl]'), a = el.querySelector('[data-mas]'); a.addEventListener('click', e => { e.preventDefault(); const abierto = c.classList.toggle('ux2-open'); a.textContent = abierto ? 'Ver menos' : 'Ver más'; }); },
    pasos: el => el.querySelectorAll('[data-tour]').forEach(t => {
      let n = 1; const tx = t.querySelector('[data-tp]'), nx = t.querySelector('[data-next]'), sk = t.querySelector('[data-skip]');
      nx.addEventListener('click', () => { if (n < 3) { n++; tx.textContent = `Paso ${n} de 3: ${['', 'Bienvenida', 'Tus cuentas', 'Tus metas'][n]}`; if (n === 3) nx.textContent = 'Terminar'; } else { tx.textContent = '✓ Recorrido terminado'; nx.hidden = true; if (sk) sk.hidden = true; } });
      if (sk) sk.addEventListener('click', e => { e.preventDefault(); tx.textContent = 'Recorrido salteado. Podés retomarlo desde Ayuda.'; nx.hidden = true; sk.hidden = true; });
    }),
    sugerir: el => { const i = el.querySelector('[data-sug]'), l = el.querySelector('[data-lst]'), ops = ['Cuenta sueldo · Banco Norte', 'Cuenta ahorro · Banco Sur', 'Cuenta joven', 'Cuenta en dólares'];
      const r = () => { const q = i.value.trim().toLowerCase(); const f = q ? ops.filter(o => o.toLowerCase().includes(q)) : []; l.hidden = !f.length; l.innerHTML = f.map(o => `<li><button type="button">${o}</button></li>`).join(''); };
      i.addEventListener('input', r); l.addEventListener('click', e => { const b = e.target.closest('button'); if (b) { i.value = b.textContent; l.hidden = true; } }); },
  };

  WLDemos.agregar(D, M);
})();

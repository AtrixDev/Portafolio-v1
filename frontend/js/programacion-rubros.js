/* ============================================================
   PROGRAMACION-RUBROS.JS — Contenido de ejemplo de la vista previa por rubro
   Lo usa paletaMock() de programacion-ejemplos.js (se carga antes).

   Cada rubro pertenece a una FAMILIA: la familia define qué pieza muestra la
   vista previa (barra de meta, turnos, carta, precio, buscador, panel, etc.)
   y los botones por defecto. Cada rubro trae su propio texto, creíble para SU web:
     [familia, nombre del sitio, título, bajada, datos de la pieza, botón?, botón secundario?]
   Las paletas sin rubro usan la familia "negocio" (sitio de negocio neutro).
   Todos los nombres son inventados: es una interfaz de ejemplo.
   ============================================================ */

window.WLRubros = (function () {
  // Pieza que muestra cada familia y sus botones por defecto
  const FAMILIAS = {
    dona:        { n: 'Donaciones y causas',        t: 'prog',   b: 'Donar',               g: 'Ver la campaña' },
    turno:       { n: 'Turnos y consultas',         t: 'slots',  b: 'Reservar turno',      g: 'Ver servicios' },
    carta:       { n: 'Gastronomía',                t: 'rows',   b: 'Reservar mesa',       g: 'Ver la carta' },
    tienda:      { n: 'Tiendas',                    t: 'precio', b: 'Agregar al carrito',  g: 'Ver detalles' },
    viaje:       { n: 'Viajes y alojamiento',       t: 'campos', b: 'Buscar',              g: 'Ver ofertas' },
    aviso:       { n: 'Avisos y listados',          t: 'rows',   b: 'Ver avisos',          g: 'Filtrar' },
    panel:       { n: 'Paneles y software',         t: 'kpis',   b: 'Ver detalle',         g: 'Exportar' },
    curso:       { n: 'Educación',                  t: 'prog',   b: 'Seguir aprendiendo',  g: 'Ver el programa' },
    lectura:     { n: 'Contenidos y documentación', t: 'rows',   b: 'Leer',                g: 'Suscribirme' },
    media:       { n: 'Audio y video',              t: 'player', b: 'Reproducir',          g: 'Mi lista' },
    evento:      { n: 'Eventos y cultura',          t: 'fecha',  b: 'Comprar entradas',    g: 'Ver programa' },
    estudio:     { n: 'Estudios y servicios profesionales', t: 'rows', b: 'Pedir presupuesto', g: 'Ver trabajos' },
    habito:      { n: 'Apps de seguimiento personal', t: 'big',  b: 'Registrar',           g: 'Historial' },
    comunidad:   { n: 'Comunidades y mensajería',   t: 'chat',   b: 'Responder',           g: 'Ver más' },
    juego:       { n: 'Juegos',                     t: 'big',    b: 'Jugar',               g: 'Ranking' },
    herramienta: { n: 'Herramientas y apps de uso diario', t: 'rows', b: 'Abrir',          g: 'Compartir' },
    finanzas:    { n: 'Finanzas y pagos',           t: 'big',    b: 'Transferir',          g: 'Movimientos' },
    tramite:     { n: 'Gobierno y trámites',        t: 'rows',   b: 'Iniciar trámite',     g: 'Sacar turno' },
    ciencia:     { n: 'Ciencia e investigación',    t: 'rows',   b: 'Ver publicaciones',   g: 'Sumate' },
    movilidad:   { n: 'Movilidad y logística',      t: 'rows',   b: 'Pedir',               g: 'Ver mapa' },
    negocio:     { n: 'Sitio de negocio',           t: 'rows',   b: 'Pedir presupuesto',   g: 'Conocé más' },
  };

  const R = {
    // ── Software, SaaS y paneles ──
    'saas-general': ['panel', 'Nubo', 'Tu equipo esta semana', 'Todo sincronizado. Hay 2 tareas vencidas en Marketing.', [['Usuarios activos', '1.284'], ['Tareas cerradas', '312'], ['Uptime', '99,9%']], 'Invitar al equipo', 'Ver planes'],
    'micro-saas': ['panel', 'Facturín', 'Tu plan Pro', 'Emitiste 38 facturas este mes. Te quedan 62 en el plan.', [['Facturas', '38'], ['Clientes', '21'], ['Plan', 'Pro']], 'Nueva factura', 'Cambiar plan'],
    'financial-dashboard': ['panel', 'Cartera', 'Tu cartera hoy', 'Resultado del día: +1,2%. Los bonos compensaron la baja de acciones.', [['Valor total', '$ 8,4 M'], ['Hoy', '+1,2%'], ['En el año', '+18%']], 'Ver posiciones', 'Exportar'],
    'analytics-dashboard': ['panel', 'Métrico', 'Embudo de la semana', 'La conversión del checkout subió después del cambio en el formulario.', [['Sesiones', '24.310'], ['Conversión', '3,1%'], ['Rebote', '41%']], 'Ver el embudo', 'Exportar'],
    'productivity-tool': ['herramienta', 'Tareo', 'Proyecto: lanzamiento web', 'Vas 7 de 12 tareas. La próxima vence el jueves.', [['Diseño aprobado', 'Hecho'], ['Textos de la home', 'En curso'], ['Carga de productos', 'Pendiente']], 'Nueva tarea', 'Ver tablero'],
    'design-system-component-library': ['herramienta', 'Kit UI', 'Componente: Botón', '4 variantes, 3 tamaños y estados de foco accesibles.', [['Primario', 'Estable'], ['Secundario', 'Estable'], ['Peligro', 'Beta']], 'Copiar código', 'Ver tokens'],
    'ai-chatbot-platform': ['comunidad', 'Asistente', 'Asistente de atención', 'Responde preguntas frecuentes las 24 horas y deriva a una persona cuando hace falta.', [['Cliente', '¿Hacen envíos a Córdoba?'], ['Asistente', 'Sí, llegan en 3 a 5 días hábiles.']], 'Probar el asistente', 'Ver conversaciones'],
    'remote-work-collaboration-tool': ['comunidad', 'Enlace', '#equipo-producto', 'Daily a las 10:00. Hay 3 hilos sin leer.', [['Lucía', 'Subí la versión nueva del diseño.'], ['Martín', 'Genial, la reviso después del daily.']], 'Unirme a la llamada', 'Ver hilos'],
    'smart-home-iot-dashboard': ['panel', 'Casa', 'Tu casa ahora', 'Todo en orden. El lavarropas termina en 20 minutos.', [['Living', '22 °C'], ['Consumo hoy', '6,4 kWh'], ['Puerta', 'Cerrada']], 'Ver ambientes', 'Automatizar'],
    'ev-charging-ecosystem': ['movilidad', 'Carga+', 'Cargadores cerca tuyo', '3 disponibles a menos de 2 km.', [['Av. Libertador 4200', 'Libre · 22 kW'], ['Shopping Norte', 'Libre · 50 kW'], ['Estación Centro', 'Ocupado']], 'Reservar cargador', 'Ver mapa'],
    'crm-client-management': ['panel', 'Clientia', 'Tu embudo de ventas', 'Tenés 5 oportunidades para seguir hoy.', [['Oportunidades', '48'], ['En negociación', '12'], ['Ganadas', '9']], 'Nuevo contacto', 'Ver embudo'],
    'inventory-stock-management': ['panel', 'Depósito', 'Stock al día', '4 productos están debajo del mínimo: conviene reponer.', [['Artículos', '1.240'], ['Bajo mínimo', '4'], ['Valor', '$ 12,8 M']], 'Cargar ingreso', 'Exportar'],
    'status-page-incident-management': ['panel', 'Estado', 'Todos los sistemas operativos', 'Sin incidentes en los últimos 30 días.', [['API', 'Operativa'], ['Pagos', 'Operativa'], ['Uptime 90 días', '99,98%']], 'Suscribirme a avisos', 'Historial'],
    'rpa-automation-dashboard': ['panel', 'Robotina', 'Automatizaciones de hoy', 'Se procesaron 420 facturas sin intervención manual.', [['Robots activos', '8'], ['Tareas hoy', '1.380'], ['Errores', '2']], 'Ver ejecuciones', 'Nuevo flujo'],
    'feature-flag-config-management': ['herramienta', 'Flags', 'checkout-nuevo', 'Activado para el 25% de los usuarios en producción.', [['Producción', '25%'], ['Staging', '100%'], ['Desarrollo', '100%']], 'Subir al 50%', 'Ver historial'],
    'cybersecurity-platform': ['panel', 'Escudo', 'Postura de seguridad', 'Hay 2 vulnerabilidades críticas para parchear esta semana.', [['Activos', '312'], ['Críticas', '2'], ['Puntaje', '84/100']], 'Ver alertas', 'Informe'],
    'developer-tool-ide': ['herramienta', 'Código', 'main · build pasó', 'Tests en verde. 3 archivos modificados sin commitear.', [['src/app.js', 'Modificado'], ['src/api.js', 'Modificado'], ['tests/app.test.js', 'Nuevo']], 'Hacer commit', 'Abrir terminal'],
    'api-developer-portal': ['lectura', 'API Docs', 'Empezá en 5 minutos', 'Creá tu clave, hacé tu primera llamada y mirá la respuesta.', [['GET /pedidos', 'Listar pedidos'], ['POST /pedidos', 'Crear un pedido'], ['Webhooks', 'Avisos en tiempo real']], 'Obtener mi clave', 'Referencia'],
    'no-code-low-code-builder': ['herramienta', 'Armalo', 'Tu app: Pedidos del local', 'Arrastrá bloques y publicala sin escribir código.', [['Formulario de pedido', 'Listo'], ['Tabla de pedidos', 'Listo'], ['Aviso por email', 'Configurar']], 'Publicar', 'Vista previa'],
    'open-source-project-landing': ['lectura', 'fastcli', 'Una CLI rápida para tus proyectos', 'Licencia MIT · 4,2 mil estrellas en GitHub.', [['npm i -g fastcli', 'Instalación'], ['Documentación', 'Guía de inicio'], ['Contribuir', 'Issues abiertos']], 'Ver en GitHub', 'Documentación'],
    'changelog-release-notes': ['lectura', 'Novedades', 'Versión 3.2', 'Exportación a PDF, modo oscuro y 14 correcciones.', [['Nuevo', 'Exportar a PDF'], ['Mejora', 'Modo oscuro'], ['Arreglo', 'Filtros por fecha']], 'Ver todo', 'Suscribirme'],
    'e-signature-document-workflow': ['herramienta', 'Firmá', 'Contrato de alquiler', 'Falta 1 firma para completar el documento.', [['Propietario', 'Firmó'], ['Inquilino', 'Firmó'], ['Garante', 'Pendiente']], 'Recordar firma', 'Descargar'],
    'survey-form-builder': ['herramienta', 'Encuestá', 'Encuesta de satisfacción', '128 respuestas. La pregunta 3 tiene el puntaje más bajo.', [['¿Nos recomendarías?', '8,6/10'], ['¿Te atendimos rápido?', '7,2/10'], ['Comentarios', '46']], 'Compartir encuesta', 'Ver respuestas'],
    'autonomous-drone-fleet-manager': ['panel', 'Flota', 'Flota en vuelo', '6 drones en misión. Uno vuelve a base por batería baja.', [['En vuelo', '6'], ['En base', '4'], ['Batería prom.', '72%']], 'Ver mapa', 'Planificar misión'],
    'sustainable-energy-climate-tech': ['panel', 'Solar', 'Tu instalación hoy', 'Generaste más de lo que consumiste: inyectaste a la red.', [['Generado', '18 kWh'], ['Consumido', '12 kWh'], ['CO₂ evitado', '7 kg']], 'Ver el mes', 'Informe'],
    'quantum-computing-interface': ['herramienta', 'Qubit Lab', 'Circuito: Bell', '2 qubits · 1.024 ejecuciones en el simulador.', [['|00⟩', '51%'], ['|11⟩', '49%'], ['Otros', '0%']], 'Ejecutar', 'Ver circuito'],
    'spatial-computing-os-app': ['herramienta', 'Espacio', 'Tu escritorio 3D', 'Tres ventanas ancladas en el living.', [['Navegador', 'Al frente'], ['Notas', 'A la izquierda'], ['Video', 'Pared']], 'Abrir app', 'Reordenar'],

    // ── Tiendas ──
    'e-commerce': ['tienda', 'Casa Útil', 'Set de 5 cuchillos de acero', 'Con taco de madera. Llega mañana.', ['$ 38.500', '6 cuotas sin interés']],
    'e-commerce-luxury': ['tienda', 'Maison', 'Cartera de cuero hecha a mano', 'Edición limitada · 40 unidades numeradas.', ['$ 890.000', 'Envío asegurado sin cargo'], 'Comprar', 'Agendar visita'],
    'luxury-premium-brand': ['tienda', 'Aurum', 'Reloj Heritage 1962', 'Movimiento automático, caja de acero y 5 años de garantía.', ['$ 2.400.000', 'Atención personalizada'], 'Reservar', 'Visitar la boutique'],
    'subscription-box-service': ['tienda', 'Cajita', 'Caja del mes: cocina italiana', '6 productos seleccionados, llega el primer lunes de cada mes.', ['$ 24.900 / mes', 'Cancelás cuando quieras'], 'Suscribirme', 'Ver cajas anteriores'],
    'digital-products-downloads': ['tienda', 'Plantillas', 'Pack de 30 plantillas para redes', 'Descarga inmediata en Canva y Figma.', ['$ 9.900', 'Pago único'], 'Comprar y descargar', 'Ver muestra'],
    'florist-plant-shop': ['tienda', 'Verde Flor', 'Ramo de rosas y eucaliptus', 'Entrega en el día en CABA si pedís antes de las 14 h.', ['$ 32.000', 'Tarjeta con dedicatoria gratis'], 'Enviar ramo', 'Plantas de interior'],
    'pharmacy-drug-store': ['tienda', 'Farmacia Sol', 'Protector solar FPS 50', '200 ml · apto piel sensible. Retirá en 1 hora.', ['$ 18.700', '20% con tu obra social'], 'Agregar al pedido', 'Subir receta'],
    'gift-wishlist': ['tienda', 'Regalá', 'Lista de cumple de Sofi', '8 regalos elegidos · 3 ya reservados.', ['Auriculares $ 45.000', 'Reservado por nadie todavía'], 'Reservar este regalo', 'Ver la lista'],
    'auction-platform': ['tienda', 'Martillo', 'Lote 14: sillón Luis XV', 'Cierra en 2 h 15 min · 23 ofertas.', ['Oferta actual $ 410.000', 'Próxima mínima $ 420.000'], 'Ofertar', 'Ver el lote'],
    'wardrobe-outfit-planner': ['habito', 'Placard', 'Outfit para hoy', 'Máxima de 18 °C: campera liviana y zapatillas blancas.', ['24', 'prendas usadas este mes', 60], 'Guardar outfit', 'Mi placard'],
    'grocery-shopping-list': ['herramienta', 'Súper', 'Lista del sábado', '12 productos · compartida con Juli.', [['Leche x2', 'Anotado'], ['Pan', 'Comprado'], ['Tomates 1 kg', 'Anotado']], 'Agregar producto', 'Compartir'],

    // ── Gastronomía ──
    'restaurant-food-service': ['carta', 'Lo de Rosa', 'Carta de hoy', 'Cocina de mercado. Abrimos de martes a domingo.', [['Bife de chorizo con papas', '$ 21.500'], ['Ravioles de ricota', '$ 14.800'], ['Flan con dulce de leche', '$ 6.200']]],
    'bakery-cafe': ['carta', 'Miga', 'Recién horneado', 'Pan de masa madre todos los días desde las 8.', [['Medialunas x6', '$ 5.400'], ['Pan de campo', '$ 4.900'], ['Café con leche', '$ 3.200']], 'Hacer pedido', 'Ver la carta'],
    'brewery-winery': ['carta', 'Bodega Andes', 'Nuestros vinos', 'Visitas guiadas con degustación de viernes a domingo.', [['Malbec Reserva 2021', '$ 16.000'], ['Torrontés', '$ 11.500'], ['Degustación de 4 vinos', '$ 25.000']], 'Reservar visita', 'Tienda online'],
    'food-delivery-on-demand': ['carta', 'Ya Llega', 'Pizzería Don Tito', 'Llega en 25-35 min · envío $ 1.500.', [['Muzzarella grande', '$ 12.900'], ['Fugazzeta', '$ 14.200'], ['Faina', '$ 2.800']], 'Pedir ahora', 'Otros locales'],
    'recipe-cooking-app': ['lectura', 'Recetario', 'Tarta de zapallitos', '40 min · 6 porciones · fácil.', [['Ingredientes', '8'], ['Pasos', '6'], ['Calorías por porción', '310']], 'Empezar a cocinar', 'Guardar receta'],
    'calorie-nutrition-counter': ['habito', 'Nutri', 'Hoy comiste', 'Te faltan 650 kcal para tu objetivo. Sumá proteína en la cena.', ['1.350', 'de 2.000 kcal', 68], 'Registrar comida', 'Ver semana'],

    // ── Turnos y consultas ──
    'veterinary-clinic': ['turno', 'Patitas', 'Turnos de consulta', 'Vacunas, control y guardia las 24 horas.', ['Mañana', '9:30', '11:00', '17:30'], 'Reservar turno', 'Guardia 24 h'],
    'dental-practice': ['turno', 'Sonrisa', 'Tu próxima limpieza', 'Atendemos las principales obras sociales.', ['Jueves', '10:00', '15:30', '18:00']],
    'medical-clinic': ['turno', 'Clínica del Parque', 'Clínica médica y especialidades', 'Elegí especialidad, profesional y horario.', ['Lunes', '8:40', '12:20', '16:00'], 'Sacar turno', 'Especialidades'],
    'beauty-spa-wellness-service': ['turno', 'Calma Spa', 'Masaje descontracturante', '60 minutos con aceites esenciales.', ['Sábado', '11:00', '14:00', '16:30'], 'Reservar', 'Ver tratamientos'],
    'booking-appointment-app': ['turno', 'Agendá', 'Peluquería Nico', 'Corte y barba · 45 min.', ['Hoy', '15:00', '16:30', '19:00'], 'Confirmar turno', 'Otro día'],
    'telemedicine-platform': ['turno', 'Doc en Casa', 'Consulta por videollamada', 'Médicos de guardia en menos de 15 minutos.', ['Ahora', '15 min', '30 min', '45 min'], 'Iniciar consulta', 'Mis recetas'],
    'healthcare-app': ['turno', 'Salud+', 'Tu cartilla', 'Turnos, estudios y recetas en un solo lugar.', ['Viernes', '9:00', '10:20', '14:40'], 'Pedir turno', 'Mis estudios'],
    'patient-portal-health-records': ['herramienta', 'Mi Historia', 'Tus estudios', 'Nuevo resultado disponible: análisis de sangre.', [['Análisis de sangre', 'Nuevo'], ['Radiografía de tórax', 'Visto'], ['Receta de amoxicilina', 'Vigente']], 'Ver resultado', 'Pedir turno'],
    'home-services-plumber-electrician': ['turno', 'Arreglos Ya', 'Plomero o electricista a domicilio', 'Presupuesto sin cargo · matriculados.', ['Mañana', '8 a 12 h', '12 a 16 h', '16 a 20 h'], 'Pedir visita', 'Urgencias'],
    'hyperlocal-services': ['turno', 'Del Barrio', 'Paseador de perros en Palermo', '4,9 ★ de 120 vecinos.', ['Lunes', '8:00', '12:00', '18:00'], 'Reservar paseo', 'Otros servicios'],
    'childcare-daycare': ['turno', 'Jardín Rayuela', 'Jardín maternal de 45 días a 3 años', 'Inscripciones abiertas para marzo.', ['Visitas', 'Mar 10 h', 'Jue 10 h', 'Vie 16 h'], 'Agendar visita', 'Proyecto educativo'],
    'senior-care-elderly': ['turno', 'Cuidar', 'Cuidadoras a domicilio', 'Acompañamiento, medicación y paseos. Personal con referencias.', ['Entrevista', 'Lun', 'Mié', 'Vie'], 'Pedir una entrevista', 'Ver servicios'],
    'coworking-space': ['turno', 'Planta 5', 'Escritorios y salas', 'Pase diario con café y wifi de alta velocidad.', ['Hoy', 'Escritorio', 'Sala 4 p.', 'Sala 8 p.'], 'Reservar', 'Ver planes'],
    'fitness-gym-app': ['turno', 'Fuerza', 'Clases de hoy', 'Quedan 3 lugares en funcional de las 19.', ['Hoy', '7:00', '12:30', '19:00'], 'Reservar clase', 'Mi plan'],
    'yoga-stretching-guide': ['habito', 'Namasté', 'Práctica de hoy', 'Secuencia suave para la espalda · 20 min.', ['5', 'días seguidos', 70], 'Empezar', 'Ver secuencias'],
    'legal-services': ['estudio', 'Estudio Paz & Asoc.', 'Abogados laborales y de familia', 'Primera consulta sin cargo, presencial o por videollamada.', [['Despidos', 'Laboral'], ['Divorcios', 'Familia'], ['Sucesiones', 'Civil']], 'Pedir consulta', 'Áreas de práctica'],

    // ── Donaciones y causas ──
    'non-profit-charity': ['dona', 'Manos Unidas', 'Campaña: útiles para 500 chicos', 'Con tu aporte llegamos a escuelas rurales de Santiago del Estero.', [72, '$ 3.600.000 recaudados', 'Meta $ 5.000.000']],
    'church-religious-organization': ['dona', 'Parroquia San José', 'Colecta para el comedor', 'Los sábados damos 200 almuerzos. Misas: dom 10 y 19 h.', [45, '$ 900.000 reunidos', 'Meta $ 2.000.000'], 'Colaborar', 'Horarios de misa'],
    'crowdfunding-platform': ['dona', 'Impulsá', 'Mate térmico de diseño argentino', 'Faltan 12 días. 340 personas ya lo apoyaron.', [86, '$ 8.600.000 de $ 10.000.000', '340 apoyos'], 'Apoyar el proyecto', 'Ver recompensas'],
    'grant-funding-portal': ['tramite', 'Fondo Crear', 'Convocatoria 2026: proyectos culturales', 'Aportes de hasta $ 5.000.000. Cierra el 30 de noviembre.', [['Bases y condiciones', 'PDF'], ['Requisitos', '5 documentos'], ['Tu postulación', 'Sin empezar']], 'Postularme', 'Preguntas frecuentes'],

    // ── Viajes y alojamiento ──
    'hotel-hospitality': ['viaje', 'Hotel Bariloche Lago', 'Habitaciones con vista al lago', 'Desayuno incluido y cancelación gratis hasta 48 h antes.', [['Llegada', '12 dic'], ['Salida', '15 dic'], ['Huéspedes', '2 adultos']], 'Ver disponibilidad', 'Habitaciones'],
    'travel-tourism-agency': ['viaje', 'Mochila Viajes', 'Salta y Jujuy en 7 días', 'Aéreos, hoteles y excursiones con guía.', [['Salida', 'Buenos Aires'], ['Fecha', 'Marzo'], ['Pasajeros', '2']], 'Cotizar viaje', 'Paquetes'],
    'airline': ['viaje', 'Vuela', 'Buscá tu vuelo', 'Equipaje de mano incluido en todas las tarifas.', [['Origen', 'Aeroparque'], ['Destino', 'Ushuaia'], ['Ida', '4 ene']], 'Buscar vuelos', 'Mis reservas'],
    'road-trip-planner': ['viaje', 'Ruta', 'Ruta 40: de Mendoza a Cafayate', '1.120 km · 3 paradas sugeridas · 4 días.', [['Salida', 'Mendoza'], ['Llegada', 'Cafayate'], ['Paradas', 'San Juan, Chilecito']], 'Armar recorrido', 'Nafteras en ruta'],

    // ── Avisos y listados ──
    'real-estate-property': ['aviso', 'Hogar Propiedades', 'Departamentos en Belgrano', '48 propiedades · 3 ambientes con balcón.', [['3 amb. con cochera · 82 m²', 'USD 185.000'], ['2 amb. a estrenar · 54 m²', 'USD 128.000'], ['Alquiler 3 amb.', '$ 780.000/mes']], 'Ver propiedades', 'Tasar la mía'],
    'automotive-car-dealership': ['aviso', 'Autos del Oeste', 'Usados certificados', 'Con garantía de 12 meses y financiación.', [['Hatchback 2021 · 38.000 km', '$ 21.500.000'], ['Sedán 2019 · 62.000 km', '$ 18.900.000'], ['Pickup 2020 · 71.000 km', '$ 29.000.000']], 'Agendar test drive', 'Tomamos tu usado'],
    'classifieds-buy-sell': ['aviso', 'Vendo', 'Avisos en tu zona', 'Publicá gratis y hablá directo con el vendedor.', [['Bicicleta rodado 29', '$ 320.000'], ['Heladera con freezer', '$ 450.000'], ['Mesa de roble', '$ 180.000']], 'Publicar aviso', 'Filtrar'],
    'marketplace-p2p': ['aviso', 'Entre Vecinos', 'Comprá y vendé usado', 'Pagos protegidos hasta que recibís el producto.', [['Cochecito de bebé', '$ 95.000'], ['Consola con 2 joysticks', '$ 380.000'], ['Campera de cuero', '$ 60.000']], 'Vender algo', 'Filtrar'],
    'directory-listing-site': ['aviso', 'Guía Local', 'Ferreterías en Caballito', '12 comercios · abiertos ahora: 7.', [['Ferretería El Tornillo', '4,7 ★ · Abierto'], ['Bulonera Rivadavia', '4,5 ★ · Abierto'], ['Pinturería Color', '4,3 ★ · Cerrado']], 'Ver en el mapa', 'Sumá tu comercio'],
    'job-board-recruitment': ['aviso', 'Trabajo Ya', 'Empleos para vos', '1.240 búsquedas activas · 86 nuevas hoy.', [['Analista de datos · Remoto', 'Semi senior'], ['Vendedor/a de salón · CABA', 'Full time'], ['Diseñador/a UX · Híbrido', 'Senior']], 'Postularme', 'Cargar mi CV'],
    'freelancer-platform': ['aviso', 'Freelo', 'Profesionales para tu proyecto', 'Pagás cuando aprobás la entrega.', [['Diseño de logo', 'desde $ 60.000'], ['Tienda online', 'desde $ 400.000'], ['Edición de video', 'desde $ 35.000']], 'Publicar proyecto', 'Buscar freelancers'],
    'review-platform': ['aviso', 'Opiná', 'Mejores parrillas de Rosario', 'Según 3.400 reseñas de clientes reales.', [['La Estancia', '4,8 ★ · 612 reseñas'], ['El Fogón', '4,6 ★ · 401 reseñas'], ['Don Ramón', '4,5 ★ · 288 reseñas']], 'Escribir reseña', 'Filtrar'],
    'parking-finder': ['movilidad', 'Estacioná', 'Cocheras cerca de tu destino', '3 con lugar a menos de 300 metros.', [['Garage Corrientes', '$ 3.500/h · 120 m'], ['Playa Uruguay', '$ 2.900/h · 250 m'], ['Estacionamiento Lavalle', 'Completo']], 'Reservar lugar', 'Ver mapa'],

    // ── Educación ──
    'online-course-e-learning': ['curso', 'Aprendé', 'Curso: Excel para el trabajo', 'Lección 5 de 12: tablas dinámicas.', [42, '5 de 12 lecciones', 'Certificado al terminar']],
    'educational-app': ['curso', 'Escuelita', 'Matemática · 2.º año', 'Hoy toca: ecuaciones de primer grado.', [60, '12 de 20 ejercicios', 'Racha de 4 días']],
    'coding-bootcamp': ['curso', 'Código Sur', 'Bootcamp Full Stack', 'Semana 6 de 16: APIs con Node.js.', [37, 'Semana 6 de 16', 'Próxima clase: mar 19 h'], 'Ir a la clase', 'Ver el programa'],
    'lms-learning-management-system': ['curso', 'Campus', 'Seguridad e Higiene · Comisión B', '3 alumnos no entregaron el trabajo práctico 2.', [78, '32 de 41 entregas', 'Cierra el viernes'], 'Corregir entregas', 'Ver alumnos'],
    'language-learning-app': ['curso', 'Idiomas Ya', 'Inglés · Nivel A2', 'Lección de hoy: pedir en un restaurante.', [55, 'Unidad 6 de 11', 'Racha de 12 días']],
    'kids-learning-abc-math': ['curso', 'Chiquis', '¡Aprendamos a sumar!', 'Juntá las frutas y contá cuántas hay.', [30, '3 de 10 estrellas', 'De 4 a 6 años'], 'Jugar y aprender', 'Para familias'],
    'music-instrument-learning': ['curso', 'Acordes', 'Guitarra para principiantes', 'Hoy: acordes de La menor y Mi.', [25, 'Lección 4 de 16', '15 min por día']],
    'micro-credentials-badges-platform': ['curso', 'Insignia', 'Insignia: Atención al cliente', 'Te faltan 2 módulos para obtenerla y compartirla en LinkedIn.', [67, '4 de 6 módulos', 'Verificable'], 'Continuar', 'Mis insignias'],
    'flashcard-study-tool': ['curso', 'Repasá', 'Mazo: Anatomía I', '24 tarjetas para repasar hoy.', [48, '120 de 250 aprendidas', 'Repaso espaciado'], 'Estudiar ahora', 'Mis mazos'],
    'coding-challenge-practice': ['curso', 'Desafíos', 'Desafío: invertir una lista', 'Dificultad media · 20 minutos.', [58, '35 de 60 resueltos', 'Racha de 6 días'], 'Resolver', 'Ranking'],
    'study-together-virtual-coworking': ['habito', 'Estudiemos', 'Sala: Final de Contabilidad', '14 personas estudiando con la cámara prendida.', ['50:00', 'bloque de foco', 35], 'Entrar a la sala', 'Mis horas'],
    'research-lab-university-department': ['ciencia', 'Lab. de Neurociencias', 'Laboratorio de Neurociencias · UBA', 'Buscamos becarios doctorales para 2027.', [['Memoria y sueño', 'Línea de investigación'], ['12 publicaciones', 'Último año'], ['Seminario abierto', 'Jue 18 h']], 'Ver publicaciones', 'Becas'],

    // ── Contenidos, medios y documentación ──
    'news-media-platform': ['lectura', 'Noticias al Día', 'Últimas noticias', 'Actualizado hace 5 minutos.', [['Economía: suben las ventas minoristas', 'Hace 12 min'], ['Deportes: el clásico del domingo', 'Hace 40 min'], ['Clima: alerta por tormentas', 'Hace 1 h']], 'Leer', 'Suscribirme'],
    'magazine-blog': ['lectura', 'Revista Casa', 'Cómo ganar luz en un monoambiente', '6 min de lectura · Decoración.', [['Colores que agrandan', 'Decoración'], ['Plantas de interior fáciles', 'Plantas'], ['Muebles plegables', 'Ideas']], 'Leer la nota', 'Suscribirme'],
    'newsletter-platform': ['lectura', 'Carta Semanal', 'Edición 84: lo que aprendí vendiendo online', '12.400 suscriptores · sale los martes.', [['Tasa de apertura', '52%'], ['Nuevos esta semana', '+310'], ['Próximo envío', 'Martes 8 h']], 'Suscribirme gratis', 'Ediciones anteriores'],
    'knowledge-base-documentation': ['lectura', 'Ayuda', '¿En qué te ayudamos?', 'Buscá en 180 artículos o escribinos.', [['Cómo cambiar la contraseña', 'Cuenta'], ['Medios de pago aceptados', 'Pagos'], ['Seguimiento de envíos', 'Envíos']], 'Buscar', 'Contactar soporte'],
    'wiki-encyclopedia': ['lectura', 'Enciclopedia', 'Río de la Plata', 'Estuario formado por los ríos Paraná y Uruguay.', [['Geografía', 'Sección 1'], ['Historia', 'Sección 2'], ['Referencias', '48 fuentes']], 'Leer artículo', 'Editar'],
    'academic-journal-scholarly-publishing': ['lectura', 'Revista de Ciencias Sociales', 'Vol. 18, n.º 2 (2026)', 'Revista con referato · acceso abierto.', [['Trabajo informal en el AMBA', 'Artículo'], ['Migración y vivienda', 'Artículo'], ['Envíos para el próximo número', 'Hasta el 1/3']], 'Leer el número', 'Enviar un artículo'],
    'patent-ip-database': ['lectura', 'Patentes', 'Resultados para "envase biodegradable"', '37 patentes y 5 marcas registradas.', [['AR112233 · Envase de almidón', 'Vigente'], ['AR109876 · Film compostable', 'Vigente'], ['AR098765 · Bandeja de fibra', 'Vencida']], 'Ver detalle', 'Buscar'],
    'bookmark-read-later': ['lectura', 'Guardado', 'Para leer después', '14 artículos guardados · 2 h de lectura.', [['Guía de fotografía con el celular', '8 min'], ['Cómo armar un presupuesto', '6 min'], ['Recetas de viandas', '5 min']], 'Leer ahora', 'Etiquetas'],

    // ── Audio y video ──
    'music-streaming': ['media', 'Sónica', 'Lo nuevo del rock nacional', 'Lista actualizada todos los viernes.', ['Canción del verano', 'Banda del Sur · 3:42', 40]],
    'video-streaming-ott': ['media', 'Pantalla', 'Serie: El Puerto · T2', 'Capítulo 3: La tormenta.', ['El Puerto · Cap. 3', '48 min · Drama', 62], 'Seguir viendo', 'Mi lista'],
    'podcast-platform': ['media', 'Charlas', 'Emprender sin plata', 'Episodio 42: cómo conseguir los primeros clientes.', ['Ep. 42 · Primeros clientes', '38 min', 25], 'Escuchar', 'Suscribirme'],
    'white-noise-ambient-sound': ['media', 'Calma', 'Lluvia sobre el techo', 'Temporizador: se apaga en 45 minutos.', ['Lluvia suave', 'Bucle · 45 min', 30], 'Reproducir', 'Mezclar sonidos'],
    'meditation-mindfulness': ['media', 'Respirá', 'Meditación para dormir', '10 minutos guiados para bajar un cambio.', ['Soltar el día', 'Guiada · 10 min', 0], 'Empezar', 'Mis sesiones'],
    'voice-recorder-memo': ['media', 'Grabá', 'Reunión con proveedor', 'Grabada hoy · transcripción lista.', ['Reunión con proveedor', '12:48 · hoy 10:15', 55], 'Escuchar', 'Ver transcripción'],
    'music-creation-beat-maker': ['media', 'Beat', 'Proyecto: cumbia 98 BPM', '4 pistas · bombo, redoblante, güiro y bajo.', ['Loop principal', '98 BPM · 8 compases', 45], 'Grabar pista', 'Exportar'],
    'short-video-editor': ['media', 'Clip', 'Video para reels', '3 cortes · música y subtítulos automáticos.', ['Reel del local', '0:28 · 9:16', 70], 'Exportar', 'Agregar texto'],

    // ── Eventos y cultura ──
    'wedding-event-planning': ['evento', 'Sí, quiero', 'Casamiento de Flor y Tomi', 'Salón Los Álamos · confirmaron 118 de 150 invitados.', ['14', 'MAR', 'Sábado 20 h'], 'Confirmar asistencia', 'Lista de regalos'],
    'event-management': ['evento', 'Eventia', 'Jornada de Emprendedores', '320 inscriptos · 12 charlas · 2 salas.', ['22', 'OCT', 'Centro Cultural Kirchner'], 'Inscribirme', 'Ver cronograma'],
    'conference-symposium-landing-page': ['evento', 'Congreso Datos', 'Congreso de Ciencia de Datos 2026', '3 días, 40 oradores y talleres prácticos.', ['05', 'NOV', 'Facultad de Ingeniería'], 'Comprar entrada', 'Ver oradores'],
    'theater-cinema': ['evento', 'Teatro Colonia', 'Obra: La casa de Bernarda', 'Funciones de jueves a domingo · 90 min.', ['18', 'SEP', 'Jueves 20:30'], 'Comprar entradas', 'Cartelera'],
    'museum-gallery': ['evento', 'Museo del Sur', 'Muestra: Pintores del Litoral', 'Entrada gratuita los miércoles.', ['01', 'AGO', 'Hasta el 30/11'], 'Reservar visita', 'Ver la colección'],
    'ticketing-box-office': ['evento', 'Entradas Ya', 'Recital en el Luna Park', 'Últimas 80 entradas en campo.', ['29', 'NOV', 'Puertas 19 h'], 'Comprar entradas', 'Mapa de ubicaciones'],
    'local-events-discovery': ['evento', 'Qué Hacer', 'Feria de diseño en San Telmo', 'Gratis · al aire libre · 60 puestos.', ['12', 'OCT', 'Domingo 11 a 19 h'], 'Me interesa', 'Más eventos'],
    'sports-team-club': ['evento', 'Club Atlético Norte', 'Próximo partido: Norte vs. Unión', 'Socios con cuota al día entran gratis.', ['07', 'SEP', 'Domingo 15:30'], 'Comprar entrada', 'Hacete socio'],

    // ── Estudios y servicios profesionales ──
    'b2b-service': ['estudio', 'Soluciones Pyme', 'Consultoría para pymes industriales', 'Ordenamos costos, procesos y tableros de gestión.', [['Diagnóstico inicial', '2 semanas'], ['Tablero de costos', 'Mensual'], ['Capacitación', 'In company']], 'Agendar reunión', 'Casos de clientes'],
    'creative-agency': ['estudio', 'Estudio Norte', 'Branding para marcas que empiezan', 'Identidad, packaging y redes.', [['Identidad visual', 'Branding'], ['Packaging', 'Diseño'], ['Contenido para redes', 'Social']], 'Contanos tu proyecto', 'Ver trabajos'],
    'marketing-agency': ['estudio', 'Crecer', 'Campañas que traen clientes', 'Pauta en Meta y Google, contenido y reportes mensuales.', [['Pauta digital', 'Meta y Google'], ['Contenido', 'Redes'], ['Reportes', 'Mensuales']], 'Pedir propuesta', 'Casos'],
    'portfolio-personal': ['estudio', 'Ana Ríos', 'Diseñadora UX/UI', 'Diseño productos digitales claros y fáciles de usar.', [['App de turnos', 'Caso de estudio'], ['Tienda de ropa', 'Rediseño'], ['Panel de logística', 'UX research']], 'Ver proyectos', 'Descargar CV'],
    'photography-studio': ['estudio', 'Luz Estudio', 'Fotografía de producto y retratos', 'Estudio propio en Villa Crespo.', [['Producto con fondo blanco', 'Por foto'], ['Retrato profesional', 'Sesión'], ['Casamientos', 'Cobertura']], 'Reservar sesión', 'Ver galería'],
    'construction-architecture': ['estudio', 'Obra Firme', 'Construcción y reformas', 'Obras llave en mano con dirección profesional.', [['Casas', 'Llave en mano'], ['Reformas', 'Cocinas y baños'], ['Dirección de obra', 'Arquitectos']], 'Pedir presupuesto', 'Obras realizadas'],
    'architecture-interior': ['estudio', 'Estudio Planta', 'Arquitectura e interiores', 'Proyectos de vivienda y locales comerciales.', [['Casa en Pilar', '240 m²'], ['Local en Palermo', '80 m²'], ['Departamento', 'Reforma']], 'Agendar reunión', 'Ver proyectos'],
    'home-decoration-interior-design': ['estudio', 'Nido Deco', 'Asesoría de decoración', 'Te armamos el ambiente con lo que ya tenés y lo que falta.', [['Living', 'Asesoría online'], ['Dormitorio', 'Proyecto completo'], ['Lista de compras', 'Incluida']], 'Pedir asesoría', 'Ver ambientes'],
    'insurance-platform': ['estudio', 'Asegurá', 'Cotizá el seguro de tu auto', 'Compará 6 aseguradoras en 2 minutos.', [['Responsabilidad civil', 'desde $ 28.000/mes'], ['Terceros completo', 'desde $ 41.000/mes'], ['Todo riesgo', 'desde $ 79.000/mes']], 'Cotizar ahora', 'Hablar con un asesor'],
    'agriculture-farm-tech': ['panel', 'Campo', 'Lote 7 · Soja', 'Humedad del suelo baja: conviene regar esta semana.', [['Humedad', '18%'], ['Lluvia 7 días', '4 mm'], ['Rinde estimado', '3,2 t/ha']], 'Ver lotes', 'Informe'],
    'logistics-delivery': ['movilidad', 'Envío Rápido', 'Seguí tu envío', 'Tu paquete está en camino: llega hoy entre 14 y 18 h.', [['Retirado en el depósito', '8:10'], ['En distribución', '11:45'], ['Entregado', 'Pendiente']], 'Ver en el mapa', 'Cambiar dirección'],
    'ride-hailing-transportation': ['movilidad', 'Viajá', '¿A dónde vas?', 'Autos disponibles cerca: llega en 4 min.', [['Estándar', '$ 5.800 · 4 min'], ['Confort', '$ 7.400 · 6 min'], ['Moto', '$ 3.200 · 3 min']], 'Pedir viaje', 'Programar'],
    'public-transit-guide': ['movilidad', 'Colectivo', 'De Palermo a Constitución', 'La mejor opción: subte D y línea C · 32 min.', [['Subte D', '4 min'], ['Combinación a línea C', '6 min'], ['Colectivo 12', '9 min']], 'Ver recorrido', 'Mis paradas'],

    // ── Finanzas y pagos ──
    'banking-traditional-finance': ['finanzas', 'Banco Pampa', 'Caja de ahorro en pesos', 'Tu sueldo se acreditó hoy.', ['$ 1.245.300', 'Saldo disponible']],
    'fintech-crypto': ['finanzas', 'Billetera', 'Tu cuenta', 'Tus pesos rinden 32% anual. Comprá o vendé dólares al instante.', ['$ 486.900', 'Disponible · rindiendo'], 'Transferir', 'Invertir'],
    'personal-finance-tracker': ['finanzas', 'Mis Cuentas', 'Presupuesto de septiembre', 'Gastaste el 62% del mes. Comida afuera viene alta.', ['$ 380.000', 'disponibles hasta fin de mes'], 'Cargar gasto', 'Ver categorías'],
    'expense-splitter-bill-split': ['finanzas', 'Dividí', 'Viaje a Mar del Plata', '4 amigos · 18 gastos cargados.', ['Martín te debe $ 24.500', 'Saldo del grupo'], 'Saldar deuda', 'Nuevo gasto'],
    'invoice-billing-tool': ['finanzas', 'Cobrá', 'Facturación de septiembre', '3 facturas vencidas por cobrar.', ['$ 2.840.000', 'Facturado este mes'], 'Nueva factura', 'Cobros pendientes'],

    // ── Gobierno y trámites ──
    'government-public-service': ['tramite', 'Municipio de Villa Verde', 'Trámites en línea', 'Hacelos desde tu casa, sin filas.', [['Licencia de conducir', 'Con turno'], ['Habilitación comercial', 'En línea'], ['Reclamo por alumbrado', 'En línea']]],
    'government-portal-civic-services': ['tramite', 'Tu Ciudad', 'Servicios al vecino', 'Seguí tus reclamos y pagá tasas en un solo lugar.', [['Pagar ABL', 'Vence el 10'], ['Reclamo n.º 4512', 'En curso'], ['Poda de árboles', 'Pedir']], 'Hacer un reclamo', 'Pagar tasas'],

    // ── Ciencia e investigación ──
    'biotech-life-sciences': ['ciencia', 'BioGen', 'Terapias biológicas para enfermedades raras', 'Dos desarrollos en fase clínica.', [['Programa BG-101', 'Fase II'], ['Programa BG-204', 'Fase I'], ['Plataforma de anticuerpos', 'Preclínica']], 'Ver ensayos clínicos', 'Trabajá con nosotros'],
    'space-tech-aerospace': ['ciencia', 'Orbital', 'Satélites de observación', 'Próximo lanzamiento: marzo de 2027.', [['Constelación', '6 satélites'], ['Resolución', '1 m por píxel'], ['Revisita', 'Cada 12 h']], 'Ver misiones', 'Datos para empresas'],
    'citizen-science-platform': ['ciencia', 'Contá Aves', 'Censo de aves urbanas', 'Subí tus avistajes: ya van 18.400 registros.', [['Hornero', '2.340 avistajes'], ['Benteveo', '1.980 avistajes'], ['Zorzal colorado', '1.120 avistajes']], 'Cargar avistaje', 'Ver el mapa'],
    'biohacking-longevity-app': ['habito', 'Longevo', 'Tu puntaje de hoy', 'Dormiste 7 h 40 y caminaste 9.000 pasos.', ['82', 'puntaje de recuperación', 82], 'Ver recomendaciones', 'Mis biomarcadores'],

    // ── Comunidades y mensajería ──
    'social-media-app': ['comunidad', 'Ronda', 'Novedades de tus amigos', '3 publicaciones nuevas desde ayer.', [['Caro', 'Primer día en el trabajo nuevo 🎉'], ['Nico', '¡Felicitaciones! Contá cómo te fue.']], 'Comentar', 'Publicar'],
    'creator-economy-platform': ['comunidad', 'Fans', 'Contenido exclusivo de Lu Cocina', '1.240 suscriptores · recetas nuevas cada semana.', [['Lu Cocina', 'Subí la receta de ñoquis del 29 🥔'], ['Pato', '¡La hago este domingo!']], 'Suscribirme', 'Ver planes'],
    'membership-community': ['comunidad', 'Club Emprende', 'Comunidad de emprendedores', 'Encuentro online el jueves: cómo fijar precios.', [['Vale', '¿Cómo calculan el costo de envío?'], ['Diego', 'Te paso la planilla que uso yo.']], 'Hacerme miembro', 'Ver beneficios'],
    'forum-discussion-board': ['comunidad', 'Foro Autos', '¿Conviene GNC en un auto 2018?', '42 respuestas · último mensaje hace 10 min.', [['Raúl', 'Si hacés más de 1.500 km por mes, sí.'], ['Sole', 'Ojo con el baúl: perdés lugar.']], 'Responder', 'Nuevo tema'],
    'q-a-community-platform': ['comunidad', 'Preguntá', '¿Cómo calculo el IVA de una factura?', '3 respuestas · 1 aceptada.', [['Pregunta', 'Tengo el total con IVA, ¿cómo saco el neto?'], ['Respuesta aceptada', 'Dividí el total por 1,21.']], 'Responder', 'Hacer una pregunta'],
    'chat-messaging-app': ['comunidad', 'Charlá', 'Familia', 'Mamá está escribiendo…', [['Mamá', '¿Vienen el domingo a comer?'], ['Vos', '¡Sí! Llevo el postre.']], 'Escribir', 'Llamar'],
    'dating-app': ['comunidad', 'Flechazo', 'Tenés un match nuevo', 'A Paula también le gusta el trekking.', [['Paula', '¡Hola! ¿Fuiste al Champaquí?'], ['Vos', 'Sí, el verano pasado. ¿Vos?']], 'Responder', 'Ver perfil'],
    'anonymous-community-confession': ['comunidad', 'Anónimo', 'Confesiones de la facultad', 'Publicá sin nombre. Moderamos cada mensaje.', [['Anónimo', 'Rendí el final sin estudiar y me saqué un 8.'], ['Anónimo', 'Contame tu secreto 😅']], 'Comentar', 'Publicar anónimo'],
    'couple-relationship-app': ['comunidad', 'Nosotros', 'Plan del finde', 'Cumplen 3 años juntos el sábado.', [['Juan', '¿Cena en el lugar de la primera cita?'], ['Vos', '¡Sí! Reservo para las 21.']], 'Responder', 'Nuestras fechas'],
    'testimonial-social-proof-widget': ['comunidad', 'Opiniones', 'Lo que dicen nuestros clientes', '4,9 ★ promedio en 230 opiniones.', [['Laura G.', 'Me asesoraron por WhatsApp y llegó en 2 días.'], ['Pablo R.', 'Muy buena atención postventa.']], 'Ver todas', 'Sumá tu opinión'],
    'pet-tech-app': ['habito', 'Mascotín', 'Rocco · 4 años', 'Vacuna antirrábica en 12 días. Hoy caminó 5 km.', ['5,2 km', 'caminados hoy', 80], 'Registrar paseo', 'Libreta sanitaria'],

    // ── Apps de seguimiento personal ──
    'mental-health-app': ['habito', 'Bienestar', '¿Cómo te sentís hoy?', 'Registraste tu ánimo 6 días seguidos.', ['6', 'días registrando', 85], 'Registrar ánimo', 'Hablar con un profesional'],
    'habit-tracker': ['habito', 'Rachas', 'Leer 20 minutos', 'Vas 14 días seguidos. ¡No cortes la racha!', ['14', 'días seguidos', 70], 'Marcar como hecho', 'Mis hábitos'],
    'mood-tracker': ['habito', 'Ánimo', 'Esta semana', 'Tus mejores días coinciden con salir a caminar.', ['7,4', 'ánimo promedio', 74], 'Registrar ánimo', 'Ver patrones'],
    'sleep-tracker': ['habito', 'Dormí Bien', 'Anoche dormiste', 'Te acostaste 40 minutos más tarde que tu promedio.', ['6 h 50', 'de sueño', 76], 'Ver fases', 'Rutina de noche'],
    'period-cycle-tracker': ['habito', 'Ciclo', 'Día 12 de tu ciclo', 'Tu próximo período llegaría en 16 días.', ['12', 'día del ciclo', 43], 'Registrar síntomas', 'Calendario'],
    'medication-pill-reminder': ['habito', 'Pastillero', 'Toma de las 20:00', 'Enalapril 10 mg · te quedan 6 comprimidos.', ['2 de 3', 'tomas de hoy', 66], 'Marcar como tomada', 'Posponer'],
    'water-hydration-reminder': ['habito', 'Agüita', 'Hoy tomaste', 'Te faltan 3 vasos para tu objetivo.', ['1,3 L', 'de 2 L', 65], 'Sumar un vaso', 'Recordatorios'],
    'fasting-intermittent-timer': ['habito', 'Ayuno', 'Ayuno 16:8 en curso', 'Podés volver a comer a las 12:00.', ['13:20', 'horas de ayuno', 83], 'Terminar ayuno', 'Historial'],
    'running-cycling-gps': ['habito', 'Kilómetros', 'Salida de hoy', 'Ritmo promedio 5:32 min/km por los bosques de Palermo.', ['8,4 km', 'recorridos', 84], 'Iniciar actividad', 'Mis rutas'],
    'plant-care-tracker': ['habito', 'Verdecito', 'Potus del living', 'Toca regar hoy. La próxima fertilización es en 9 días.', ['3', 'plantas para regar hoy', 40], 'Marcar riego', 'Mis plantas'],
    'book-reading-tracker': ['habito', 'Lecturas', 'Rayuela · Julio Cortázar', 'Vas por la página 214 de 600.', ['214', 'páginas leídas', 36], 'Actualizar página', 'Mi biblioteca'],
    'parenting-baby-tracker': ['habito', 'Bebé', 'Día de Olivia', 'Última toma hace 2 h 10 min.', ['7', 'tomas hoy', 70], 'Registrar toma', 'Pañales y sueño'],
    'diary-journal-app': ['habito', 'Diario', 'Martes 12 de septiembre', '¿Qué fue lo mejor de tu día?', ['32', 'días escribiendo', 64], 'Escribir', 'Entradas anteriores'],
    'timer-pomodoro': ['habito', 'Foco', 'Pomodoro 3 de 4', 'Después de este bloque te toca un descanso largo.', ['18:42', 'para terminar', 25], 'Pausar', 'Tareas'],
    'alarm-world-clock': ['habito', 'Reloj', 'Alarma de las 7:00', 'Madrid 12:00 · Nueva York 6:00.', ['7:00', 'de lunes a viernes', 100], 'Nueva alarma', 'Reloj mundial'],
    'weather-app': ['habito', 'Clima', 'Buenos Aires', 'Parcialmente nublado. Lluvias por la tarde.', ['17 °C', 'máx. 21 · mín. 12', 55], 'Ver pronóstico', 'Alertas'],
    'calendar-scheduling-app': ['herramienta', 'Agenda', 'Hoy, jueves', '3 eventos · el primero en 40 minutos.', [['Reunión con proveedores', '10:00'], ['Almuerzo con Sofi', '13:00'], ['Dentista', '17:30']], 'Nuevo evento', 'Semana'],
    'family-calendar-chores': ['herramienta', 'En Casa', 'Tareas de la semana', 'Lucas lleva 4 de 5 tareas hechas.', [['Sacar la basura', 'Lucas · Hecho'], ['Lavar los platos', 'Mora · Hoy'], ['Compras', 'Papá · Sábado']], 'Nueva tarea', 'Calendario'],
    'notes-writing-app': ['herramienta', 'Notas', 'Ideas para el local', 'Editado hace 5 minutos.', [['Horarios de verano', 'Nota'], ['Proveedores de envases', 'Lista'], ['Promo de apertura', 'Borrador']], 'Nueva nota', 'Carpetas'],

    // ── Herramientas y apps de uso diario ──
    'password-manager': ['herramienta', 'Bóveda', 'Tus contraseñas', '2 contraseñas son débiles y 1 se repite.', [['Banco', 'Segura'], ['Email', 'Repetida'], ['Streaming', 'Débil']], 'Revisar ahora', 'Generar contraseña'],
    'vpn-privacy-tool': ['herramienta', 'Túnel', 'Conectado', 'Tu conexión está cifrada · servidor en San Pablo.', [['Servidor', 'San Pablo'], ['IP visible', 'Oculta'], ['Tiempo', '1 h 12 min']], 'Desconectar', 'Cambiar servidor'],
    'emergency-sos-safety': ['herramienta', 'Alerta', 'Botón de emergencia', 'Mantené apretado 3 segundos para avisar a tus contactos.', [['Contactos de emergencia', '3'], ['Compartir ubicación', 'Activado'], ['Emergencias', '911']], 'Enviar SOS', 'Mis contactos'],
    'scanner-document-manager': ['herramienta', 'Escaneá', 'Documentos recientes', 'Texto reconocido: podés buscar dentro de los PDF.', [['DNI frente y dorso', 'PDF · 2 páginas'], ['Factura de luz', 'PDF · 1 página'], ['Contrato firmado', 'PDF · 6 páginas']], 'Escanear', 'Compartir'],
    'file-manager-transfer': ['herramienta', 'Enviá', 'Transferencia lista', '3 archivos · 1,2 GB · el link vence en 7 días.', [['Video_final.mp4', '980 MB'], ['Fotos.zip', '210 MB'], ['Presupuesto.pdf', '2 MB']], 'Copiar link', 'Enviar por email'],
    'email-client': ['herramienta', 'Correo', 'Bandeja de entrada', '4 sin leer · 1 marcado como importante.', [['Proveedor: factura de agosto', '10:12'], ['Equipo: agenda del lunes', '9:40'], ['Banco: resumen de tarjeta', 'Ayer']], 'Redactar', 'Carpetas'],
    'translator-app': ['herramienta', 'Traducí', 'Español → Inglés', '"¿Dónde queda la estación de tren?"', [['Traducción', 'Where is the train station?'], ['Pronunciación', 'Escuchar'], ['Modo conversación', 'Disponible']], 'Traducir', 'Cámara'],
    'calculator-unit-converter': ['herramienta', 'Conversor', 'Pulgadas a centímetros', '55 pulgadas = 139,7 cm.', [['55 in', '139,7 cm'], ['1 libra', '0,45 kg'], ['1 galón', '3,79 L']], 'Convertir', 'Historial'],
    'photo-editor-filters': ['herramienta', 'Retoque', 'Foto del producto', 'Fondo quitado · brillo +12.', [['Recortar', '1:1'], ['Brillo', '+12'], ['Filtro', 'Natural']], 'Guardar', 'Deshacer'],
    'drawing-sketching-canvas': ['herramienta', 'Lienzo', 'Boceto de logo', '4 capas · pincel lápiz HB.', [['Capa: contorno', 'Visible'], ['Capa: color', 'Visible'], ['Capa: fondo', 'Oculta']], 'Exportar', 'Pinceles'],
    'meme-sticker-maker': ['herramienta', 'Stickers', 'Pack del grupo', '12 stickers listos para WhatsApp.', [['Sticker: "Llego en 5"', 'Listo'], ['Sticker: "Mañana arranco"', 'Listo'], ['Sticker nuevo', 'Editar']], 'Agregar a WhatsApp', 'Crear sticker'],
    'ai-photo-avatar-generator': ['herramienta', 'Avatar', 'Tus avatares', 'Subiste 10 fotos: generamos 24 estilos.', [['Estilo ilustración', '8 imágenes'], ['Estilo foto de perfil', '8 imágenes'], ['Estilo acuarela', '8 imágenes']], 'Descargar', 'Probar otro estilo'],
    'link-in-bio-page-builder': ['herramienta', 'Mis Links', '@luciacocina', '5 links · 1.240 clics esta semana.', [['Tienda online', '640 clics'], ['Recetas en YouTube', '410 clics'], ['WhatsApp', '190 clics']], 'Agregar link', 'Ver estadísticas'],
    'resume-cv-builder': ['herramienta', 'Mi CV', 'Tu CV · plantilla Clásica', 'Completo al 80%: falta la sección de idiomas.', [['Experiencia', 'Completa'], ['Estudios', 'Completa'], ['Idiomas', 'Falta']], 'Descargar PDF', 'Cambiar plantilla'],
    'digital-signage-kiosk': ['herramienta', 'Pantallas', 'Pantallas del local', '4 pantallas encendidas · contenido de la promo de otoño.', [['Vidriera', 'Promo otoño'], ['Caja', 'Medios de pago'], ['Entrada', 'Horarios']], 'Cambiar contenido', 'Programar'],
    'wallpaper-theme-app': ['herramienta', 'Fondos', 'Colección: Patagonia', '24 fondos en alta resolución.', [['Glaciar Perito Moreno', '4K'], ['Fitz Roy al amanecer', '4K'], ['Lago Nahuel Huapi', '4K']], 'Aplicar fondo', 'Descargar'],

    // ── Juegos ──
    'gaming': ['juego', 'Arena', 'Temporada 4', 'Nuevo mapa y torneo por equipos el sábado.', ['Nivel 38', '2.450 puntos de temporada', 62], 'Jugar', 'Torneos'],
    'casual-puzzle-game': ['juego', 'Encajá', 'Nivel 112', 'Combiná 3 piezas iguales en 20 movimientos.', ['112', 'nivel actual', 45]],
    'trivia-quiz-game': ['juego', 'Trivia Ya', 'Categoría: Historia argentina', 'Respondé 10 preguntas y sumá monedas.', ['7 de 10', 'respuestas correctas', 70]],
    'card-board-game': ['juego', 'Truco Online', 'Partida a 30 puntos', 'Vos y tu compañero van 18 a 12.', ['18 a 12', 'tanteador', 60], 'Jugar mano', 'Invitar amigos'],
    'idle-clicker-game': ['juego', 'Fábrica', 'Tu fábrica de alfajores', 'Producís 1.200 alfajores por segundo.', ['4,8 M', 'alfajores producidos', 48], 'Mejorar máquina', 'Logros'],
    'word-crossword-game': ['juego', 'Palabrita', 'Palabra del día', 'Adiviná la palabra de 5 letras en 6 intentos.', ['3 de 6', 'intentos usados', 50], 'Seguir jugando', 'Estadísticas'],
    'arcade-retro-game': ['juego', 'Pixel', 'Nave 8 bits', 'Récord del día: 98.300 puntos.', ['45.200', 'puntos · vida 3', 46], 'Jugar', 'Récords'],

    // ── NFT, Web3 y cripto ──
    'nft-web3-platform': ['tienda', 'Colección', 'Obra digital "Pampa #12"', 'Edición única · incluye certificado de autoría en blockchain.', ['0,15 ETH', 'Conectá tu billetera para ofertar'], 'Ofertar', 'Ver colección'],
    'generative-art-platform': ['herramienta', 'Algoritmo', 'Serie: Ríos', 'Semilla 4821 · 3 variaciones generadas.', [['Variación A', 'Guardada'], ['Variación B', 'Nueva'], ['Variación C', 'Nueva']], 'Generar otra', 'Exportar'],
  };

  // Familia neutra para paletas sin rubro
  const NEUTRO = ['negocio', 'Tu Empresa', 'Soluciones para tu negocio', 'Atención personalizada y respuesta en 24 horas.', [['Servicio principal', 'Consultá'], ['Planes a medida', 'Consultá'], ['Soporte', 'Lun a vie']]];

  function datos(id) {
    const r = R[id] || NEUTRO;
    const [fam, marca, h, p, w, b, g] = r;
    const F = FAMILIAS[fam];
    return { fam, familia: F.n, t: F.t, marca, h, p, w, b: b || F.b, g: g || F.g, neutro: !R[id] };
  }
  return { datos, FAMILIAS, ids: () => Object.keys(R) };
})();

// Datos 100% inventados para una copia local de demostración. No toca ninguna base real.
const B = (process.env.SDV4_BACKEND || '.') + '/';
const mongoose = require(B + 'node_modules/mongoose');
const bcrypt = require(B + 'node_modules/bcryptjs');
const M = require(B + 'models');
(async () => {
  if (!/127\.0\.0\.1:27099/.test(process.env.MONGO_URI || '')) throw new Error('MONGO_URI no es la base local de demo');
  await mongoose.connect(process.env.MONGO_URI);
  await M.Admin.deleteMany({}); await M.Admin.create({ email: 'demo@demo.test', password: await bcrypt.hash('demo-123456', 10) });
  const cat = [['Consulta y diagnóstico', 'Consultas', 25000, '30 min'], ['Limpieza dental', 'Preventiva', 38000, '45 min'], ['Blanqueamiento', 'Estética', 120000, '60 min'], ['Endodoncia', 'Endodoncia', 150000, '90 min'],
    ['Obturación (arreglo)', 'Operatoria', 45000, '45 min'], ['Corona de porcelana', 'Prótesis', 280000, '60 min'], ['Implante unitario', 'Implantes', 950000, '90 min'], ['Ortodoncia (control mensual)', 'Ortodoncia', 55000, '30 min']];
  await M.Tratamiento.deleteMany({}); const T = {};
  for (const [nombre, categoria, precio, duracion] of cat) T[nombre] = await M.Tratamiento.create({ nombre, categoria, precio, duracion, visible: true });
  const ya = (d, h, m = 0) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, m, 0, 0); return x; };
  const od = (o) => Object.fromEntries(Object.entries(o).map(([k, s]) => [k, { status: s, treatments: [] }]));
  const pacs = [
    { nombre: 'Lucía', apellido: 'Fernández', dni: '30111222', sexo: 'F', fechaNac: new Date('1988-04-12'), telefono: '1155550101', email: 'lucia.demo@example.test', mutual: 'Particular', motivoConsulta: 'Reposición de una pieza perdida',
      odontograma: od({ 36: 'implant', 46: 'restoration', 18: 'missing', 28: 'missing', 24: 'treatment', 11: 'attention', 21: 'restoration', 47: 'restoration' }),
      tratamientos: [{ tratamiento: T['Implante unitario']._id, estado: 'en_curso', precio: 950000, piezas: [36] }, { tratamiento: T['Endodoncia']._id, estado: 'en_curso', precio: 150000, piezas: [24] }, { tratamiento: T['Obturación (arreglo)']._id, estado: 'completado', precio: 45000, piezas: [46] }],
      pagos: [{ monto: 400000, concepto: 'Seña implante' }, { monto: 45000, concepto: 'Obturación' }] },
    { nombre: 'Martín', apellido: 'Gómez', dni: '28999888', sexo: 'M', fechaNac: new Date('1979-09-30'), telefono: '1155550102', email: 'martin.demo@example.test', mutual: 'Particular', motivoConsulta: 'Control y limpieza', odontograma: od({ 16: 'restoration', 26: 'restoration', 38: 'missing' }),
      tratamientos: [{ tratamiento: T['Limpieza dental']._id, estado: 'completado', precio: 38000, piezas: [] }], pagos: [{ monto: 38000, concepto: 'Limpieza' }] },
    { nombre: 'Sofía', apellido: 'Ramírez', dni: '35444111', sexo: 'F', fechaNac: new Date('1995-01-22'), telefono: '1155550103', email: 'sofia.demo@example.test', mutual: 'Particular', motivoConsulta: 'Blanqueamiento', odontograma: od({}),
      tratamientos: [{ tratamiento: T['Blanqueamiento']._id, estado: 'planificado', precio: 120000, piezas: [] }], pagos: [] },
    { nombre: 'Julián', apellido: 'Acosta', dni: '33222555', sexo: 'M', fechaNac: new Date('1991-06-05'), telefono: '1155550104', email: 'julian.demo@example.test', mutual: 'Particular', motivoConsulta: 'Corona en molar', odontograma: od({ 46: 'treatment', 36: 'restoration' }),
      tratamientos: [{ tratamiento: T['Corona de porcelana']._id, estado: 'en_curso', precio: 280000, piezas: [46] }], pagos: [{ monto: 100000, concepto: 'Anticipo corona' }] },
    { nombre: 'Camila', apellido: 'Torres', dni: '40111999', sexo: 'F', fechaNac: new Date('2001-11-18'), telefono: '1155550105', email: 'camila.demo@example.test', mutual: 'Particular', motivoConsulta: 'Ortodoncia', odontograma: od({}),
      tratamientos: [{ tratamiento: T['Ortodoncia (control mensual)']._id, estado: 'en_curso', precio: 55000, piezas: [] }], pagos: [{ monto: 55000, concepto: 'Control mensual' }] },
    { nombre: 'Diego', apellido: 'Herrera', dni: '27555666', sexo: 'M', fechaNac: new Date('1976-03-09'), telefono: '1155550106', email: 'diego.demo@example.test', mutual: 'Particular', motivoConsulta: 'Dolor en una muela', odontograma: od({ 26: 'attention' }),
      tratamientos: [], pagos: [] },
  ];
  await M.Paciente.deleteMany({}); const P = [];
  for (const d of pacs) { const p = new M.Paciente(d); p.calcularDeuda(); await p.save(); P.push(p); }
  const nom = p => `${p.nombre} ${p.apellido}`;
  const tur = [[0, 9, 0, 0, 'Consulta y diagnóstico', 'completado'], [0, 10, 30, 1, 'Limpieza dental', 'confirmado'], [0, 12, 0, 5, 'Consulta y diagnóstico', 'pendiente'], [0, 16, 0, 0, 'Implante unitario', 'confirmado'],
    [1, 9, 30, 3, 'Corona de porcelana', 'confirmado'], [1, 11, 0, 4, 'Ortodoncia (control mensual)', 'pendiente'], [1, 15, 0, 2, 'Blanqueamiento', 'confirmado'], [2, 10, 0, 0, 'Endodoncia', 'pendiente'], [2, 14, 30, 5, 'Consulta y diagnóstico', 'confirmado'],
    [3, 9, 0, 1, 'Obturación (arreglo)', 'pendiente'], [3, 17, 0, 3, 'Corona de porcelana', 'confirmado'], [-1, 11, 0, 4, 'Ortodoncia (control mensual)', 'completado'], [-2, 10, 0, 1, 'Limpieza dental', 'completado'], [-1, 16, 0, 5, 'Consulta y diagnóstico', 'no_asistio']];
  await M.Turno.deleteMany({});
  for (const [d, h, m, i, tr, estado] of tur) await M.Turno.create({ paciente: P[i]._id, nombrePaciente: nom(P[i]), telefono: P[i].telefono, fecha: ya(d, h, m), duracion: 45, tratamiento: tr, estado, origen: 'admin', confirmToken: undefined });
  const pre = [[0, 'aceptado', [['Implante unitario (pieza 36)', 1, 950000], ['Corona de porcelana sobre implante', 1, 280000]]], [3, 'enviado', [['Corona de porcelana (pieza 46)', 1, 280000], ['Obturación previa', 1, 45000]]], [2, 'borrador', [['Blanqueamiento en consultorio', 1, 120000], ['Limpieza previa', 1, 38000]]]];
  await M.Presupuesto.deleteMany({}); let nro = 1;
  for (const [i, estado, items] of pre) { const it = items.map(([descripcion, cantidad, precioUnit]) => ({ descripcion, cantidad, precioUnit, subtotal: cantidad * precioUnit })); await M.Presupuesto.create({ paciente: P[i]._id, nombrePaciente: nom(P[i]), items: it, total: it.reduce((s, x) => s + x.subtotal, 0), estado, nro: nro++, notas: 'Presupuesto de ejemplo con datos inventados.' }); }
  console.log('OK', { pacientes: await M.Paciente.countDocuments(), turnos: await M.Turno.countDocuments(), presupuestos: await M.Presupuesto.countDocuments(), idLucia: String(P[0]._id), idJulian: String(P[3]._id) });
  await mongoose.disconnect();
})().catch(e => { console.error('ERROR', e.message); process.exit(1); });

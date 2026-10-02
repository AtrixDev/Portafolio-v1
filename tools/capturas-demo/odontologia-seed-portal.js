const B = (process.env.SDV4_BACKEND || '.') + '/';
const mongoose = require(B + 'node_modules/mongoose'); const bcrypt = require(B + 'node_modules/bcryptjs'); const M = require(B + 'models');
(async () => { if (!/127\.0\.0\.1:27099/.test(process.env.MONGO_URI||'')) throw new Error('no es la base local');
  await mongoose.connect(process.env.MONGO_URI);
  const r = await M.Paciente.updateOne({ email: 'lucia.demo@example.test' }, { $set: { password: await bcrypt.hash('demo-123456', 10), passwordSet: true, consentimientoDatosSalud: true, fechaConsentimiento: new Date(), consentimientoOrigen: 'portal', nuevoPortal: false } });
  console.log('paciente actualizado', r.modifiedCount); await mongoose.disconnect(); })().catch(e => { console.error(e.message); process.exit(1); });

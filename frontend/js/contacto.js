/* ============================================================
   CONTACTO.JS — Formulario, copiar datos y reloj de Buenos Aires
   ============================================================ */

const CONTACT_API = '/api/contact';
const WA_NUMBER   = '541144474507';
const EMAIL       = 'daricolangelo@gmail.com';
const REASONS     = { oferta: 'Oferta laboral', freelance: 'Consultoría / freelance', consulta: 'Consulta', otro: 'Otro' };

// ── Reloj de Buenos Aires ──
(function () {
  const el = document.getElementById('ct-clock');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
  const tick = () => { el.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 30000);
})();

// ── Copiar al portapapeles ──
document.querySelectorAll('.ct-copy').forEach(btn => {
  btn.addEventListener('click', async () => {
    const label = btn.querySelector('span');
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      btn.classList.add('copied');
      label.textContent = 'Copiado';
    } catch (e) {
      label.textContent = btn.dataset.copy;
    }
    setTimeout(() => { btn.classList.remove('copied'); label.textContent = 'Copiar'; }, 2200);
  });
});

// ── Formulario ──
(function () {
  const form = document.getElementById('ct-form');
  if (!form) return;
  const statusEl = document.getElementById('ct-form-status');
  const submit   = document.getElementById('ct-submit');
  const submitLabel = submit.querySelector('span');
  const msg      = form.elements.message;
  const count    = document.getElementById('f-count');

  // ?motivo=consulta preselecciona el motivo (se usa desde "pedir copia" de certificados)
  const motivo = new URLSearchParams(location.search).get('motivo');
  if (motivo && REASONS[motivo]) form.querySelector(`input[name="reason"][value="${motivo}"]`).checked = true;
  if (motivo === 'consulta' && !msg.value) msg.value = 'Hola Darío, ¿me podrías enviar una copia de tus certificados de Smartbeemo?';

  const RULES = {
    name:    v => v.trim().length >= 2 || 'Decime tu nombre.',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Ese email no parece válido. Revisalo (ej: nombre@empresa.com).',
    message: v => v.trim().length >= 10 || 'Contame un poco más: mínimo 10 caracteres.',
  };

  function setError(name, text) {
    const input = form.elements[name];
    const err = document.getElementById('e-' + name);
    input.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (err) err.textContent = text || '';
  }
  function validate(name) {
    const r = RULES[name](form.elements[name].value);
    setError(name, r === true ? '' : r);
    return r === true;
  }

  // Validar al salir del campo; si ya estaba marcado, re-validar mientras escribe
  Object.keys(RULES).forEach(name => {
    const input = form.elements[name];
    input.addEventListener('blur', () => { if (input.value) validate(name); });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validate(name); });
  });
  const updateCount = () => { count.textContent = `${msg.value.length} / 3000`; };
  msg.addEventListener('input', updateCount);
  updateCount();

  const data = () => ({
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim(),
    company: form.elements.company.value.trim(),
    reason: form.elements.reason.value,
    message: form.elements.message.value.trim(),
    website: form.elements.website.value,
  });

  function composed(d) {
    return `Hola Darío, soy ${d.name || '…'}${d.company ? ` de ${d.company}` : ''}.\n` +
           `Motivo: ${REASONS[d.reason] || 'Otro'}\n\n${d.message}` +
           (d.email ? `\n\nMi email: ${d.email}` : '');
  }
  const waLink   = d => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(composed(d))}`;
  const mailLink = d => `mailto:${EMAIL}?subject=${encodeURIComponent(`Contacto desde el portfolio: ${REASONS[d.reason]}`)}&body=${encodeURIComponent(composed(d))}`;

  function showStatus(kind, title, text, actions = '') {
    statusEl.innerHTML = `<div class="ct-status ${kind}" role="status">${icon(kind === 'ok' ? 'check' : 'alert')}
      <div><strong>${title}</strong><p>${text}</p>${actions ? `<div class="ct-status-actions">${actions}</div>` : ''}</div></div>`;
  }

  // Enviar el mismo mensaje por WhatsApp o email
  form.querySelectorAll('.ct-link').forEach(b => b.addEventListener('click', () => {
    const d = data();
    if (!d.message) { validate('message'); msg.focus(); return; }
    window.open(b.dataset.via === 'whatsapp' ? waLink(d) : mailLink(d), '_blank', 'noopener');
  }));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    statusEl.innerHTML = '';
    const invalid = Object.keys(RULES).filter(n => !validate(n));
    if (invalid.length) { form.elements[invalid[0]].focus(); return; }

    const d = data();
    submit.disabled = true;
    submitLabel.textContent = 'Enviando…';
    try {
      const res = await fetch(CONTACT_API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(d), signal: AbortSignal.timeout(12000),
      });
      const out = await res.json().catch(() => null);
      if (res.ok && out?.ok) {
        form.reset(); updateCount();
        showStatus('ok', `¡Gracias, ${esc(d.name.split(' ')[0])}! Recibí tu mensaje.`, 'Te respondo a ' + esc(d.email) + '. Si es urgente, también podés escribirme por WhatsApp.');
        return;
      }
      if (res.status === 400 && out?.errors) {
        Object.entries(out.errors).forEach(([k, v]) => setError(k, v));
        form.elements[Object.keys(out.errors)[0]]?.focus();
        return;
      }
      if (res.status === 429) throw Object.assign(new Error(out.error), { soft: true });
      throw new Error('fallo');
    } catch (err) {
      showStatus('warn', 'No pude enviarlo desde acá',
        (err.soft ? esc(err.message) + ' ' : '') + 'No se pierde nada: mandá el mismo mensaje con un clic.',
        `<a class="ct-action" href="${waLink(d)}" target="_blank" rel="noopener">${icon('message')}Enviar por WhatsApp</a>
         <a class="ct-action" href="${mailLink(d)}">${icon('mail')}Enviar por email</a>`);
    } finally {
      submit.disabled = false;
      submitLabel.textContent = 'Enviar mensaje';
    }
  });
})();

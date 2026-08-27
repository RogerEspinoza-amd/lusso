/**
 * Lusso Beauty Salón - Landing Page Controller
 * Handles Public Catalog, Monthly Offers, Booking Generator, WhatsApp integration (+51 971 988 386),
 * and automatic synchronization with the Girls' CRM System (Kiara & Cielo).
 */

const SALON_WHATSAPP_NUMBER = '51971988386'; // Official Salon Number

class LussoLanding {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderOffers();
    this.renderCatalog();
    this.populateBookingServices();
    this.updateTopBarPendingBadge();
  }

  bindEvents() {
    // Category Filter Buttons
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.currentCategory = e.currentTarget.getAttribute('data-cat');
        this.renderCatalog();
      });
    });

    // Catalog Search
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCatalog();
      });
    }

    // FAQ Accordion
    document.querySelectorAll('.faq-question').forEach(q => {
      q.addEventListener('click', (e) => {
        const item = e.currentTarget.parentElement;
        item.classList.toggle('active');
      });
    });

    // Booking Modal Form Submission
    const bookingForm = document.getElementById('booking-modal-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSendBookingWhatsApp();
      });
    }

    // Booking form live message preview
    ['booking-service-select', 'booking-specialist-select', 'booking-date', 'booking-time', 'booking-name', 'booking-phone', 'booking-notes'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', () => this.updateWhatsAppPreview());
        el.addEventListener('input', () => this.updateWhatsAppPreview());
      }
    });

    // Mobile Navbar Menu Toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        document.querySelector('.landing-nav-links')?.classList.toggle('open');
      });
    }
  }

  renderOffers() {
    const container = document.getElementById('offers-grid');
    if (!container) return;

    const offers = window.lussoDB ? window.lussoDB.getMonthlyOffers() : (window.LUSSO_SEED_DATA?.monthlyOffers || []);

    if (!offers || offers.length === 0) {
      container.innerHTML = '<p class="col-span-full text-center text-muted">Pronto nuevas ofertas del mes.</p>';
      return;
    }

    let html = '';
    offers.forEach(promo => {
      const savingsText = promo.savings ? `Ahorras S/ ${promo.savings}` : '';
      const itemsList = (promo.includes || []).map(item => `<li><span class="check-icon">✓</span> <span>${item}</span></li>`).join('');

      html += `
        <div class="offer-card">
          <div class="offer-card-top">
            <span class="offer-badge">${promo.badge || '👑 EDICIÓN DEL MES'}</span>
            <span class="offer-spec-tag">👩‍🎨 ${promo.specialist}</span>
          </div>

          <div class="offer-header">
            <div class="offer-icon-box">${promo.icon || '✨'}</div>
            <div>
              <h3 class="offer-title">${promo.title}</h3>
              <p class="offer-subtitle">${promo.subtitle}</p>
            </div>
          </div>

          <p class="offer-desc">${promo.description}</p>

          <div class="offer-includes-box">
            <span class="includes-title">El ritual incluye:</span>
            <ul class="offer-includes-list">
              ${itemsList}
            </ul>
          </div>

          <div class="offer-card-footer">
            <div class="offer-pricing">
              <div class="offer-old-price">Precio Regular S/ ${promo.regularPrice}</div>
              <div class="offer-current-price">
                <span class="price-num">S/ ${promo.offerPrice}</span>
                ${savingsText ? `<span class="savings-pill">${savingsText}</span>` : ''}
              </div>
            </div>

            <button class="btn-claim-offer" onclick="window.lussoLanding.openBookingModal('${promo.title} (Colección del Mes)', '${promo.specialist}', ${promo.offerPrice})">
              <span>Reservar Ritual</span> ✨
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  renderCatalog() {
    const container = document.getElementById('services-grid');
    if (!container) return;

    const services = window.lussoDB ? window.lussoDB.getServicesCatalog() : (window.LUSSO_SEED_DATA?.servicesCatalog || []);

    const filtered = services.filter(s => {
      const matchCat = this.currentCategory === 'all' || s.category === this.currentCategory;
      const matchSearch = !this.searchQuery || 
        s.name.toLowerCase().includes(this.searchQuery) || 
        s.description.toLowerCase().includes(this.searchQuery) ||
        (s.specialist && s.specialist.toLowerCase().includes(this.searchQuery));
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-catalog-msg col-span-full">
          <p>No se encontraron servicios con los filtros seleccionados.</p>
          <button class="btn-sm btn-outline mt-2" onclick="window.lussoLanding.resetFilters()">Ver todos los servicios</button>
        </div>
      `;
      return;
    }

    const categoryIcons = {
      manicure: '💅',
      pedicure: '🦶',
      corte: '✂️',
      color: '🎨',
      tratamientos: '✨',
      tradicionales: '💇‍♀️',
      retiros: '🧴'
    };

    let html = '';
    filtered.forEach(s => {
      const icon = categoryIcons[s.category] || '✨';
      const isFromPrice = s.name.toLowerCase().includes('desde') || s.price >= 100 || s.category === 'color' || s.category === 'tratamientos';
      const priceText = isFromPrice ? `Desde S/ ${s.price}` : `S/ ${s.price}`;

      html += `
        <div class="service-card ${s.bestSeller ? 'card-bestseller' : ''}">
          ${s.bestSeller ? '<div class="badge-bestseller">⭐ Best Seller</div>' : ''}
          <div class="service-card-header">
            <span class="service-cat-icon">${icon}</span>
            <span class="service-specialist-tag">Atiende: ${s.specialist}</span>
          </div>
          <h3 class="service-name">${s.name}</h3>
          <p class="service-desc">${s.description}</p>
          <div class="service-card-footer">
            <div class="service-price-block">
              <span class="price-val">${priceText}</span>
              <span class="duration-val">⏱️ ${s.duration} min aprox.</span>
            </div>
            <button class="btn-book-service" onclick="window.lussoLanding.openBookingModal('${s.name}', '${s.specialist}', ${s.price})">
              Agendar Cita ✨
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  resetFilters() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.toggle('active', p.getAttribute('data-cat') === 'all'));
    const input = document.getElementById('catalog-search');
    if (input) input.value = '';
    this.renderCatalog();
  }

  populateBookingServices() {
    const select = document.getElementById('booking-service-select');
    if (!select) return;

    const offers = window.lussoDB ? window.lussoDB.getMonthlyOffers() : [];
    const services = window.lussoDB ? window.lussoDB.getServicesCatalog() : [];

    let html = '<option value="">-- Selecciona un servicio o promo --</option>';

    if (offers.length > 0) {
      html += '<optgroup label="🔥 OFERTAS ESPECIALES DEL MES">';
      offers.forEach(o => {
        html += `<option value="${o.title} (Promo del Mes)" data-spec="${o.specialist}" data-price="${o.offerPrice}">⭐ [PROMO] ${o.title} - S/ ${o.offerPrice} (Antes S/ ${o.regularPrice})</option>`;
      });
      html += '</optgroup>';
    }

    if (services.length > 0) {
      html += '<optgroup label="💅 CARTA DE SERVICIOS">';
      services.forEach(s => {
        html += `<option value="${s.name}" data-spec="${s.specialist}" data-price="${s.price}">[${s.category.toUpperCase()}] ${s.name} - S/ ${s.price}</option>`;
      });
      html += '</optgroup>';
    }

    select.innerHTML = html;

    // Smart Specialist Auto-Selection when changing service
    select.addEventListener('change', (e) => {
      const opt = select.options[select.selectedIndex];
      const spec = opt?.getAttribute('data-spec');
      if (spec) {
        const specSelect = document.getElementById('booking-specialist-select');
        if (specSelect) {
          specSelect.value = spec;
        }
      }
      this.updateWhatsAppPreview();
    });
  }

  openBookingModal(serviceName = '', specialist = '', price = 0) {
    const modal = document.getElementById('modal-booking');
    if (!modal) return;

    if (serviceName) {
      const select = document.getElementById('booking-service-select');
      if (select) {
        let matched = false;
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === serviceName || select.options[i].value.includes(serviceName)) {
            select.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched) {
          select.value = serviceName;
        }
      }
    }

    if (specialist) {
      const specSelect = document.getElementById('booking-specialist-select');
      if (specSelect) specSelect.value = specialist;
    }

    // Default tomorrow date if empty
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('booking-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }

    this.updateWhatsAppPreview();
    modal.classList.add('open');
  }

  updateWhatsAppPreview() {
    const previewEl = document.getElementById('wa-preview-text');
    if (!previewEl) return;

    const name = document.getElementById('booking-name')?.value.trim() || '[Tu Nombre]';
    const phone = document.getElementById('booking-phone')?.value.trim() || '[Tu Celular]';
    const service = document.getElementById('booking-service-select')?.value || '[Servicio / Oferta]';
    const specialist = document.getElementById('booking-specialist-select')?.value || 'Cualquiera disponible';
    const date = document.getElementById('booking-date')?.value || '[Fecha]';
    const time = document.getElementById('booking-time')?.value || '[Hora]';
    const notes = document.getElementById('booking-notes')?.value.trim();

    let msg = `¡Hola Lusso Beauty Salón! ✨ Mi nombre es *${name}* (${phone}). Quisiera agendar una cita para *${service}* con la especialista *${specialist}* el día *${date}* a las *${time}*.`;
    if (notes) {
      msg += ` Nota: ${notes}.`;
    }
    msg += ` ¿Tienen disponibilidad? 💖`;

    previewEl.textContent = msg;
  }

  handleSendBookingWhatsApp() {
    const name = document.getElementById('booking-name')?.value.trim();
    const phone = document.getElementById('booking-phone')?.value.trim();
    const service = document.getElementById('booking-service-select')?.value;
    const specialist = document.getElementById('booking-specialist-select')?.value || 'Kiara / Cielo';
    const date = document.getElementById('booking-date')?.value;
    const time = document.getElementById('booking-time')?.value;
    const notes = document.getElementById('booking-notes')?.value.trim() || '';

    if (!name || !phone || !service || !date || !time) {
      alert('Por favor completa todos los campos obligatorios (*) para confirmar tu cita.');
      return;
    }

    // Determine estimated amount
    const select = document.getElementById('booking-service-select');
    const opt = select ? select.options[select.selectedIndex] : null;
    const price = opt ? Number(opt.getAttribute('data-price') || 0) : 0;

    // 1. AUTO-SAVE IN CRM APPOINTMENTS SYSTEM
    let savedApt = null;
    if (window.lussoDB) {
      savedApt = window.lussoDB.saveAppointment({
        clientName: name,
        clientPhone: phone,
        service: service,
        specialist: specialist === 'Cualquiera disponible' ? 'Kiara / Cielo' : specialist,
        date: date,
        time: time,
        status: 'pending',
        amount: price,
        notes: notes ? `Reserva online: ${notes}` : 'Reserva online desde landing page'
      });
    }

    // Update Notification Badges
    this.updateTopBarPendingBadge();
    if (window.lussoCRM) {
      window.lussoCRM.refreshAppointments();
    }

    // 2. CONSTRUCT WHATSAPP MESSAGE
    let waText = `¡Hola Lusso Beauty Salón! ✨\n\n`;
    waText += `Mi nombre es *${name}* (Celular: ${phone}).\n`;
    waText += `Quisiera reservar una cita para:\n`;
    waText += `💅 Servicio: *${service}*\n`;
    waText += `👩‍🦰 Especialista: *${specialist}*\n`;
    waText += `📅 Fecha: *${date}*\n`;
    waText += `⏰ Hora: *${time}*\n`;
    if (notes) {
      waText += `📝 Notas: ${notes}\n`;
    }
    waText += `\n¿Me confirman disponibilidad? ¡Muchas gracias! 💖`;

    const encodedMsg = encodeURIComponent(waText);
    const waUrl = `https://wa.me/${SALON_WHATSAPP_NUMBER}?text=${encodedMsg}`;

    // Open WhatsApp in new tab
    window.open(waUrl, '_blank');

    // Close booking modal
    document.getElementById('modal-booking')?.classList.remove('open');

    // 3. SHOW CONFIRMATION MODAL WITH TICKET & GOOGLE CALENDAR LINK
    this.showBookingSuccessModal({
      id: savedApt ? savedApt.id : 'APT-' + Date.now().toString().slice(-4),
      clientName: name,
      clientPhone: phone,
      service: service,
      specialist: specialist,
      date: date,
      time: time,
      waUrl: waUrl
    });
  }

  showBookingSuccessModal(apt) {
    const modal = document.getElementById('modal-booking-success');
    if (!modal) return;

    document.getElementById('success-client-greeting').textContent = `¡Gracias por reservar, ${apt.clientName}! 💖`;
    document.getElementById('success-apt-id').textContent = apt.id;
    document.getElementById('success-apt-service').textContent = apt.service;
    document.getElementById('success-apt-specialist').textContent = apt.specialist;
    document.getElementById('success-apt-datetime').textContent = `${apt.date} a las ${apt.time}`;

    const waBtn = document.getElementById('btn-success-open-whatsapp');
    if (waBtn) {
      waBtn.href = apt.waUrl;
    }

    // Google Calendar Link
    const calBtn = document.getElementById('btn-success-google-cal');
    if (calBtn) {
      const gcalTitle = encodeURIComponent(`Cita en Lusso Beauty Salón: ${apt.service}`);
      const gcalDetails = encodeURIComponent(`Cita reservada para ${apt.clientName} con ${apt.specialist}. Servicio: ${apt.service}. Contacto Lusso: +51 971 988 386.`);
      const gcalLocation = encodeURIComponent(`Calle Berlín 481, Miraflores, Lima, Perú`);
      calBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${gcalTitle}&details=${gcalDetails}&location=${gcalLocation}`;
    }

    modal.classList.add('open');
  }

  updateTopBarPendingBadge() {
    if (!window.lussoDB) return;
    const count = window.lussoDB.getPendingAppointmentsCount();
    const badge = document.getElementById('top-pending-badge');
    const countSpan = document.getElementById('top-pending-count');

    if (badge && countSpan) {
      if (count > 0) {
        countSpan.textContent = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.lussoLanding = new LussoLanding();
});

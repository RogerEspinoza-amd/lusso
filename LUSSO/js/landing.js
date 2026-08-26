/**
 * LUSSO Salon Boutique - Landing Page Controller
 * Handles Public Catalog, Category Filters, Booking Generator, WhatsApp integration, and UI interactions
 */

class LussoLanding {
  constructor() {
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderCatalog();
    this.populateBookingServices();
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
    ['booking-service-select', 'booking-specialist-select', 'booking-date', 'booking-time', 'booking-name'].forEach(id => {
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
            <button class="btn-book-service" onclick="window.lussoLanding.openBookingModal('${s.name}', '${s.specialist}')">
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
    const services = window.lussoDB ? window.lussoDB.getServicesCatalog() : [];
    select.innerHTML = '<option value="">-- Selecciona un servicio --</option>' + 
      services.map(s => `<option value="${s.name}" data-spec="${s.specialist}">[${s.category.toUpperCase()}] ${s.name} - S/ ${s.price}</option>`).join('');

    select.addEventListener('change', (e) => {
      const opt = select.options[select.selectedIndex];
      const spec = opt?.getAttribute('data-spec');
      if (spec) {
        const specSelect = document.getElementById('booking-specialist-select');
        if (specSelect) specSelect.value = spec;
      }
      this.updateWhatsAppPreview();
    });
  }

  openBookingModal(serviceName = '', specialist = '') {
    const modal = document.getElementById('modal-booking');
    if (!modal) return;

    if (serviceName) {
      const select = document.getElementById('booking-service-select');
      if (select) select.value = serviceName;
    }
    if (specialist) {
      const specSelect = document.getElementById('booking-specialist-select');
      if (specSelect) specSelect.value = specialist;
    }

    // Default tomorrow date
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
    const service = document.getElementById('booking-service-select')?.value || '[Servicio]';
    const specialist = document.getElementById('booking-specialist-select')?.value || 'Cualquiera disponible';
    const date = document.getElementById('booking-date')?.value || '[Fecha]';
    const time = document.getElementById('booking-time')?.value || '[Hora]';

    const msg = `¡Hola LUSSO Salón Boutique! ✨ Mi nombre es *${name}*. Quisiera agendar una cita para *${service}* con la especialista *${specialist}* el día *${date}* a las *${time}*. ¿Tienen disponibilidad?`;
    previewEl.textContent = msg;
  }

  handleSendBookingWhatsApp() {
    const name = document.getElementById('booking-name')?.value.trim();
    const service = document.getElementById('booking-service-select')?.value;
    const specialist = document.getElementById('booking-specialist-select')?.value;
    const date = document.getElementById('booking-date')?.value;
    const time = document.getElementById('booking-time')?.value;

    if (!name || !service || !date || !time) {
      alert('Por favor completa todos los campos requeridos para enviar tu reserva.');
      return;
    }

    const msg = encodeURIComponent(`¡Hola LUSSO Salón Boutique! ✨ Mi nombre es *${name}*. Quisiera agendar una cita para *${service}* con la especialista *${specialist}* el día *${date}* a las *${time}*. ¿Tienen disponibilidad?`);
    
    // Default salon WhatsApp number (Peru code 51)
    const salonPhone = '51993511745';
    window.open(`https://wa.me/${salonPhone}?text=${msg}`, '_blank');
    
    document.getElementById('modal-booking')?.classList.remove('open');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.lussoLanding = new LussoLanding();
});

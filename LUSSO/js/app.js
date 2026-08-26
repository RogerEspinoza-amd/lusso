/**
 * LUSSO Salon Boutique - App Core Router & View Manager
 */

class LussoApp {
  constructor() {
    this.currentView = 'crm'; // Default to CRM or Landing depending on hash or param
    this.init();
  }

  init() {
    // Check URL Hash or default
    const hash = window.location.hash.replace('#', '');
    if (hash === 'landing' || hash === 'crm') {
      this.currentView = hash;
    } else {
      this.currentView = 'landing';
    }

    this.setView(this.currentView);
    this.bindGlobalEvents();
  }

  setView(viewName) {
    this.currentView = viewName;
    window.location.hash = viewName;

    const landingContainer = document.getElementById('view-landing');
    const crmContainer = document.getElementById('view-crm');
    const btnLanding = document.getElementById('btn-switch-landing');
    const btnCrm = document.getElementById('btn-switch-crm');

    if (viewName === 'landing') {
      landingContainer?.classList.remove('hidden');
      crmContainer?.classList.add('hidden');
      btnLanding?.classList.add('active');
      btnCrm?.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      crmContainer?.classList.remove('hidden');
      landingContainer?.classList.add('hidden');
      btnCrm?.classList.add('active');
      btnLanding?.classList.remove('active');
      if (window.lussoCRM) window.lussoCRM.refreshAll();
    }
  }

  bindGlobalEvents() {
    // Top view switcher buttons
    document.getElementById('btn-switch-landing')?.addEventListener('click', () => this.setView('landing'));
    document.getElementById('btn-switch-crm')?.addEventListener('click', () => this.setView('crm'));
    document.getElementById('btn-enter-crm-from-landing')?.addEventListener('click', () => this.setView('crm'));

    // Modal Close Buttons
    document.querySelectorAll('.modal-close-btn, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.currentTarget.closest('.lusso-modal');
        if (modal) modal.classList.remove('open');
      });
    });

    // Close modals on clicking overlay backdrop
    document.querySelectorAll('.lusso-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });

    // Client Drawer Backdrop Closer
    document.getElementById('drawer-backdrop')?.addEventListener('click', () => {
      window.lussoCRM?.closeClientDrawer();
    });

    document.getElementById('btn-close-client-drawer')?.addEventListener('click', () => {
      window.lussoCRM?.closeClientDrawer();
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.lussoApp = new LussoApp();
});

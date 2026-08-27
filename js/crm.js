/**
 * Lusso Beauty Salón - CRM & Administration Controller
 * Manages Appointments & Agenda, Client Directory, Service POS, Inventory, Expenses, and Analytics.
 * Optimized for Desktop and 11" Tablets with Role-based Access Control (Stylist vs Dueña)
 */

class LussoCRM {
  constructor() {
    this.currentTab = 'dashboard';
    this.selectedClient = null;
    this.salesFilterDate = 'all';
    this.clientFilterType = 'all';
    this.inventoryFilterCategory = 'all';
    this.appointmentFilterSpec = 'all';
    this.appointmentFilterDate = 'all';
    this.appointmentFilterStatus = 'all';
    this.appointmentSearchQuery = '';
    this.pendingTab = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateRoleUI();
    this.renderDashboard();
    this.renderAppointments();
    this.renderClients();
    this.renderSales();
    this.renderInventory();
    this.renderExpenses();
    this.renderPayroll();
    this.populateSelects();
    this.updateAppointmentBadges();
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.crm-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Payroll Filters & Forms
    const payrollMonthSelect = document.getElementById('payroll-month-selector');
    if (payrollMonthSelect) {
      payrollMonthSelect.addEventListener('change', () => this.renderPayroll());
    }

    const payrollSpecFilter = document.getElementById('payroll-specialist-filter');
    if (payrollSpecFilter) {
      payrollSpecFilter.addEventListener('change', () => this.renderPayroll());
    }

    const absenceForm = document.getElementById('form-absence-register');
    if (absenceForm) {
      absenceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveAbsence();
      });
    }

    const staffSalaryForm = document.getElementById('form-staff-salary');
    if (staffSalaryForm) {
      staffSalaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveStaffSalary();
      });
    }

    const kiaraSalaryInput = document.getElementById('salary-kiara-input');
    if (kiaraSalaryInput) {
      kiaraSalaryInput.addEventListener('input', (e) => {
        const val = Number(e.target.value) || 0;
        const el = document.getElementById('kiara-daily-calc');
        if (el) el.textContent = (val / 30).toFixed(2);
      });
    }

    const cieloSalaryInput = document.getElementById('salary-cielo-input');
    if (cieloSalaryInput) {
      cieloSalaryInput.addEventListener('input', (e) => {
        const val = Number(e.target.value) || 0;
        const el = document.getElementById('cielo-daily-calc');
        if (el) el.textContent = (val / 30).toFixed(2);
      });
    }

    // Admin PIN Form Submit
    const adminPinForm = document.getElementById('form-admin-pin');
    if (adminPinForm) {
      adminPinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = document.getElementById('input-admin-pin')?.value.trim();
        if (window.lussoDB.verifyAdminPin(pin)) {
          this.setRole('admin');
          document.getElementById('modal-admin-pin')?.classList.remove('open');
          document.getElementById('input-admin-pin').value = '';
          document.getElementById('pin-error-msg')?.classList.add('hidden');
          this.showToast('Acceso desbloqueado: Modo Dueña / Administración activo.', 'success');
          if (this.pendingTab) {
            this.switchTab(this.pendingTab);
            this.pendingTab = null;
          }
        } else {
          document.getElementById('pin-error-msg')?.classList.remove('hidden');
        }
      });
    }

    // Appointment Filters & Search
    const aptSearchInput = document.getElementById('appointment-search-input');
    if (aptSearchInput) {
      aptSearchInput.addEventListener('input', (e) => {
        this.appointmentSearchQuery = e.target.value.toLowerCase().trim();
        this.renderAppointments();
      });
    }

    document.querySelectorAll('.apt-spec-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.apt-spec-filter').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.appointmentFilterSpec = e.currentTarget.getAttribute('data-spec');
        this.renderAppointments();
      });
    });

    document.querySelectorAll('.apt-date-filter').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.apt-date-filter').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.appointmentFilterDate = e.currentTarget.getAttribute('data-date');
        this.renderAppointments();
      });
    });

    const aptStatusSelect = document.getElementById('appointment-status-select-filter');
    if (aptStatusSelect) {
      aptStatusSelect.addEventListener('change', (e) => {
        this.appointmentFilterStatus = e.target.value;
        this.renderAppointments();
      });
    }

    // Manual Appointment Form Submit
    const manualAptForm = document.getElementById('form-manual-appointment');
    if (manualAptForm) {
      manualAptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveManualAppointment();
      });
    }

    // Client Search & Filters
    const clientSearchInput = document.getElementById('client-search-input');
    if (clientSearchInput) {
      clientSearchInput.addEventListener('input', () => this.renderClients());
    }

    document.querySelectorAll('.client-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.client-filter-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.clientFilterType = e.currentTarget.getAttribute('data-filter');
        this.renderClients();
      });
    });

    // POS Client Input Change -> Show Last Service Card
    const saleClientInput = document.getElementById('sale-client-input');
    if (saleClientInput) {
      saleClientInput.addEventListener('input', (e) => this.handlePOSClientInputChange(e.target.value));
      saleClientInput.addEventListener('change', (e) => this.handlePOSClientInputChange(e.target.value));
    }

    // Sales Filters
    const salesDateFilter = document.getElementById('sales-date-filter');
    if (salesDateFilter) {
      salesDateFilter.addEventListener('change', (e) => {
        this.salesFilterDate = e.target.value;
        this.renderSales();
      });
    }

    // Inventory Filters
    const inventoryCategoryFilter = document.getElementById('inventory-category-filter');
    if (inventoryCategoryFilter) {
      inventoryCategoryFilter.addEventListener('change', (e) => {
        this.inventoryFilterCategory = e.target.value;
        this.renderInventory();
      });
    }

    // Form Submissions
    const newSaleForm = document.getElementById('form-new-sale');
    if (newSaleForm) {
      newSaleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleCreateSale();
      });
    }

    const newClientForm = document.getElementById('form-new-client');
    if (newClientForm) {
      newClientForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveClient();
      });
    }

    const newInvForm = document.getElementById('form-new-inventory');
    if (newInvForm) {
      newInvForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveInventory();
      });
    }

    const adjustStockForm = document.getElementById('form-adjust-stock');
    if (adjustStockForm) {
      adjustStockForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAdjustStockSubmit();
      });
    }

    const pettyCashForm = document.getElementById('form-petty-cash');
    if (pettyCashForm) {
      pettyCashForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSavePettyCash();
      });
    }

    const invoiceForm = document.getElementById('form-invoice');
    if (invoiceForm) {
      invoiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveInvoice();
      });
    }

    // Admin PIN Form
    const adminPinForm = document.getElementById('form-admin-pin');
    if (adminPinForm) {
      adminPinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pinInput = document.getElementById('input-admin-pin');
        const pinVal = pinInput ? pinInput.value.trim() : '';
        if (window.lussoDB.verifyAdminPin(pinVal)) {
          this.setRole('admin');
          document.getElementById('modal-admin-pin')?.classList.remove('open');
          if (pinInput) pinInput.value = '';
          document.getElementById('pin-error-msg')?.classList.add('hidden');
          this.showToast('✨ Acceso desbloqueado: Modo Dueña / Administración activo.', 'success');
          if (this.pendingTab) {
            this.switchTab(this.pendingTab);
            this.pendingTab = null;
          }
        } else {
          document.getElementById('pin-error-msg')?.classList.remove('hidden');
          if (pinInput) {
            pinInput.value = '';
            pinInput.focus();
          }
        }
      });
    }

    // Absence & Payroll Forms
    const absenceForm = document.getElementById('form-absence-register');
    if (absenceForm) {
      absenceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveAbsence();
      });
    }

    const staffSalaryForm = document.getElementById('form-staff-salary');
    if (staffSalaryForm) {
      staffSalaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveStaffSalary();
      });
    }

    const absenceTypeSelect = document.getElementById('absence-type-select');
    if (absenceTypeSelect) {
      absenceTypeSelect.addEventListener('change', (e) => {
        this.handleAbsenceTypeChange(e.target.value);
      });
    }

    const payrollMonthSelect = document.getElementById('payroll-month-selector');
    if (payrollMonthSelect) {
      payrollMonthSelect.addEventListener('change', () => {
        this.renderPayroll();
      });
    }

    const payrollSpecFilter = document.getElementById('payroll-specialist-filter');
    if (payrollSpecFilter) {
      payrollSpecFilter.addEventListener('change', () => {
        this.renderPayroll();
      });
    }

    // Backup & Restore
    const exportBtn = document.getElementById('btn-export-backup');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportBackup());
    }

    const importInput = document.getElementById('input-import-backup');
    if (importInput) {
      importInput.addEventListener('change', (e) => this.handleImportBackup(e));
    }

    const resetBtn = document.getElementById('btn-reset-data');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!window.lussoDB.isPrivilegedAdmin()) {
          this.handleRoleClick();
          this.showToast('Esta acción requiere PIN de Dueña / Administración.', 'warning');
          return;
        }
        if (confirm('¿Estás segura de reiniciar los datos a la versión consolidada 2026?')) {
          window.lussoDB.resetToDefaults();
          this.refreshAll();
          this.showToast('Datos reiniciados con éxito.', 'success');
        }
      });
    }
  }

  handleRoleClick() {
    if (window.lussoDB.isPrivilegedAdmin()) {
      // Toggle back to Stylist mode
      this.setRole('stylist');
      this.showToast('🔒 Has regresado a Modo Estilista (Métricas de ingresos protegidas).', 'info');
    } else {
      // Open PIN modal
      const pinInput = document.getElementById('input-admin-pin');
      if (pinInput) pinInput.value = '';
      document.getElementById('pin-error-msg')?.classList.add('hidden');
      document.getElementById('modal-admin-pin')?.classList.add('open');
      setTimeout(() => pinInput?.focus(), 200);
    }
  }

  setRole(role) {
    window.lussoDB.setAuthRole(role);
    this.updateRoleUI();
    this.refreshAll();
  }

  updateRoleUI() {
    const isAdmin = window.lussoDB.isPrivilegedAdmin();

    // Top Bar Switcher
    const btn = document.getElementById('btn-top-role-toggle');
    const icon = document.getElementById('top-role-icon');
    const label = document.getElementById('top-role-label');
    const actionBadge = document.getElementById('top-role-action-badge');

    if (btn) {
      btn.className = `role-switcher-btn ${isAdmin ? 'role-admin' : 'role-stylist'}`;
    }
    if (icon) icon.textContent = isAdmin ? '👑' : '💅';
    if (label) label.textContent = isAdmin ? 'Modo Dueña' : 'Modo Estilista';
    if (actionBadge) actionBadge.textContent = isAdmin ? 'Bloquear 🔒' : 'Desbloquear 🔑';

    // Sidebar locked indicators
    const expensesItem = document.querySelector('.crm-nav-item[data-tab="expenses"]');
    const payrollItem = document.querySelector('.crm-nav-item[data-tab="payroll"]');
    const backupItem = document.querySelector('.crm-nav-item[data-tab="backup"]');
    if (expensesItem) {
      expensesItem.classList.toggle('nav-item-locked', !isAdmin);
    }
    if (payrollItem) {
      payrollItem.classList.toggle('nav-item-locked', !isAdmin);
    }
    if (backupItem) {
      backupItem.classList.toggle('nav-item-locked', !isAdmin);
    }
  }

  switchTab(tab) {
    if ((tab === 'expenses' || tab === 'backup' || tab === 'payroll') && !window.lussoDB.isPrivilegedAdmin()) {
      this.pendingTab = tab;
      this.handleRoleClick();
      this.showToast('🔒 Esta sección contiene pagos y balances salariales. Ingresa el PIN de Dueña para acceder.', 'warning');
      return;
    }

    this.currentTab = tab;
    document.querySelectorAll('.crm-nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });

    document.querySelectorAll('.crm-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tab}`);
    });

    if (tab === 'dashboard') this.renderDashboard();
    if (tab === 'appointments') this.renderAppointments();
    if (tab === 'clients') this.renderClients();
    if (tab === 'sales') this.renderSales();
    if (tab === 'inventory') this.renderInventory();
    if (tab === 'expenses') this.renderExpenses();
    if (tab === 'payroll') this.renderPayroll();
  }

  refreshAll() {
    this.updateRoleUI();
    this.renderDashboard();
    this.renderAppointments();
    this.renderClients();
    this.renderSales();
    this.renderInventory();
    this.renderExpenses();
    this.renderPayroll();
    this.populateSelects();
    this.updateAppointmentBadges();
  }

  refreshAppointments() {
    this.renderAppointments();
    this.renderDashboard();
    this.updateAppointmentBadges();
  }

  updateAppointmentBadges() {
    if (!window.lussoDB) return;
    const pendingCount = window.lussoDB.getPendingAppointmentsCount();

    const sidebarBadge = document.getElementById('crm-sidebar-pending-badge');
    if (sidebarBadge) {
      if (pendingCount > 0) {
        sidebarBadge.textContent = pendingCount;
        sidebarBadge.classList.remove('hidden');
      } else {
        sidebarBadge.classList.add('hidden');
      }
    }

    const topBadge = document.getElementById('top-pending-badge');
    const topCount = document.getElementById('top-pending-count');
    if (topBadge && topCount) {
      if (pendingCount > 0) {
        topCount.textContent = pendingCount;
        topBadge.classList.remove('hidden');
      } else {
        topBadge.classList.add('hidden');
      }
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `lusso-toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✨' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span class="toast-msg">${message}</span>
    `;
    const container = document.getElementById('toast-container') || document.body;
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ================= DASHBOARD =================
  renderDashboard() {
    const stats = window.lussoDB.getDashboardStats();
    const isAdmin = window.lussoDB.isPrivilegedAdmin();
    
    const elRevenue = document.getElementById('kpi-total-revenue');
    const elTodayApt = document.getElementById('kpi-today-appointments');
    const elPendingApt = document.getElementById('kpi-pending-appointments');
    const elTransactions = document.getElementById('kpi-total-sales');
    const elClients = document.getElementById('kpi-total-clients');
    const elLowStock = document.getElementById('kpi-low-stock');

    if (elRevenue) {
      if (isAdmin) {
        elRevenue.textContent = `S/ ${stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
        elRevenue.classList.remove('text-masked');
      } else {
        elRevenue.innerHTML = `<span class="masked-revenue">••••••</span> <span class="lock-tag-sm">🔒 Solo Dueña</span>`;
        elRevenue.classList.add('text-masked');
      }
    }
    if (elTodayApt) elTodayApt.textContent = stats.todayAppointmentsCount || 0;
    if (elPendingApt) elPendingApt.textContent = stats.pendingAppointmentsCount || 0;
    if (elTransactions) elTransactions.textContent = stats.totalTransactions;
    if (elClients) elClients.textContent = stats.totalClients;
    if (elLowStock) {
      elLowStock.textContent = stats.lowStockCount;
      elLowStock.className = `kpi-val ${stats.lowStockCount > 0 ? 'text-amber' : 'text-emerald'}`;
    }

    this.renderDashboardTodayAppointments(stats.todayAppointments || []);
    this.renderSpecialistChart(stats.specialists);
    this.renderPaymentMethodChart(stats.paymentMethods);
    this.renderTopServicesList(stats.topServices);
    this.renderLowStockAlerts(stats.lowStockItems);
  }

  renderDashboardTodayAppointments(appointments) {
    const container = document.getElementById('dashboard-today-appointments-list');
    if (!container) return;

    if (!appointments || appointments.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card py-3">
          <p class="text-sm text-muted">No hay citas programadas para hoy. ¡Puedes agendar una desde la Agenda de Citas o esperar reservas de la web!</p>
          <button class="btn-sm btn-outline mt-2" onclick="window.lussoCRM.openNewAppointmentModal()">+ Agendar Cita Manual</button>
        </div>
      `;
      return;
    }

    let html = '<div class="dashboard-apt-grid">';
    appointments.forEach(apt => {
      const isKiara = (apt.specialist || '').toLowerCase().includes('kiara');
      const specAvatar = isKiara ? '💇‍♀️' : '💅';
      const statusMap = {
        'pending': '<span class="status-badge status-pending">⏳ Pendiente</span>',
        'confirmed': '<span class="status-badge status-confirmed">✅ Confirmada</span>',
        'completed': '<span class="status-badge status-completed">💅 Atendida</span>',
        'cancelled': '<span class="status-badge status-cancelled">❌ Cancelada</span>'
      };

      html += `
        <div class="dash-apt-card">
          <div class="dash-apt-time-box">
            <span class="apt-time-txt">${apt.time}</span>
            <span class="apt-spec-txt">${specAvatar} ${apt.specialist}</span>
          </div>
          <div class="dash-apt-info">
            <div class="dash-apt-client">${apt.clientName} ${apt.clientPhone ? `<span class="text-xs text-muted">(${apt.clientPhone})</span>` : ''}</div>
            <div class="dash-apt-service">${apt.service} • <strong>S/ ${apt.amount || 0}</strong></div>
          </div>
          <div class="dash-apt-status">
            ${statusMap[apt.status] || statusMap['pending']}
          </div>
          <div class="dash-apt-actions">
            ${apt.clientPhone ? `
              <button class="btn-xs btn-outline text-emerald" onclick="window.lussoCRM.handleConfirmAppointmentWhatsApp('${apt.id}')" title="Enviar Confirmación por WhatsApp">
                💬 WhatsApp
              </button>
            ` : ''}
            <button class="btn-xs btn-primary" onclick="window.lussoCRM.handleConvertAppointmentToSale('${apt.id}')" title="Pasar a Caja y Registrar Cobro">
              💳 Cobrar
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  renderSpecialistChart(specialists) {
    const container = document.getElementById('chart-specialists');
    if (!container) return;

    const isAdmin = window.lussoDB.isPrivilegedAdmin();
    const sales = window.lussoDB.getSales();

    // Count services by specialist
    const counts = { 'Kiara': 0, 'Cielo': 0 };
    sales.forEach(s => {
      const spec = (s.specialist || '').toLowerCase().includes('kiara') ? 'Kiara' : 'Cielo';
      counts[spec] = (counts[spec] || 0) + 1;
    });

    const entries = Object.entries(specialists).sort((a, b) => b[1] - a[1]);
    const maxVal = Math.max(...entries.map(e => e[1]), 1);
    const maxCount = Math.max(counts['Kiara'] || 1, counts['Cielo'] || 1);

    let html = '<div class="bar-chart-list">';
    if (isAdmin) {
      entries.forEach(([name, amount]) => {
        const pct = Math.round((amount / maxVal) * 100);
        html += `
          <div class="bar-chart-row">
            <div class="bar-label">
              <span class="font-medium">${name}</span>
              <span class="text-muted font-bold">S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 0 })} (${counts[name] || 0} serv.)</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      });
    } else {
      // Stylist Mode: Only show number of clients/services without monetary Soles!
      ['Kiara', 'Cielo'].forEach(name => {
        const cnt = counts[name] || 0;
        const pct = Math.round((cnt / maxCount) * 100);
        html += `
          <div class="bar-chart-row">
            <div class="bar-label">
              <span class="font-medium">${name === 'Kiara' ? '💇‍♀️ Kiara (Estilista)' : '💅 Cielo (Nail Artist)'}</span>
              <span class="text-primary font-bold">${cnt} clientas atendidas</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      });
      html += `<div class="chart-discreet-note text-xs text-muted mt-2 text-right">🔒 Cifras en S/ restringidas para Administración</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  renderPaymentMethodChart(paymentMethods) {
    const container = document.getElementById('chart-payments');
    if (!container) return;

    const isAdmin = window.lussoDB.isPrivilegedAdmin();
    const total = Object.values(paymentMethods).reduce((a, b) => a + b, 0);
    const colors = {
      'TARJETA': '#d48b96',
      'EFECTIVO': '#10b981',
      'QR': '#8b5cf6',
      'YAPE/PLIN': '#ec4899',
      'TRANSFERENCIA': '#3b82f6'
    };

    let html = '<div class="payment-pills-list">';
    Object.entries(paymentMethods).forEach(([method, amount]) => {
      if (amount <= 0 || method.includes('.')) return;
      const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
      const color = colors[method] || '#94a3b8';

      html += `
        <div class="payment-method-row">
          <div class="pay-method-header">
            <span class="pay-dot" style="background-color: ${color}"></span>
            <span class="pay-name">${method}</span>
            <span class="pay-val">${isAdmin ? `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })} (${pct}%)` : `${pct}% de cobros`}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }


  renderTopServicesList(topServices) {
    const container = document.getElementById('list-top-services');
    if (!container) return;

    if (!topServices || topServices.length === 0) {
      container.innerHTML = '<p class="text-muted">No hay datos registrados aún.</p>';
      return;
    }

    let html = '<div class="top-services-grid">';
    topServices.forEach(([service, count], idx) => {
      html += `
        <div class="top-service-item">
          <span class="service-rank">#${idx + 1}</span>
          <div class="service-name-box">
            <span class="service-title">${service}</span>
            <span class="service-count">${count} servicios realizados</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  renderLowStockAlerts(items) {
    const container = document.getElementById('dashboard-low-stock-list');
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = '<div class="empty-state-card"><p class="text-emerald">✨ ¡Todo el stock está en niveles óptimos!</p></div>';
      return;
    }

    let html = '<div class="stock-alerts-list">';
    items.slice(0, 5).forEach(item => {
      html += `
        <div class="stock-alert-item">
          <div class="alert-info">
            <span class="alert-name">${item.name}</span>
            <span class="alert-detail">${item.category} • ${item.unit}</span>
          </div>
          <div class="alert-stock">
            <span class="stock-badge badge-critical">Stock: ${item.stock}</span>
            <button class="btn-sm btn-outline" onclick="window.lussoCRM.openAdjustStockModal('${item.id}')">+ Reponer</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  // ================= APPOINTMENTS & AGENDA MANAGEMENT =================
  renderAppointments() {
    const container = document.getElementById('appointments-list-container');
    if (!container) return;

    const appointments = window.lussoDB.getAppointments();
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Compute start and end of this week
    const now = new Date();
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)).toISOString().split('T')[0];
    const lastDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 7)).toISOString().split('T')[0];

    // Compute KPI counters
    const todayCount = appointments.filter(a => a.date === todayStr && a.status !== 'cancelled').length;
    const pendingCount = appointments.filter(a => a.status === 'pending').length;
    const confirmedCount = appointments.filter(a => a.status === 'confirmed').length;
    const completedCount = appointments.filter(a => a.status === 'completed').length;

    const elToday = document.getElementById('apt-stat-today-count');
    const elPending = document.getElementById('apt-stat-pending-count');
    const elConfirmed = document.getElementById('apt-stat-confirmed-count');
    const elCompleted = document.getElementById('apt-stat-completed-count');

    if (elToday) elToday.textContent = todayCount;
    if (elPending) elPending.textContent = pendingCount;
    if (elConfirmed) elConfirmed.textContent = confirmedCount;
    if (elCompleted) elCompleted.textContent = completedCount;

    // Filter appointments
    const filtered = appointments.filter(a => {
      // Specialist filter
      if (this.appointmentFilterSpec !== 'all') {
        const specName = (a.specialist || '').toLowerCase();
        if (!specName.includes(this.appointmentFilterSpec.toLowerCase())) return false;
      }

      // Date filter
      if (this.appointmentFilterDate === 'today' && a.date !== todayStr) return false;
      if (this.appointmentFilterDate === 'tomorrow' && a.date !== tomorrowStr) return false;
      if (this.appointmentFilterDate === 'week') {
        if (a.date < firstDayOfWeek || a.date > lastDayOfWeek) return false;
      }

      // Status filter
      if (this.appointmentFilterStatus !== 'all' && a.status !== this.appointmentFilterStatus) return false;

      // Search Query
      if (this.appointmentSearchQuery) {
        const q = this.appointmentSearchQuery;
        const match = (a.clientName || '').toLowerCase().includes(q) ||
          (a.clientPhone || '').includes(q) ||
          (a.service || '').toLowerCase().includes(q) ||
          (a.notes || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card col-span-full py-8 text-center">
          <p class="text-muted text-base mb-2">No se encontraron citas con los filtros actuales.</p>
          <button class="btn-sm btn-primary" onclick="window.lussoCRM.openNewAppointmentModal()">+ Registrar Cita Manual</button>
        </div>
      `;
      return;
    }

    let html = '';
    filtered.forEach(apt => {
      const isKiara = (apt.specialist || '').toLowerCase().includes('kiara');
      const specTag = isKiara 
        ? '<span class="badge-specialist badge-kiara">💇‍♀️ Kiara (Estilista)</span>' 
        : '<span class="badge-specialist badge-cielo">💅 Cielo (Nail Artist)</span>';

      const statusMap = {
        'pending': '<span class="status-badge status-pending">⏳ Pendiente</span>',
        'confirmed': '<span class="status-badge status-confirmed">✅ Confirmada</span>',
        'completed': '<span class="status-badge status-completed">💅 Atendida</span>',
        'cancelled': '<span class="status-badge status-cancelled">❌ Cancelada</span>'
      };

      const isToday = apt.date === todayStr;

      html += `
        <div class="apt-card ${apt.status === 'pending' ? 'is-pending' : ''} ${isToday ? 'is-today' : ''}">
          <div class="apt-card-header">
            <div>
              <div class="apt-client-name">${apt.clientName}</div>
              <div class="apt-client-phone">${apt.clientPhone ? `📱 ${apt.clientPhone}` : 'Sin teléfono'}</div>
            </div>
            <div class="apt-status-box">
              ${statusMap[apt.status] || statusMap['pending']}
            </div>
          </div>

          <div class="apt-card-body">
            <div class="apt-service-line">
              <span class="apt-service-name">✨ ${apt.service}</span>
              ${apt.amount ? `<span class="apt-amount-tag">S/ ${apt.amount}</span>` : ''}
            </div>

            <div class="apt-meta-row">
              <div class="apt-meta-item">
                <span>📅</span> <strong>${apt.date}</strong> (${apt.time})
              </div>
              <div class="apt-meta-item">
                ${specTag}
              </div>
            </div>

            ${apt.notes ? `<div class="apt-notes-snippet">📝 ${apt.notes}</div>` : ''}
          </div>

          <div class="apt-card-actions">
            ${apt.clientPhone ? `
              <button class="btn-xs btn-wa-action" onclick="window.lussoCRM.handleConfirmAppointmentWhatsApp('${apt.id}')" title="Enviar confirmación oficial por WhatsApp a la clienta">
                💬 Confirmar WhatsApp
              </button>
              <button class="btn-xs btn-outline" onclick="window.lussoCRM.handleReminderWhatsApp('${apt.id}')" title="Enviar recordatorio 24h por WhatsApp">
                ⏰ Recordar
              </button>
            ` : ''}

            <button class="btn-xs btn-primary-soft" onclick="window.lussoCRM.handleConvertAppointmentToSale('${apt.id}')" title="Cobrar y transferir al Punto de Venta">
              💳 Cobrar / POS
            </button>

            <select class="form-select select-xs" onchange="window.lussoCRM.handleUpdateAppointmentStatus('${apt.id}', this.value)" title="Cambiar estado">
              <option value="pending" ${apt.status === 'pending' ? 'selected' : ''}>⏳ Pendiente</option>
              <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''}>✅ Confirmada</option>
              <option value="completed" ${apt.status === 'completed' ? 'selected' : ''}>💅 Atendida</option>
              <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''}>❌ Cancelada</option>
            </select>

            <button class="btn-icon text-muted" onclick="window.lussoCRM.handleDeleteAppointment('${apt.id}')" title="Eliminar cita">
              🗑️
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  filterAppointmentsByDate(dateVal) {
    this.appointmentFilterDate = dateVal;
    document.querySelectorAll('.apt-date-filter').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-date') === dateVal);
    });
    this.renderAppointments();
  }

  filterAppointmentsByStatus(statusVal) {
    this.appointmentFilterStatus = statusVal;
    const select = document.getElementById('appointment-status-select-filter');
    if (select) select.value = statusVal;
    this.renderAppointments();
  }

  openNewAppointmentModal(aptData = null) {
    const modal = document.getElementById('modal-appointment-manual');
    if (!modal) return;

    const idInput = document.getElementById('manual-apt-id');
    const nameInput = document.getElementById('manual-apt-name');
    const phoneInput = document.getElementById('manual-apt-phone');
    const srvInput = document.getElementById('manual-apt-service');
    const specSelect = document.getElementById('manual-apt-specialist');
    const dateInput = document.getElementById('manual-apt-date');
    const timeSelect = document.getElementById('manual-apt-time');
    const statusSelect = document.getElementById('manual-apt-status');
    const amtInput = document.getElementById('manual-apt-amount');
    const notesInput = document.getElementById('manual-apt-notes');
    const titleEl = document.getElementById('modal-manual-apt-title');

    if (aptData) {
      if (titleEl) titleEl.textContent = 'Editar Cita';
      if (idInput) idInput.value = aptData.id || '';
      if (nameInput) nameInput.value = aptData.clientName || '';
      if (phoneInput) phoneInput.value = aptData.clientPhone || '';
      if (srvInput) srvInput.value = aptData.service || '';
      if (specSelect) specSelect.value = aptData.specialist || 'Kiara';
      if (dateInput) dateInput.value = aptData.date || new Date().toISOString().split('T')[0];
      if (timeSelect) timeSelect.value = aptData.time || '10:00 AM';
      if (statusSelect) statusSelect.value = aptData.status || 'confirmed';
      if (amtInput) amtInput.value = aptData.amount || '';
      if (notesInput) notesInput.value = aptData.notes || '';
    } else {
      if (titleEl) titleEl.textContent = 'Registrar Cita Manual';
      if (idInput) idInput.value = '';
      if (nameInput) nameInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (srvInput) srvInput.value = '';
      if (specSelect) specSelect.value = 'Kiara';
      if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
      if (timeSelect) timeSelect.value = '10:00 AM';
      if (statusSelect) statusSelect.value = 'confirmed';
      if (amtInput) amtInput.value = '';
      if (notesInput) notesInput.value = '';
    }

    modal.classList.add('open');
  }

  handleSaveManualAppointment() {
    const id = document.getElementById('manual-apt-id')?.value;
    const clientName = document.getElementById('manual-apt-name')?.value.trim();
    const clientPhone = document.getElementById('manual-apt-phone')?.value.trim();
    const service = document.getElementById('manual-apt-service')?.value.trim();
    const specialist = document.getElementById('manual-apt-specialist')?.value;
    const date = document.getElementById('manual-apt-date')?.value;
    const time = document.getElementById('manual-apt-time')?.value;
    const status = document.getElementById('manual-apt-status')?.value || 'confirmed';
    const amount = parseFloat(document.getElementById('manual-apt-amount')?.value) || 0;
    const notes = document.getElementById('manual-apt-notes')?.value.trim();

    if (!clientName || !service || !date || !time) {
      this.showToast('Por favor completa todos los campos requeridos (*)', 'warning');
      return;
    }

    const aptData = {
      id: id || undefined,
      clientName,
      clientPhone,
      service,
      specialist,
      date,
      time,
      status,
      amount,
      notes
    };

    window.lussoDB.saveAppointment(aptData);
    document.getElementById('modal-appointment-manual')?.classList.remove('open');
    this.refreshAppointments();
    this.showToast(`Cita de ${clientName} guardada con éxito en la agenda.`, 'success');
  }

  handleConfirmAppointmentWhatsApp(id) {
    const apt = window.lussoDB.getAppointmentById(id);
    if (!apt) return;

    if (!apt.clientPhone) {
      this.showToast('Esta clienta no tiene número de teléfono registrado.', 'warning');
      return;
    }

    // Format professional confirmation message
    let msg = `¡Hola *${apt.clientName}*! 💖✨\n\n`;
    msg += `Te confirmamos con mucha alegría tu cita en *Lusso Beauty Salón*:\n\n`;
    msg += `💅 Servicio: *${apt.service}*\n`;
    msg += `👩‍🦰 Especialista: *${apt.specialist}*\n`;
    msg += `📅 Fecha: *${apt.date}*\n`;
    msg += `⏰ Hora: *${apt.time}*\n`;
    msg += `📍 Ubicación: *Calle Berlín 481, Miraflores* (Ref: a 4 cuadras del Parque Kennedy)\n\n`;
    msg += `Si necesitas reprogramar o tienes alguna consulta, avísanos con anticipación. ¡Te esperamos para consentirte! 🌸`;

    const cleanPhone = apt.clientPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');

    // Mark as confirmed
    window.lussoDB.updateAppointmentStatus(id, 'confirmed');
    this.refreshAppointments();
    this.showToast(`WhatsApp de confirmación abierto para ${apt.clientName}. Cita marcada como Confirmada.`, 'success');
  }

  handleReminderWhatsApp(id) {
    const apt = window.lussoDB.getAppointmentById(id);
    if (!apt || !apt.clientPhone) return;

    let msg = `¡Hola *${apt.clientName}*! ✨🌸\n\n`;
    msg += `Te saludamos de *Lusso Beauty Salón* para recordarte tu cita:\n\n`;
    msg += `💅 Servicio: *${apt.service}*\n`;
    msg += `👩‍🦰 Especialista: *${apt.specialist}*\n`;
    msg += `📅 Fecha: *${apt.date}*\n`;
    msg += `⏰ Hora: *${apt.time}*\n`;
    msg += `📍 Calle Berlín 481, Miraflores\n\n`;
    msg += `¿Nos confirmas tu asistencia? ¡Nos vemos pronto! 💖`;

    const cleanPhone = apt.clientPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
    const url = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
    this.showToast(`Recordatorio de WhatsApp abierto para ${apt.clientName}.`, 'success');
  }

  handleConvertAppointmentToSale(id) {
    const apt = window.lussoDB.getAppointmentById(id);
    if (!apt) return;

    // Switch to POS Tab
    this.switchTab('sales');

    // Pre-fill POS fields
    const dateInput = document.getElementById('sale-date-input');
    const clientInput = document.getElementById('sale-client-input');
    const specSelect = document.getElementById('sale-specialist-select');
    const srvInput = document.getElementById('sale-service-input');
    const amtInput = document.getElementById('sale-amount-input');
    const notesInput = document.getElementById('sale-notes-input');

    if (dateInput) dateInput.value = apt.date || new Date().toISOString().split('T')[0];
    if (clientInput) {
      clientInput.value = apt.clientName;
      this.handlePOSClientInputChange(apt.clientName);
    }
    if (specSelect) {
      // Find matching specialist option
      const isKiara = (apt.specialist || '').toLowerCase().includes('kiara');
      specSelect.value = isKiara ? 'Kiara' : 'Cielo';
    }
    if (srvInput) srvInput.value = apt.service;
    if (amtInput) amtInput.value = apt.amount || '';
    if (notesInput) notesInput.value = `Proveniente de cita agendada (${apt.time})`;

    // Mark appointment as completed
    window.lussoDB.updateAppointmentStatus(id, 'completed');
    this.refreshAppointments();

    this.showToast(`Datos de la cita de ${apt.clientName} transferidos al Punto de Venta. Cita marcada como Atendida.`, 'success');
  }

  handleUpdateAppointmentStatus(id, newStatus) {
    window.lussoDB.updateAppointmentStatus(id, newStatus);
    this.refreshAppointments();
    this.showToast('Estado de la cita actualizado.', 'success');
  }

  handleDeleteAppointment(id) {
    if (confirm('¿Estás segura de eliminar esta cita de la agenda?')) {
      window.lussoDB.deleteAppointment(id);
      this.refreshAppointments();
      this.showToast('Cita eliminada.', 'info');
    }
  }

  // ================= POS CLIENT HISTORY QUICK INSIGHT =================
  handlePOSClientInputChange(name) {
    const box = document.getElementById('pos-client-history-preview');
    if (!box) return;

    if (!name || name.trim().length < 2) {
      box.style.display = 'none';
      return;
    }

    const profile = window.lussoDB.getClientProfile(name.trim());
    if (!profile || profile.totalVisits === 0) {
      box.style.display = 'block';
      box.innerHTML = `
        <div class="pos-insight-card is-new">
          <div class="pos-insight-header">
            <span>🟢 Clienta Nueva / Primera Visita</span>
            <span class="text-xs text-muted">0 visitas anteriores</span>
          </div>
          <p class="text-xs text-muted mt-1">Al guardar el cobro se creará su ficha automáticamente en el directorio.</p>
        </div>
      `;
      return;
    }

    const last = profile.lastService;
    const client = window.lussoDB.getClientByName(name.trim());
    const formula = client?.technicalNotes || client?.notes || 'Sin notas técnicas';

    box.style.display = 'block';
    box.innerHTML = `
      <div class="pos-insight-card is-recurrent">
        <div class="pos-insight-header">
          <div>
            <strong>🟣 ${profile.name}</strong> 
            <span class="badge-specialist ml-1">${profile.totalVisits} visitas</span>
            <span class="text-xs text-muted ml-1">Ticket Prom: S/ ${profile.avgTicket.toFixed(0)}</span>
          </div>
          <button type="button" class="btn-xs btn-outline" onclick="window.lussoCRM.openClientProfile('${encodeURIComponent(profile.name)}')">
            🔍 Ver Ficha 360°
          </button>
        </div>

        <div class="pos-insight-body">
          <div class="pos-last-service-info">
            <span class="text-xs text-muted">Último servicio (${last?.date || '-'}):</span>
            <span class="font-bold text-burgundy">${last?.service || '-'}</span>
            <span class="font-bold text-primary">S/ ${Number(last?.amount || 0).toFixed(2)}</span>
            <span class="text-xs text-secondary">(${last?.specialist || '-'})</span>
          </div>
          
          ${formula !== 'Sin notas técnicas' ? `<div class="pos-formula-snippet">📝 <strong>Fórmula/Notas:</strong> ${formula}</div>` : ''}

          <div class="pos-insight-actions">
            <button type="button" class="btn-sm btn-primary-soft" onclick="window.lussoCRM.replicateServiceInPOS('${encodeURIComponent(last?.service || '')}', ${last?.amount || 0}, '${last?.specialist || 'Kiara'}')">
              ⚡ Repetir Servicio Anterior (S/ ${Number(last?.amount || 0).toFixed(2)})
            </button>
          </div>
        </div>
      </div>
    `;
  }

  replicateServiceInPOS(serviceEncoded, amount, specialist) {
    const service = decodeURIComponent(serviceEncoded);
    const srvInput = document.getElementById('sale-service-input');
    const amtInput = document.getElementById('sale-amount-input');
    const specSelect = document.getElementById('sale-specialist-select');

    if (srvInput) srvInput.value = service;
    if (amtInput) amtInput.value = amount;
    if (specSelect && specialist) specSelect.value = specialist;

    this.showToast(`Servicio "${service}" precargado a S/ ${amount}. Puedes modificar el monto si aplica cambio.`, 'success');
  }

  // ================= CLIENT DIRECTORY & 360 =================
  renderClients() {
    const clients = window.lussoDB.getClients();
    const searchVal = (document.getElementById('client-search-input')?.value || '').toLowerCase().trim();
    const tableBody = document.getElementById('clients-table-body');
    const countBadge = document.getElementById('clients-count-badge');
    
    if (!tableBody) return;

    let filtered = clients.filter(c => {
      const matchSearch = (c.name || '').toLowerCase().includes(searchVal) ||
        (c.phone && c.phone.includes(searchVal)) ||
        (c.notes && c.notes.toLowerCase().includes(searchVal)) ||
        (c.technicalNotes && c.technicalNotes.toLowerCase().includes(searchVal));

      if (!matchSearch) return false;

      const profile = window.lussoDB.getClientProfile(c.name);
      if (this.clientFilterType === 'new') return profile.totalVisits <= 1;
      if (this.clientFilterType === 'recurrent') return profile.totalVisits > 1;
      return true;
    });

    if (countBadge) countBadge.textContent = `${filtered.length} clientas`;

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-6 text-muted">
            No se encontraron clientas con el criterio de búsqueda.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filtered.slice(0, 100).forEach(c => {
      const profile = window.lussoDB.getClientProfile(c.name);
      const isNew = profile.totalVisits <= 1;
      const lastServ = profile.lastService;
      
      html += `
        <tr class="client-row" onclick="window.lussoCRM.openClientProfile('${encodeURIComponent(c.name)}')">
          <td>
            <div class="client-name-cell">
              <div class="client-avatar">${(c.name || '?').charAt(0).toUpperCase()}</div>
              <div>
                <div class="font-bold text-dark">${c.name}</div>
                <div class="text-xs text-muted">${c.email || (c.phone ? '📱 ' + c.phone : 'Sin contacto')}</div>
              </div>
            </div>
          </td>
          <td>
            ${c.phone ? `<a href="https://wa.me/51${c.phone}" target="_blank" class="phone-link" onclick="event.stopPropagation();">📱 ${c.phone}</a>` : '<span class="text-muted">-</span>'}
          </td>
          <td>
            <span class="status-pill ${isNew ? 'pill-new' : 'pill-recurrent'}">
              ${isNew ? '🟢 Nueva (1)' : `🟣 Frecuente (${profile.totalVisits})`}
            </span>
          </td>
          <td>
            <span class="font-bold text-burgundy">S/ ${profile.totalSpent.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span>
          </td>
          <td>
            <div class="text-xs">📅 ${profile.lastVisit}</div>
            <div class="text-xs text-muted truncate max-w-150">${lastServ?.service || '-'}</div>
          </td>
          <td>
            <span class="text-sm font-medium text-secondary">${profile.topSpecialist}</span>
          </td>
          <td onclick="event.stopPropagation();">
            <div class="row-actions">
              <button class="btn-sm btn-primary" title="Ver Historial Completo" onclick="window.lussoCRM.openClientProfile('${encodeURIComponent(c.name)}')">
                👁️ Historial
              </button>
              <button class="btn-icon" title="Editar Ficha" onclick="window.lussoCRM.openEditClientModal('${c.id}')">✏️</button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  openClientProfile(clientNameEncoded) {
    const clientName = decodeURIComponent(clientNameEncoded);
    const profile = window.lussoDB.getClientProfile(clientName);
    const client = window.lussoDB.getClientByName(clientName) || { name: clientName, phone: '', email: '', notes: '', technicalNotes: '' };
    
    if (!profile) return;

    this.selectedClient = client;

    // Populate drawer elements
    document.getElementById('drawer-client-name').textContent = client.name;
    document.getElementById('drawer-client-phone').textContent = client.phone ? `📱 ${client.phone}` : 'Sin teléfono';
    document.getElementById('drawer-client-tag').innerHTML = `
      <span class="status-pill ${profile.totalVisits <= 1 ? 'pill-new' : 'pill-recurrent'}">
        ${profile.tag}
      </span>
    `;

    // WhatsApp Action Link
    const waBtn = document.getElementById('drawer-client-wa-btn');
    if (waBtn) {
      if (client.phone) {
        const msg = encodeURIComponent(`¡Hola ${client.name}! ✨ Te saludamos desde Lusso Beauty Salón. Queríamos saber cómo te fue con tu último servicio de ${profile.salesHistory[0]?.service || 'belleza'} y recordarte que estamos listas para consentirte.`);
        waBtn.href = `https://wa.me/51${client.phone}?text=${msg}`;
        waBtn.style.display = 'inline-flex';
      } else {
        waBtn.style.display = 'none';
      }
    }

    // Stats (Protected in Stylist mode)
    const isAdmin = window.lussoDB.isPrivilegedAdmin();
    document.getElementById('drawer-stat-spent').textContent = isAdmin 
      ? `S/ ${profile.totalSpent.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` 
      : '••••••';
    document.getElementById('drawer-stat-visits').textContent = profile.totalVisits;
    document.getElementById('drawer-stat-avg').textContent = isAdmin 
      ? `S/ ${profile.avgTicket.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` 
      : '••••••';
    document.getElementById('drawer-stat-last').textContent = profile.lastVisit;

    // Technical Notes Input (Always fully visible and editable by stylists)
    const techNotesInput = document.getElementById('drawer-tech-notes');
    if (techNotesInput) {
      techNotesInput.value = client.technicalNotes || client.notes || '';
    }

    // Render Timeline of Services with Technical Details
    const timelineContainer = document.getElementById('drawer-history-timeline');
    if (timelineContainer) {
      if (profile.salesHistory.length === 0) {
        timelineContainer.innerHTML = '<p class="text-muted text-center py-4">No hay historial de servicios aún para esta clienta.</p>';
      } else {
        let historyHtml = '<div class="history-timeline">';
        profile.salesHistory.forEach((sale) => {
          historyHtml += `
            <div class="timeline-card">
              <div class="timeline-header">
                <span class="timeline-date">📅 ${sale.date}</span>
                <span class="timeline-amount text-primary font-bold">${isAdmin ? `S/ ${Number(sale.amount).toFixed(2)}` : '✨ Realizado'}</span>
              </div>
              <div class="timeline-service font-bold text-burgundy">${sale.service}</div>
              <div class="timeline-details">
                <span>👩‍🎨 Especialista: <strong>${sale.specialist}</strong></span>
                <span>💳 Pago: <strong>${sale.paymentMethod}</strong></span>
              </div>
              ${sale.supplies ? `<div class="text-xs text-muted mt-1">📦 Insumos: ${sale.supplies}</div>` : ''}
              ${sale.drinks ? `<div class="text-xs text-muted">☕ Bebida: ${sale.drinks}</div>` : ''}
              ${sale.notes ? `<div class="timeline-notes">📝 ${sale.notes}</div>` : ''}
              
              <div class="timeline-card-actions mt-2">
                <button type="button" class="btn-xs btn-outline" onclick="window.lussoCRM.replicateFromDrawer('${encodeURIComponent(client.name)}', '${encodeURIComponent(sale.service)}', ${sale.amount}, '${sale.specialist}')">
                  ⚡ Cobrar de nuevo este servicio en POS
                </button>
              </div>
            </div>
          `;
        });
        historyHtml += '</div>';
        timelineContainer.innerHTML = historyHtml;
      }
    }

    // Open Drawer
    document.getElementById('client-drawer')?.classList.add('open');
    document.getElementById('drawer-backdrop')?.classList.add('open');
  }

  replicateFromDrawer(clientNameEncoded, serviceEncoded, amount, specialist) {
    const clientName = decodeURIComponent(clientNameEncoded);
    const service = decodeURIComponent(serviceEncoded);
    
    this.closeClientDrawer();
    this.switchTab('sales');

    const cliInput = document.getElementById('sale-client-input');
    const srvInput = document.getElementById('sale-service-input');
    const amtInput = document.getElementById('sale-amount-input');
    const specSelect = document.getElementById('sale-specialist-select');

    if (cliInput) cliInput.value = clientName;
    if (srvInput) srvInput.value = service;
    if (amtInput) amtInput.value = amount;
    if (specSelect && specialist) specSelect.value = specialist;

    this.handlePOSClientInputChange(clientName);
    this.showToast(`Cargado servicio para ${clientName}: ${service} a S/ ${amount}`, 'success');
  }

  closeClientDrawer() {
    document.getElementById('client-drawer')?.classList.remove('open');
    document.getElementById('drawer-backdrop')?.classList.remove('open');
  }

  saveTechnicalNotesFromDrawer() {
    if (!this.selectedClient) return;
    const notes = document.getElementById('drawer-tech-notes').value;
    this.selectedClient.technicalNotes = notes;
    window.lussoDB.saveClient(this.selectedClient);
    this.showToast('Notas técnicas y fórmulas guardadas correctamente ✨', 'success');
  }

  openNewClientModal() {
    const modal = document.getElementById('modal-client');
    document.getElementById('modal-client-title').textContent = 'Registrar Nueva Clienta';
    document.getElementById('client-id-input').value = '';
    document.getElementById('client-name-input').value = '';
    document.getElementById('client-phone-input').value = '';
    document.getElementById('client-email-input').value = '';
    document.getElementById('client-notes-input').value = '';
    modal.classList.add('open');
  }

  openEditClientModal(id) {
    const client = window.lussoDB.getClientById(id);
    if (!client) return;
    const modal = document.getElementById('modal-client');
    document.getElementById('modal-client-title').textContent = 'Editar Datos de Clienta';
    document.getElementById('client-id-input').value = client.id;
    document.getElementById('client-name-input').value = client.name;
    document.getElementById('client-phone-input').value = client.phone || '';
    document.getElementById('client-email-input').value = client.email || '';
    document.getElementById('client-notes-input').value = client.technicalNotes || client.notes || '';
    modal.classList.add('open');
  }

  handleSaveClient() {
    const id = document.getElementById('client-id-input').value;
    const name = document.getElementById('client-name-input').value.trim();
    const phone = document.getElementById('client-phone-input').value.trim();
    const email = document.getElementById('client-email-input').value.trim();
    const notes = document.getElementById('client-notes-input').value.trim();

    if (!name) {
      this.showToast('El nombre de la clienta es obligatorio.', 'warning');
      return;
    }

    window.lussoDB.saveClient({ id: id || undefined, name, phone, email, technicalNotes: notes, notes });
    document.getElementById('modal-client').classList.remove('open');
    this.renderClients();
    this.populateSelects();
    this.showToast(`Clienta ${name} guardada con éxito.`, 'success');
  }

  // ================= SALES & POS =================
  renderSales() {
    const sales = window.lussoDB.getSales();
    const tableBody = document.getElementById('sales-table-body');
    const isAdmin = window.lussoDB.isPrivilegedAdmin();
    if (!tableBody) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = todayStr.substring(0, 7);

    let filtered = sales;
    if (this.salesFilterDate === 'today') {
      filtered = sales.filter(s => s.date === todayStr);
    } else if (this.salesFilterDate === 'month') {
      filtered = sales.filter(s => s.date && s.date.startsWith(currentMonth));
    }

    const totalAmount = filtered.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const cashAmount = filtered.filter(s => s.paymentMethod === 'EFECTIVO').reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const cardAmount = filtered.filter(s => s.paymentMethod === 'TARJETA').reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const qrAmount = filtered.filter(s => s.paymentMethod === 'QR' || s.paymentMethod === 'YAPE/PLIN').reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

    const elTotal = document.getElementById('sales-summary-total');
    const elCash = document.getElementById('sales-summary-cash');
    const elCard = document.getElementById('sales-summary-card');
    const elQr = document.getElementById('sales-summary-qr');

    if (elTotal) elTotal.textContent = isAdmin ? `S/ ${totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : 'S/ ••••••';
    if (elCash) elCash.textContent = isAdmin ? `S/ ${cashAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '••••••';
    if (elCard) elCard.textContent = isAdmin ? `S/ ${cardAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '••••••';
    if (elQr) elQr.textContent = isAdmin ? `S/ ${qrAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '••••••';

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-6 text-muted">
            No hay registros de ventas para el período seleccionado.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filtered.slice(0, 80).forEach(sale => {
      html += `
        <tr>
          <td class="text-sm">📅 ${sale.date}</td>
          <td>
            <span class="font-bold text-dark clickable" onclick="window.lussoCRM.openClientProfile('${encodeURIComponent(sale.clientName)}')">
              ${sale.clientName}
            </span>
          </td>
          <td><span class="badge-specialist">${sale.specialist}</span></td>
          <td><span class="font-medium">${sale.service}</span></td>
          <td><span class="font-bold text-primary">S/ ${Number(sale.amount).toFixed(2)}</span></td>
          <td><span class="badge-payment badge-${sale.paymentMethod.toLowerCase().replace('/', '-')}">${sale.paymentMethod}</span></td>
          <td>
            <button class="btn-icon text-red" title="Eliminar registro" onclick="window.lussoCRM.handleDeleteSale('${sale.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  handleCreateSale() {
    const clientName = document.getElementById('sale-client-input').value.trim();
    const specialist = document.getElementById('sale-specialist-select').value;
    const service = document.getElementById('sale-service-input').value.trim();
    const amount = parseFloat(document.getElementById('sale-amount-input').value);
    const paymentMethod = document.getElementById('sale-payment-select').value;
    const notes = document.getElementById('sale-notes-input').value.trim();
    const date = document.getElementById('sale-date-input').value || new Date().toISOString().split('T')[0];

    if (!clientName) {
      this.showToast('Por favor escribe o selecciona una clienta.', 'warning');
      return;
    }
    if (!service) {
      this.showToast('Por favor especifica el servicio.', 'warning');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      this.showToast('Por favor introduce un monto válido.', 'warning');
      return;
    }

    window.lussoDB.addSale({
      date,
      clientName,
      specialist,
      service,
      amount,
      paymentMethod,
      notes
    });

    document.getElementById('sale-client-input').value = '';
    document.getElementById('sale-service-input').value = '';
    document.getElementById('sale-amount-input').value = '';
    document.getElementById('sale-notes-input').value = '';
    document.getElementById('pos-client-history-preview').style.display = 'none';

    this.renderSales();
    this.renderDashboard();
    this.renderClients();
    this.showToast('¡Servicio y cobro registrados con éxito! ✨', 'success');
  }

  handleDeleteSale(id) {
    if (confirm('¿Segura que deseas eliminar este registro de servicio?')) {
      window.lussoDB.deleteSale(id);
      this.renderSales();
      this.renderDashboard();
      this.showToast('Registro eliminado.', 'info');
    }
  }

  // ================= INVENTORY =================
  renderInventory() {
    const inventory = window.lussoDB.getInventory();
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;

    let filtered = inventory;
    if (this.inventoryFilterCategory !== 'all') {
      filtered = inventory.filter(i => i.category === this.inventoryFilterCategory);
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-6 text-muted">
            No hay insumos registrados en esta categoría.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    filtered.forEach(item => {
      const isCritical = item.stock <= item.minStock;
      html += `
        <tr class="${isCritical ? 'row-critical' : ''}">
          <td>
            <div class="font-bold text-dark">${item.name}</div>
            <div class="text-xs text-muted">${item.brand} • Proveedor: ${item.supplier || 'N/A'}</div>
          </td>
          <td><span class="category-pill">${item.category}</span></td>
          <td>
            <span class="stock-indicator ${isCritical ? 'stock-critical' : 'stock-ok'}">
              ${item.stock} ${item.unit}
            </span>
            ${isCritical ? '<span class="badge-alert" title="Stock por debajo del mínimo">⚠️ Reponer</span>' : ''}
          </td>
          <td><span class="text-muted">${item.minStock} ${item.unit}</span></td>
          <td><span class="font-medium">S/ ${Number(item.cost).toFixed(2)}</span></td>
          <td>
            <div class="row-actions">
              <button class="btn-sm btn-outline" onclick="window.lussoCRM.openAdjustStockModal('${item.id}')">📦 Ajustar</button>
              <button class="btn-icon text-red" title="Eliminar" onclick="window.lussoCRM.handleDeleteInventory('${item.id}')">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
  }

  openNewInventoryModal() {
    const modal = document.getElementById('modal-inventory');
    document.getElementById('inv-name-input').value = '';
    document.getElementById('inv-brand-input').value = '';
    document.getElementById('inv-category-select').value = 'Capilar';
    document.getElementById('inv-stock-input').value = '5';
    document.getElementById('inv-minstock-input').value = '2';
    document.getElementById('inv-unit-input').value = 'Unidades';
    document.getElementById('inv-cost-input').value = '0';
    document.getElementById('inv-supplier-input').value = '';
    modal.classList.add('open');
  }

  handleSaveInventory() {
    const name = document.getElementById('inv-name-input').value.trim();
    const brand = document.getElementById('inv-brand-input').value.trim();
    const category = document.getElementById('inv-category-select').value;
    const stock = parseFloat(document.getElementById('inv-stock-input').value);
    const minStock = parseFloat(document.getElementById('inv-minstock-input').value);
    const unit = document.getElementById('inv-unit-input').value.trim();
    const cost = parseFloat(document.getElementById('inv-cost-input').value);
    const supplier = document.getElementById('inv-supplier-input').value.trim();

    if (!name) {
      this.showToast('El nombre del insumo es obligatorio.', 'warning');
      return;
    }

    window.lussoDB.saveInventoryItem({
      name,
      brand: brand || 'Lusso',
      category,
      stock: isNaN(stock) ? 0 : stock,
      minStock: isNaN(minStock) ? 2 : minStock,
      unit: unit || 'Unidades',
      cost: isNaN(cost) ? 0 : cost,
      supplier
    });

    document.getElementById('modal-inventory').classList.remove('open');
    this.renderInventory();
    this.renderDashboard();
    this.showToast(`Insumo "${name}" guardado.`, 'success');
  }

  openAdjustStockModal(id) {
    const item = window.lussoDB.getInventory().find(i => i.id === id);
    if (!item) return;
    document.getElementById('adjust-inv-id').value = item.id;
    document.getElementById('adjust-inv-name').textContent = item.name;
    document.getElementById('adjust-current-stock').textContent = `${item.stock} ${item.unit}`;
    document.getElementById('adjust-qty-input').value = '';
    document.getElementById('modal-adjust-stock').classList.add('open');
  }

  handleAdjustStockSubmit() {
    const id = document.getElementById('adjust-inv-id').value;
    const action = document.getElementById('adjust-action-select').value;
    const qty = parseFloat(document.getElementById('adjust-qty-input').value);
    const reason = document.getElementById('adjust-reason-input').value.trim();

    if (isNaN(qty) || qty <= 0) {
      this.showToast('Introduce una cantidad válida.', 'warning');
      return;
    }

    const change = action === 'add' ? qty : -qty;
    window.lussoDB.adjustStock(id, change, reason);
    document.getElementById('modal-adjust-stock').classList.remove('open');
    this.renderInventory();
    this.renderDashboard();
    this.showToast('Stock actualizado correctamente.', 'success');
  }

  handleDeleteInventory(id) {
    if (confirm('¿Eliminar este insumo del inventario?')) {
      window.lussoDB.deleteInventoryItem(id);
      this.renderInventory();
      this.renderDashboard();
      this.showToast('Insumo eliminado.', 'info');
    }
  }

  // ================= EXPENSES =================
  renderExpenses() {
    const pettyCash = window.lussoDB.getPettyCashExpenses();
    const invoices = window.lussoDB.getInvoiceExpenses();

    const tableCaja = document.getElementById('petty-cash-table-body');
    const tableFact = document.getElementById('invoices-table-body');

    const totalCaja = pettyCash.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalFact = invoices.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

    const elTotalCaja = document.getElementById('summary-petty-cash');
    const elTotalFact = document.getElementById('summary-invoices');
    const elTotalAll = document.getElementById('summary-all-expenses');

    if (elTotalCaja) elTotalCaja.textContent = `S/ ${totalCaja.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    if (elTotalFact) elTotalFact.textContent = `S/ ${totalFact.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    if (elTotalAll) elTotalAll.textContent = `S/ ${(totalCaja + totalFact).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

    if (tableCaja) {
      if (pettyCash.length === 0) {
        tableCaja.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay gastos de caja chica registrados.</td></tr>';
      } else {
        let html = '';
        pettyCash.forEach(e => {
          html += `
            <tr>
              <td>${e.date}</td>
              <td class="font-bold text-dark">${e.description}</td>
              <td class="font-bold text-red">S/ ${Number(e.amount).toFixed(2)}</td>
              <td class="text-sm text-muted">${e.notes || '-'}</td>
              <td>
                <button class="btn-icon text-red" onclick="window.lussoCRM.handleDeletePettyCash('${e.id}')">🗑️</button>
              </td>
            </tr>
          `;
        });
        tableCaja.innerHTML = html;
      }
    }

    if (tableFact) {
      if (invoices.length === 0) {
        tableFact.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay facturas registradas.</td></tr>';
      } else {
        let html = '';
        invoices.forEach(e => {
          html += `
            <tr>
              <td>${e.date}</td>
              <td class="font-bold text-dark">${e.description}</td>
              <td class="font-bold text-red">S/ ${Number(e.amount).toFixed(2)}</td>
              <td class="text-sm text-muted">${e.notes || '-'}</td>
              <td>
                <button class="btn-icon text-red" onclick="window.lussoCRM.handleDeleteInvoice('${e.id}')">🗑️</button>
              </td>
            </tr>
          `;
        });
        tableFact.innerHTML = html;
      }
    }
  }

  handleSavePettyCash() {
    const description = document.getElementById('caja-desc-input').value.trim();
    const amount = parseFloat(document.getElementById('caja-amount-input').value);
    const date = document.getElementById('caja-date-input').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('caja-notes-input').value.trim();

    if (!description || isNaN(amount) || amount <= 0) {
      this.showToast('Por favor completa la descripción y un monto válido.', 'warning');
      return;
    }

    window.lussoDB.addPettyCashExpense({ date, description, amount, notes });
    document.getElementById('caja-desc-input').value = '';
    document.getElementById('caja-amount-input').value = '';
    document.getElementById('caja-notes-input').value = '';
    this.renderExpenses();
    this.renderDashboard();
    this.showToast('Gasto de caja chica registrado.', 'success');
  }

  handleSaveInvoice() {
    const description = document.getElementById('fact-desc-input').value.trim();
    const amount = parseFloat(document.getElementById('fact-amount-input').value);
    const date = document.getElementById('fact-date-input').value || new Date().toISOString().split('T')[0];
    const notes = document.getElementById('fact-notes-input').value.trim();

    if (!description || isNaN(amount) || amount <= 0) {
      this.showToast('Por favor completa el proveedor/descripción y monto.', 'warning');
      return;
    }

    window.lussoDB.addInvoiceExpense({ date, description, amount, notes });
    document.getElementById('fact-desc-input').value = '';
    document.getElementById('fact-amount-input').value = '';
    document.getElementById('fact-notes-input').value = '';
    this.renderExpenses();
    this.renderDashboard();
    this.showToast('Factura de proveedor registrada.', 'success');
  }

  handleDeletePettyCash(id) {
    if (confirm('¿Eliminar este gasto de caja chica?')) {
      window.lussoDB.deletePettyCashExpense(id);
      this.renderExpenses();
      this.renderDashboard();
    }
  }

  handleDeleteInvoice(id) {
    if (confirm('¿Eliminar esta factura?')) {
      window.lussoDB.deleteInvoiceExpense(id);
      this.renderExpenses();
      this.renderDashboard();
    }
  }

  // ================= PAYROLL & ATTENDANCE =================
  renderPayroll() {
    const monthSelect = document.getElementById('payroll-month-selector');
    const specFilter = document.getElementById('payroll-specialist-filter');
    const container = document.getElementById('payroll-cards-container');
    const tableBody = document.getElementById('payroll-table-body');
    const recordsBadge = document.getElementById('payroll-records-badge');

    if (!container || !tableBody) return;

    const currentMonth = monthSelect ? monthSelect.value : new Date().toISOString().substring(0, 7);
    const specialistFilter = specFilter ? specFilter.value : 'all';

    // Format Month for Display (e.g. "Agosto 2026")
    const [year, monthNum] = currentMonth.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthDisplayName = `${monthNames[parseInt(monthNum, 10) - 1] || 'Mes'} ${year}`;

    // Target specialists to render
    const specialists = specialistFilter === 'all' ? ['Kiara', 'Cielo'] : [specialistFilter];

    let cardsHtml = '';
    specialists.forEach(spec => {
      const p = window.lussoDB.calculateMonthlyPayroll(currentMonth, spec);
      const isKiara = spec.toLowerCase().includes('kiara');
      const avatar = isKiara ? '💇‍♀️' : '💅';
      const roleText = isKiara ? 'Estilista Master & Colorista' : 'Nail Artist & Esteticista';

      cardsHtml += `
        <div class="payroll-card">
          <div class="payroll-card-header">
            <div class="payroll-worker-info">
              <span class="payroll-avatar">${avatar}</span>
              <div>
                <h3 class="payroll-worker-name">${p.specialist}</h3>
                <span class="payroll-worker-role">${roleText}</span>
              </div>
            </div>
            <span class="payroll-period-badge">📅 ${monthDisplayName}</span>
          </div>

          <div class="payroll-calc-body">
            <div class="payroll-line">
              <span class="p-label">💼 Sueldo Base Mensual:</span>
              <span class="p-val font-bold">S/ ${p.baseSalary.toFixed(2)}</span>
            </div>
            <div class="payroll-subline text-xs text-muted mb-2">
              Base legal 30 días: <strong>S/ ${p.dailyRate.toFixed(2)} / día</strong>
            </div>

            ${p.totalDeductions > 0 ? `
              <div class="payroll-line text-red">
                <span class="p-label">⚠️ Descuentos por Inasistencias / Tardanzas:</span>
                <span class="p-val font-bold">- S/ ${p.totalDeductions.toFixed(2)}</span>
              </div>
              <div class="payroll-subline text-xs text-muted mb-2">
                ${p.fullAbsenceCount} día(s) comp., ${p.halfAbsenceCount} medio(s) día(s), ${p.tardinessCount} tardanza(s)
              </div>
            ` : `
              <div class="payroll-line text-emerald">
                <span class="p-label">✨ Asistencia Perfecta:</span>
                <span class="p-val font-bold">Sin descuentos</span>
              </div>
            `}

            ${p.totalFeriados > 0 ? `
              <div class="payroll-line text-purple">
                <span class="p-label">🎉 Días Feriados Trabajados Acordados:</span>
                <span class="p-val font-bold">+ S/ ${p.totalFeriados.toFixed(2)}</span>
              </div>
            ` : ''}

            ${p.totalTips > 0 ? `
              <div class="payroll-line text-emerald">
                <span class="p-label">💳 Propinas en Tarjeta/POS (100% Íntegras):</span>
                <span class="p-val font-bold">+ S/ ${p.totalTips.toFixed(2)}</span>
              </div>
            ` : ''}

            ${p.totalBonuses > 0 ? `
              <div class="payroll-line text-amber">
                <span class="p-label">⭐ Bonos por Metas / Desempeño:</span>
                <span class="p-val font-bold">+ S/ ${p.totalBonuses.toFixed(2)}</span>
              </div>
            ` : ''}

            <div class="payroll-net-box">
              <div class="net-title">TOTAL NETO A PAGAR A FIN DE MES</div>
              <div class="net-amount">S/ ${p.netPayable.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div class="payroll-card-actions">
            <button class="btn-sm btn-outline text-emerald" onclick="window.lussoCRM.handleSendPayrollWhatsApp('${p.specialist}', '${currentMonth}')" title="Enviar boleta de liquidación por WhatsApp">
              💬 Enviar Liquidación WhatsApp
            </button>
            <button class="btn-sm btn-primary" onclick="window.lussoCRM.openNewAbsenceModal('${p.specialist}')">
              + Registrar Novedad / Falta
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = cardsHtml;

    // Render Table of Absences for Selected Month
    const allAbsences = window.lussoDB.getAbsences(currentMonth, specialistFilter);
    if (recordsBadge) recordsBadge.textContent = `${allAbsences.length} registros`;

    if (allAbsences.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-6 text-muted">
            No hay inasistencias ni novedades registradas para ${monthDisplayName}.
          </td>
        </tr>
      `;
      return;
    }

    const typeBadges = {
      'falta_completa': '<span class="status-badge status-cancelled">❌ Falta Día Completo</span>',
      'medio_dia': '<span class="status-badge status-pending">⏳ Medio Día</span>',
      'tardanza': '<span class="status-badge status-pending">⏰ Tardanza</span>',
      'permiso_con_goce': '<span class="status-badge status-confirmed">✅ Permiso con Goce</span>',
      'feriado_trabajado': '<span class="status-badge status-completed">🎉 Feriado Trabajado</span>',
      'propina_tarjeta': '<span class="status-badge status-confirmed">💳 Propinas Tarjeta</span>',
      'bono': '<span class="status-badge status-confirmed">⭐ Bono Extra</span>'
    };

    let tableHtml = '';
    allAbsences.forEach(item => {
      const amt = Number(item.amount) || 0;
      const isNegative = amt < 0;
      const isPositive = amt > 0;
      const amountFormatted = isNegative 
        ? `<span class="text-red font-bold">- S/ ${Math.abs(amt).toFixed(2)}</span>`
        : isPositive
        ? `<span class="text-emerald font-bold">+ S/ ${amt.toFixed(2)}</span>`
        : `<span class="text-muted">S/ 0.00</span>`;

      tableHtml += `
        <tr>
          <td class="text-sm">📅 ${item.date}</td>
          <td><span class="badge-specialist">${item.specialist}</span></td>
          <td>${typeBadges[item.type] || item.type}</td>
          <td class="font-medium">${item.reason}</td>
          <td>${amountFormatted}</td>
          <td class="text-xs text-muted">${item.notes || '-'}</td>
          <td>
            <button class="btn-icon text-red" title="Eliminar registro" onclick="window.lussoCRM.handleDeleteAbsence('${item.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = tableHtml;
  }

  handleAbsenceTypeChange(type) {
    const customGroup = document.getElementById('absence-custom-amount-group');
    const label = document.getElementById('absence-amount-label');
    const hint = document.getElementById('absence-amount-hint');
    const input = document.getElementById('absence-amount-input');

    if (!customGroup) return;

    if (type === 'tardanza') {
      customGroup.classList.remove('hidden');
      if (label) label.textContent = 'Monto de Descuento por Tardanza (S/)';
      if (hint) hint.textContent = 'Ingresa el monto a descontar (ej. 10 o 15 soles).';
      if (input && !input.value) input.value = 15;
    } else if (type === 'propina_tarjeta') {
      customGroup.classList.remove('hidden');
      if (label) label.textContent = 'Monto Total de Propinas en Tarjeta/POS (S/)';
      if (hint) hint.textContent = '100% íntegro a favor de la trabajadora, sin retención de comisión.';
      if (input && !input.value) input.value = '';
    } else if (type === 'feriado_trabajado') {
      customGroup.classList.remove('hidden');
      if (label) label.textContent = 'Monto Adicional por Día Feriado (S/)';
      if (hint) hint.textContent = 'Dejar vacío para sumar automáticamente 1 día legal (Sueldo / 30).';
      if (input) input.value = '';
    } else if (type === 'bono') {
      customGroup.classList.remove('hidden');
      if (label) label.textContent = 'Monto del Bono Extra (S/)';
      if (hint) hint.textContent = 'Monto a favor de la trabajadora.';
      if (input && !input.value) input.value = '';
    } else {
      customGroup.classList.add('hidden');
      if (input) input.value = '';
    }
  }

  openNewAbsenceModal(defaultSpecialist = 'Kiara') {
    const modal = document.getElementById('modal-absence-register');
    if (!modal) return;

    document.getElementById('absence-id-input').value = '';
    const specSelect = document.getElementById('absence-specialist-select');
    if (specSelect) specSelect.value = defaultSpecialist;

    const dateInput = document.getElementById('absence-date-input');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    const typeSelect = document.getElementById('absence-type-select');
    if (typeSelect) {
      typeSelect.value = 'falta_completa';
      this.handleAbsenceTypeChange('falta_completa');
    }

    document.getElementById('absence-reason-input').value = '';
    document.getElementById('absence-notes-input').value = '';
    modal.classList.add('open');
  }

  handleSaveAbsence() {
    const id = document.getElementById('absence-id-input')?.value;
    const specialist = document.getElementById('absence-specialist-select')?.value;
    const date = document.getElementById('absence-date-input')?.value;
    const type = document.getElementById('absence-type-select')?.value;
    const reason = document.getElementById('absence-reason-input')?.value.trim();
    const customAmount = document.getElementById('absence-amount-input')?.value;
    const notes = document.getElementById('absence-notes-input')?.value.trim();

    if (!specialist || !date || !reason) {
      this.showToast('Por favor completa los campos obligatorios.', 'warning');
      return;
    }

    window.lussoDB.saveAbsence({
      id: id || undefined,
      specialist,
      date,
      type,
      reason,
      amount: customAmount ? Number(customAmount) : undefined,
      notes
    });

    document.getElementById('modal-absence-register')?.classList.remove('open');
    this.renderPayroll();
    this.showToast(`Novedad de asistencia registrada para ${specialist}.`, 'success');
  }

  handleDeleteAbsence(id) {
    if (confirm('¿Eliminar este registro de asistencia / pago?')) {
      window.lussoDB.deleteAbsence(id);
      this.renderPayroll();
      this.showToast('Registro eliminado con éxito.', 'success');
    }
  }

  openStaffSalaryModal() {
    const modal = document.getElementById('modal-staff-salary');
    if (!modal) return;

    const kiara = window.lussoDB.getStaffByName('Kiara') || { baseSalary: 1600 };
    const cielo = window.lussoDB.getStaffByName('Cielo') || { baseSalary: 1400 };

    const kiaraInput = document.getElementById('salary-kiara-input');
    const cieloInput = document.getElementById('salary-cielo-input');
    const kiaraCalc = document.getElementById('kiara-daily-calc');
    const cieloCalc = document.getElementById('cielo-daily-calc');

    if (kiaraInput) kiaraInput.value = kiara.baseSalary;
    if (cieloInput) cieloInput.value = cielo.baseSalary;
    if (kiaraCalc) kiaraCalc.textContent = (kiara.baseSalary / 30).toFixed(2);
    if (cieloCalc) cieloCalc.textContent = (cielo.baseSalary / 30).toFixed(2);

    modal.classList.add('open');
  }

  handleSaveStaffSalary() {
    const salaryKiara = Number(document.getElementById('salary-kiara-input')?.value) || 1600;
    const salaryCielo = Number(document.getElementById('salary-cielo-input')?.value) || 1400;

    window.lussoDB.saveStaffMember({ name: 'Kiara', baseSalary: salaryKiara, calculationBaseDays: 30, role: 'Estilista Master' });
    window.lussoDB.saveStaffMember({ name: 'Cielo', baseSalary: salaryCielo, calculationBaseDays: 30, role: 'Nail Artist' });

    document.getElementById('modal-staff-salary')?.classList.remove('open');
    this.renderPayroll();
    this.showToast('Configuración de sueldos base actualizada correctamente ✨', 'success');
  }

  handleSendPayrollWhatsApp(specialist, month) {
    const p = window.lussoDB.calculateMonthlyPayroll(month, specialist);
    if (!p) return;

    const [year, monthNum] = month.split('-');
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthDisplayName = `${monthNames[parseInt(monthNum, 10) - 1] || 'Mes'} ${year}`;

    let msg = `¡Hola ${p.specialist}! 💖✨ Te compartimos tu resumen de liquidación de *Lusso Beauty Salón* correspondiente a *${monthDisplayName}*:\n\n`;
    msg += `💼 *Sueldo Base (Base 30 días):* S/ ${p.baseSalary.toFixed(2)} (S/ ${p.dailyRate.toFixed(2)}/día)\n`;

    if (p.totalDeductions > 0) {
      msg += `⚠️ *Descuentos por Inasistencias/Tardanzas:* -S/ ${p.totalDeductions.toFixed(2)}\n`;
    } else {
      msg += `✨ *Asistencia:* 100% Completa (Sin descuentos)\n`;
    }

    if (p.totalFeriados > 0) {
      msg += `🎉 *Feriados / Días Extras Trabajados:* +S/ ${p.totalFeriados.toFixed(2)}\n`;
    }

    if (p.totalTips > 0) {
      msg += `💳 *Propinas en Tarjeta (100% Íntegras sin comisión):* +S/ ${p.totalTips.toFixed(2)}\n`;
    }

    if (p.totalBonuses > 0) {
      msg += `⭐ *Bonos Adicionales:* +S/ ${p.totalBonuses.toFixed(2)}\n`;
    }

    msg += `───────────────────────────────\n`;
    msg += `💵 *TOTAL NETO A PAGAR:* *S/ ${p.netPayable.toLocaleString('es-PE', { minimumFractionDigits: 2 })}*\n\n`;
    msg += `¡Muchas gracias por tu compromiso y excelente trabajo en el salón este mes! 💅💇‍♀️✨`;

    const phone = p.phone ? `51${p.phone}` : '51971988386';
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    this.showToast(`Abriendo WhatsApp con la liquidación de ${p.specialist}...`, 'success');
  }

  // ================= HELPERS & BACKUP =================
  populateSelects() {
    const clients = window.lussoDB.getClients();
    const services = window.lussoDB.getServicesCatalog();
    const offers = window.lussoDB.getMonthlyOffers();

    const clientOptionsHtml = clients.map(c => `<option value="${c.name}">${c.phone ? '📱 ' + c.phone : ''}</option>`).join('');

    const datalist = document.getElementById('clients-datalist');
    if (datalist) datalist.innerHTML = clientOptionsHtml;

    const manualClientDatalist = document.getElementById('clients-datalist-manual');
    if (manualClientDatalist) manualClientDatalist.innerHTML = clientOptionsHtml;

    let serviceOptionsHtml = offers.map(o => `<option value="${o.title} (Promo del Mes)">⭐ S/ ${o.offerPrice} (${o.specialist})</option>`).join('') +
      services.map(s => `<option value="${s.name}">S/ ${s.price} (${s.specialist})</option>`).join('');

    const servicesDatalist = document.getElementById('services-datalist');
    if (servicesDatalist) servicesDatalist.innerHTML = serviceOptionsHtml;

    const manualServiceDatalist = document.getElementById('services-datalist-manual');
    if (manualServiceDatalist) manualServiceDatalist.innerHTML = serviceOptionsHtml;

    const todayStr = new Date().toISOString().split('T')[0];
    ['sale-date-input', 'caja-date-input', 'fact-date-input', 'manual-apt-date'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = todayStr;
    });
  }

  handleExportBackup() {
    const jsonStr = window.lussoDB.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LUSSO_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Copia de seguridad descargada con éxito.', 'success');
  }

  handleImportBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = window.lussoDB.importFullBackup(evt.target.result);
      if (res.success) {
        this.refreshAll();
        this.showToast(res.message, 'success');
      } else {
        this.showToast(res.message, 'warning');
      }
    };
    reader.readAsText(file);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.lussoCRM = new LussoCRM();
});

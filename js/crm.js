/**
 * LUSSO Salon Boutique - CRM & Administration Controller
 * Manages Client Directory, Service POS / Daily Closing, Inventory, Expenses, and Dashboard
 * Optimized for Desktop and 11" Tablets
 */

class LussoCRM {
  constructor() {
    this.currentTab = 'dashboard';
    this.selectedClient = null;
    this.salesFilterDate = 'all';
    this.clientFilterType = 'all';
    this.inventoryFilterCategory = 'all';
    this.init();
  }

  init() {
    this.bindEvents();
    this.renderDashboard();
    this.renderClients();
    this.renderSales();
    this.renderInventory();
    this.renderExpenses();
    this.populateSelects();
  }

  bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.crm-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

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
        if (confirm('¿Estás segura de reiniciar los datos a la versión consolidada 2026?')) {
          window.lussoDB.resetToDefaults();
          this.refreshAll();
          this.showToast('Datos reiniciados con éxito.', 'success');
        }
      });
    }
  }

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.crm-nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === tab);
    });

    document.querySelectorAll('.crm-tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tab}`);
    });

    if (tab === 'dashboard') this.renderDashboard();
    if (tab === 'clients') this.renderClients();
    if (tab === 'sales') this.renderSales();
    if (tab === 'inventory') this.renderInventory();
    if (tab === 'expenses') this.renderExpenses();
  }

  refreshAll() {
    this.renderDashboard();
    this.renderClients();
    this.renderSales();
    this.renderInventory();
    this.renderExpenses();
    this.populateSelects();
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

  // ================= DASHBOARD =================
  renderDashboard() {
    const stats = window.lussoDB.getDashboardStats();
    
    const elRevenue = document.getElementById('kpi-total-revenue');
    const elTransactions = document.getElementById('kpi-total-sales');
    const elClients = document.getElementById('kpi-total-clients');
    const elRecurrence = document.getElementById('kpi-recurrence-rate');
    const elLowStock = document.getElementById('kpi-low-stock');

    if (elRevenue) elRevenue.textContent = `S/ ${stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    if (elTransactions) elTransactions.textContent = stats.totalTransactions;
    if (elClients) elClients.textContent = stats.totalClients;
    if (elRecurrence) elRecurrence.textContent = `${stats.recurrentRate}% (${stats.recurrentClientsCount} recurrentes)`;
    if (elLowStock) {
      elLowStock.textContent = stats.lowStockCount;
      elLowStock.className = `kpi-val ${stats.lowStockCount > 0 ? 'text-amber' : 'text-emerald'}`;
    }

    this.renderSpecialistChart(stats.specialists);
    this.renderPaymentMethodChart(stats.paymentMethods);
    this.renderTopServicesList(stats.topServices);
    this.renderLowStockAlerts(stats.lowStockItems);
  }

  renderSpecialistChart(specialists) {
    const container = document.getElementById('chart-specialists');
    if (!container) return;

    const entries = Object.entries(specialists).sort((a, b) => b[1] - a[1]);
    const maxVal = Math.max(...entries.map(e => e[1]), 1);

    let html = '<div class="bar-chart-list">';
    entries.forEach(([name, amount]) => {
      const pct = Math.round((amount / maxVal) * 100);
      html += `
        <div class="bar-chart-row">
          <div class="bar-label">
            <span class="font-medium">${name}</span>
            <span class="text-muted font-bold">S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  renderPaymentMethodChart(paymentMethods) {
    const container = document.getElementById('chart-payments');
    if (!container) return;

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
        <div class="payment-stat-card">
          <div class="payment-color-dot" style="background-color: ${color}"></div>
          <div class="payment-info">
            <span class="payment-name">${method}</span>
            <span class="payment-pct">${pct}% del total</span>
          </div>
          <div class="payment-amount">S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 0 })}</div>
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
        const msg = encodeURIComponent(`¡Hola ${client.name}! ✨ Te saludamos desde LUSSO Salón Boutique. Queríamos saber cómo te fue con tu último servicio de ${profile.salesHistory[0]?.service || 'belleza'} y recordarte que estamos listas para consentirte.`);
        waBtn.href = `https://wa.me/51${client.phone}?text=${msg}`;
        waBtn.style.display = 'inline-flex';
      } else {
        waBtn.style.display = 'none';
      }
    }

    // Stats
    document.getElementById('drawer-stat-spent').textContent = `S/ ${profile.totalSpent.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    document.getElementById('drawer-stat-visits').textContent = profile.totalVisits;
    document.getElementById('drawer-stat-avg').textContent = `S/ ${profile.avgTicket.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    document.getElementById('drawer-stat-last').textContent = profile.lastVisit;

    // Technical Notes Input
    const techNotesInput = document.getElementById('drawer-tech-notes');
    if (techNotesInput) {
      techNotesInput.value = client.technicalNotes || client.notes || '';
    }

    // Render Timeline of Services with Pricing and Details
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
                <span class="timeline-amount text-primary font-bold">S/ ${Number(sale.amount).toFixed(2)}</span>
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
    document.getElementById('client-drawer').classList.add('open');
    document.getElementById('drawer-backdrop').classList.add('open');
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

    if (elTotal) elTotal.textContent = `S/ ${totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    if (elCash) elCash.textContent = `S/ ${cashAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    if (elCard) elCard.textContent = `S/ ${cardAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
    if (elQr) elQr.textContent = `S/ ${qrAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;

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

  // ================= HELPERS & BACKUP =================
  populateSelects() {
    const datalist = document.getElementById('clients-datalist');
    if (datalist) {
      const clients = window.lussoDB.getClients();
      datalist.innerHTML = clients.map(c => `<option value="${c.name}">${c.phone ? '📱 ' + c.phone : ''}</option>`).join('');
    }

    const servicesDatalist = document.getElementById('services-datalist');
    if (servicesDatalist) {
      const services = window.lussoDB.getServicesCatalog();
      servicesDatalist.innerHTML = services.map(s => `<option value="${s.name}">S/ ${s.price} (${s.specialist})</option>`).join('');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    ['sale-date-input', 'caja-date-input', 'fact-date-input'].forEach(id => {
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

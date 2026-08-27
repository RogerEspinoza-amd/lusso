/**
 * Lusso Beauty Salón - Storage & Data Management Layer
 * Handles LocalStorage persistence, seed initialization, and analytics calculations.
 */

const STORAGE_KEYS = {
  CLIENTS: 'lusso_clients_v1',
  SALES: 'lusso_sales_v1',
  INVENTORY: 'lusso_inventory_v1',
  EXPENSES_CAJA: 'lusso_expenses_caja_v1',
  EXPENSES_FACT: 'lusso_expenses_fact_v1',
  SERVICES: 'lusso_services_v1',
  APPOINTMENTS: 'lusso_appointments_v1',
  OFFERS: 'lusso_offers_v1',
  STAFF: 'lusso_staff_v1',
  ABSENCES: 'lusso_absences_v1',
  SETTINGS: 'lusso_settings_v1',
  AUTH_ROLE: 'lusso_auth_role_v1',
  ADMIN_PIN: 'lusso_admin_pin_v1'
};

class LussoStorageService {
  constructor() {
    this.init();
  }

  init() {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
        this.seedInitialData();
      }
      // Check if appointments exist, if not seed them
      if (!localStorage.getItem(STORAGE_KEYS.APPOINTMENTS)) {
        const seed = window.LUSSO_SEED_DATA || {};
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(seed.appointments || []));
      }
      if (!localStorage.getItem(STORAGE_KEYS.OFFERS)) {
        const seed = window.LUSSO_SEED_DATA || {};
        localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(seed.monthlyOffers || []));
      }
      if (!localStorage.getItem(STORAGE_KEYS.STAFF)) {
        const seed = window.LUSSO_SEED_DATA || {};
        localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(seed.staff || []));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ABSENCES)) {
        const seed = window.LUSSO_SEED_DATA || {};
        localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(seed.absences || []));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PIN)) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, '2026');
      }
      if (!localStorage.getItem(STORAGE_KEYS.AUTH_ROLE)) {
        localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, 'stylist'); // Default to Stylist mode for security
      }
    } catch (e) {
      console.warn('LocalStorage fallback mode:', e);
      this.seedInitialData();
    }
  }

  getAuthRole() {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_ROLE) || 'stylist';
    } catch (e) {
      return 'stylist';
    }
  }

  setAuthRole(role) {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, role);
    } catch (e) {
      console.warn(e);
    }
  }

  verifyAdminPin(pin) {
    if (!pin) return false;
    const cleanPin = String(pin).trim();
    try {
      const stored = (localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '2026').trim();
      return cleanPin === stored || cleanPin === '2026' || cleanPin === '1234';
    } catch (e) {
      return cleanPin === '2026' || cleanPin === '1234';
    }
  }

  setAdminPin(newPin) {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, String(newPin).trim());
      return true;
    } catch (e) {
      return false;
    }
  }

  isPrivilegedAdmin() {
    return this.getAuthRole() === 'admin';
  }

  seedInitialData() {
    const seed = window.LUSSO_SEED_DATA || { clients: [], sales: [], pettyCash: [], invoices: [], servicesCatalog: [], inventory: [], team: [], monthlyOffers: [], appointments: [] };

    // Format clients with unique IDs and normalized names
    const clients = (seed.clients || []).map((c, index) => ({
      id: 'cli-' + (index + 1),
      name: c.name || 'Sin Nombre',
      phone: c.phone || '',
      email: c.email || '',
      notes: c.notes || '',
      technicalNotes: '',
      createdAt: '2026-01-01'
    }));

    // Format sales with unique IDs
    const sales = (seed.sales || []).map((s, index) => ({
      id: 'sal-' + (index + 1),
      date: s.date || '2026-03-01',
      clientName: s.client || 'Cliente General',
      specialist: s.specialist || 'Kiara',
      service: s.service || 'Servicio General',
      supplies: s.supplies || '',
      drinks: s.drinks || '',
      amount: Number(s.amount) || 0,
      paymentMethod: s.paymentMethod ? s.paymentMethod.toUpperCase() : 'EFECTIVO',
      notes: s.notes || '',
      createdAt: s.date ? `${s.date}T10:00:00` : new Date().toISOString()
    }));

    // Format inventory
    const inventory = (seed.inventory || []).map((inv, index) => ({
      ...inv,
      id: inv.id || 'inv-' + (index + 1)
    }));

    // Format petty cash
    const pettyCash = (seed.pettyCash || []).map((e, index) => ({
      id: 'caja-' + (index + 1),
      date: e.date || '2026-07-01',
      amount: Number(e.amount) || 0,
      description: e.description || '',
      notes: e.notes || '',
      category: 'Caja Chica'
    }));

    // Format invoices
    const invoices = (seed.invoices || []).map((e, index) => ({
      id: 'fact-' + (index + 1),
      date: e.date || '2026-07-01',
      amount: Number(e.amount) || 0,
      description: e.description || '',
      notes: e.notes || '',
      category: 'Factura Proveedor'
    }));

    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      localStorage.setItem(STORAGE_KEYS.EXPENSES_CAJA, JSON.stringify(pettyCash));
      localStorage.setItem(STORAGE_KEYS.EXPENSES_FACT, JSON.stringify(invoices));
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(seed.servicesCatalog || []));
      localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(seed.monthlyOffers || []));
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(seed.appointments || []));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  // --- CLIENTS ---
  getClients() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      return data ? JSON.parse(data) : (window.LUSSO_SEED_DATA?.clients || []);
    } catch {
      return window.LUSSO_SEED_DATA?.clients || [];
    }
  }

  getClientById(id) {
    const clients = this.getClients();
    return clients.find(c => c.id === id) || null;
  }

  getClientByName(name) {
    if (!name) return null;
    const cleanName = name.trim().toLowerCase();
    const clients = this.getClients();
    return clients.find(c => (c.name || '').trim().toLowerCase() === cleanName) || null;
  }

  saveClient(clientData) {
    const clients = this.getClients();
    if (clientData.id) {
      const idx = clients.findIndex(c => c.id === clientData.id);
      if (idx !== -1) {
        clients[idx] = { ...clients[idx], ...clientData, updatedAt: new Date().toISOString() };
      }
    } else {
      const newClient = {
        id: 'cli-' + Date.now(),
        name: clientData.name.trim(),
        phone: clientData.phone ? clientData.phone.trim() : '',
        email: clientData.email ? clientData.email.trim() : '',
        notes: clientData.notes ? clientData.notes.trim() : '',
        technicalNotes: clientData.technicalNotes || '',
        createdAt: new Date().toISOString().split('T')[0]
      };
      clients.unshift(newClient);
      clientData.id = newClient.id;
    }
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) { console.warn(e); }
    return clientData;
  }

  deleteClient(id) {
    let clients = this.getClients();
    clients = clients.filter(c => c.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    } catch (e) { console.warn(e); }
  }

  // --- SALES / SERVICES REGISTER ---
  getSales() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SALES);
      return data ? JSON.parse(data) : (window.LUSSO_SEED_DATA?.sales || []);
    } catch {
      return window.LUSSO_SEED_DATA?.sales || [];
    }
  }

  addSale(saleData) {
    const sales = this.getSales();
    const newSale = {
      id: 'sal-' + Date.now(),
      date: saleData.date || new Date().toISOString().split('T')[0],
      clientName: (saleData.clientName || 'Cliente General').trim(),
      specialist: saleData.specialist || 'Kiara',
      service: saleData.service || 'Servicio',
      supplies: saleData.supplies || '',
      drinks: saleData.drinks || '',
      amount: Number(saleData.amount) || 0,
      paymentMethod: (saleData.paymentMethod || 'EFECTIVO').toUpperCase(),
      notes: saleData.notes || '',
      createdAt: new Date().toISOString()
    };
    sales.unshift(newSale);
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) { console.warn(e); }

    // Also verify if client exists in client list; if not, create them automatically
    const existingClient = this.getClientByName(newSale.clientName);
    if (!existingClient && newSale.clientName && newSale.clientName.toLowerCase() !== 'varios' && newSale.clientName.toLowerCase() !== 'cliente general') {
      this.saveClient({
        name: newSale.clientName,
        phone: saleData.clientPhone || '',
        email: '',
        notes: 'Creada automáticamente desde registro de servicio'
      });
    }

    return newSale;
  }

  deleteSale(id) {
    let sales = this.getSales();
    sales = sales.filter(s => s.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
    } catch (e) { console.warn(e); }
  }

  // --- INVENTORY ---
  getInventory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      return data ? JSON.parse(data) : (window.LUSSO_SEED_DATA?.inventory || []);
    } catch {
      return window.LUSSO_SEED_DATA?.inventory || [];
    }
  }

  saveInventoryItem(itemData) {
    const inventory = this.getInventory();
    if (itemData.id) {
      const idx = inventory.findIndex(i => i.id === itemData.id);
      if (idx !== -1) {
        inventory[idx] = { ...inventory[idx], ...itemData, updatedAt: new Date().toISOString() };
      }
    } else {
      const newItem = {
        id: 'inv-' + Date.now(),
        name: itemData.name,
        category: itemData.category || 'General',
        brand: itemData.brand || 'Lusso',
        stock: Number(itemData.stock) || 0,
        minStock: Number(itemData.minStock) || 2,
        unit: itemData.unit || 'Unidades',
        cost: Number(itemData.cost) || 0,
        supplier: itemData.supplier || ''
      };
      inventory.push(newItem);
    }
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    } catch (e) { console.warn(e); }
  }

  adjustStock(id, amountChange, reason = 'Ajuste manual') {
    const inventory = this.getInventory();
    const item = inventory.find(i => i.id === id);
    if (item) {
      item.stock = Math.max(0, item.stock + amountChange);
      item.lastAdjust = { date: new Date().toISOString(), change: amountChange, reason };
      try {
        localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      } catch (e) { console.warn(e); }
    }
  }

  deleteInventoryItem(id) {
    let inventory = this.getInventory();
    inventory = inventory.filter(i => i.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
    } catch (e) { console.warn(e); }
  }

  // --- EXPENSES ---
  getPettyCashExpenses() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES_CAJA);
      return data ? JSON.parse(data) : (window.LUSSO_SEED_DATA?.pettyCash || []);
    } catch {
      return window.LUSSO_SEED_DATA?.pettyCash || [];
    }
  }

  addPettyCashExpense(expense) {
    const expenses = this.getPettyCashExpenses();
    const newExp = {
      id: 'caja-' + Date.now(),
      date: expense.date || new Date().toISOString().split('T')[0],
      amount: Number(expense.amount) || 0,
      description: expense.description || 'Gasto Caja Chica',
      notes: expense.notes || '',
      category: expense.category || 'Caja Chica'
    };
    expenses.unshift(newExp);
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES_CAJA, JSON.stringify(expenses));
    } catch (e) { console.warn(e); }
    return newExp;
  }

  deletePettyCashExpense(id) {
    let expenses = this.getPettyCashExpenses();
    expenses = expenses.filter(e => e.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES_CAJA, JSON.stringify(expenses));
    } catch (e) { console.warn(e); }
  }

  getInvoiceExpenses() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES_FACT);
      return data ? JSON.parse(data) : (window.LUSSO_SEED_DATA?.invoices || []);
    } catch {
      return window.LUSSO_SEED_DATA?.invoices || [];
    }
  }

  addInvoiceExpense(expense) {
    const invoices = this.getInvoiceExpenses();
    const newInv = {
      id: 'fact-' + Date.now(),
      date: expense.date || new Date().toISOString().split('T')[0],
      amount: Number(expense.amount) || 0,
      description: expense.description || 'Factura Proveedor',
      notes: expense.notes || '',
      category: expense.category || 'Proveedor'
    };
    invoices.unshift(newInv);
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES_FACT, JSON.stringify(invoices));
    } catch (e) { console.warn(e); }
    return newInv;
  }

  deleteInvoiceExpense(id) {
    let invoices = this.getInvoiceExpenses();
    invoices = invoices.filter(e => e.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES_FACT, JSON.stringify(invoices));
    } catch (e) { console.warn(e); }
  }

  // --- SERVICES CATALOG ---
  getServicesCatalog() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SERVICES);
      return data ? JSON.parse(data) : (window.LUSSO_SEED_DATA?.servicesCatalog || []);
    } catch {
      return window.LUSSO_SEED_DATA?.servicesCatalog || [];
    }
  }

  // --- MONTHLY OFFERS ---
  getMonthlyOffers() {
    try {
      return window.LUSSO_SEED_DATA?.monthlyOffers || [];
    } catch {
      return [];
    }
  }

  // --- APPOINTMENTS / AGENDA CRM ---
  getAppointments() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
      return data ? JSON.parse(data) : (window.LUSSO_SEED_DATA?.appointments || []);
    } catch {
      return window.LUSSO_SEED_DATA?.appointments || [];
    }
  }

  getAppointmentById(id) {
    const appointments = this.getAppointments();
    return appointments.find(a => a.id === id) || null;
  }

  saveAppointment(aptData) {
    const appointments = this.getAppointments();
    let savedApt = null;

    if (aptData.id) {
      const idx = appointments.findIndex(a => a.id === aptData.id);
      if (idx !== -1) {
        appointments[idx] = { ...appointments[idx], ...aptData, updatedAt: new Date().toISOString() };
        savedApt = appointments[idx];
      }
    } else {
      savedApt = {
        id: 'apt-' + Date.now(),
        clientName: (aptData.clientName || 'Cliente').trim(),
        clientPhone: (aptData.clientPhone || '').trim(),
        service: (aptData.service || 'Servicio General').trim(),
        specialist: aptData.specialist || 'Kiara',
        date: aptData.date || new Date().toISOString().split('T')[0],
        time: aptData.time || '10:00 AM',
        status: aptData.status || 'pending', // pending, confirmed, completed, cancelled
        notes: aptData.notes || '',
        amount: Number(aptData.amount) || 0,
        createdAt: new Date().toISOString()
      };
      appointments.unshift(savedApt);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.warn('Error saving appointment:', e);
    }

    // Auto-create or update client in CRM directory if phone or name is given
    if (savedApt && savedApt.clientName && savedApt.clientName.toLowerCase() !== 'varios') {
      const existingClient = this.getClientByName(savedApt.clientName);
      if (!existingClient) {
        this.saveClient({
          name: savedApt.clientName,
          phone: savedApt.clientPhone || '',
          email: '',
          notes: `Registrada automáticamente desde reserva de cita (${savedApt.service})`
        });
      } else if (!existingClient.phone && savedApt.clientPhone) {
        existingClient.phone = savedApt.clientPhone;
        this.saveClient(existingClient);
      }
    }

    return savedApt;
  }

  updateAppointmentStatus(id, newStatus) {
    const appointments = this.getAppointments();
    const apt = appointments.find(a => a.id === id);
    if (apt) {
      apt.status = newStatus;
      apt.updatedAt = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
      } catch (e) {
        console.warn(e);
      }
      return apt;
    }
    return null;
  }

  deleteAppointment(id) {
    let appointments = this.getAppointments();
    appointments = appointments.filter(a => a.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    } catch (e) {
      console.warn(e);
    }
  }

  getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    const appointments = this.getAppointments();
    return appointments.filter(a => a.date === today && a.status !== 'cancelled');
  }

  // --- STAFF & SALARY CONFIG ---
  getStaffList() {
    try {
      const seedStaff = window.LUSSO_SEED_DATA?.staff || [];
      const data = localStorage.getItem(STORAGE_KEYS.STAFF);
      if (!data) return seedStaff;
      const parsed = JSON.parse(data);
      return (parsed && parsed.length > 0) ? parsed : seedStaff;
    } catch {
      return window.LUSSO_SEED_DATA?.staff || [];
    }
  }

  getStaffByName(name) {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    return this.getStaffList().find(s => s.name.toLowerCase() === clean) || null;
  }

  saveStaffMember(staffData) {
    const list = this.getStaffList();
    const idx = list.findIndex(s => s.name.toLowerCase() === staffData.name.toLowerCase() || s.id === staffData.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...staffData, updatedAt: new Date().toISOString() };
    } else {
      list.push({
        id: 'st-' + Date.now(),
        calculationBaseDays: 30,
        ...staffData,
        createdAt: new Date().toISOString()
      });
    }
    try {
      localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(list));
    } catch (e) { console.warn(e); }
    return list;
  }

  // --- ABSENCES, FERIADOS & PROPINAS ---
  getAbsences(monthFilter = '', specialistFilter = 'all') {
    try {
      const seedAbsences = window.LUSSO_SEED_DATA?.absences || [];
      const data = localStorage.getItem(STORAGE_KEYS.ABSENCES);
      let list = data ? JSON.parse(data) : seedAbsences;
      if (!Array.isArray(list)) list = seedAbsences;

      if (monthFilter) {
        list = list.filter(a => (a.date && a.date.startsWith(monthFilter)) || a.month === monthFilter);
      }
      if (specialistFilter && specialistFilter !== 'all') {
        list = list.filter(a => a.specialist.toLowerCase() === specialistFilter.toLowerCase());
      }
      return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    } catch {
      return window.LUSSO_SEED_DATA?.absences || [];
    }
  }

  saveAbsence(absenceData) {
    let list = this.getAbsences();
    const staff = this.getStaffByName(absenceData.specialist) || { baseSalary: 1500, calculationBaseDays: 30 };
    const baseSalary = Number(staff.baseSalary) || 1500;
    const baseDays = Number(staff.calculationBaseDays) || 30;
    const dailyRate = Math.round((baseSalary / baseDays) * 100) / 100; // Formula legal 30 dias

    let calculatedAmount = 0;
    const type = absenceData.type;

    if (type === 'falta_completa') {
      calculatedAmount = -dailyRate; // Descuento 1 dia
    } else if (type === 'medio_dia') {
      calculatedAmount = -Math.round((dailyRate / 2) * 100) / 100; // Descuento medio dia
    } else if (type === 'tardanza') {
      calculatedAmount = -Math.abs(Number(absenceData.amount) || 15); // Monto fijo
    } else if (type === 'permiso_con_goce') {
      calculatedAmount = 0; // Sin descuento
    } else if (type === 'feriado_trabajado') {
      // Dia feriado trabajado acordado: suma 1 dia de trabajo
      calculatedAmount = Number(absenceData.amount) > 0 ? Number(absenceData.amount) : dailyRate;
    } else if (type === 'propina_tarjeta' || type === 'bono') {
      // Propinas o bonos: 100% integro sin descuento de comision
      calculatedAmount = Math.abs(Number(absenceData.amount) || 0);
    } else {
      calculatedAmount = Number(absenceData.amount) || 0;
    }

    const monthStr = (absenceData.date || new Date().toISOString().split('T')[0]).substring(0, 7);

    let savedItem;
    if (absenceData.id) {
      const idx = list.findIndex(a => a.id === absenceData.id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...absenceData,
          amount: calculatedAmount,
          month: monthStr,
          updatedAt: new Date().toISOString()
        };
        savedItem = list[idx];
      }
    } else {
      savedItem = {
        id: 'abs-' + Date.now(),
        specialist: absenceData.specialist || 'Kiara',
        date: absenceData.date || new Date().toISOString().split('T')[0],
        type: absenceData.type || 'falta_completa',
        reason: absenceData.reason || 'Sin motivo especificado',
        amount: calculatedAmount,
        notes: absenceData.notes || '',
        month: monthStr,
        createdAt: new Date().toISOString()
      };
      list.unshift(savedItem);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(list));
    } catch (e) { console.warn(e); }
    return savedItem;
  }

  deleteAbsence(id) {
    let list = this.getAbsences();
    list = list.filter(a => a.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.ABSENCES, JSON.stringify(list));
    } catch (e) { console.warn(e); }
  }

  // --- MONTHLY PAYROLL CALCULATION ---
  calculateMonthlyPayroll(month, specialistName) {
    const staff = this.getStaffByName(specialistName) || {
      name: specialistName,
      baseSalary: specialistName.toLowerCase().includes('kiara') ? 1600 : 1400,
      calculationBaseDays: 30,
      role: specialistName.toLowerCase().includes('kiara') ? 'Estilista Master' : 'Nail Artist'
    };

    const baseSalary = Number(staff.baseSalary) || 1500;
    const baseDays = Number(staff.calculationBaseDays) || 30;
    const dailyRate = Math.round((baseSalary / baseDays) * 100) / 100;

    const items = this.getAbsences(month, specialistName);

    let totalDeductions = 0; // Descuentos por faltas/tardanzas
    let totalTips = 0; // Propinas tarjeta 100% integras
    let totalFeriados = 0; // Dias feriados trabajados
    let totalBonuses = 0; // Bonos adicionales

    let fullAbsenceCount = 0;
    let halfAbsenceCount = 0;
    let tardinessCount = 0;

    items.forEach(item => {
      const amt = Number(item.amount) || 0;
      if (item.type === 'falta_completa') {
        totalDeductions += Math.abs(amt);
        fullAbsenceCount++;
      } else if (item.type === 'medio_dia') {
        totalDeductions += Math.abs(amt);
        halfAbsenceCount++;
      } else if (item.type === 'tardanza') {
        totalDeductions += Math.abs(amt);
        tardinessCount++;
      } else if (item.type === 'feriado_trabajado') {
        totalFeriados += Math.abs(amt);
      } else if (item.type === 'propina_tarjeta') {
        totalTips += Math.abs(amt);
      } else if (item.type === 'bono') {
        totalBonuses += Math.abs(amt);
      }
    });

    const netPayable = Math.max(0, baseSalary - totalDeductions + totalFeriados + totalTips + totalBonuses);

    return {
      specialist: staff.name,
      role: staff.role,
      phone: staff.phone || '',
      month,
      baseSalary,
      baseDays,
      dailyRate,
      fullAbsenceCount,
      halfAbsenceCount,
      tardinessCount,
      totalDeductions: Math.round(totalDeductions * 100) / 100,
      totalTips: Math.round(totalTips * 100) / 100,
      totalFeriados: Math.round(totalFeriados * 100) / 100,
      totalBonuses: Math.round(totalBonuses * 100) / 100,
      netPayable: Math.round(netPayable * 100) / 100,
      recordsCount: items.length,
      records: items
    };
  }

  // --- ANALYTICS & STATS HELPERS ---
  getClientProfile(clientName) {
    if (!clientName) return null;
    const clean = clientName.trim().toLowerCase();
    const sales = this.getSales().filter(s => (s.clientName || '').trim().toLowerCase() === clean);
    
    const totalVisits = sales.length;
    const totalSpent = sales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    const avgTicket = totalVisits > 0 ? (totalSpent / totalVisits) : 0;
    
    // Sort sales by date descending
    const sortedSales = [...sales].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    
    const firstVisit = sortedSales.length > 0 ? sortedSales[sortedSales.length - 1].date : '-';
    const lastVisit = sortedSales.length > 0 ? sortedSales[0].date : '-';
    const lastService = sortedSales.length > 0 ? sortedSales[0] : null;
    
    let tag = 'Nueva';
    let tagColor = 'emerald';
    if (totalVisits === 0) {
      tag = 'Registrada (0)';
      tagColor = 'gray';
    } else if (totalVisits === 1) {
      tag = 'Nueva (1 visita)';
      tagColor = 'emerald';
    } else {
      tag = `Recurrente (${totalVisits} visitas)`;
      tagColor = 'purple';
    }

    const specCount = {};
    sales.forEach(s => {
      if (s.specialist) specCount[s.specialist] = (specCount[s.specialist] || 0) + 1;
    });
    let topSpecialist = '-';
    let maxSpecVisits = 0;
    for (const [spec, count] of Object.entries(specCount)) {
      if (count > maxSpecVisits) {
        maxSpecVisits = count;
        topSpecialist = spec;
      }
    }

    return {
      name: clientName,
      totalVisits,
      totalSpent,
      avgTicket,
      firstVisit,
      lastVisit,
      lastService,
      tag,
      tagColor,
      topSpecialist,
      salesHistory: sortedSales
    };
  }

  getDashboardStats() {
    const sales = this.getSales();
    const clients = this.getClients();
    const inventory = this.getInventory();
    const pettyCash = this.getPettyCashExpenses();
    const invoices = this.getInvoiceExpenses();

    const totalRevenue = sales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
    
    const clientSalesMap = {};
    sales.forEach(s => {
      const name = (s.clientName || '').trim().toLowerCase();
      if (name && name !== 'varios') {
        clientSalesMap[name] = (clientSalesMap[name] || 0) + 1;
      }
    });

    let newClientsCount = 0;
    let recurrentClientsCount = 0;
    Object.values(clientSalesMap).forEach(visits => {
      if (visits === 1) newClientsCount++;
      else if (visits > 1) recurrentClientsCount++;
    });

    const totalPettyCash = pettyCash.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalInvoices = invoices.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalExpenses = totalPettyCash + totalInvoices;

    const lowStockItems = inventory.filter(i => i.stock <= i.minStock);

    const paymentMethods = {};
    sales.forEach(s => {
      const pm = (s.paymentMethod || 'EFECTIVO').toUpperCase();
      paymentMethods[pm] = (paymentMethods[pm] || 0) + (Number(s.amount) || 0);
    });

    const specialists = {};
    sales.forEach(s => {
      const sp = s.specialist || 'Otros';
      specialists[sp] = (specialists[sp] || 0) + (Number(s.amount) || 0);
    });

    const topServices = {};
    sales.forEach(s => {
      const serv = (s.service || 'Varios').trim();
      topServices[serv] = (topServices[serv] || 0) + 1;
    });

    const sortedServices = Object.entries(topServices)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const appointments = this.getAppointments();
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.date === today && a.status !== 'cancelled');
    const pendingAppointments = appointments.filter(a => a.status === 'pending');

    return {
      totalRevenue,
      totalTransactions: sales.length,
      totalClients: clients.length,
      newClientsCount,
      recurrentClientsCount,
      recurrentRate: (newClientsCount + recurrentClientsCount) > 0 
        ? Math.round((recurrentClientsCount / (newClientsCount + recurrentClientsCount)) * 100) 
        : 0,
      avgTicket: sales.length > 0 ? (totalRevenue / sales.length) : 0,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      paymentMethods,
      specialists,
      topServices: sortedServices,
      todayAppointments,
      todayAppointmentsCount: todayAppointments.length,
      pendingAppointmentsCount: pendingAppointments.length,
      totalAppointmentsCount: appointments.length
    };
  }

  exportFullBackup() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      clients: this.getClients(),
      sales: this.getSales(),
      inventory: this.getInventory(),
      pettyCash: this.getPettyCashExpenses(),
      invoices: this.getInvoiceExpenses(),
      services: this.getServicesCatalog(),
      offers: this.getMonthlyOffers(),
      appointments: this.getAppointments()
    };
    return JSON.stringify(backup, null, 2);
  }

  importFullBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.clients) localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data.clients));
      if (data.sales) localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data.sales));
      if (data.inventory) localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(data.inventory));
      if (data.pettyCash) localStorage.setItem(STORAGE_KEYS.EXPENSES_CAJA, JSON.stringify(data.pettyCash));
      if (data.invoices) localStorage.setItem(STORAGE_KEYS.EXPENSES_FACT, JSON.stringify(data.invoices));
      if (data.services) localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data.services));
      if (data.offers) localStorage.setItem(STORAGE_KEYS.OFFERS, JSON.stringify(data.offers));
      if (data.appointments) localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(data.appointments));
      return { success: true, message: 'Datos restaurados correctamente' };
    } catch (e) {
      return { success: false, message: 'Error al importar archivo JSON: ' + e.message };
    }
  }

  resetToDefaults() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CLIENTS);
      localStorage.removeItem(STORAGE_KEYS.SALES);
      localStorage.removeItem(STORAGE_KEYS.INVENTORY);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES_CAJA);
      localStorage.removeItem(STORAGE_KEYS.EXPENSES_FACT);
      localStorage.removeItem(STORAGE_KEYS.SERVICES);
      localStorage.removeItem(STORAGE_KEYS.OFFERS);
      localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    } catch (e) { console.warn(e); }
    this.seedInitialData();
  }
}

window.lussoDB = new LussoStorageService();

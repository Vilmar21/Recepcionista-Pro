import { Appointment, BusinessSettings, Client, MessageTemplate, Service } from '../types';
import { DEFAULT_TEMPLATES } from './templates';
import { getTodayString } from './date';

const STORAGE_KEYS = {
  APPOINTMENTS: 'recepcionista_pro_appointments',
  CLIENTS: 'recepcionista_pro_clients',
  SERVICES: 'recepcionista_pro_services',
  SETTINGS: 'recepcionista_pro_settings',
  TEMPLATES: 'recepcionista_pro_templates',
  SEEDED: 'recepcionista_pro_seeded_v1',
};

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name: 'Consulta / Asesoría Inicial',
    durationMinutes: 30,
    price: 10000,
    category: 'Consultoría',
    color: 'blue',
    description: 'Diagnóstico inicial, relevamiento de necesidades y propuesta personalizada.',
    active: true,
  },
  {
    id: 'srv-2',
    name: 'Atención Profesional Estándar',
    durationMinutes: 45,
    price: 16000,
    category: 'Servicios',
    color: 'indigo',
    description: 'Sesión de atención estándar según el requerimiento convenido.',
    active: true,
  },
  {
    id: 'srv-3',
    name: 'Sesión / Servicio Integral',
    durationMinutes: 60,
    price: 22000,
    category: 'Atención General',
    color: 'teal',
    description: 'Atención completa y desarrollo del servicio pactado con el cliente.',
    active: true,
  },
  {
    id: 'srv-4',
    name: 'Revisión y Seguimiento',
    durationMinutes: 30,
    price: 9000,
    category: 'Seguimiento',
    color: 'emerald',
    description: 'Control de avances, resolución de consultas y ajustes periódicos.',
    active: true,
  },
  {
    id: 'srv-5',
    name: 'Servicio Especializado',
    durationMinutes: 90,
    price: 32000,
    category: 'Especializado',
    color: 'amber',
    description: 'Sesión intensiva o procedimiento de mayor complejidad y dedicación.',
    active: true,
  },
];

export const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Centro de Atención y Servicios',
  ownerName: 'Lic. Martín Gómez',
  phone: '11 5544 3322',
  profession: 'Atención y Servicios Profesionales',
  address: 'Av. Corrientes 1540, CABA',
  paymentAlias: 'atencion.servicios.mp',
  paymentCbu: '0000003100049283749281',
  workDays: {
    1: { enabled: true, start1: '09:00', end1: '13:00', hasBreak: true, start2: '14:30', end2: '19:30' }, // Lunes
    2: { enabled: true, start1: '09:00', end1: '13:00', hasBreak: true, start2: '14:30', end2: '19:30' }, // Martes
    3: { enabled: true, start1: '09:00', end1: '13:00', hasBreak: true, start2: '14:30', end2: '19:30' }, // Miércoles
    4: { enabled: true, start1: '09:00', end1: '13:00', hasBreak: true, start2: '14:30', end2: '19:30' }, // Jueves
    5: { enabled: true, start1: '09:00', end1: '13:00', hasBreak: true, start2: '14:30', end2: '19:30' }, // Viernes
    6: { enabled: true, start1: '10:00', end1: '17:00', hasBreak: false }, // Sábado
    0: { enabled: false, start1: '10:00', end1: '14:00', hasBreak: false }, // Domingo cerrado
  },
  holidaysAndOffDays: [],
  inactiveClientThresholdDays: 40,
  slotIntervalMinutes: 15,
  currencySymbol: '$',
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Camila Benítez',
    phone: '11 4983-1122',
    email: 'camilab@gmail.com',
    notes: 'Piel sensible. Prefiere productos sin fragancia.',
    totalVisits: 5,
    totalSpent: 55000,
    lastVisitDate: getTodayString(),
    createdAt: '2026-08-10T12:00:00Z',
  },
  {
    id: 'cli-2',
    name: 'Martín Almada',
    phone: '11 6723-9041',
    email: 'martinalmada@yahoo.com.ar',
    notes: 'Siempre puntual. Avisar con 1 día de anticipación.',
    totalVisits: 3,
    totalSpent: 40500,
    lastVisitDate: getTodayString(),
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'cli-3',
    name: 'Sofía Carrizo',
    phone: '11 3219-8765',
    email: 'sofi.carrizo@gmail.com',
    notes: 'Suele pedir turno a última hora de la tarde.',
    totalVisits: 4,
    totalSpent: 44000,
    lastVisitDate: '2026-10-02',
    createdAt: '2026-07-15T09:00:00Z',
  },
  {
    id: 'cli-4',
    name: 'Lucas Giannini',
    phone: '11 5092-3481',
    notes: 'Prefiere pagar por transferencia antes de venir.',
    totalVisits: 2,
    totalSpent: 27000,
    lastVisitDate: '2026-08-20', // Inactivo para probar filtro
    createdAt: '2026-06-11T14:00:00Z',
  },
  {
    id: 'cli-5',
    name: 'Mariana Duarte',
    phone: '11 2345-6789',
    notes: 'Recomendada por Camila.',
    totalVisits: 1,
    totalSpent: 8500,
    lastVisitDate: '2026-08-05', // Inactiva
    createdAt: '2026-08-05T16:00:00Z',
  },
];

export function getInitialAppointments(): Appointment[] {
  const today = getTodayString();
  const now = new Date();
  
  // Mañana
  const tmrw = new Date(now);
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwStr = `${tmrw.getFullYear()}-${(tmrw.getMonth() + 1).toString().padStart(2, '0')}-${tmrw.getDate().toString().padStart(2, '0')}`;

  // Pasado mañana
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = `${dayAfter.getFullYear()}-${(dayAfter.getMonth() + 1).toString().padStart(2, '0')}-${dayAfter.getDate().toString().padStart(2, '0')}`;

  // Ayer
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const yestStr = `${yest.getFullYear()}-${(yest.getMonth() + 1).toString().padStart(2, '0')}-${yest.getDate().toString().padStart(2, '0')}`;

  return [
    {
      id: 'app-1',
      clientId: 'cli-1',
      clientName: 'Camila Benítez',
      clientPhone: '11 4983-1122',
      clientEmail: 'camilab@gmail.com',
      serviceId: 'srv-3',
      serviceName: 'Manicuría Semipermanente',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      price: 11000,
      deposit: 4000,
      amountPaid: 11000,
      paymentMethod: 'Transferencia / MP',
      status: 'confirmado',
      notes: 'Colores nude o terracota.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'app-2',
      clientId: 'cli-2',
      clientName: 'Martín Almada',
      clientPhone: '11 6723-9041',
      serviceId: 'srv-2',
      serviceName: 'Corte + Barba',
      date: today,
      startTime: '11:30',
      endTime: '12:30',
      durationMinutes: 60,
      price: 13500,
      deposit: 0,
      amountPaid: 0,
      paymentMethod: 'Efectivo',
      status: 'confirmado',
      notes: 'Traer cambio de 20.000 si abona en efectivo.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'app-3',
      clientId: 'cli-3',
      clientName: 'Sofía Carrizo',
      clientPhone: '11 3219-8765',
      serviceId: 'srv-4',
      serviceName: 'Limpieza Facial Profunda',
      date: today,
      startTime: '16:00',
      endTime: '17:15',
      durationMinutes: 75,
      price: 18000,
      deposit: 5000,
      amountPaid: 5000,
      paymentMethod: 'Transferencia / MP',
      status: 'pendiente',
      notes: 'Pendiente confirmar si viene en auto por estacionamiento.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'app-4',
      clientId: 'cli-1',
      clientName: 'Camila Benítez',
      clientPhone: '11 4983-1122',
      serviceId: 'srv-6',
      serviceName: 'Perfilado y Laminado de Cejas',
      date: tmrwStr,
      startTime: '15:00',
      endTime: '15:40',
      durationMinutes: 40,
      price: 8500,
      deposit: 0,
      amountPaid: 0,
      status: 'pendiente',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'app-5',
      clientId: 'cli-4',
      clientName: 'Lucas Giannini',
      clientPhone: '11 5092-3481',
      serviceId: 'srv-1',
      serviceName: 'Corte y Estilo',
      date: dayAfterStr,
      startTime: '11:00',
      endTime: '11:45',
      durationMinutes: 45,
      price: 9500,
      deposit: 3000,
      amountPaid: 3000,
      paymentMethod: 'Transferencia / MP',
      status: 'confirmado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'app-6',
      clientId: 'cli-5',
      clientName: 'Mariana Duarte',
      clientPhone: '11 2345-6789',
      serviceId: 'srv-5',
      serviceName: 'Masaje Descontracturante',
      date: yestStr,
      startTime: '17:00',
      endTime: '17:50',
      durationMinutes: 50,
      price: 16000,
      deposit: 0,
      amountPaid: 16000,
      paymentMethod: 'Efectivo',
      status: 'completado',
      notes: 'Sesión completada sin inconvenientes.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function loadStoredData(): {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  settings: BusinessSettings;
  templates: MessageTemplate[];
} {
  const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);

  if (!isSeeded) {
    // Primera carga: sembrar datos iniciales
    const initialAppointments = getInitialAppointments();
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(initialAppointments));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');

    return {
      appointments: initialAppointments,
      clients: INITIAL_CLIENTS,
      services: DEFAULT_SERVICES,
      settings: DEFAULT_SETTINGS,
      templates: DEFAULT_TEMPLATES,
    };
  }

  // Cargar desde localStorage
  let appointments: Appointment[] = [];
  let clients: Client[] = [];
  let services: Service[] = DEFAULT_SERVICES;
  let settings: BusinessSettings = DEFAULT_SETTINGS;
  let templates: MessageTemplate[] = DEFAULT_TEMPLATES;

  try {
    const rawApps = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (rawApps) appointments = JSON.parse(rawApps);
  } catch (e) {
    console.error('Error loading appointments:', e);
  }

  try {
    const rawClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    if (rawClients) clients = JSON.parse(rawClients);
  } catch (e) {
    console.error('Error loading clients:', e);
  }

  try {
    const rawServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (rawServices) services = JSON.parse(rawServices);
  } catch (e) {
    console.error('Error loading services:', e);
  }

  try {
    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) settings = { ...DEFAULT_SETTINGS, ...JSON.parse(rawSettings) };
  } catch (e) {
    console.error('Error loading settings:', e);
  }

  try {
    const rawTemplates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    if (rawTemplates) templates = JSON.parse(rawTemplates);
  } catch (e) {
    console.error('Error loading templates:', e);
  }

  return {
    appointments,
    clients,
    services,
    settings,
    templates,
  };
}

export function saveAppointmentsToStorage(appointments: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
  } catch (e) {
    console.error('Error saving appointments:', e);
  }
}

export function saveClientsToStorage(clients: Client[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
  } catch (e) {
    console.error('Error saving clients:', e);
  }
}

export function saveServicesToStorage(services: Service[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  } catch (e) {
    console.error('Error saving services:', e);
  }
}

export function saveSettingsToStorage(settings: BusinessSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

export function saveTemplatesToStorage(templates: MessageTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving templates:', e);
  }
}

/**
 * Exporta turnos a formato CSV para Excel o Google Sheets
 */
export function exportAppointmentsToCSV(appointments: Appointment[]): void {
  const headers = [
    'ID',
    'Cliente',
    'Telefono',
    'Email',
    'Servicio',
    'Fecha',
    'Hora Inicio',
    'Hora Fin',
    'Duracion Minutos',
    'Precio Total ARS',
    'Sena Pagada ARS',
    'Total Pagado ARS',
    'Saldo Pendiente ARS',
    'Medio de Pago',
    'Estado',
    'Notas',
  ];

  const rows = appointments.map(a => {
    const balance = Math.max(0, a.price - (a.amountPaid || a.deposit || 0));
    return [
      `"${a.id}"`,
      `"${a.clientName.replace(/"/g, '""')}"`,
      `"${a.clientPhone}"`,
      `"${a.clientEmail || ''}"`,
      `"${a.serviceName.replace(/"/g, '""')}"`,
      `"${a.date}"`,
      `"${a.startTime}"`,
      `"${a.endTime}"`,
      a.durationMinutes,
      a.price,
      a.deposit || 0,
      a.amountPaid || 0,
      balance,
      `"${a.paymentMethod || ''}"`,
      `"${a.status}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `turnos-recepcionista-pro-${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta clientes a formato CSV
 */
export function exportClientsToCSV(clients: Client[]): void {
  const headers = [
    'ID',
    'Nombre',
    'Telefono',
    'Email',
    'Total Visitas',
    'Total Gastado ARS',
    'Ultima Visita',
    'Notas',
    'Fecha Alta',
  ];

  const rows = clients.map(c => [
    `"${c.id}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.phone}"`,
    `"${c.email || ''}"`,
    c.totalVisits,
    c.totalSpent,
    `"${c.lastVisitDate || 'Sin visitas'}"`,
    `"${(c.notes || '').replace(/"/g, '""')}"`,
    `"${c.createdAt}"`,
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `clientes-recepcionista-pro-${getTodayString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Descarga una copia de seguridad JSON completa
 */
export function exportBackupJSON(): void {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    appointments: JSON.parse(localStorage.getItem(STORAGE_KEYS.APPOINTMENTS) || '[]'),
    clients: JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]'),
    services: JSON.parse(localStorage.getItem(STORAGE_KEYS.SERVICES) || '[]'),
    settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{}'),
    templates: JSON.parse(localStorage.getItem(STORAGE_KEYS.TEMPLATES) || '[]'),
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `backup-recepcionista-pro-${getTodayString()}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Restaura datos desde un string JSON con validación
 */
export function restoreBackupJSON(jsonContent: string): {
  success: boolean;
  message: string;
  data?: {
    appointments: Appointment[];
    clients: Client[];
    services: Service[];
    settings: BusinessSettings;
    templates: MessageTemplate[];
  };
} {
  try {
    const parsed = JSON.parse(jsonContent);

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'El archivo JSON no tiene un formato válido.' };
    }

    if (!Array.isArray(parsed.appointments) || !Array.isArray(parsed.clients)) {
      return { success: false, message: 'El archivo no contiene la estructura requerida de turnos o clientes.' };
    }

    const appointments: Appointment[] = parsed.appointments;
    const clients: Client[] = parsed.clients;
    const services: Service[] = Array.isArray(parsed.services) ? parsed.services : DEFAULT_SERVICES;
    const settings: BusinessSettings = parsed.settings?.businessName ? { ...DEFAULT_SETTINGS, ...parsed.settings } : DEFAULT_SETTINGS;
    const templates: MessageTemplate[] = Array.isArray(parsed.templates) ? parsed.templates : DEFAULT_TEMPLATES;

    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');

    return {
      success: true,
      message: `Copia de seguridad restaurada con éxito: ${appointments.length} turnos y ${clients.length} clientes.`,
      data: { appointments, clients, services, settings, templates },
    };
  } catch (err: any) {
    return { success: false, message: `Error al procesar el archivo: ${err.message || 'Formato inválido'}` };
  }
}

/**
 * Reinicia la base de datos a los valores de ejemplo
 */
export function resetToDemoData(): {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  settings: BusinessSettings;
  templates: MessageTemplate[];
} {
  const initialAppointments = getInitialAppointments();
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(initialAppointments));
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(INITIAL_CLIENTS));
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
  localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');

  return {
    appointments: initialAppointments,
    clients: INITIAL_CLIENTS,
    services: DEFAULT_SERVICES,
    settings: DEFAULT_SETTINGS,
    templates: DEFAULT_TEMPLATES,
  };
}

/**
 * Borra todos los datos y deja la app en blanco
 */
export function clearAllData(): {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  settings: BusinessSettings;
  templates: MessageTemplate[];
} {
  const emptyApps: Appointment[] = [];
  const emptyClients: Client[] = [];
  localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(emptyApps));
  localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(emptyClients));
  localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(DEFAULT_TEMPLATES));
  localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');

  return {
    appointments: emptyApps,
    clients: emptyClients,
    services: DEFAULT_SERVICES,
    settings: DEFAULT_SETTINGS,
    templates: DEFAULT_TEMPLATES,
  };
}

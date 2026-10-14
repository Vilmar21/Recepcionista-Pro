export type AppointmentStatus = 'pendiente' | 'confirmado' | 'completado' | 'cancelado' | 'ausente';

export type PaymentMethod = 
  | 'Efectivo' 
  | 'Transferencia / MP' 
  | 'Tarjeta de Débito' 
  | 'Tarjeta de Crédito' 
  | 'Otro';

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM (24hs)
  endTime: string; // HH:MM (24hs)
  durationMinutes: number;
  price: number; // Precio acordado en ARS
  deposit: number; // Seña o adelanto entregado
  amountPaid: number; // Total pagado hasta la fecha
  paymentMethod?: PaymentMethod;
  status: AppointmentStatus;
  cancellationReason?: string;
  notes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisitDate?: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number; // ARS
  category: string;
  color: string; // Tailwind color token or hex
  description?: string;
  active: boolean;
}

export interface DaySchedule {
  enabled: boolean;
  start1: string; // HH:MM
  end1: string; // HH:MM
  hasBreak: boolean;
  start2?: string; // HH:MM
  end2?: string; // HH:MM
}

export interface BusinessSettings {
  businessName: string;
  ownerName: string;
  phone: string;
  profession: string;
  address: string;
  paymentAlias: string; // Alias de Mercado Pago / Banco
  paymentCbu?: string;
  workDays: Record<number, DaySchedule>; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  holidaysAndOffDays: string[]; // YYYY-MM-DD
  inactiveClientThresholdDays: number;
  slotIntervalMinutes: number; // 15 o 30 minutos
  currencySymbol: string; // default "$"
}

export type TemplateType = 
  | 'confirmacion'
  | 'recordatorio'
  | 'reprogramacion'
  | 'agradecimiento'
  | 'fidelizacion'
  | 'sena';

export interface MessageTemplate {
  id: string;
  type: TemplateType;
  title: string;
  content: string;
  description: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflicts: Appointment[];
  isOutOfHours: boolean;
  isOnBreak: boolean;
  isOffDay: boolean;
  warningMessage: string | null;
}

export type ActiveTab = 
  | 'dashboard' 
  | 'calendar' 
  | 'appointments' 
  | 'clients' 
  | 'services' 
  | 'messages' 
  | 'settings';

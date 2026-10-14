import { createClient } from '@supabase/supabase-js';
import { Appointment, AppointmentStatus, PaymentMethod } from '../types';

export const SUPABASE_URL = 'https://lbvnmbhodgjvuylcrwip.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxidm5tYmhvZGdqdnV5bGNyd2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mjc1MjgsImV4cCI6MjEwNzIwMzUyOH0.b54ADnojztuRqihBET-WzILNj6-ke5Cdi-nm9qYCNDA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export interface RecepcionRow {
  id?: number;
  created_at?: string;
  user_id: string;
  empresa: string | null;
  motivo: string | null;
  estado: string | null;
  notas: string | null;
}

/**
 * Convierte una fila de la tabla `recepcion` en un objeto `Appointment` de Recepcionista Pro
 */
export function mapRowToAppointment(row: RecepcionRow): Appointment {
  let parsedPayload: any = {};
  if (row.notas) {
    try {
      parsedPayload = JSON.parse(row.notas);
    } catch {
      // Si no es JSON, se toma como texto de notas directamente
      parsedPayload = { notes: row.notas };
    }
  }

  const dateFromRow = row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

  return {
    id: row.id ? String(row.id) : (parsedPayload.id || `app-${Date.now()}`),
    clientId: parsedPayload.clientId || `cli-${row.id || Date.now()}`,
    clientName: parsedPayload.clientName || row.empresa || 'Cliente',
    clientPhone: parsedPayload.clientPhone || '',
    clientEmail: parsedPayload.clientEmail || undefined,
    serviceId: parsedPayload.serviceId || 'srv-default',
    serviceName: parsedPayload.serviceName || row.motivo || 'Servicio General',
    date: parsedPayload.date || dateFromRow,
    startTime: parsedPayload.startTime || '10:00',
    endTime: parsedPayload.endTime || '10:45',
    durationMinutes: Number(parsedPayload.durationMinutes) || 45,
    price: Number(parsedPayload.price) || 0,
    deposit: Number(parsedPayload.deposit) || 0,
    amountPaid: Number(parsedPayload.amountPaid) || 0,
    paymentMethod: (parsedPayload.paymentMethod as PaymentMethod) || 'Efectivo',
    status: (row.estado as AppointmentStatus) || (parsedPayload.status as AppointmentStatus) || 'pendiente',
    cancellationReason: parsedPayload.cancellationReason || undefined,
    notes: parsedPayload.notes || (typeof parsedPayload === 'object' ? '' : row.notas || ''),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: parsedPayload.updatedAt || new Date().toISOString(),
  };
}

/**
 * Convierte un `Appointment` en la fila esperada por la tabla `recepcion` en Supabase
 */
export function mapAppointmentToRow(app: Appointment, userId: string): RecepcionRow {
  // Guardamos todo el payload enriquecido de Recepcionista Pro en el campo `notas` como JSON
  const payloadJson = JSON.stringify({
    clientName: app.clientName,
    clientPhone: app.clientPhone,
    clientEmail: app.clientEmail,
    clientId: app.clientId,
    serviceId: app.serviceId,
    serviceName: app.serviceName,
    date: app.date,
    startTime: app.startTime,
    endTime: app.endTime,
    durationMinutes: app.durationMinutes,
    price: app.price,
    deposit: app.deposit,
    amountPaid: app.amountPaid,
    paymentMethod: app.paymentMethod,
    status: app.status,
    cancellationReason: app.cancellationReason,
    notes: app.notes || '',
    updatedAt: new Date().toISOString(),
  });

  const row: RecepcionRow = {
    user_id: userId,
    empresa: app.clientName,
    motivo: `${app.serviceName} - ${app.date} ${app.startTime}hs`,
    estado: app.status,
    notas: payloadJson,
  };

  // Si el ID es numérico (proveniente de la base de datos), lo incluimos
  const numericId = Number(app.id);
  if (!isNaN(numericId) && Number.isInteger(numericId) && numericId > 0) {
    row.id = numericId;
  }

  return row;
}

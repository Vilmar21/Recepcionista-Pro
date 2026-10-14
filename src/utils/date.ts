import { Appointment, BusinessSettings, ConflictCheckResult } from '../types';

/**
 * Formato de moneda en pesos argentinos: $ 15.000
 */
export function formatCurrencyARS(amount: number): string {
  if (isNaN(amount)) return '$ 0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convierte HH:MM a minutos desde medianoche
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Convierte minutos desde medianoche a HH:MM
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Suma minutos a una hora HH:MM y retorna HH:MM
 */
export function addMinutesToTime(startTime: string, minutesToAdd: number): string {
  const total = timeToMinutes(startTime) + minutesToAdd;
  return minutesToTime(total);
}

/**
 * Retorna la fecha local actual en formato YYYY-MM-DD
 */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea fecha en español argentino
 * ej: "Lunes 14 de Octubre de 2026" o "14/10/2026"
 */
export function formatDateHuman(dateStr: string, options?: { short?: boolean; withDayOfWeek?: boolean }): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (options?.short) {
    return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
  }

  const todayStr = getTodayString();
  if (dateStr === todayStr) {
    return 'Hoy';
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;
  if (dateStr === tomorrowStr) {
    return 'Mañana';
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${(yesterday.getMonth() + 1).toString().padStart(2, '0')}-${yesterday.getDate().toString().padStart(2, '0')}`;
  if (dateStr === yesterdayStr) {
    return 'Ayer';
  }

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayName = dayNames[date.getDay()];
  const monthName = monthNames[date.getMonth()];

  if (options?.withDayOfWeek === false) {
    return `${day} de ${monthName}`;
  }

  return `${dayName} ${day} de ${monthName}`;
}

/**
 * Obtiene el día de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado) de YYYY-MM-DD
 */
export function getDayOfWeekFromDateString(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * Verifica si hay conflicto de horario para un turno
 */
export function checkAppointmentConflict(
  target: {
    id?: string;
    date: string;
    startTime: string;
    durationMinutes: number;
  },
  existingAppointments: Appointment[],
  settings: BusinessSettings
): ConflictCheckResult {
  const startMins = timeToMinutes(target.startTime);
  const endMins = startMins + target.durationMinutes;

  // 1. Verificar si es feriado o día no laborable configurado
  const isOffDay = settings.holidaysAndOffDays.includes(target.date);

  // 2. Verificar día de la semana
  const dayOfWeek = getDayOfWeekFromDateString(target.date);
  const schedule = settings.workDays[dayOfWeek];

  let isOutOfHours = false;
  let isOnBreak = false;

  if (!schedule || !schedule.enabled) {
    isOutOfHours = true;
  } else {
    const s1 = timeToMinutes(schedule.start1);
    const e1 = timeToMinutes(schedule.end1);

    if (schedule.hasBreak && schedule.start2 && schedule.end2) {
      const s2 = timeToMinutes(schedule.start2);
      const e2 = timeToMinutes(schedule.end2);

      // En el turno matutino?
      const inShift1 = startMins >= s1 && endMins <= e1;
      // En el turno vespertino?
      const inShift2 = startMins >= s2 && endMins <= e2;

      if (!inShift1 && !inShift2) {
        // ¿Cae durante el descanso de almuerzo?
        if (
          (startMins >= e1 && startMins < s2) ||
          (endMins > e1 && endMins <= s2) ||
          (startMins < e1 && endMins > s2)
        ) {
          isOnBreak = true;
        } else {
          isOutOfHours = true;
        }
      }
    } else {
      // Horario continuado
      if (startMins < s1 || endMins > e1) {
        isOutOfHours = true;
      }
    }
  }

  // 3. Verificar solapamiento con otros turnos activos
  const conflicts: Appointment[] = [];

  for (const app of existingAppointments) {
    if (app.date !== target.date) continue;
    if (app.status === 'cancelado') continue;
    if (target.id && app.id === target.id) continue;

    const appStart = timeToMinutes(app.startTime);
    const appEnd = timeToMinutes(app.endTime);

    // Hay solapamiento si se cruzan los rangos
    if (startMins < appEnd && endMins > appStart) {
      conflicts.push(app);
    }
  }

  const hasConflict = conflicts.length > 0;

  // Mensaje de advertencia
  let warningMessage: string | null = null;
  if (hasConflict) {
    const names = conflicts.map(c => `${c.clientName} (${c.startTime} a ${c.endTime} hs)`).join(', ');
    warningMessage = `¡Atención! Se solapa con: ${names}.`;
  } else if (isOffDay) {
    warningMessage = 'El día seleccionado está marcado como feriado o día no laborable.';
  } else if (isOnBreak) {
    warningMessage = 'El turno coincide con el horario de descanso o pausa programada.';
  } else if (isOutOfHours) {
    warningMessage = 'El horario seleccionado se encuentra fuera de la jornada laboral habitual.';
  }

  return {
    hasConflict,
    conflicts,
    isOutOfHours,
    isOnBreak,
    isOffDay,
    warningMessage,
  };
}

/**
 * Obtiene las fechas de la semana actual a partir de una fecha de referencia
 * Lunes a Domingo
 */
export function getWeekDates(referenceDateStr: string): string[] {
  const [y, m, d] = referenceDateStr.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  
  // En JS: 0=Domingo, 1=Lunes, ... Queremos que la semana empiece en Lunes (1)
  const currentDay = current.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);

  const week: string[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    const yr = day.getFullYear();
    const mo = (day.getMonth() + 1).toString().padStart(2, '0');
    const da = day.getDate().toString().padStart(2, '0');
    week.push(`${yr}-${mo}-${da}`);
  }
  return week;
}

/**
 * Obtiene los días para armar la grilla del mes (incluyendo días padding)
 */
export function getMonthDaysGrid(year: number, month: number): {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
}[] {
  // month es 0-11
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Primer día de la semana (1 = Lunes, ..., 0 = Domingo)
  let startDayOfWeek = firstDay.getDay();
  // Ajuste para semana comenzando en Lunes: Lunes=0, Martes=1,..., Domingo=6
  const paddingBefore = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const grid: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Días del mes anterior
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = paddingBefore - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, d);
    const yr = prevDate.getFullYear();
    const mo = (prevDate.getMonth() + 1).toString().padStart(2, '0');
    const da = prevDate.getDate().toString().padStart(2, '0');
    grid.push({
      dateStr: `${yr}-${mo}-${da}`,
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  // Días del mes actual
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const mo = (month + 1).toString().padStart(2, '0');
    const da = d.toString().padStart(2, '0');
    grid.push({
      dateStr: `${year}-${mo}-${da}`,
      dayNumber: d,
      isCurrentMonth: true,
    });
  }

  // Días del mes siguiente para completar múltiplos de 7 (hasta 35 o 42 celdas)
  const remaining = (7 - (grid.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const nextDate = new Date(year, month + 1, d);
    const yr = nextDate.getFullYear();
    const mo = (nextDate.getMonth() + 1).toString().padStart(2, '0');
    const da = nextDate.getDate().toString().padStart(2, '0');
    grid.push({
      dateStr: `${yr}-${mo}-${da}`,
      dayNumber: d,
      isCurrentMonth: false,
    });
  }

  return grid;
}

/**
 * Calcula días de diferencia entre dos fechas YYYY-MM-DD
 */
export function getDaysDifference(date1Str: string, date2Str: string): number {
  const [y1, m1, d1] = date1Str.split('-').map(Number);
  const [y2, m2, d2] = date2Str.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, d1).getTime();
  const dt2 = new Date(y2, m2 - 1, d2).getTime();
  const diffTime = Math.abs(dt2 - dt1);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

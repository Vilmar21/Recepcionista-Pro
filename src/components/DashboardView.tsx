import React, { useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Send, 
  ChevronRight, 
  Plus, 
  Users, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  UserX,
  CreditCard
} from 'lucide-react';
import { Appointment, AppointmentStatus, BusinessSettings, Client } from '../types';
import { formatCurrencyARS, formatDateHuman, getTodayString, getDaysDifference } from '../utils/date';
import { normalizeArgentinePhone } from '../utils/phone';

interface DashboardViewProps {
  appointments: Appointment[];
  clients: Client[];
  settings: BusinessSettings;
  onNewAppointment: () => void;
  onEditAppointment: (appointment: Appointment) => void;
  onChangeStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onOpenWhatsApp: (
    appointment: Appointment | null, 
    templateType?: string, 
    clientOverride?: { name: string; phone: string; serviceName?: string }
  ) => void;
  onNavigateToTab: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  appointments,
  clients,
  settings,
  onNewAppointment,
  onEditAppointment,
  onChangeStatus,
  onOpenWhatsApp,
  onNavigateToTab,
}) => {
  const todayStr = getTodayString();

  // Filtrar turnos de hoy
  const todayAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, todayStr]);

  // Turnos pendientes de confirmación o recordatorio para hoy
  const unconfirmedToday = useMemo(() => {
    return todayAppointments.filter((a) => a.status === 'pendiente');
  }, [todayAppointments]);

  // Próximos turnos (próximos 7 días excluyendo hoy)
  const upcomingAppointments = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    const nextWeekStr = `${nextWeek.getFullYear()}-${(nextWeek.getMonth() + 1).toString().padStart(2, '0')}-${nextWeek.getDate().toString().padStart(2, '0')}`;

    return appointments
      .filter((a) => a.date > todayStr && a.date <= nextWeekStr && a.status !== 'cancelado')
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .slice(0, 6);
  }, [appointments, todayStr]);

  // Finanzas del mes en curso
  const currentMonthFinancials = useMemo(() => {
    const currentYearMonth = todayStr.slice(0, 7); // YYYY-MM
    let totalBilled = 0;
    let totalPaid = 0;
    let totalPendingBalance = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let absentCount = 0;

    for (const a of appointments) {
      if (a.date.startsWith(currentYearMonth)) {
        if (a.status !== 'cancelado') {
          totalBilled += a.price;
          totalPaid += a.amountPaid || a.deposit || 0;
          totalPendingBalance += Math.max(0, a.price - (a.amountPaid || a.deposit || 0));
        }

        if (a.status === 'completado') completedCount++;
        if (a.status === 'cancelado') cancelledCount++;
        if (a.status === 'ausente') absentCount++;
      }
    }

    const totalFinishedOrFailed = completedCount + absentCount;
    const attendanceRate = totalFinishedOrFailed > 0 
      ? Math.round((completedCount / totalFinishedOrFailed) * 100) 
      : 100;

    return {
      totalBilled,
      totalPaid,
      totalPendingBalance,
      completedCount,
      cancelledCount,
      absentCount,
      attendanceRate,
    };
  }, [appointments, todayStr]);

  // Clientes que no reservan hace X días
  const inactiveClients = useMemo(() => {
    const threshold = settings.inactiveClientThresholdDays || 40;
    return clients.filter((c) => {
      if (!c.lastVisitDate) return true;
      const diff = getDaysDifference(c.lastVisitDate, todayStr);
      return diff >= threshold;
    });
  }, [clients, settings.inactiveClientThresholdDays, todayStr]);

  return (
    <div className="space-y-6">
      
      {/* Banner de Bienvenida y Recordatorios de Hoy */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
              {formatDateHuman(todayStr)}
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-300">
              {settings.profession || 'Servicios Profesionales'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Hola, {settings.ownerName || 'Profesional'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Tenés <strong className="text-white font-semibold">{todayAppointments.length} turnos</strong> programados para hoy. 
            {unconfirmedToday.length > 0 ? (
              <span className="text-amber-300 ml-1">
                Hay {unconfirmedToday.length} sin confirmar todavía.
              </span>
            ) : (
              <span className="text-emerald-300 ml-1">
                Todos tus turnos de hoy están confirmados o gestionados.
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => onNavigateToTab('calendar')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Ver Agenda Completa</span>
          </button>
          <button
            onClick={onNewAppointment}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Crear Turno</span>
          </button>
        </div>
      </div>

      {/* 4 Métricas Clave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Turnos Hoy */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Turnos Hoy
            </span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {todayAppointments.length}
            </span>
            <span className="text-xs text-slate-500">
              en agenda
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-600">
            <span>{todayAppointments.filter(a => a.status === 'confirmado').length} confirmados</span>
            <span>·</span>
            <span>{todayAppointments.filter(a => a.status === 'pendiente').length} pendientes</span>
          </div>
        </div>

        {/* Total Cobrado en el Mes */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Cobrado en el Mes
            </span>
            <CreditCard className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700">
              {formatCurrencyARS(currentMonthFinancials.totalPaid)}
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Por cobrar:</span>
            <span className="font-mono font-bold text-amber-700">
              {formatCurrencyARS(currentMonthFinancials.totalPendingBalance)}
            </span>
          </div>
        </div>

        {/* Próximos 7 Días */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Próximos 7 Días
            </span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {upcomingAppointments.length}
            </span>
            <span className="text-xs text-slate-500">
              turnos
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Cancelaciones mes:</span>
            <span className="font-mono text-rose-600 font-semibold">
              {currentMonthFinancials.cancelledCount}
            </span>
          </div>
        </div>

        {/* Tasa de Asistencia */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Asistencia del Mes
            </span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {currentMonthFinancials.attendanceRate}%
            </span>
          </div>
          <div className="mt-3 text-[11px] text-slate-600 flex items-center justify-between">
            <span>Ausentes sin aviso:</span>
            <span className="font-mono text-slate-700 font-semibold">
              {currentMonthFinancials.absentCount}
            </span>
          </div>
        </div>

      </div>

      {/* Sección Principal: Turnos de Hoy */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Agenda de Hoy</span>
              <span className="text-xs font-normal text-slate-500">
                ({formatDateHuman(todayStr)})
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Control rápido de estados, cobros y mensajes directos
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('appointments')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              No hay turnos registrados para hoy
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Podés agendar un nuevo turno o revisar los días siguientes desde la agenda.
            </p>
            <button
              onClick={onNewAppointment}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-500 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agendar Turno para Hoy</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {todayAppointments.map((app) => {
              const balance = Math.max(0, app.price - (app.amountPaid || app.deposit || 0));
              const phone = normalizeArgentinePhone(app.clientPhone);

              return (
                <div
                  key={app.id}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Hora y Datos del Turno */}
                  <div className="flex items-start gap-4">
                    <div className="text-center shrink-0 w-16">
                      <span className="text-base font-bold font-mono text-slate-900 block leading-tight">
                        {app.startTime}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 block">
                        hasta {app.endTime}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {app.durationMinutes} min
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditAppointment(app)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 text-left transition-colors"
                        >
                          {app.clientName}
                        </button>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-600 font-medium">
                          {app.serviceName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono text-[11px]">{phone.displayFormatted || app.clientPhone}</span>
                        <span>·</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {formatCurrencyARS(app.price)}
                        </span>
                        {balance > 0 ? (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded text-[11px] font-medium border border-amber-200/60">
                            Resta: {formatCurrencyARS(balance)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-medium">
                            Pagado total
                          </span>
                        )}
                      </div>

                      {app.notes && (
                        <p className="text-xs text-slate-500 italic max-w-md line-clamp-1">
                          Nota: {app.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones y Selector de Estado */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    {/* Selector de Estado Rápido */}
                    <select
                      value={app.status}
                      onChange={(e) => onChangeStatus(app.id, e.target.value as AppointmentStatus)}
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border transition-all cursor-pointer ${
                        app.status === 'confirmado'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : app.status === 'completado'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : app.status === 'pendiente'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : app.status === 'cancelado'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="completado">Completado</option>
                      <option value="ausente">Ausente</option>
                      <option value="cancelado">Cancelado</option>
                    </select>

                    {/* Botón WhatsApp */}
                    <button
                      onClick={() => onOpenWhatsApp(app, app.status === 'pendiente' ? 'recordatorio' : 'confirmacion')}
                      title="Enviar mensaje por WhatsApp"
                      className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>

                    {/* Botón Editar */}
                    <button
                      onClick={() => onEditAppointment(app)}
                      className="text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors font-medium"
                    >
                      Editar
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Doble Columna Inferior: Próximos Turnos & Fidelización */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Próximos Turnos (7 días) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Próximos en la Semana</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('calendar')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Ver calendario
            </button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No hay turnos registrados en los próximos 7 días.
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingAppointments.map((app) => (
                <div
                  key={app.id}
                  onClick={() => onEditAppointment(app)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 transition-all flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{app.clientName}</span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-xs text-slate-600">{app.serviceName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-medium text-blue-700">{formatDateHuman(app.date)}</span>
                      <span>a las</span>
                      <span className="font-mono font-semibold">{app.startTime} hs</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {formatCurrencyARS(app.price)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenWhatsApp(app, 'recordatorio');
                      }}
                      className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                      title="Enviar recordatorio previo"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fidelización: Clientes Inactivos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Clientes para Reactivar</span>
            </h3>
            <button
              onClick={() => onNavigateToTab('clients')}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Ver clientes ({clients.length})
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Clientes que no agendan hace más de {settings.inactiveClientThresholdDays} días. 
            Podés enviarles un mensaje amigable para que vuelvan.
          </p>

          {inactiveClients.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
              ¡Genial! Todos tus clientes habituales reservaron recientemente.
            </div>
          ) : (
            <div className="space-y-2">
              {inactiveClients.slice(0, 4).map((c) => {
                const diff = c.lastVisitDate ? getDaysDifference(c.lastVisitDate, todayStr) : null;
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{c.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {diff ? `Última visita: hace ${diff} días` : 'Sin turnos registrados'} 
                        {' '}({c.totalVisits} visitas en total)
                      </p>
                    </div>

                    <button
                      onClick={() => onOpenWhatsApp(null, 'fidelizacion', { name: c.name, phone: c.phone })}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Send className="w-3 h-3 text-emerald-600" />
                      <span>Escribir</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

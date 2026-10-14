import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Send, 
  User, 
  Briefcase, 
  AlertCircle,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Appointment, AppointmentStatus, BusinessSettings, Service } from '../types';
import { 
  formatCurrencyARS, 
  formatDateHuman, 
  getDayOfWeekFromDateString, 
  getMonthDaysGrid, 
  getTodayString, 
  getWeekDates, 
  timeToMinutes 
} from '../utils/date';
import { normalizeArgentinePhone } from '../utils/phone';

type CalendarMode = 'day' | 'week' | 'month';

interface CalendarViewProps {
  appointments: Appointment[];
  services: Service[];
  settings: BusinessSettings;
  onNewAppointmentWithSlot: (date: string, time: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onChangeStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onOpenWhatsApp: (appointment: Appointment, templateType?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  services,
  settings,
  onNewAppointmentWithSlot,
  onEditAppointment,
  onChangeStatus,
  onOpenWhatsApp,
}) => {
  const todayStr = getTodayString();
  const [mode, setMode] = useState<CalendarMode>('day');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [filterServiceId, setFilterServiceId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtrado de turnos
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      if (filterServiceId !== 'all' && app.serviceId !== filterServiceId) return false;
      if (filterStatus !== 'all' && app.status !== filterStatus) return false;
      return true;
    });
  }, [appointments, filterServiceId, filterStatus]);

  // Manejo de navegación de fechas
  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(todayStr);
      return;
    }

    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (mode === 'day') {
      date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    } else if (mode === 'week') {
      date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
    } else if (mode === 'month') {
      date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    }

    const yr = date.getFullYear();
    const mo = (date.getMonth() + 1).toString().padStart(2, '0');
    const da = date.getDate().toString().padStart(2, '0');
    setSelectedDate(`${yr}-${mo}-${da}`);
  };

  // Datos para vista semanal
  const weekDates = useMemo(() => {
    return getWeekDates(selectedDate);
  }, [selectedDate]);

  // Datos para vista mensual
  const monthData = useMemo(() => {
    const [y, m] = selectedDate.split('-').map(Number);
    const grid = getMonthDaysGrid(y, m - 1);
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return {
      year: y,
      monthName: monthNames[m - 1],
      grid,
    };
  }, [selectedDate]);

  // Horas del día (08:00 a 20:00 en intervalos de 1 hora)
  const dayHours = useMemo(() => {
    const hours: string[] = [];
    for (let h = 8; h <= 20; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return hours;
  }, []);

  // Turnos del día seleccionado
  const selectedDayAppointments = useMemo(() => {
    return filteredAppointments
      .filter((a) => a.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredAppointments, selectedDate]);

  // Horario laboral del día seleccionado
  const dayOfWeek = getDayOfWeekFromDateString(selectedDate);
  const currentDaySchedule = settings.workDays[dayOfWeek];
  const isOffDay = settings.holidaysAndOffDays.includes(selectedDate);

  // Status badge styling helper
  const getStatusBadge = (st: AppointmentStatus) => {
    switch (st) {
      case 'confirmado':
        return <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200/60 px-1.5 py-0.2 rounded">Confirmado</span>;
      case 'completado':
        return <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">Completado</span>;
      case 'pendiente':
        return <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded">Pendiente</span>;
      case 'cancelado':
        return <span className="text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200/60 px-1.5 py-0.2 rounded line-through">Cancelado</span>;
      case 'ausente':
        return <span className="text-[11px] font-semibold text-slate-800 bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded">Ausente</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Barra de Controles y Navegación de la Agenda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Selector de Fecha y Navegador */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => handleNavigate('prev')}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleNavigate('today')}
              className="px-2.5 py-1 text-xs font-bold text-slate-800 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button
              onClick={() => handleNavigate('next')}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="text-xs font-medium text-slate-800 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-bold text-slate-900 hidden sm:inline">
              {mode === 'month' 
                ? `${monthData.monthName} ${monthData.year}`
                : formatDateHuman(selectedDate)}
            </span>
          </div>
        </div>

        {/* Segmented Control de Modo (Diaria / Semanal / Mensual) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setMode('day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diaria
            </button>
            <button
              onClick={() => setMode('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'month'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensual
            </button>
          </div>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-1.5">
            <select
              value={filterServiceId}
              onChange={(e) => setFilterServiceId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">Todos los servicios</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="completado">Completados</option>
              <option value="cancelado">Cancelados</option>
              <option value="ausente">Ausentes</option>
            </select>
          </div>
        </div>

      </div>

      {/* VISTA 1: AGENDA DIARIA */}
      {mode === 'day' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Header del día */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{formatDateHuman(selectedDate)}</span>
                {selectedDate === todayStr && (
                  <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase">
                    Hoy
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {!currentDaySchedule?.enabled || isOffDay ? (
                  <span className="text-amber-400 font-semibold">
                    Día no laborable o feriado programado
                  </span>
                ) : (
                  <span>
                    Horario de atención: {currentDaySchedule.start1} a {currentDaySchedule.end1} hs
                    {currentDaySchedule.hasBreak && ` y ${currentDaySchedule.start2} a ${currentDaySchedule.end2} hs`}
                  </span>
                )}
              </p>
            </div>

            <button
              onClick={() => onNewAppointmentWithSlot(selectedDate, '10:00')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Turno</span>
            </button>
          </div>

          {/* Timeline de Horas del Día */}
          <div className="divide-y divide-slate-100">
            {dayHours.map((hour) => {
              const hourMins = timeToMinutes(hour);
              const nextHourMins = hourMins + 60;

              // Turnos que comienzan en esta franja horaria
              const appsInHour = selectedDayAppointments.filter((a) => {
                const sMins = timeToMinutes(a.startTime);
                return sMins >= hourMins && sMins < nextHourMins;
              });

              return (
                <div key={hour} className="flex min-h-[72px] hover:bg-slate-50/50 transition-colors group">
                  {/* Etiqueta de Hora */}
                  <div className="w-16 sm:w-20 p-3 text-right font-mono text-xs font-semibold text-slate-600 border-r border-slate-200 select-none shrink-0 bg-slate-50/40">
                    {hour}
                  </div>

                  {/* Espacio para Turnos o Slot Vacío */}
                  <div className="flex-1 p-2 flex flex-col gap-2 relative">
                    {appsInHour.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onNewAppointmentWithSlot(selectedDate, hour)}
                        className="w-full h-full min-h-[50px] rounded-lg border border-dashed border-transparent hover:border-blue-300 hover:bg-blue-50/40 flex items-center justify-start px-4 text-xs text-transparent group-hover:text-slate-400 transition-all text-left"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <Plus className="w-3.5 h-3.5 text-blue-600" />
                          <span>Hacer clic para agendar a las {hour} hs</span>
                        </span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {appsInHour.map((app) => {
                          const balance = Math.max(0, app.price - (app.amountPaid || app.deposit || 0));
                          const phone = normalizeArgentinePhone(app.clientPhone);

                          return (
                            <div
                              key={app.id}
                              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 shadow-xs ${
                                app.status === 'cancelado'
                                  ? 'bg-slate-50 border-slate-200 opacity-60'
                                  : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-blue-700">
                                      {app.startTime} - {app.endTime} hs
                                    </span>
                                    {getStatusBadge(app.status)}
                                  </div>
                                  <h4 
                                    onClick={() => onEditAppointment(app)}
                                    className="font-bold text-sm text-slate-900 mt-1 hover:text-blue-600 cursor-pointer text-left"
                                  >
                                    {app.clientName}
                                  </h4>
                                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                                    <Briefcase className="w-3 h-3 text-slate-400" />
                                    <span>{app.serviceName} ({app.durationMinutes}m)</span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => onOpenWhatsApp(app)}
                                    title="WhatsApp al cliente"
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => onEditAppointment(app)}
                                    className="text-[11px] text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                                  >
                                    Editar
                                  </button>
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="font-mono text-slate-500 text-[11px]">
                                  {phone.displayFormatted || app.clientPhone}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-800">
                                    {formatCurrencyARS(app.price)}
                                  </span>
                                  {balance > 0 && (
                                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                                      Debe {formatCurrencyARS(balance)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VISTA 2: AGENDA SEMANAL */}
      {mode === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <h2 className="text-base font-extrabold">
              Semana del {formatDateHuman(weekDates[0], { short: true })} al {formatDateHuman(weekDates[6], { short: true })}
            </h2>
            <span className="text-xs text-slate-300">
              {filteredAppointments.filter(a => weekDates.includes(a.date)).length} turnos en total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 min-h-[480px]">
            {weekDates.map((dateStr) => {
              const dayApps = filteredAppointments
                .filter((a) => a.date === dateStr)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const isCurrentDay = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const dNum = getDayOfWeekFromDateString(dateStr);
              const sched = settings.workDays[dNum];

              return (
                <div
                  key={dateStr}
                  className={`flex flex-col ${
                    isSelected ? 'bg-blue-50/20' : 'bg-white'
                  }`}
                >
                  {/* Encabezado del Día */}
                  <div 
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setMode('day');
                    }}
                    className={`p-3 text-center border-b border-slate-200 cursor-pointer transition-colors ${
                      isCurrentDay ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'
                    }`}
                  >
                    <p className={`text-xs uppercase font-bold tracking-wider ${isCurrentDay ? 'text-white' : 'text-slate-600'}`}>
                      {formatDateHuman(dateStr, { withDayOfWeek: true }).split(' ')[0]}
                    </p>
                    <p className={`text-lg font-extrabold ${isCurrentDay ? 'text-white' : 'text-slate-900'}`}>
                      {dateStr.split('-')[2]}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isCurrentDay ? 'text-blue-100' : 'text-slate-400'}`}>
                      {dayApps.length} {dayApps.length === 1 ? 'turno' : 'turnos'}
                    </p>
                  </div>

                  {/* Lista de Turnos del Día */}
                  <div className="p-2 flex-1 space-y-2 overflow-y-auto max-h-[500px]">
                    {!sched?.enabled && (
                      <p className="text-[10px] text-center text-slate-400 italic py-2">
                        Cerrado
                      </p>
                    )}

                    {dayApps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => onEditAppointment(app)}
                        className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                          app.status === 'cancelado' 
                            ? 'bg-slate-50 border-slate-200 opacity-60' 
                            : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-blue-700">
                          <span>{app.startTime} hs</span>
                          <span className="text-[9px] uppercase px-1 rounded bg-slate-100 text-slate-600">
                            {app.status}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                          {app.clientName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {app.serviceName}
                        </p>
                      </div>
                    ))}

                    <button
                      onClick={() => onNewAppointmentWithSlot(dateStr, '11:00')}
                      className="w-full py-1.5 border border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 rounded-lg text-[11px] text-slate-400 hover:text-blue-700 font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Agendar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* VISTA 3: AGENDA MENSUAL */}
      {mode === 'month' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h2 className="text-base font-extrabold capitalize">
                {monthData.monthName} {monthData.year}
              </h2>
              <span className="text-xs text-slate-300">
                Selecciona cualquier día para ver sus turnos en detalle
              </span>
            </div>

            {/* Días de la semana header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <span>Lun</span>
              <span>Mar</span>
              <span>Mié</span>
              <span>Jue</span>
              <span>Vie</span>
              <span>Sáb</span>
              <span>Dom</span>
            </div>

            {/* Grilla de días */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-200">
              {monthData.grid.map((cell) => {
                const dayApps = filteredAppointments.filter((a) => a.date === cell.dateStr);
                const isToday = cell.dateStr === todayStr;
                const isSelected = cell.dateStr === selectedDate;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-h-[85px] sm:min-h-[105px] p-2 text-left transition-all relative flex flex-col justify-between ${
                      !cell.isCurrentMonth
                        ? 'bg-slate-50/60 text-slate-400'
                        : isSelected
                        ? 'bg-blue-50/50 ring-2 ring-blue-600 ring-inset'
                        : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${
                        isToday 
                          ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-extrabold'
                          : cell.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {cell.dayNumber}
                      </span>

                      {dayApps.length > 0 && (
                        <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.2 rounded">
                          {dayApps.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mt-1">
                      {dayApps.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          className="text-[10px] font-medium truncate px-1 py-0.5 rounded bg-slate-100 text-slate-700"
                        >
                          {a.startTime} {a.clientName.split(' ')[0]}
                        </div>
                      ))}
                      {dayApps.length > 2 && (
                        <div className="text-[9px] text-slate-400 font-medium pl-1">
                          +{dayApps.length - 2} más
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de Detalle del Día Seleccionado en la vista mensual */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Turnos de: {formatDateHuman(selectedDate)}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedDayAppointments.length} turnos programados
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMode('day')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Abrir Vista Diaria
                </button>
                <button
                  onClick={() => onNewAppointmentWithSlot(selectedDate, '10:00')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Turno</span>
                </button>
              </div>
            </div>

            {selectedDayAppointments.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No hay turnos para esta fecha. Hacé clic en "Nuevo Turno" para agendar.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {selectedDayAppointments.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onEditAppointment(app)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition-all text-left space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700">
                        {app.startTime} a {app.endTime} hs
                      </span>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-xs font-bold text-slate-900">{app.clientName}</p>
                    <p className="text-[11px] text-slate-600">{app.serviceName}</p>
                    <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-100">
                      <span className="font-mono font-bold text-slate-800">
                        {formatCurrencyARS(app.price)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenWhatsApp(app);
                        }}
                        className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

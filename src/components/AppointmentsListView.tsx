import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Download, 
  Plus, 
  Send, 
  Edit3, 
  Trash2, 
  Calendar, 
  Clock, 
  DollarSign, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Appointment, AppointmentStatus, BusinessSettings, Service } from '../types';
import { exportAppointmentsToCSV } from '../utils/storage';
import { exportRecepcionToExcel } from '../utils/excel';
import { formatCurrencyARS, formatDateHuman, getTodayString, getWeekDates } from '../utils/date';
import { normalizeArgentinePhone } from '../utils/phone';

interface AppointmentsListViewProps {
  appointments: Appointment[];
  services: Service[];
  settings: BusinessSettings;
  onNewAppointment: () => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onChangeStatus: (appointmentId: string, status: AppointmentStatus) => void;
  onOpenWhatsApp: (appointment: Appointment, templateType?: string) => void;
  initialStatusFilter?: string;
  initialDateFilter?: 'all' | 'today' | 'week' | 'month' | 'upcoming' | 'past';
}

export const AppointmentsListView: React.FC<AppointmentsListViewProps> = ({
  appointments,
  services,
  settings,
  onNewAppointment,
  onEditAppointment,
  onDeleteAppointment,
  onChangeStatus,
  onOpenWhatsApp,
  initialStatusFilter,
  initialDateFilter,
}) => {
  const todayStr = getTodayString();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'upcoming' | 'past'>(initialDateFilter || 'all');
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  React.useEffect(() => {
    if (initialStatusFilter !== undefined) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  React.useEffect(() => {
    if (initialDateFilter !== undefined) {
      setDateFilter(initialDateFilter);
    }
  }, [initialDateFilter]);

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportRecepcionToExcel(appointments);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      alert('Ocurrió un error al generar el archivo Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const weekDates = useMemo(() => getWeekDates(todayStr), [todayStr]);
  const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

  // Filtrado de turnos
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      // Texto de búsqueda
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesClient = app.clientName.toLowerCase().includes(query);
        const matchesPhone = app.clientPhone.includes(query);
        const matchesService = app.serviceName.toLowerCase().includes(query);
        const matchesNotes = (app.notes || '').toLowerCase().includes(query);
        if (!matchesClient && !matchesPhone && !matchesService && !matchesNotes) {
          return false;
        }
      }

      // Filtro de estado
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // Filtro de fecha
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (dateFilter === 'week' && !weekDates.includes(app.date)) return false;
      if (dateFilter === 'month' && !app.date.startsWith(currentMonthPrefix)) return false;
      if (dateFilter === 'upcoming' && app.date < todayStr) return false;
      if (dateFilter === 'past' && app.date >= todayStr) return false;

      return true;
    }).sort((a, b) => {
      // Orden por fecha y hora descendente (más recientes primero)
      return (b.date + b.startTime).localeCompare(a.date + a.startTime);
    });
  }, [appointments, searchTerm, statusFilter, dateFilter, todayStr, weekDates, currentMonthPrefix]);

  // Totales de la selección filtrada
  const totals = useMemo(() => {
    let billed = 0;
    let paid = 0;
    let balance = 0;

    for (const a of filteredAppointments) {
      if (a.status !== 'cancelado') {
        billed += a.price;
        paid += a.amountPaid || a.deposit || 0;
        balance += Math.max(0, a.price - (a.amountPaid || a.deposit || 0));
      }
    }

    return { billed, paid, balance };
  }, [filteredAppointments]);

  return (
    <div className="space-y-4">
      
      {/* Barra de Filtros, Búsqueda y Exportación */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, teléfono, servicio o notas..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              title="Descargar archivo Excel (.xlsx) con los datos de la tabla recepcion"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 border border-emerald-300 rounded-xl transition-all shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{isExportingExcel ? 'Exportando...' : 'Exportar a Excel'}</span>
            </button>

            <button
              onClick={() => exportAppointmentsToCSV(filteredAppointments)}
              title="Descargar listado en formato CSV para hojas de cálculo"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={onNewAppointment}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Turno</span>
            </button>
          </div>
        </div>

        {/* Filtros de Fecha y Estado */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          
          {/* Segmentos de Fecha */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'today', label: 'Hoy' },
              { id: 'week', label: 'Esta Semana' },
              { id: 'month', label: 'Este Mes' },
              { id: 'upcoming', label: 'Próximos' },
              { id: 'past', label: 'Historial Pasado' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  dateFilter === d.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Selector de Estado */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs bg-slate-50 font-semibold text-slate-700 focus:outline-none"
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

      {/* Barra de Resumen Financiero Filtrado */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 px-5 flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Turnos filtrados:</span>
          <span className="font-bold text-white text-sm font-mono">{filteredAppointments.length}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono">
          <div>
            <span className="text-slate-400 mr-1.5 font-sans">Total:</span>
            <span className="font-bold text-white">{formatCurrencyARS(totals.billed)}</span>
          </div>
          <div>
            <span className="text-emerald-400 mr-1.5 font-sans">Cobrado:</span>
            <span className="font-bold text-emerald-400">{formatCurrencyARS(totals.paid)}</span>
          </div>
          <div>
            <span className="text-amber-400 mr-1.5 font-sans">Saldo Restante:</span>
            <span className="font-bold text-amber-300">{formatCurrencyARS(totals.balance)}</span>
          </div>
        </div>
      </div>

      {/* Lista / Tabla de Turnos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              No se encontraron turnos con los filtros actuales
            </p>
            <p className="text-xs text-slate-500">
              Probá restableciendo los filtros o buscando con otro término.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateFilter('all');
              }}
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              Restablecer todos los filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((app) => {
              const balance = Math.max(0, app.price - (app.amountPaid || app.deposit || 0));
              const phone = normalizeArgentinePhone(app.clientPhone);

              return (
                <div
                  key={app.id}
                  className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Fecha, Hora y Cliente */}
                  <div className="flex items-start gap-4">
                    {/* Bloque Fecha */}
                    <div className="text-center w-16 sm:w-20 shrink-0">
                      <span className="text-xs font-bold text-slate-900 block">
                        {formatDateHuman(app.date, { short: true })}
                      </span>
                      <span className="text-xs font-mono font-semibold text-blue-700 block">
                        {app.startTime} hs
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {app.durationMinutes} min
                      </span>
                    </div>

                    {/* Detalle */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onEditAppointment(app)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors text-left"
                        >
                          {app.clientName}
                        </button>
                        <span className="text-slate-300">·</span>
                        <span className="font-medium text-slate-600">
                          {app.serviceName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-mono">{phone.displayFormatted || app.clientPhone}</span>
                        {app.paymentMethod && (
                          <>
                            <span>·</span>
                            <span>{app.paymentMethod}</span>
                          </>
                        )}
                        {app.notes && (
                          <>
                            <span>·</span>
                            <span className="italic text-slate-600 truncate max-w-xs">
                              {app.notes}
                            </span>
                          </>
                        )}
                        {app.cancellationReason && (
                          <span className="text-rose-700 font-semibold">
                            (Motivo: {app.cancellationReason})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Precios, Estado y Acciones */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                    
                    {/* Info de Cobro */}
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 block">
                        {formatCurrencyARS(app.price)}
                      </span>
                      {balance > 0 ? (
                        <span className="text-[10px] text-amber-700 font-mono font-semibold block">
                          Resta: {formatCurrencyARS(balance)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 font-medium block">
                          Cobrado
                        </span>
                      )}
                    </div>

                    {/* Selector de Estado */}
                    <select
                      value={app.status}
                      onChange={(e) => onChangeStatus(app.id, e.target.value as AppointmentStatus)}
                      className={`text-xs font-semibold rounded-lg px-2 py-1 border transition-all cursor-pointer ${
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
                      onClick={() => onOpenWhatsApp(app)}
                      title="Enviar WhatsApp"
                      className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>

                    {/* Botón Editar */}
                    <button
                      onClick={() => onEditAppointment(app)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                      title="Editar turno"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el turno de ${app.clientName}?`)) {
                          onDeleteAppointment(app.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                      title="Eliminar turno"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

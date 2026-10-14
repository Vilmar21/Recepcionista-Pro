import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Trash2, 
  Briefcase,
  FileText,
  CreditCard,
  Ban,
  ChevronDown,
  Sliders,
  Sparkles,
  Pencil
} from 'lucide-react';
import { 
  Appointment, 
  AppointmentStatus, 
  BusinessSettings, 
  Client, 
  PaymentMethod, 
  Service 
} from '../types';
import { 
  addMinutesToTime, 
  checkAppointmentConflict, 
  formatCurrencyARS, 
  getTodayString 
} from '../utils/date';
import { normalizeArgentinePhone } from '../utils/phone';
import { ManageServicesModal } from './ManageServicesModal';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment, clientData: { isNew: boolean; client: Client }) => void;
  onDelete?: (appointmentId: string) => void;
  onOpenWhatsApp?: (appointment: Appointment, templateType?: string) => void;
  appointmentToEdit?: Appointment | null;
  initialDate?: string;
  initialStartTime?: string;
  services: Service[];
  clients: Client[];
  existingAppointments: Appointment[];
  settings: BusinessSettings;
  onSaveService?: (service: Service) => void;
  onDeleteService?: (serviceId: string) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onOpenWhatsApp,
  appointmentToEdit,
  initialDate,
  initialStartTime,
  services,
  clients,
  existingAppointments,
  settings,
  onSaveService,
  onDeleteService,
}) => {
  // Estado del Formulario
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientId, setClientId] = useState('');
  const [selectedClientSearch, setSelectedClientSearch] = useState('');
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);

  // Servicio dinámico y editable
  const [serviceId, setServiceId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [isManageServicesOpen, setIsManageServicesOpen] = useState(false);

  const [date, setDate] = useState(getTodayString());
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [price, setPrice] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo');
  const [status, setStatus] = useState<AppointmentStatus>('pendiente');
  const [cancellationReason, setCancellationReason] = useState('');
  const [notes, setNotes] = useState('');

  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setShowServiceSuggestions(false);
      }
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carga inicial y sincronización
  useEffect(() => {
    if (!isOpen) return;

    if (appointmentToEdit) {
      setClientName(appointmentToEdit.clientName);
      setClientPhone(appointmentToEdit.clientPhone);
      setClientEmail(appointmentToEdit.clientEmail || '');
      setClientId(appointmentToEdit.clientId);
      setSelectedClientSearch(appointmentToEdit.clientName);

      setServiceId(appointmentToEdit.serviceId);
      setServiceName(appointmentToEdit.serviceName);
      setDate(appointmentToEdit.date);
      setStartTime(appointmentToEdit.startTime);
      setDurationMinutes(appointmentToEdit.durationMinutes);
      setPrice(appointmentToEdit.price);
      setDeposit(appointmentToEdit.deposit || 0);
      setAmountPaid(appointmentToEdit.amountPaid || 0);
      setPaymentMethod(appointmentToEdit.paymentMethod || 'Efectivo');
      setStatus(appointmentToEdit.status);
      setCancellationReason(appointmentToEdit.cancellationReason || '');
      setNotes(appointmentToEdit.notes || '');
    } else {
      // Nuevo turno
      const firstActiveService = services.find((s) => s.active) || services[0];
      setClientName('');
      setClientPhone('');
      setClientEmail('');
      setClientId('');
      setSelectedClientSearch('');

      const sId = firstActiveService ? firstActiveService.id : `srv-${Date.now()}`;
      const sName = firstActiveService ? firstActiveService.name : 'Consulta General';
      const sDur = firstActiveService ? firstActiveService.durationMinutes : 45;
      const sPrice = firstActiveService ? firstActiveService.price : 10000;

      setServiceId(sId);
      setServiceName(sName);
      setDate(initialDate || getTodayString());
      setStartTime(initialStartTime || '10:00');
      setDurationMinutes(sDur);
      setPrice(sPrice);
      setDeposit(0);
      setAmountPaid(0);
      setPaymentMethod('Efectivo');
      setStatus('pendiente');
      setCancellationReason('');
      setNotes('');
    }
  }, [isOpen, appointmentToEdit, initialDate, initialStartTime, services]);

  // Hora de fin calculada
  const endTime = useMemo(() => {
    return addMinutesToTime(startTime, durationMinutes);
  }, [startTime, durationMinutes]);

  // Detección de solapamiento en tiempo real
  const conflictResult = useMemo(() => {
    if (!date || !startTime || durationMinutes <= 0 || status === 'cancelado') {
      return { hasConflict: false, conflicts: [], isOutOfHours: false, isOnBreak: false, isOffDay: false, warningMessage: null };
    }
    return checkAppointmentConflict(
      {
        id: appointmentToEdit?.id,
        date,
        startTime,
        durationMinutes,
      },
      existingAppointments,
      settings
    );
  }, [date, startTime, durationMinutes, appointmentToEdit?.id, existingAppointments, settings, status]);

  // Sugerencias de clientes
  const filteredClients = useMemo(() => {
    if (!selectedClientSearch || selectedClientSearch.length < 1) return [];
    return clients.filter((c) => 
      c.name.toLowerCase().includes(selectedClientSearch.toLowerCase()) ||
      c.phone.includes(selectedClientSearch)
    ).slice(0, 5);
  }, [selectedClientSearch, clients]);

  // Sugerencias de servicios basadas en lo que el usuario escribe
  const filteredServices = useMemo(() => {
    if (!serviceName.trim()) return services;
    const query = serviceName.toLowerCase();
    return services.filter((s) => 
      s.name.toLowerCase().includes(query) || 
      (s.category && s.category.toLowerCase().includes(query))
    );
  }, [serviceName, services]);

  // Chequea si el servicio actual coincide con uno del catálogo
  const matchingCatalogService = useMemo(() => {
    return services.find(
      (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.trim().toLowerCase()
    );
  }, [services, serviceId, serviceName]);

  if (!isOpen) return null;

  // Manejador al seleccionar un servicio de la lista o catálogo
  const handleSelectService = (selected: Service) => {
    setServiceId(selected.id);
    setServiceName(selected.name);
    setDurationMinutes(selected.durationMinutes);
    setPrice(selected.price);
    setShowServiceSuggestions(false);
  };

  const handleSelectClient = (c: Client) => {
    setClientId(c.id);
    setClientName(c.name);
    setClientPhone(c.phone);
    setClientEmail(c.email || '');
    setSelectedClientSearch(c.name);
    setShowClientSuggestions(false);
  };

  const balance = Math.max(0, price - amountPaid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }

    if (!clientPhone.trim()) {
      alert('Por favor ingresa el teléfono del cliente.');
      return;
    }

    if (!serviceName.trim()) {
      alert('Por favor ingresa o selecciona un servicio.');
      return;
    }

    if (!date.trim()) {
      alert('Por favor ingresa la Fecha obligatoria de la cita/visita (formato YYYY-MM-DD).');
      return;
    }

    if (!startTime.trim()) {
      alert('Por favor ingresa la Hora obligatoria de la cita/visita (formato HH:MM).');
      return;
    }

    const currentId = appointmentToEdit?.id || `app-${Date.now()}`;
    const targetClientId = clientId || `cli-${Date.now()}`;
    const targetServiceId = serviceId || (matchingCatalogService ? matchingCatalogService.id : `srv-custom-${Date.now()}`);

    const newAppointment: Appointment = {
      id: currentId,
      clientId: targetClientId,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      serviceId: targetServiceId,
      serviceName: serviceName.trim(),
      date,
      startTime,
      endTime,
      durationMinutes: Number(durationMinutes) || 30,
      price: Number(price) || 0,
      deposit: Number(deposit) || 0,
      amountPaid: Number(amountPaid) || 0,
      paymentMethod,
      status,
      cancellationReason: status === 'cancelado' ? cancellationReason : undefined,
      notes: notes.trim() || undefined,
      createdAt: appointmentToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Crear o actualizar cliente
    const existingClient = clients.find((c) => c.id === targetClientId);
    const clientData: Client = existingClient
      ? {
          ...existingClient,
          name: clientName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim() || existingClient.email,
          lastVisitDate: date,
        }
      : {
          id: targetClientId,
          name: clientName.trim(),
          phone: clientPhone.trim(),
          email: clientEmail.trim() || undefined,
          totalVisits: 1,
          totalSpent: Number(amountPaid) || 0,
          lastVisitDate: date,
          createdAt: new Date().toISOString(),
        };

    onSave(newAppointment, { isNew: !existingClient, client: clientData });
    onClose();
  };

  const phoneValidation = normalizeArgentinePhone(clientPhone);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col my-4 max-h-[94vh] animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
        >
          {/* Encabezado */}
          <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {appointmentToEdit ? 'Editar Turno' : 'Nuevo Turno'}
                </h2>
                <p className="text-xs text-slate-300">
                  {appointmentToEdit ? `Modificando turno de ${appointmentToEdit.clientName}` : 'Completa los datos del turno y cliente'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
            
            {/* Alerta de Solapamiento / Conflicto */}
            {conflictResult.warningMessage && (
              <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                conflictResult.hasConflict 
                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                  conflictResult.hasConflict ? 'text-rose-600' : 'text-amber-600'
                }`} />
                <div className="space-y-1">
                  <p className="font-bold text-sm">
                    {conflictResult.hasConflict ? 'Conflicto de Horario Detectado' : 'Advertencia de Agenda'}
                  </p>
                  <p>{conflictResult.warningMessage}</p>
                  {conflictResult.hasConflict && (
                    <p className="text-[11px] text-rose-700 italic">
                      Podés continuar si se trata de una atención simultánea excepcional o modificar la hora.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Sección 1: Datos del Cliente */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Datos del Cliente</span>
                </h3>
                {clientId && (
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Cliente registrado
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                {/* Nombre y autocompletado */}
                <div className="relative" ref={clientDropdownRef}>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setSelectedClientSearch(e.target.value);
                      setShowClientSuggestions(true);
                    }}
                    onFocus={() => setShowClientSuggestions(true)}
                    placeholder="Ej: Mateo Silva"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Dropdown sugerencias clientes */}
                  {showClientSuggestions && filteredClients.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                        Clientes Existentes
                      </div>
                      {filteredClients.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectClient(c)}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{c.name}</p>
                            <p className="text-slate-500 font-mono text-[11px]">{c.phone}</p>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {c.totalVisits} visitas
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>Teléfono (WhatsApp) *</span>
                    </label>
                    {phoneValidation.isValid && (
                      <span className="text-[10px] text-emerald-600 font-mono font-medium">
                        Formato AR OK
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ej: 11 4455-6677 o 351 555 1234"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Email opcional */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email (Opcional)
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: SERVICIO Y HORARIO (DINÁMICO Y EDITABLE) */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Servicio y Horario</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* CAMPO DE SERVICIOS TOTALMENTE DINÁMICO Y EDITABLE + BOTÓN ADMINISTRAR */}
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <span>Servicio *</span>
                      {matchingCatalogService ? (
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                          Catálogo
                        </span>
                      ) : serviceName.trim() ? (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                          Personalizado
                        </span>
                      ) : null}
                    </label>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      Escribe cualquier servicio o elige uno existente
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Input editable con autocompletado y dropdown */}
                    <div className="relative flex-1" ref={serviceDropdownRef}>
                      <input
                        type="text"
                        required
                        value={serviceName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setServiceName(val);
                          setShowServiceSuggestions(true);

                          // Si coincide exactamente con uno existente, actualizar id/duración/precio
                          const match = services.find((s) => s.name.toLowerCase() === val.trim().toLowerCase());
                          if (match) {
                            setServiceId(match.id);
                            setDurationMinutes(match.durationMinutes);
                            setPrice(match.price);
                          } else {
                            setServiceId(`srv-custom-${Date.now()}`);
                          }
                        }}
                        onFocus={() => setShowServiceSuggestions(true)}
                        placeholder="Ej: Kinesiología, Consulta Médica, Corte y Color..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium pr-8"
                      />

                      {/* Flecha para abrir sugerencias */}
                      <button
                        type="button"
                        onClick={() => setShowServiceSuggestions(!showServiceSuggestions)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        title="Ver lista de servicios"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      {/* Lista desplegable de sugerencias de servicios */}
                      {showServiceSuggestions && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in-50 duration-100">
                          <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <span>Servicios Disponibles ({services.length})</span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowServiceSuggestions(false);
                                setIsManageServicesOpen(true);
                              }}
                              className="text-blue-600 hover:underline font-bold text-[10px]"
                            >
                              + Crear nuevo
                            </button>
                          </div>

                          {filteredServices.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500 text-center">
                              No hay coincidencias. Se usará como <strong className="text-slate-700">servicio personalizado</strong>.
                            </div>
                          ) : (
                            filteredServices.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => handleSelectService(s)}
                                className={`w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center justify-between text-xs ${
                                  serviceId === s.id ? 'bg-blue-50/60 font-semibold' : ''
                                }`}
                              >
                                <div>
                                  <p className="text-slate-900 font-semibold">{s.name}</p>
                                  <p className="text-slate-500 text-[11px]">
                                    {s.durationMinutes} min {s.category ? `· ${s.category}` : ''}
                                  </p>
                                </div>
                                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  {formatCurrencyARS(s.price)}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* BOTÓN/ICONO DE "ADMINISTRAR SERVICIOS" */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowServiceSuggestions(false);
                        setIsManageServicesOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                      title="Administrar servicios: Agregar nuevos, editar existentes o eliminar"
                    >
                      <Pencil className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Administrar servicios</span>
                      <span className="sm:hidden">Servicios</span>
                    </button>
                  </div>
                </div>

                {/* Fecha Obligatoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Fecha (YYYY-MM-DD) *</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                  />
                </div>

                {/* Hora Inicio Obligatoria */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Hora (HH:MM) *</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duración (Minutos)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value) || 15)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
                      Fin: {endTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 3: Estado del Turno */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Estado del Turno
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(['pendiente', 'confirmado', 'completado', 'cancelado', 'ausente'] as AppointmentStatus[]).map((st) => {
                  const isSelected = status === st;
                  const colors = {
                    pendiente: isSelected ? 'bg-amber-100 border-amber-500 text-amber-900' : 'hover:bg-amber-50 text-slate-700',
                    confirmado: isSelected ? 'bg-blue-100 border-blue-500 text-blue-900' : 'hover:bg-blue-50 text-slate-700',
                    completado: isSelected ? 'bg-emerald-100 border-emerald-500 text-emerald-900' : 'hover:bg-emerald-50 text-slate-700',
                    cancelado: isSelected ? 'bg-rose-100 border-rose-500 text-rose-900' : 'hover:bg-rose-50 text-slate-700',
                    ausente: isSelected ? 'bg-slate-200 border-slate-500 text-slate-900' : 'hover:bg-slate-100 text-slate-700',
                  };
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-semibold capitalize border text-center transition-all cursor-pointer ${
                        isSelected ? 'border-2 shadow-xs' : 'border-slate-200 bg-white'
                      } ${colors[st]}`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>

              {status === 'cancelado' && (
                <div className="pt-1">
                  <label className="block text-xs font-semibold text-rose-800 mb-1 flex items-center gap-1">
                    <Ban className="w-3 h-3" />
                    <span>Motivo de cancelación</span>
                  </label>
                  <input
                    type="text"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Ej: Cliente avisó por imprevisto familiar"
                    className="w-full bg-rose-50/50 border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>

            {/* Sección 4: Pagos y Seña */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Registro de Pago y Saldo</span>
                </h3>
                <div className="text-xs font-medium">
                  Saldo pendiente: <span className={`font-bold font-mono ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {formatCurrencyARS(balance)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {/* Precio Total */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Precio Total ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                  />
                </div>

                {/* Seña Adelantada */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Seña Registrada ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={deposit}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setDeposit(val);
                      if (amountPaid < val) {
                        setAmountPaid(val);
                      }
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {/* Total Cobrado */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Total Cobrado ($)
                    </label>
                    <button
                      type="button"
                      onClick={() => setAmountPaid(price)}
                      className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
                    >
                      Todo pago
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-emerald-700"
                  />
                </div>

                {/* Medio de Pago */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Medio de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia / MP">Transferencia / MP</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notas Adicionales */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-500" />
                <span>Notas internas del turno</span>
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles del tratamiento, preferencias de color, alergias o recordatorios..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Botones de Acción */}
            <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {appointmentToEdit && onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar el turno de ${appointmentToEdit.clientName}?`)) {
                        onDelete(appointmentToEdit.id);
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}

                {appointmentToEdit && onOpenWhatsApp && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenWhatsApp(appointmentToEdit);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  {appointmentToEdit ? 'Guardar Cambios' : 'Crear Turno'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>

      {/* VENTANA EMERGENTE PARA ADMINISTRAR SERVICIOS (AGREGAR, EDITAR, ELIMINAR) */}
      <ManageServicesModal
        isOpen={isManageServicesOpen}
        onClose={() => setIsManageServicesOpen(false)}
        services={services}
        onSaveService={(saved) => {
          if (onSaveService) {
            onSaveService(saved);
          }
          // Si el usuario guardó un nuevo servicio o editó, actualizar el turno actual
          handleSelectService(saved);
        }}
        onDeleteService={(deletedId) => {
          if (onDeleteService) {
            onDeleteService(deletedId);
          }
          // Si eliminó el servicio actualmente seleccionado, resetear id
          if (serviceId === deletedId) {
            setServiceId('');
          }
        }}
        onSelectService={(selected) => {
          handleSelectService(selected);
        }}
      />
    </>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Appointment, 
  AppointmentStatus, 
  BusinessSettings, 
  Client, 
  MessageTemplate, 
  Service,
  ActiveTab
} from './types';
import { 
  loadStoredData, 
  saveAppointmentsToStorage, 
  saveClientsToStorage, 
  saveServicesToStorage, 
  saveSettingsToStorage, 
  saveTemplatesToStorage 
} from './utils/storage';
import { getTodayString, timeToMinutes } from './utils/date';
import { exportRecepcionToExcel } from './utils/excel';
import { playAlarmChime, playAlertBeep } from './utils/audio';
import { supabase, mapRowToAppointment, mapAppointmentToRow } from './lib/supabase';
import { AuthScreen } from './components/AuthScreen';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CalendarView } from './components/CalendarView';
import { AppointmentsListView } from './components/AppointmentsListView';
import { ClientsView } from './components/ClientsView';
import { ServicesView } from './components/ServicesView';
import { MessagesView } from './components/MessagesView';
import { SettingsView } from './components/SettingsView';
import { AppointmentModal } from './components/AppointmentModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { AlarmAlertModal } from './components/AlarmAlertModal';
import { AppointmentAlertBanner } from './components/AppointmentAlertBanner';
import { Cloud } from 'lucide-react';

export default function App() {
  // Autenticación Supabase
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Estado de datos
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [syncingCloud, setSyncingCloud] = useState(false);

  // Navegación y Filtros de la Barra Lateral
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [listViewStatusFilter, setListViewStatusFilter] = useState<string>('all');
  const [listViewDateFilter, setListViewDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'upcoming' | 'past'>('all');

  // Modal de Turno (Creación / Edición)
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Appointment | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>();
  const [modalInitialTime, setModalInitialTime] = useState<string | undefined>();

  // Modal de WhatsApp
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppTargetAppointment, setWhatsAppTargetAppointment] = useState<Appointment | null>(null);
  const [whatsAppTemplateType, setWhatsAppTemplateType] = useState<string>('confirmacion');
  const [whatsAppClientOverride, setWhatsAppClientOverride] = useState<{
    name: string;
    phone: string;
    serviceName?: string;
  } | null>(null);

  // Alarma modal de 5 minutos y avisos flotantes de 10 minutos
  const [activeAlarmAppointment, setActiveAlarmAppointment] = useState<Appointment | null>(null);
  const [alarmTriggeredIds, setAlarmTriggeredIds] = useState<Set<string>>(new Set());
  const [upcomingAlerts, setUpcomingAlerts] = useState<Array<{ appointment: Appointment; minutesLeft: number }>>([]);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());
  const [alertedBeepIds, setAlertedBeepIds] = useState<Set<string>>(new Set());

  // Temporizador JavaScript que se ejecuta cada 30 segundos para comparar la hora actual con las citas
  useEffect(() => {
    const checkUpcomingAlerts = () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = (now.getMonth() + 1).toString().padStart(2, '0');
      const da = now.getDate().toString().padStart(2, '0');
      const currentDateStr = `${yr}-${mo}-${da}`;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const matched: Array<{ appointment: Appointment; minutesLeft: number }> = [];

      for (const app of appointments) {
        if (app.date !== currentDateStr) continue;
        if (app.status === 'cancelado' || app.status === 'completado') continue;

        const appMinutes = timeToMinutes(app.startTime);
        const diff = appMinutes - currentMinutes;

        // 1. Alarma obligatoria de 5 minutos antes del horario seleccionado (suena y abre aviso)
        if (diff <= 5 && diff >= 0 && !alarmTriggeredIds.has(app.id)) {
          setActiveAlarmAppointment(app);
          playAlarmChime();
          setAlarmTriggeredIds((prev) => new Set(prev).add(app.id));
        }

        // 2. Banner/alerta visual si está a 10 minutos o menos de la hora programada
        if (diff >= 0 && diff <= 10 && !dismissedAlertIds.has(app.id)) {
          matched.push({
            appointment: app,
            minutesLeft: diff,
          });

          // Reproduce un sonido de alerta sutil (beep mediante Web Audio API) la primera vez que entra en rango de 10 min
          if (!alertedBeepIds.has(app.id)) {
            playAlertBeep();
            setAlertedBeepIds((prev) => new Set(prev).add(app.id));
          }
        }
      }

      setUpcomingAlerts(matched);
    };

    // Verificación inmediata y cada 30 segundos (30.000 ms)
    checkUpcomingAlerts();
    const intervalId = setInterval(checkUpcomingAlerts, 30000);
    return () => clearInterval(intervalId);
  }, [appointments, dismissedAlertIds, alertedBeepIds, alarmTriggeredIds]);

  const handleDismissAlert = (appId: string) => {
    setDismissedAlertIds((prev) => new Set(prev).add(appId));
    setUpcomingAlerts((prev) => prev.filter((a) => a.appointment.id !== appId));
  };

  // 1. Escuchar sesión de Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Cargar datos locales base (servicios, configuración, plantillas)
  useEffect(() => {
    const local = loadStoredData();
    setServices(local.services);
    setSettings(local.settings);
    setTemplates(local.templates);
    setClients(local.clients);
  }, []);

  // 3. Función para cargar turnos desde la tabla `recepcion` en Supabase
  const loadAppointmentsFromSupabase = useCallback(async (currentUserId: string) => {
    if (!currentUserId) return;
    setSyncingCloud(true);

    try {
      const { data, error } = await supabase
        .from('recepcion')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching recepcion from Supabase:', error);
        return;
      }

      if (data) {
        const cloudAppointments = data.map((row) => mapRowToAppointment(row));
        setAppointments(cloudAppointments);
        saveAppointmentsToStorage(cloudAppointments);

        // Extraer y sincronizar clientes derivados de los turnos en la nube
        setClients((prevClients) => {
          const clientMap = new Map<string, Client>();
          prevClients.forEach((c) => clientMap.set(c.id, c));

          cloudAppointments.forEach((app) => {
            if (app.clientName) {
              const existing = clientMap.get(app.clientId);
              if (existing) {
                clientMap.set(app.clientId, {
                  ...existing,
                  name: app.clientName,
                  phone: app.clientPhone || existing.phone,
                  lastVisitDate: app.date,
                });
              } else {
                clientMap.set(app.clientId, {
                  id: app.clientId,
                  name: app.clientName,
                  phone: app.clientPhone,
                  email: app.clientEmail,
                  totalVisits: 1,
                  totalSpent: app.amountPaid || 0,
                  lastVisitDate: app.date,
                  createdAt: app.createdAt,
                });
              }
            }
          });

          const mergedClients = Array.from(clientMap.values());
          saveClientsToStorage(mergedClients);
          return mergedClients;
        });
      }
    } catch (err) {
      console.error('Failed to load appointments from Supabase:', err);
    } finally {
      setSyncingCloud(false);
    }
  }, []);

  // 4. Sincronización en tiempo real con Supabase
  useEffect(() => {
    if (!user) return;

    // Carga inicial desde Supabase
    loadAppointmentsFromSupabase(user.id);

    // Canal Realtime para recibir cambios instantáneos de otros dispositivos
    const channel = supabase
      .channel('recepcion_realtime_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recepcion' },
        (_payload) => {
          loadAppointmentsFromSupabase(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadAppointmentsFromSupabase]);

  // Turnos de hoy
  const todayStr = getTodayString();
  const todayCount = useMemo(() => {
    return appointments.filter((a) => a.date === todayStr && a.status !== 'cancelado').length;
  }, [appointments, todayStr]);

  // Manejo de Guardado de Turno (Directo en Supabase y Local)
  const handleSaveAppointment = async (
    savedApp: Appointment,
    clientInfo: { isNew: boolean; client: Client }
  ) => {
    if (!user) return;

    const numericId = Number(savedApp.id);
    const isExistingInCloud = !isNaN(numericId) && Number.isInteger(numericId) && numericId > 0;

    const rowPayload = mapAppointmentToRow(savedApp, user.id);

    try {
      if (isExistingInCloud) {
        // Actualizar registro existente en tabla `recepcion`
        const { error } = await supabase
          .from('recepcion')
          .update(rowPayload)
          .eq('id', numericId);

        if (error) {
          console.error('Error al actualizar en Supabase:', error);
          alert('Hubo un problema al sincronizar con la nube: ' + error.message);
        }
      } else {
        // Insertar nuevo registro en tabla `recepcion`
        const { data, error } = await supabase
          .from('recepcion')
          .insert([rowPayload])
          .select()
          .single();

        if (error) {
          console.error('Error al insertar en Supabase:', error);
          alert('Hubo un problema al guardar en la nube: ' + error.message);
        } else if (data) {
          savedApp = mapRowToAppointment(data);
        }
      }
    } catch (err) {
      console.error('Excepción al conectar con Supabase:', err);
    }

    // Actualizar estado local de turnos
    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === savedApp.id);
      const updated = exists
        ? prev.map((a) => (a.id === savedApp.id ? savedApp : a))
        : [savedApp, ...prev];
      saveAppointmentsToStorage(updated);
      return updated;
    });

    // Actualizar cliente localmente
    setClients((prev) => {
      const exists = prev.some((c) => c.id === clientInfo.client.id);
      let updated: Client[];
      if (exists) {
        updated = prev.map((c) => (c.id === clientInfo.client.id ? clientInfo.client : c));
      } else {
        updated = [clientInfo.client, ...prev];
      }
      saveClientsToStorage(updated);
      return updated;
    });
  };

  // Eliminar turno en Supabase y localmente
  const handleDeleteAppointment = async (appointmentId: string) => {
    const numericId = Number(appointmentId);
    if (!isNaN(numericId) && Number.isInteger(numericId) && numericId > 0) {
      try {
        const { error } = await supabase
          .from('recepcion')
          .delete()
          .eq('id', numericId);

        if (error) {
          console.error('Error al eliminar en Supabase:', error);
        }
      } catch (err) {
        console.error('Excepción al eliminar en Supabase:', err);
      }
    }

    setAppointments((prev) => {
      const updated = prev.filter((a) => a.id !== appointmentId);
      saveAppointmentsToStorage(updated);
      return updated;
    });
  };

  // Cambiar estado rápido de un turno
  const handleChangeStatus = async (appointmentId: string, newStatus: AppointmentStatus) => {
    const target = appointments.find((a) => a.id === appointmentId);
    if (!target) return;

    const updatedApp: Appointment = {
      ...target,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    const numericId = Number(appointmentId);
    if (!isNaN(numericId) && Number.isInteger(numericId) && numericId > 0 && user) {
      try {
        await supabase
          .from('recepcion')
          .update({
            asistencia: newStatus === 'confirmado' ? 'si' : newStatus === 'cancelado' ? 'no' : newStatus,
            estado_pago: updatedApp.amountPaid >= updatedApp.price ? 'pagado' : updatedApp.amountPaid > 0 ? 'parcial' : 'pendiente',
          })
          .eq('id', numericId);
      } catch (err) {
        console.error('Error actualizando estado en Supabase:', err);
      }
    }

    setAppointments((prev) => {
      const updated = prev.map((a) => (a.id === appointmentId ? updatedApp : a));
      saveAppointmentsToStorage(updated);
      return updated;
    });
  };

  // Guardar clientes
  const handleSaveClient = (client: Client) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === client.id);
      const updated = exists
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [client, ...prev];
      saveClientsToStorage(updated);
      return updated;
    });
  };

  // Eliminar clientes
  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== clientId);
      saveClientsToStorage(updated);
      return updated;
    });
  };

  // Guardar servicios (catálogo)
  const handleSaveService = (savedService: Service) => {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === savedService.id);
      const updated = exists
        ? prev.map((s) => (s.id === savedService.id ? savedService : s))
        : [...prev, savedService];
      saveServicesToStorage(updated);
      return updated;
    });
  };

  // Eliminar servicio
  const handleDeleteService = (serviceId: string) => {
    setServices((prev) => {
      const updated = prev.filter((s) => s.id !== serviceId);
      saveServicesToStorage(updated);
      return updated;
    });
  };

  // Pausar/Activar servicio
  const handleToggleServiceActive = (serviceId: string) => {
    setServices((prev) => {
      const updated = prev.map((s) => (s.id === serviceId ? { ...s, active: !s.active } : s));
      saveServicesToStorage(updated);
      return updated;
    });
  };

  // Guardar plantillas
  const handleSaveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    saveTemplatesToStorage(newTemplates);
  };

  // Guardar configuración
  const handleSaveSettings = (newSettings: BusinessSettings) => {
    setSettings(newSettings);
    saveSettingsToStorage(newSettings);
  };

  // Restaurar datos completos
  const handleRestoreData = (data: {
    appointments: Appointment[];
    clients: Client[];
    services: Service[];
    settings: BusinessSettings;
    templates: MessageTemplate[];
  }) => {
    setAppointments(data.appointments);
    setClients(data.clients);
    setServices(data.services);
    setSettings(data.settings);
    setTemplates(data.templates);

    saveAppointmentsToStorage(data.appointments);
    saveClientsToStorage(data.clients);
    saveServicesToStorage(data.services);
    saveSettingsToStorage(data.settings);
    saveTemplatesToStorage(data.templates);
  };

  // Abrir modal de nuevo turno
  const handleOpenNewAppointment = (date?: string, time?: string) => {
    setAppointmentToEdit(null);
    setModalInitialDate(date || getTodayString());
    setModalInitialTime(time || '10:00');
    setAppointmentModalOpen(true);
  };

  // Abrir modal para editar turno
  const handleEditAppointment = (appointment: Appointment) => {
    setAppointmentToEdit(appointment);
    setAppointmentModalOpen(true);
  };

  // Abrir modal de WhatsApp
  const handleOpenWhatsApp = (
    appointment: Appointment | null,
    templateType: string = 'confirmacion',
    clientOverride?: { name: string; phone: string; serviceName?: string }
  ) => {
    setWhatsAppTargetAppointment(appointment);
    setWhatsAppTemplateType(templateType);
    setWhatsAppClientOverride(clientOverride || null);
    setWhatsAppModalOpen(true);
  };

  // Cerrar Sesión de Supabase
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Exportar a Excel (.xlsx)
  const handleExportExcel = async () => {
    try {
      await exportRecepcionToExcel(appointments);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      alert('Ocurrió un error al generar el archivo Excel.');
    }
  };

  // Probar timbre y ventana de alarma de 5 minutos
  const handleTestAlarm = () => {
    playAlarmChime();
    const sample = appointments.find((a) => a.date === todayStr && a.status !== 'cancelado') || appointments[0] || {
      id: 'demo-alarm',
      clientName: 'Cliente Ejemplo',
      clientPhone: '11 4455-6677',
      serviceName: services[0]?.name || 'Consulta Profesional',
      startTime: '16:00',
      endTime: '16:45',
      durationMinutes: 45,
      date: todayStr,
      price: 15000,
      deposit: 0,
      amountPaid: 0,
      status: 'confirmado',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clientId: 'cli-test',
      serviceId: 'srv-1',
    };
    setActiveAlarmAppointment(sample as Appointment);
  };

  // Filtro rápido seleccionado desde la barra lateral
  const handleSelectFilterFromSidebar = (status: string, dateF?: string) => {
    setListViewStatusFilter(status);
    if (dateF) {
      setListViewDateFilter(dateF as any);
    } else {
      setListViewDateFilter('all');
    }
    setActiveTab('appointments');
  };

  // Estado de carga inicial de autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-200">Conectando con Recepcionista Pro...</p>
        </div>
      </div>
    );
  }

  // Si el usuario no ha iniciado sesión, mostrar la pantalla de autenticación
  if (!user) {
    return <AuthScreen onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />;
  }

  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex font-sans">
      
      {/* ========================================================
          BARRA LATERAL IZQUIERDA:
          Enlaces de navegación principales, pestañas de sección 
          y filtros del panel de control
         ======================================================== */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        todayCount={todayCount}
        appointments={appointments}
        clientsCount={clients.length}
        isOpenMobile={sidebarOpenMobile}
        onCloseMobile={() => setSidebarOpenMobile(false)}
        onSelectFilter={handleSelectFilterFromSidebar}
        currentStatusFilter={listViewStatusFilter}
      />

      {/* ========================================================
          ÁREA PRINCIPAL: ENCABEZADO SUPERIOR + CONTENIDO
         ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* ENCABEZADO SUPERIOR: 
            Mantenga ÚNICAMENTE los botones de acción principales alineados en la esquina superior derecha:
            1. "Nuevo Turno" button
            2. Botón de exportación a Excel
            3. Icono de campana de alarma/notificación
            4. Icono de correo electrónico/cuenta del usuario
            5. "Cerrar Sesión" (Logout) button
        */}
        <Navbar
          onNewAppointment={() => handleOpenNewAppointment()}
          onExportExcel={handleExportExcel}
          onTestAlarm={handleTestAlarm}
          userEmail={user?.email}
          onSignOut={handleSignOut}
          onToggleMobileSidebar={() => setSidebarOpenMobile(true)}
          activeTab={activeTab}
          upcomingAlertsCount={upcomingAlerts.length}
          settings={settings}
        />

        {/* Indicador sutil de sincronización en la nube */}
        {syncingCloud && (
          <div className="bg-blue-600 text-white text-[11px] font-semibold py-1 px-4 text-center flex items-center justify-center gap-1.5 shadow-xs">
            <Cloud className="w-3.5 h-3.5 animate-pulse" />
            <span>Sincronizando con Supabase (tabla recepcion)...</span>
          </div>
        )}

        {/* Banner flotante de alerta y recordatorio en tiempo real */}
        <AppointmentAlertBanner
          alerts={upcomingAlerts}
          onDismiss={handleDismissAlert}
          onOpenWhatsApp={(app) => handleOpenWhatsApp(app, 'recordatorio')}
          onViewAppointment={(app) => handleEditAppointment(app)}
        />

        {/* Contenido Principal según Pestaña Activa */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              appointments={appointments}
              clients={clients}
              settings={settings}
              onNewAppointment={() => handleOpenNewAppointment()}
              onEditAppointment={handleEditAppointment}
              onChangeStatus={handleChangeStatus}
              onOpenWhatsApp={(app, tmpl, override) => handleOpenWhatsApp(app, tmpl, override)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              appointments={appointments}
              services={services}
              settings={settings}
              onNewAppointmentWithSlot={(date, time) => handleOpenNewAppointment(date, time)}
              onEditAppointment={handleEditAppointment}
              onChangeStatus={handleChangeStatus}
              onOpenWhatsApp={(app, tmpl) => handleOpenWhatsApp(app, tmpl)}
            />
          )}

          {activeTab === 'appointments' && (
            <AppointmentsListView
              appointments={appointments}
              services={services}
              settings={settings}
              onNewAppointment={() => handleOpenNewAppointment()}
              onEditAppointment={handleEditAppointment}
              onDeleteAppointment={handleDeleteAppointment}
              onChangeStatus={handleChangeStatus}
              onOpenWhatsApp={(app, tmpl) => handleOpenWhatsApp(app, tmpl)}
              initialStatusFilter={listViewStatusFilter}
              initialDateFilter={listViewDateFilter}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView
              clients={clients}
              appointments={appointments}
              settings={settings}
              onSaveClient={handleSaveClient}
              onDeleteClient={handleDeleteClient}
              onOpenWhatsApp={(app, tmpl, override) => handleOpenWhatsApp(app, tmpl, override)}
            />
          )}

          {activeTab === 'services' && (
            <ServicesView
              services={services}
              onSaveService={handleSaveService}
              onDeleteService={handleDeleteService}
              onToggleActive={handleToggleServiceActive}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesView
              templates={templates}
              appointments={appointments}
              settings={settings}
              onSaveTemplates={handleSaveTemplates}
              onOpenWhatsApp={(app, tmpl) => handleOpenWhatsApp(app, tmpl)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onRestoreData={handleRestoreData}
            />
          )}
        </main>
      </div>

      {/* Modal de Turno (con Campo de Servicios Dinámicos y Editables + Administrar) */}
      <AppointmentModal
        isOpen={appointmentModalOpen}
        onClose={() => setAppointmentModalOpen(false)}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        onOpenWhatsApp={(app) => {
          setAppointmentModalOpen(false);
          handleOpenWhatsApp(app);
        }}
        appointmentToEdit={appointmentToEdit}
        initialDate={modalInitialDate}
        initialStartTime={modalInitialTime}
        services={services}
        clients={clients}
        existingAppointments={appointments}
        settings={settings}
        onSaveService={handleSaveService}
        onDeleteService={handleDeleteService}
      />

      {/* Modal de WhatsApp */}
      <WhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        appointment={whatsAppTargetAppointment}
        clientOverride={whatsAppClientOverride}
        templates={templates}
        settings={settings}
        defaultTemplateType={whatsAppTemplateType}
      />

      {/* Modal de Alarma de 5 minutos */}
      <AlarmAlertModal
        isOpen={!!activeAlarmAppointment}
        appointment={activeAlarmAppointment}
        onClose={() => setActiveAlarmAppointment(null)}
        onOpenWhatsApp={(app) => {
          setActiveAlarmAppointment(null);
          handleOpenWhatsApp(app, 'recordatorio');
        }}
      />

    </div>
  );
}

import React from 'react';
import { 
  Plus, 
  FileSpreadsheet, 
  Bell, 
  User, 
  LogOut, 
  Menu,
  Cloud
} from 'lucide-react';
import { ActiveTab, BusinessSettings } from '../types';

interface NavbarProps {
  onNewAppointment: () => void;
  onExportExcel: () => void;
  onTestAlarm: () => void;
  userEmail?: string;
  onSignOut: () => void;
  onToggleMobileSidebar: () => void;
  activeTab?: ActiveTab;
  upcomingAlertsCount?: number;
  settings?: BusinessSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNewAppointment,
  onExportExcel,
  onTestAlarm,
  userEmail,
  onSignOut,
  onToggleMobileSidebar,
  activeTab = 'dashboard',
  upcomingAlertsCount = 0,
  settings,
}) => {
  // Título legible de la vista activa para el encabezado
  const tabTitles: Record<ActiveTab, string> = {
    dashboard: 'Panel Principal',
    calendar: 'Agenda de Turnos',
    appointments: 'Gestión de Turnos',
    clients: 'Directorio de Clientes',
    services: 'Catálogo de Servicios',
    messages: 'Plantillas de WhatsApp',
    settings: 'Configuración General',
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Lado Izquierdo: Botón Menú Móvil + Título de la Sección */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Disparador de la Barra Lateral en Móviles / Tablets */}
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Título de la Sección actual y nombre del negocio */}
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                {tabTitles[activeTab] || 'Recepcionista Pro'}
              </h1>
              {settings?.businessName && (
                <p className="text-[11px] text-slate-600 truncate hidden sm:block">
                  {settings.businessName}
                </p>
              )}
            </div>
          </div>

          {/* ESQUINA SUPERIOR DERECHA:
              ÚNICAMENTE los botones de acción principales alineados:
              1. "Nuevo Turno" button
              2. Botón de exportación a Excel
              3. Icono de campana de alarma/notificación
              4. Icono de correo electrónico/cuenta del usuario
              5. "Cerrar Sesión" (Logout) button
          */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* 1. Botón "Nuevo Turno" */}
            <button
              onClick={onNewAppointment}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 cursor-pointer shrink-0"
              title="Registrar un nuevo turno o cita"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Nuevo Turno</span>
              <span className="sm:hidden">Turno</span>
            </button>

            {/* 2. Botón de Exportación a Excel */}
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 text-white px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold shadow-xs transition-all border border-emerald-600 cursor-pointer shrink-0"
              title="Exportar base de turnos a archivo Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="hidden md:inline">Exportar a Excel</span>
              <span className="md:hidden hidden sm:inline">Excel</span>
            </button>

            {/* 3. Icono de Campana de Alarma / Notificación */}
            <button
              onClick={onTestAlarm}
              className="relative p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 rounded-xl transition-all cursor-pointer shrink-0"
              title="Alarma automática activa: suena 5 minutos antes de la cita. Clic para probar timbre."
              aria-label="Alarma y notificaciones de turnos"
            >
              <Bell className="w-4 h-4 text-amber-600" />
              {upcomingAlertsCount > 0 ? (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {upcomingAlertsCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>

            {/* 4. Icono de Correo Electrónico / Cuenta del Usuario */}
            {userEmail ? (
              <div 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium cursor-default shrink-0"
                title={`Usuario autenticado en Supabase: ${userEmail}`}
              >
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="hidden xl:inline font-mono text-[11px] truncate max-w-[140px]">
                  {userEmail}
                </span>
              </div>
            ) : (
              <div 
                className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 shrink-0"
                title="Usuario Conectado"
              >
                <User className="w-4 h-4" />
              </div>
            )}

            {/* 5. Botón "Cerrar Sesión" (Logout) */}
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Cerrar sesión de Supabase"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

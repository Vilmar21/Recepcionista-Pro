import React from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  ListFilter, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Settings as SettingsIcon, 
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Database,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { ActiveTab, Appointment, BusinessSettings } from '../types';
import { getTodayString } from '../utils/date';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: BusinessSettings;
  todayCount: number;
  appointments: Appointment[];
  clientsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectFilter?: (statusFilter: string, dateFilter?: string) => void;
  currentStatusFilter?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  todayCount,
  appointments,
  clientsCount,
  isOpenMobile,
  onCloseMobile,
  onSelectFilter,
  currentStatusFilter = 'all',
}) => {
  const todayStr = getTodayString();

  // Conteo de estados para filtros rápidos
  const filterCounts = React.useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let completed = 0;
    let cancelled = 0;
    let todayPending = 0;

    for (const a of appointments) {
      if (a.status === 'pendiente') {
        pending++;
        if (a.date === todayStr) todayPending++;
      } else if (a.status === 'confirmado') {
        confirmed++;
      } else if (a.status === 'completado') {
        completed++;
      } else if (a.status === 'cancelado') {
        cancelled++;
      }
    }

    return {
      all: appointments.length,
      today: todayCount,
      todayPending,
      pending,
      confirmed,
      completed,
      cancelled,
    };
  }, [appointments, todayCount, todayStr]);

  const navItems = [
    { 
      id: 'dashboard' as ActiveTab, 
      label: 'Inicio / Panel', 
      icon: LayoutDashboard,
      description: 'Métricas, finanzas y turnos del día'
    },
    { 
      id: 'calendar' as ActiveTab, 
      label: 'Agenda', 
      icon: Calendar, 
      badge: todayCount > 0 ? `${todayCount} hoy` : undefined,
      description: 'Vista de calendario semanal y diario'
    },
    { 
      id: 'appointments' as ActiveTab, 
      label: 'Lista de Turnos', 
      icon: ListFilter,
      badge: appointments.length > 0 ? String(appointments.length) : undefined,
      description: 'Gestión detallada, pagos y filtros'
    },
    { 
      id: 'clients' as ActiveTab, 
      label: 'Clientes', 
      icon: Users,
      badge: clientsCount > 0 ? String(clientsCount) : undefined,
      description: 'Historial, asistencias y WhatsApp'
    },
    { 
      id: 'services' as ActiveTab, 
      label: 'Servicios', 
      icon: Briefcase,
      description: 'Catálogo de precios y duración'
    },
    { 
      id: 'messages' as ActiveTab, 
      label: 'Mensajes WhatsApp', 
      icon: MessageSquare,
      description: 'Plantillas y recordatorios automáticos'
    },
    { 
      id: 'settings' as ActiveTab, 
      label: 'Configuración', 
      icon: SettingsIcon,
      description: 'Horarios, descansos y negocio'
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const handleQuickFilterClick = (status: string, dateF?: string) => {
    if (onSelectFilter) {
      onSelectFilter(status, dateF);
    }
    setActiveTab('appointments');
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800 select-none">
      
      {/* 1. Header de la Barra Lateral: Marca y Logo */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <button 
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-800 p-1 border border-slate-700 shadow-md group-hover:border-blue-500 transition-all flex items-center justify-center overflow-hidden shrink-0">
              <img 
                src="https://i.postimg.cc/Yq5ZGfpz/Gemini-Generated-Image-9wbbqy9wbbqy9wbb-modified.png" 
                alt="Recepcionista Pro Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-blue-300 transition-colors">
                  Recepcionista Pro
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider text-blue-400 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800/80">
                  ARG
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[170px]" title={settings.businessName}>
                {settings.businessName || 'Gestión Profesional'}
              </p>
            </div>
          </button>

          {/* Botón cerrar en móvil */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Cerrar barra lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Cuerpo Desplazable: Menú Principal y Filtros Rápidos */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        
        {/* Navegación Principal */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navegación Principal
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sección de Filtros y Atajos Rápidos del Panel */}
        <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
          <div className="px-3 pb-1 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Filtros Rápidos
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {appointments.length} total
            </span>
          </div>

          {/* Filtro: Turnos de Hoy */}
          <button
            onClick={() => handleQuickFilterClick('all', 'today')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Turnos de Hoy</span>
            </div>
            <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
              filterCounts.today > 0 
                ? 'bg-blue-900/60 text-blue-300 border border-blue-700/60' 
                : 'text-slate-400'
            }`}>
              {filterCounts.today}
            </span>
          </button>

          {/* Filtro: Pendientes */}
          <button
            onClick={() => handleQuickFilterClick('pendiente')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
              activeTab === 'appointments' && currentStatusFilter === 'pendiente'
                ? 'bg-amber-950/40 text-amber-300 border border-amber-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Pendientes</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/70 border border-amber-800/60 px-1.5 py-0.5 rounded">
              {filterCounts.pending}
            </span>
          </button>

          {/* Filtro: Confirmados */}
          <button
            onClick={() => handleQuickFilterClick('confirmado')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
              activeTab === 'appointments' && currentStatusFilter === 'confirmado'
                ? 'bg-blue-950/40 text-blue-300 border border-blue-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confirmados</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
              {filterCounts.confirmed}
            </span>
          </button>

          {/* Filtro: Cancelados */}
          {filterCounts.cancelled > 0 && (
            <button
              onClick={() => handleQuickFilterClick('cancelado')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                activeTab === 'appointments' && currentStatusFilter === 'cancelado'
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Cancelados</span>
              </div>
              <span className="text-[11px] font-mono text-rose-400 bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-900/50">
                {filterCounts.cancelled}
              </span>
            </button>
          )}
        </div>

      </div>

      {/* 3. Footer de la Barra Lateral: Estado y Profesional */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40 shrink-0 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold">Supabase Realtime</span>
          </div>
          <span className="text-slate-400 font-mono text-[10px]">recepcion</span>
        </div>

        {settings.ownerName && (
          <div className="text-[11px] text-slate-400 truncate">
            <span className="text-slate-400">Atención: </span>
            <span className="text-slate-200 font-semibold">{settings.ownerName}</span>
          </div>
        )}
      </div>

    </div>
  );

  return (
    <>
      {/* Sidebar fijo en Desktop */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0 h-screen sticky top-0 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Sidebar emergente (Drawer) en Mobile / Tablet */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop con desenfoque suave */}
          <div 
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Panel deslizante */}
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

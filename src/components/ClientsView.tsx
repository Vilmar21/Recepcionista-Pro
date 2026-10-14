import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  FileSpreadsheet, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Send, 
  Edit3, 
  Trash2, 
  Clock, 
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import { Client, BusinessSettings, Appointment } from '../types';
import { exportClientsToCSV } from '../utils/storage';
import { formatCurrencyARS, formatDateHuman, getDaysDifference, getTodayString } from '../utils/date';
import { normalizeArgentinePhone } from '../utils/phone';

interface ClientsViewProps {
  clients: Client[];
  appointments: Appointment[];
  settings: BusinessSettings;
  onSaveClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onOpenWhatsApp: (appointment: Appointment | null, templateType?: string, clientOverride?: { name: string; phone: string; serviceName?: string }) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  appointments,
  settings,
  onSaveClient,
  onDeleteClient,
  onOpenWhatsApp,
}) => {
  const todayStr = getTodayString();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'inactive'>('all');
  const [inactiveDaysThreshold, setInactiveDaysThreshold] = useState<number>(settings.inactiveClientThresholdDays || 40);

  // Modal para crear / editar cliente
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const openClientModal = (clientToEdit?: Client) => {
    if (clientToEdit) {
      setEditingClient(clientToEdit);
      setName(clientToEdit.name);
      setPhone(clientToEdit.phone);
      setEmail(clientToEdit.email || '');
      setNotes(clientToEdit.notes || '');
    } else {
      setEditingClient(null);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
    setClientModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Por favor completa nombre y teléfono.');
      return;
    }

    const clientData: Client = {
      id: editingClient ? editingClient.id : `cli-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      totalVisits: editingClient ? editingClient.totalVisits : 0,
      totalSpent: editingClient ? editingClient.totalSpent : 0,
      lastVisitDate: editingClient ? editingClient.lastVisitDate : undefined,
      createdAt: editingClient ? editingClient.createdAt : new Date().toISOString(),
    };

    onSaveClient(clientData);
    setClientModalOpen(false);
  };

  // Filtrado y clasificación
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesPhone = c.phone.includes(q);
        const matchesEmail = (c.email || '').toLowerCase().includes(q);
        const matchesNotes = (c.notes || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesEmail && !matchesNotes) {
          return false;
        }
      }

      if (activeFilter === 'inactive') {
        if (!c.lastVisitDate) return true;
        const diff = getDaysDifference(c.lastVisitDate, todayStr);
        return diff >= inactiveDaysThreshold;
      }

      return true;
    }).sort((a, b) => {
      if (activeFilter === 'inactive') {
        // Los que hace más tiempo no vienen primero
        const diffA = a.lastVisitDate ? getDaysDifference(a.lastVisitDate, todayStr) : 999;
        const diffB = b.lastVisitDate ? getDaysDifference(b.lastVisitDate, todayStr) : 999;
        return diffB - diffA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [clients, searchTerm, activeFilter, inactiveDaysThreshold, todayStr]);

  const totalInactiveCount = useMemo(() => {
    return clients.filter((c) => {
      if (!c.lastVisitDate) return true;
      return getDaysDifference(c.lastVisitDate, todayStr) >= inactiveDaysThreshold;
    }).length;
  }, [clients, inactiveDaysThreshold, todayStr]);

  return (
    <div className="space-y-4">
      
      {/* Barra Superior con Búsqueda, Filtro de Fidelización y Botones */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente por nombre, teléfono, email..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportClientsToCSV(filteredClients)}
              title="Descargar lista de clientes en CSV"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              onClick={() => openClientModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Cliente</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Fidelización / Inactivos */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos los Clientes ({clients.length})
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeFilter === 'inactive'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Para Reactivar / Inactivos ({totalInactiveCount})</span>
            </button>
          </div>

          {activeFilter === 'inactive' && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/80 rounded-lg px-3 py-1 text-amber-900">
              <span className="font-medium text-[11px]">Inactivos sin turno hace más de:</span>
              <select
                value={inactiveDaysThreshold}
                onChange={(e) => setInactiveDaysThreshold(Number(e.target.value))}
                className="bg-white border border-amber-300 rounded px-2 py-0.5 text-xs font-bold text-amber-900 focus:outline-none"
              >
                <option value={20}>20 días</option>
                <option value={30}>30 días</option>
                <option value={45}>45 días</option>
                <option value={60}>60 días</option>
                <option value={90}>90 días</option>
              </select>
            </div>
          )}

        </div>

      </div>

      {/* Directorio de Clientes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">
              No se encontraron clientes con el criterio seleccionado
            </p>
            <p className="text-xs text-slate-500">
              Probá restableciendo los filtros o agregando un nuevo cliente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredClients.map((c) => {
              const phoneInfo = normalizeArgentinePhone(c.phone);
              const daysSince = c.lastVisitDate ? getDaysDifference(c.lastVisitDate, todayStr) : null;
              const isInactive = daysSince !== null && daysSince >= inactiveDaysThreshold;

              return (
                <div
                  key={c.id}
                  className="p-4 sm:px-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Info Cliente */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {c.name}
                      </span>
                      {isInactive && (
                        <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300/60 px-1.5 py-0.2 rounded">
                          Hace {daysSince} días sin venir
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 text-slate-500 text-[11px]">
                      <span className="font-mono text-slate-700 font-medium">
                        {phoneInfo.displayFormatted || c.phone}
                      </span>
                      {c.email && (
                        <>
                          <span>·</span>
                          <span>{c.email}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>Total visitas: <strong className="text-slate-800">{c.totalVisits}</strong></span>
                      {c.totalSpent > 0 && (
                        <>
                          <span>·</span>
                          <span>Total consumido: <strong className="font-mono text-slate-800">{formatCurrencyARS(c.totalSpent)}</strong></span>
                        </>
                      )}
                    </div>

                    {c.lastVisitDate && (
                      <p className="text-[11px] text-slate-400">
                        Última visita registrada: {formatDateHuman(c.lastVisitDate)}
                      </p>
                    )}

                    {c.notes && (
                      <p className="text-[11px] text-slate-600 italic max-w-lg mt-0.5">
                        Nota: {c.notes}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                    
                    {/* Botón WhatsApp Fidelización o Contacto */}
                    <button
                      onClick={() => {
                        onOpenWhatsApp(
                          null,
                          isInactive ? 'fidelizacion' : 'confirmacion',
                          { name: c.name, phone: c.phone }
                        );
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isInactive
                          ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isInactive ? 'Reconectar por WhatsApp' : 'WhatsApp'}</span>
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => openClientModal(c)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                      title="Editar ficha del cliente"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Eliminar */}
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar la ficha de ${c.name}?`)) {
                          onDeleteClient(c.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                      title="Eliminar cliente"
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

      {/* Modal Crear / Editar Cliente */}
      {clientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="text-base font-bold text-white">
                {editingClient ? 'Editar Ficha de Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setClientModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Sofía Gómez"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Teléfono (WhatsApp Argentino) *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 11 4455-6677 o 341 555 1234"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sofia@gmail.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Notas / Observaciones del Cliente
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferencias, alergias, productos favoritos..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClientModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Clock, 
  DollarSign, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  Sparkles,
  Tag
} from 'lucide-react';
import { Service } from '../types';
import { formatCurrencyARS } from '../utils/date';

interface ServicesViewProps {
  services: Service[];
  onSaveService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
  onToggleActive: (serviceId: string) => void;
}

export const ServicesView: React.FC<ServicesViewProps> = ({
  services,
  onSaveService,
  onDeleteService,
  onToggleActive,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [price, setPrice] = useState(15000);
  const [category, setCategory] = useState('Servicios');
  const [description, setDescription] = useState('');

  const openModal = (serviceToEdit?: Service) => {
    if (serviceToEdit) {
      setEditingService(serviceToEdit);
      setName(serviceToEdit.name);
      setDurationMinutes(serviceToEdit.durationMinutes);
      setPrice(serviceToEdit.price);
      setCategory(serviceToEdit.category || 'Servicios');
      setDescription(serviceToEdit.description || '');
    } else {
      setEditingService(null);
      setName('');
      setDurationMinutes(45);
      setPrice(15000);
      setCategory('Servicios');
      setDescription('');
    }
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa el nombre del servicio.');
      return;
    }

    const serviceData: Service = {
      id: editingService ? editingService.id : `srv-${Date.now()}`,
      name: name.trim(),
      durationMinutes: Number(durationMinutes) || 30,
      price: Number(price) || 0,
      category: category.trim() || 'Servicios',
      color: editingService ? editingService.color : 'blue',
      description: description.trim() || undefined,
      active: editingService ? editingService.active : true,
    };

    onSaveService(serviceData);
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      
      {/* Encabezado */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <span>Catálogo de Servicios</span>
          </h2>
          <p className="text-xs text-slate-500">
            Define los servicios de tu actividad profesional, su duración y precios en Pesos Argentinos ($ ARS). Totalmente editable para cualquier profesión o rubro.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Servicio</span>
        </button>
      </div>

      {/* Grilla de Servicios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((srv) => (
          <div
            key={srv.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
              srv.active
                ? 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {srv.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {srv.name}
                  </h3>
                </div>

                <button
                  onClick={() => onToggleActive(srv.id)}
                  title={srv.active ? 'Desactivar temporalmente' : 'Activar servicio'}
                  className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                    srv.active
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {srv.active ? 'Activo' : 'Pausado'}
                </button>
              </div>

              {srv.description && (
                <p className="text-xs text-slate-600 line-clamp-2">
                  {srv.description}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold">{srv.durationMinutes} minutos</span>
                </div>
                <div className="font-mono font-extrabold text-base text-slate-900">
                  {formatCurrencyARS(srv.price)}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openModal(srv)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Editar servicio"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar el servicio "${srv.name}"?`)) {
                      onDeleteService(srv.id);
                    }
                  }}
                  className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Eliminar servicio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Modal Crear / Editar Servicio */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Consulta Profesional / Asesoría / Atención Personalizada"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duración (Minutos) *
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value) || 30)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Precio ($ ARS) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Categoría o Rubro
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej: Consultoría, Atención Médica, Servicios Profesionales, Especialidad..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Descripción del Servicio (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles sobre qué incluye la atención o el servicio..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
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

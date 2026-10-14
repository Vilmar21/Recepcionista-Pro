import React, { useState } from 'react';
import { 
  X, 
  Briefcase, 
  Plus, 
  Edit3, 
  Trash2, 
  Clock, 
  DollarSign, 
  Check, 
  RotateCcw,
  Tag
} from 'lucide-react';
import { Service } from '../types';
import { formatCurrencyARS } from '../utils/date';

interface ManageServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  onSaveService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
  onSelectService?: (service: Service) => void;
}

export const ManageServicesModal: React.FC<ManageServicesModalProps> = ({
  isOpen,
  onClose,
  services,
  onSaveService,
  onDeleteService,
  onSelectService,
}) => {
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Formulario
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [price, setPrice] = useState(15000);
  const [category, setCategory] = useState('Servicios');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleStartEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setName(service.name);
    setDurationMinutes(service.durationMinutes);
    setPrice(service.price);
    setCategory(service.category || 'Servicios');
  };

  const handleCancelEdit = () => {
    setEditingServiceId(null);
    setName('');
    setDurationMinutes(45);
    setPrice(15000);
    setCategory('Servicios');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa el nombre del servicio.');
      return;
    }

    const serviceData: Service = {
      id: editingServiceId || `srv-${Date.now()}`,
      name: name.trim(),
      durationMinutes: Number(durationMinutes) || 30,
      price: Number(price) || 0,
      category: category.trim() || 'Servicios',
      color: 'blue',
      active: true,
    };

    onSaveService(serviceData);

    // Si el usuario estaba agregando uno nuevo y desea seleccionarlo de inmediato
    if (!editingServiceId && onSelectService) {
      onSelectService(serviceData);
    }

    handleCancelEdit();
  };

  const handleDelete = (serviceId: string, serviceName: string) => {
    if (confirm(`¿Estás seguro de eliminar el servicio "${serviceName}" del catálogo?`)) {
      onDeleteService(serviceId);
      if (editingServiceId === serviceId) {
        handleCancelEdit();
      }
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (s.category && s.category.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col my-4 max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Encabezado */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Administrar Catálogo de Servicios
              </h2>
              <p className="text-xs text-slate-300">
                Agrega nuevos servicios, edita duraciones y precios, o elimina de la lista
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

        {/* Contenido dividido en Formulario y Lista */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Formulario: AGREGAR O EDITAR SERVICIO */}
          <form 
            onSubmit={handleSubmit}
            className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                {editingServiceId ? (
                  <>
                    <Edit3 className="w-4 h-4 text-blue-600" />
                    <span>Modificar Servicio Existente</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Agregar Nuevo Servicio al Catálogo</span>
                  </>
                )}
              </h3>
              {editingServiceId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Cancelar edición</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nombre */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Consulta Médica, Corte + Peinado, Tratamiento Facial"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duración */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duración estimada (minutos)</span>
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value) || 15)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span>Precio sugerido ($ ARS)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  required
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Categoría */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  <span>Categoría o Rubro</span>
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej: Consultas, Tratamientos, Estética, General"
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {editingServiceId ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Agregar al Catálogo</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* LISTA DE SERVICIOS EXISTENTES CON OPCIONES DE EDITAR / ELIMINAR */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Servicios Disponibles ({services.length})</span>
              </h3>
              
              {/* Buscador de servicios */}
              {services.length > 3 && (
                <input
                  type="text"
                  placeholder="Buscar servicio..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg max-w-[200px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>

            {filteredServices.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                No hay servicios cargados que coincidan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white max-h-64 overflow-y-auto">
                {filteredServices.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors ${
                      editingServiceId === s.id ? 'bg-blue-50/70' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {s.name}
                        </span>
                        {s.category && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium truncate">
                            {s.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {s.durationMinutes} min
                        </span>
                        <span className="font-mono font-semibold text-slate-800">
                          {formatCurrencyARS(s.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botón Seleccionar para el Turno */}
                      {onSelectService && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectService(s);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                          title="Seleccionar este servicio para el turno actual"
                        >
                          Usar
                        </button>
                      )}

                      {/* Botón EDITAR */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(s)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar servicio"
                        aria-label={`Editar ${s.name}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Botón ELIMINAR */}
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar servicio"
                        aria-label={`Eliminar ${s.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Building2, 
  Clock, 
  CalendarOff, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  ShieldCheck, 
  Save, 
  Check, 
  CreditCard, 
  Plus, 
  X,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { BusinessSettings } from '../types';
import { exportBackupJSON, restoreBackupJSON, resetToDemoData, clearAllData } from '../utils/storage';
import { formatDateHuman } from '../utils/date';

interface SettingsViewProps {
  settings: BusinessSettings;
  onSaveSettings: (settings: BusinessSettings) => void;
  onRestoreData: (restoredData: any) => void;
}

const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onRestoreData,
}) => {
  const [formData, setFormData] = useState<BusinessSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [newOffDay, setNewOffDay] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const handleTextChange = (field: keyof BusinessSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleDayToggle = (dayIdx: number, enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      workDays: {
        ...prev.workDays,
        [dayIdx]: {
          ...prev.workDays[dayIdx],
          enabled,
        },
      },
    }));
    setSavedSuccess(false);
  };

  const handleDayTimeChange = (
    dayIdx: number,
    field: 'start1' | 'end1' | 'start2' | 'end2' | 'hasBreak',
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      workDays: {
        ...prev.workDays,
        [dayIdx]: {
          ...prev.workDays[dayIdx],
          [field]: value,
        },
      },
    }));
    setSavedSuccess(false);
  };

  const handleAddOffDay = () => {
    if (!newOffDay) return;
    if (formData.holidaysAndOffDays.includes(newOffDay)) {
      alert('Esta fecha ya está en la lista de días no laborables.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      holidaysAndOffDays: [...prev.holidaysAndOffDays, newOffDay].sort(),
    }));
    setNewOffDay('');
    setSavedSuccess(false);
  };

  const handleRemoveOffDay = (dateStr: string) => {
    setFormData((prev) => ({
      ...prev,
      holidaysAndOffDays: prev.holidaysAndOffDays.filter((d) => d !== dateStr),
    }));
    setSavedSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Manejo de Restauración de Backup JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreBackupJSON(content);
      if (res.success && res.data) {
        onRestoreData(res.data);
        setFormData(res.data.settings);
        setRestoreStatus(res.message);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    if (confirm('¿Cargar datos de ejemplo de Argentina? Esto reemplazará los turnos y clientes actuales con una muestra lista para usar.')) {
      const res = resetToDemoData();
      onRestoreData(res);
      setFormData(res.settings);
      setRestoreStatus('Datos de demostración cargados exitosamente.');
    }
  };

  const handleClearAll = () => {
    if (confirm('¿Estás seguro de que deseas eliminar TODOS los turnos y clientes? Esta acción dejará la agenda vacía.')) {
      if (confirm('Confirmación final: ¿proceder con el vaciado total?')) {
        const res = clearAllData();
        onRestoreData(res);
        setFormData(res.settings);
        setRestoreStatus('Todos los datos fueron eliminados.');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <span>Configuración del Negocio y Agenda</span>
          </h2>
          <p className="text-xs text-slate-500">
            Define horarios de atención, descansos, datos de cobro y realiza copias de seguridad.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all shadow-xs"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>¡Guardado!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </>
          )}
        </button>
      </div>

      {restoreStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span>{restoreStatus}</span>
          <button onClick={() => setRestoreStatus(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Sección 1: Datos Generales y Datos de Cobro */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Identidad del Negocio y Pagos</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre del Negocio / Estudio *
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleTextChange('businessName', e.target.value)}
                placeholder="Ej: Studio Belleza & Estética"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nombre del Profesional / Titular *
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => handleTextChange('ownerName', e.target.value)}
                placeholder="Ej: Lic. Martín Gómez"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rubro o Especialidad
              </label>
              <input
                type="text"
                value={formData.profession}
                onChange={(e) => handleTextChange('profession', e.target.value)}
                placeholder="Ej: Peluquería, Consultorio, Kinesiología..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Teléfono de Atención
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleTextChange('phone', e.target.value)}
                placeholder="11 5555-1234"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Dirección del Local o Consultorio
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleTextChange('address', e.target.value)}
                placeholder="Ej: Av. Santa Fe 3420 3° B, Palermo, CABA"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Datos de transferencia bancaria / MP para señas */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Alias de Mercado Pago / CVU</span>
              </label>
              <input
                type="text"
                value={formData.paymentAlias}
                onChange={(e) => handleTextChange('paymentAlias', e.target.value)}
                placeholder="ej: negocio.turno.mp"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                CBU o Banco (Opcional)
              </label>
              <input
                type="text"
                value={formData.paymentCbu || ''}
                onChange={(e) => handleTextChange('paymentCbu', e.target.value)}
                placeholder="00000031000..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Días de inactividad para Fidelización
              </label>
              <input
                type="number"
                min={10}
                max={180}
                value={formData.inactiveClientThresholdDays}
                onChange={(e) => handleTextChange('inactiveClientThresholdDays', Number(e.target.value) || 40)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Días Laborables y Horarios de Atención */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Días Laborables y Horarios de Atención</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Validación automática de solapamientos y descansos
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => {
              const day = formData.workDays[dayIdx] || { enabled: false, start1: '09:00', end1: '18:00', hasBreak: false };
              const dayName = DAY_NAMES[dayIdx];

              return (
                <div key={dayIdx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  
                  {/* Switch Día */}
                  <div className="flex items-center gap-3 w-36 shrink-0">
                    <input
                      type="checkbox"
                      id={`day-${dayIdx}`}
                      checked={day.enabled}
                      onChange={(e) => handleDayToggle(dayIdx, e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor={`day-${dayIdx}`} className={`font-bold cursor-pointer ${day.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                      {dayName}
                    </label>
                  </div>

                  {/* Horarios */}
                  {day.enabled ? (
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Desde:</span>
                        <input
                          type="time"
                          value={day.start1}
                          onChange={(e) => handleDayTimeChange(dayIdx, 'start1', e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs text-slate-900"
                        />
                        <span className="text-slate-500 font-medium">hasta:</span>
                        <input
                          type="time"
                          value={day.end1}
                          onChange={(e) => handleDayTimeChange(dayIdx, 'end1', e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs text-slate-900"
                        />
                      </div>

                      {/* Pausa / Turno Tarde */}
                      <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                        <input
                          type="checkbox"
                          id={`break-${dayIdx}`}
                          checked={day.hasBreak}
                          onChange={(e) => handleDayTimeChange(dayIdx, 'hasBreak', e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                        />
                        <label htmlFor={`break-${dayIdx}`} className="text-slate-600 font-medium cursor-pointer">
                          Pausa / Corte de almuerzo
                        </label>

                        {day.hasBreak && (
                          <div className="flex items-center gap-1.5 ml-2">
                            <span className="text-slate-500 font-medium">Reanuda:</span>
                            <input
                              type="time"
                              value={day.start2 || '14:30'}
                              onChange={(e) => handleDayTimeChange(dayIdx, 'start2', e.target.value)}
                              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs text-slate-900"
                            />
                            <span className="text-slate-500 font-medium">hasta:</span>
                            <input
                              type="time"
                              value={day.end2 || '19:30'}
                              onChange={(e) => handleDayTimeChange(dayIdx, 'end2', e.target.value)}
                              className="bg-slate-50 border border-slate-300 rounded px-2 py-1 font-mono text-xs text-slate-900"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No laborable (Cerrado)</span>
                  )}

                </div>
              );
            })}
          </div>
        </div>

        {/* Sección 3: Días No Laborables / Feriados */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <CalendarOff className="w-4 h-4 text-rose-600" />
            <span>Feriados y Días No Laborables Específicos</span>
          </h3>

          <p className="text-xs text-slate-500">
            Agrega fechas concretas en las que no atenderás turnos (vacaciones, feriados nacionales o días personales).
          </p>

          <div className="flex items-center gap-2 max-w-sm">
            <input
              type="date"
              value={newOffDay}
              onChange={(e) => setNewOffDay(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAddOffDay}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Día</span>
            </button>
          </div>

          {formData.holidaysAndOffDays.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.holidaysAndOffDays.map((d) => (
                <div
                  key={d}
                  className="bg-rose-50 border border-rose-200 text-rose-900 px-2.5 py-1 rounded-lg text-xs flex items-center gap-2 font-medium"
                >
                  <span>{formatDateHuman(d, { short: true })} ({formatDateHuman(d)})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOffDay(d)}
                    className="text-rose-600 hover:text-rose-900"
                    title="Eliminar de no laborables"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sección 4: Copias de Seguridad, Privacidad y Costo Cero */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Gestión de Datos y Copias de Seguridad (100% Costo Cero)</span>
            </h3>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Almacenamiento Local Seguro</span>
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <p className="font-semibold text-slate-900">
              ¿Dónde se guardan mis datos?
            </p>
            <p className="text-slate-600 leading-relaxed">
              Recepcionista Pro almacena todos tus clientes, turnos, precios y mensajes <strong>directamente en la memoria de este navegador web</strong> (LocalStorage). Esto garantiza máxima privacidad, funciona de inmediato y no requiere pagar servidores ni suscripciones mensuales. Para resguardar tu información o cambiar de dispositivo, descargá periódicamente una copia de seguridad.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            
            {/* Descargar JSON */}
            <button
              type="button"
              onClick={exportBackupJSON}
              className="p-3.5 rounded-xl border border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 text-left transition-all flex flex-col justify-between gap-2 shadow-xs group"
            >
              <Download className="w-5 h-5 text-blue-600 group-hover:scale-105 transition-transform" />
              <div>
                <p className="text-xs font-bold text-slate-900">Descargar Copia JSON</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Guarda un archivo de respaldo en tu computadora o teléfono.</p>
              </div>
            </button>

            {/* Restaurar JSON */}
            <label className="p-3.5 rounded-xl border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all flex flex-col justify-between gap-2 shadow-xs cursor-pointer group">
              <Upload className="w-5 h-5 text-emerald-600 group-hover:scale-105 transition-transform" />
              <div>
                <p className="text-xs font-bold text-slate-900">Restaurar Copia JSON</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Recupera turnos y clientes desde un archivo descargado.</p>
              </div>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Cargar Demo */}
            <button
              type="button"
              onClick={handleResetDemo}
              className="p-3.5 rounded-xl border border-slate-300 hover:border-amber-500 hover:bg-amber-50/40 text-left transition-all flex flex-col justify-between gap-2 shadow-xs group"
            >
              <RotateCcw className="w-5 h-5 text-amber-600 group-hover:scale-105 transition-transform" />
              <div>
                <p className="text-xs font-bold text-slate-900">Cargar Datos Demo</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Rellena la app con turnos y clientes de prueba de Argentina.</p>
              </div>
            </button>

            {/* Vaciar Datos */}
            <button
              type="button"
              onClick={handleClearAll}
              className="p-3.5 rounded-xl border border-rose-200 hover:border-rose-400 hover:bg-rose-50/40 text-left transition-all flex flex-col justify-between gap-2 shadow-xs group"
            >
              <Trash2 className="w-5 h-5 text-rose-600 group-hover:scale-105 transition-transform" />
              <div>
                <p className="text-xs font-bold text-rose-900">Limpiar Todo</p>
                <p className="text-[11px] text-rose-600/80 mt-0.5">Elimina turnos y clientes para empezar completamente de cero.</p>
              </div>
            </button>

          </div>

        </div>

      </form>
    </div>
  );
};

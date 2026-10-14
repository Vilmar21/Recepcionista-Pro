import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  Edit3, 
  Save, 
  RotateCcw, 
  Sparkles, 
  User, 
  Calendar, 
  Info,
  PhoneCall
} from 'lucide-react';
import { Appointment, BusinessSettings, MessageTemplate } from '../types';
import { renderMessageTemplate, DEFAULT_TEMPLATES } from '../utils/templates';
import { buildWhatsAppLink, normalizeArgentinePhone } from '../utils/phone';

interface MessagesViewProps {
  templates: MessageTemplate[];
  appointments: Appointment[];
  settings: BusinessSettings;
  onSaveTemplates: (templates: MessageTemplate[]) => void;
  onOpenWhatsApp: (appointment: Appointment, templateType?: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  templates,
  appointments,
  settings,
  onSaveTemplates,
  onOpenWhatsApp,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(appointments[0]?.id || '');
  const [editingTemplateContent, setEditingTemplateContent] = useState<string>(templates[0]?.content || '');
  const [customClientName, setCustomClientName] = useState<string>('Camila Gómez');
  const [customPhone, setCustomPhone] = useState<string>('11 4455-6677');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];
  const selectedAppointment = appointments.find(a => a.id === selectedAppointmentId);

  const handleSelectTemplate = (tmpl: MessageTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setEditingTemplateContent(tmpl.content);
    setSavedSuccess(false);
  };

  const handleSaveCurrentTemplate = () => {
    const updated = templates.map(t => {
      if (t.id === selectedTemplateId) {
        return { ...t, content: editingTemplateContent };
      }
      return t;
    });
    onSaveTemplates(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    if (confirm('¿Restablecer todas las plantillas a los textos sugeridos originales?')) {
      onSaveTemplates(DEFAULT_TEMPLATES);
      const matched = DEFAULT_TEMPLATES.find(t => t.id === selectedTemplateId) || DEFAULT_TEMPLATES[0];
      setEditingTemplateContent(matched.content);
    }
  };

  // Mensaje renderizado en vivo
  const renderedMessage = renderMessageTemplate(
    editingTemplateContent,
    selectedAppointment || {
      clientName: customClientName,
      serviceName: 'Corte y Peinado',
      date: new Date().toISOString().slice(0, 10),
      startTime: '16:00',
      price: 12000,
      deposit: 4000,
      amountPaid: 4000,
    },
    settings,
    customClientName
  );

  const targetPhone = selectedAppointment ? selectedAppointment.clientPhone : customPhone;
  const phoneInfo = normalizeArgentinePhone(targetPhone);
  const { url: waUrl } = buildWhatsAppLink(targetPhone, renderedMessage);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(renderedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <span>Plantillas de Mensajes y WhatsApp</span>
          </h2>
          <p className="text-xs text-slate-500">
            Personaliza los textos para confirmaciones, recordatorios, reprogramaciones y reactivación sin suscripción.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Originales</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Lista de Plantillas y Editor */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Selector de Plantilla */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Plantillas Disponibles
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`p-3 text-left rounded-xl border transition-all text-xs ${
                    selectedTemplateId === tmpl.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <p className="truncate">{tmpl.title}</p>
                </button>
              ))}
            </div>

            {/* Editor de la Plantilla Seleccionada */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Editar Contenido: {currentTemplate?.title}
                </label>
                <button
                  onClick={handleSaveCurrentTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Guardado!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Plantilla</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={9}
                value={editingTemplateContent}
                onChange={(e) => setEditingTemplateContent(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs sm:text-sm font-sans text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-y"
              />
            </div>

            {/* Guía de Variables Disponibles */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Variables Dinámicas Disponibles</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Copia y pega cualquiera de estas etiquetas dentro de tu texto:
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                {['{cliente}', '{servicio}', '{fecha}', '{hora}', '{profesional}', '{negocio}', '{direccion}', '{precio}', '{sena}', '{saldo}', '{alias}'].map(tag => (
                  <span key={tag} className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-800">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Columna Derecha: Previsualizador y Probador en Vivo */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simulador en Tiempo Real</span>
              </h3>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Vista previa WhatsApp
              </span>
            </div>

            {/* Selector de Turno de Prueba */}
            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700">
                Probar con turno de la agenda:
              </label>
              <select
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="">(Datos de prueba genéricos)</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.clientName} - {a.serviceName} ({a.date} {a.startTime} hs)
                  </option>
                ))}
              </select>

              {!selectedAppointment && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-500">Nombre cliente</label>
                    <input
                      type="text"
                      value={customClientName}
                      onChange={(e) => setCustomClientName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Celular</label>
                    <input
                      type="text"
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Burbuja estilo WhatsApp */}
            <div className="bg-[#EFEAE2] p-4 rounded-2xl border border-slate-200 relative shadow-inner">
              <div className="bg-white rounded-xl rounded-tr-xs p-3.5 shadow-xs max-w-sm ml-auto space-y-2 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                {renderedMessage}
                <div className="text-[10px] text-slate-400 text-right font-mono">
                  12:45 ✓✓
                </div>
              </div>
            </div>

            {/* Teléfono de destino */}
            <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                <span>Destino: <strong className="font-mono text-slate-800">{phoneInfo.displayFormatted || targetPhone}</strong></span>
              </div>
              {phoneInfo.isValid && (
                <span className="text-[10px] text-emerald-700 font-semibold">
                  Número válido
                </span>
              )}
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar Mensaje</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.open(waUrl, '_blank', 'noopener,noreferrer')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Abrir WhatsApp</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

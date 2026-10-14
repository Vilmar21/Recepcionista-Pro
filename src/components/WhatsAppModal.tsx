import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  Copy, 
  Check, 
  AlertCircle, 
  Sparkles,
  PhoneCall,
  User,
  Calendar,
  Clock
} from 'lucide-react';
import { Appointment, BusinessSettings, MessageTemplate } from '../types';
import { buildWhatsAppLink, normalizeArgentinePhone } from '../utils/phone';
import { renderMessageTemplate } from '../utils/templates';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  clientOverride?: { name: string; phone: string; serviceName?: string } | null;
  templates: MessageTemplate[];
  settings: BusinessSettings;
  defaultTemplateType?: string;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  appointment,
  clientOverride,
  templates,
  settings,
  defaultTemplateType = 'confirmacion',
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [phoneOverride, setPhoneOverride] = useState<string>('');

  const targetClientName = clientOverride?.name || appointment?.clientName || 'Cliente';
  const targetClientPhone = phoneOverride || clientOverride?.phone || appointment?.clientPhone || '';
  const targetServiceName = clientOverride?.serviceName || appointment?.serviceName || '';

  // Inicializar plantilla
  useEffect(() => {
    if (!isOpen) return;

    const matchedTemplate = templates.find(t => t.type === defaultTemplateType) || templates[0];
    if (matchedTemplate) {
      setSelectedTemplateId(matchedTemplate.id);
      const rendered = renderMessageTemplate(
        matchedTemplate.content,
        appointment || { serviceName: targetServiceName },
        settings,
        targetClientName
      );
      setMessageText(rendered);
    }
    setPhoneOverride(clientOverride?.phone || appointment?.clientPhone || '');
    setCopied(false);
  }, [isOpen, appointment, clientOverride, defaultTemplateType, templates, settings, targetClientName, targetServiceName]);

  // Manejar cambio de plantilla
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) {
      const rendered = renderMessageTemplate(
        tmpl.content,
        appointment || { serviceName: targetServiceName },
        settings,
        targetClientName
      );
      setMessageText(rendered);
    }
  };

  if (!isOpen) return null;

  const phoneInfo = normalizeArgentinePhone(targetClientPhone);
  const { url: whatsAppUrl, isValid } = buildWhatsAppLink(targetClientPhone, messageText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error copying text:', err);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!isValid && !phoneInfo.normalized) {
      alert('Por favor verifica el número de teléfono del cliente.');
      return;
    }
    window.open(whatsAppUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Encabezado */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-title" className="text-base font-bold text-white">
                Enviar Mensaje por WhatsApp
              </h3>
              <p className="text-xs text-slate-300">
                Revisa y abre la conversación directamente con el cliente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-4">
          
          {/* Info del Destinatario */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-800 font-medium">
              <User className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold">{targetClientName}</span>
              {appointment && (
                <span className="text-slate-500 hidden sm:inline">
                  · {appointment.serviceName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={phoneOverride}
                onChange={(e) => setPhoneOverride(e.target.value)}
                placeholder="Ej: 11 5555-1234"
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                title="Editar número si es necesario"
              />
            </div>
          </div>

          {/* Advertencia / Validación de teléfono */}
          {!phoneInfo.isValid && targetClientPhone.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Atención con el formato del celular</p>
                <p className="text-amber-700">
                  En Argentina se recomienda 10 dígitos (código de área sin 0 y número sin 15). 
                  Se enviará a: <code className="font-mono font-bold">{phoneInfo.normalized}</code>
                </p>
              </div>
            </div>
          )}

          {/* Selector de Plantilla */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Seleccionar Plantilla
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleTemplateChange(tmpl.id)}
                  type="button"
                  className={`px-3 py-2 text-left rounded-lg text-xs font-medium border transition-all ${
                    selectedTemplateId === tmpl.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <p className="truncate">{tmpl.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Editor de Mensaje */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Texto del Mensaje (Editable)
              </label>
              <span className="text-[11px] text-slate-400">
                Formato WhatsApp (*negrita*, _cursiva_)
              </span>
            </div>
            <textarea
              rows={8}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-50/60 border border-slate-300 rounded-xl p-3 text-sm font-sans text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              placeholder="Escribe tu mensaje..."
            />
          </div>

          {/* Nota de privacidad y política de costo cero */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Control total sin costo:</strong> Al hacer clic en <em>Abrir en WhatsApp</em>, se abrirá la aplicación o WhatsApp Web con el texto preparado para que lo revises antes de enviarlo. No se realizan cargos automáticos ni envíos invisibles.
            </p>
          </div>

        </div>

        {/* Botones de acción */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cerrar
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span>Abrir en WhatsApp</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

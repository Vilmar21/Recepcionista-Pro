import React, { useEffect } from 'react';
import { 
  BellRing, 
  Clock, 
  User, 
  Send, 
  X, 
  Volume2, 
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { Appointment } from '../types';
import { playAlarmChime } from '../utils/audio';
import { normalizeArgentinePhone } from '../utils/phone';

interface AlarmAlertModalProps {
  isOpen: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onOpenWhatsApp: (appointment: Appointment) => void;
}

export const AlarmAlertModal: React.FC<AlarmAlertModalProps> = ({
  isOpen,
  appointment,
  onClose,
  onOpenWhatsApp,
}) => {
  useEffect(() => {
    if (isOpen && appointment) {
      // Intentar reproducir sonido al abrir la ventana de alarma
      playAlarmChime();
    }
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  const phoneInfo = normalizeArgentinePhone(appointment.clientPhone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-amber-400 overflow-hidden animate-in zoom-in-95 duration-150"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alarm-title"
      >
        {/* Cabecera de Alerta */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner animate-bounce">
              <BellRing className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-100 bg-amber-700/50 px-2 py-0.5 rounded">
                Alerta de Turno
              </span>
              <h2 id="alarm-title" className="text-lg font-black text-white mt-0.5">
                ¡Faltan 5 minutos!
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-amber-100 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
            aria-label="Cerrar alarma"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido con Detalles del Turno */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            
            {/* Hora y Servicio */}
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
              <div className="flex items-center gap-2 text-slate-800">
                <Clock className="w-4 h-4 text-amber-700" />
                <span className="font-mono font-extrabold text-base text-slate-900">
                  {appointment.startTime} hs
                </span>
                <span className="text-xs text-slate-500">
                  ({appointment.durationMinutes} min)
                </span>
              </div>
              <span className="text-xs font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                Próximo turno
              </span>
            </div>

            {/* Cliente */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-extrabold text-base text-slate-900">
                  {appointment.clientName}
                </span>
              </div>
              <p className="text-xs text-slate-600 pl-6 font-mono">
                {phoneInfo.displayFormatted || appointment.clientPhone}
              </p>
            </div>

            {/* Servicio */}
            <div className="flex items-center gap-2 text-xs text-slate-700 pt-1">
              <Briefcase className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="font-semibold text-slate-900">
                {appointment.serviceName}
              </span>
            </div>

            {/* Notas si existen */}
            {appointment.notes && (
              <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-amber-200/50">
                Nota: {appointment.notes}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500 text-center">
            La alarma sonora fue activada para que prepares la atención con tiempo.
          </p>
        </div>

        {/* Acciones */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() => playAlarmChime()}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Volume2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Repetir timbre</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWhatsApp(appointment);
              }}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-black text-white bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Entendido</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

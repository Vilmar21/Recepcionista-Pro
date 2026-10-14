import React, { useEffect } from 'react';
import { 
  BellRing, 
  Clock, 
  User, 
  Send, 
  X, 
  Volume2, 
  AlertTriangle,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import { Appointment } from '../types';
import { playAlertBeep } from '../utils/audio';
import { normalizeArgentinePhone } from '../utils/phone';

interface AppointmentAlertBannerProps {
  alerts: Array<{
    appointment: Appointment;
    minutesLeft: number;
  }>;
  onDismiss: (appointmentId: string) => void;
  onOpenWhatsApp: (appointment: Appointment) => void;
  onViewAppointment: (appointment: Appointment) => void;
}

export const AppointmentAlertBanner: React.FC<AppointmentAlertBannerProps> = ({
  alerts,
  onDismiss,
  onOpenWhatsApp,
  onViewAppointment,
}) => {
  // Cuando se detecta una alerta nueva, reproducir sonido de beep sutil
  useEffect(() => {
    if (alerts.length > 0) {
      playAlertBeep();
    }
  }, [alerts.length]);

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-20 right-3 sm:right-6 z-50 max-w-md w-full space-y-3 pointer-events-auto animate-in slide-in-from-top-4 duration-200">
      {alerts.map(({ appointment, minutesLeft }) => {
        const phone = normalizeArgentinePhone(appointment.clientPhone);
        const minutesLabel = minutesLeft <= 0 
          ? '¡Es ahora!' 
          : minutesLeft === 10 
          ? 'es en 10 minutos' 
          : `es en ${minutesLeft} minutos`;

        return (
          <div
            key={appointment.id}
            className="bg-white rounded-2xl shadow-2xl border-2 border-amber-500 overflow-hidden ring-4 ring-amber-500/20 transition-all"
            role="alert"
          >
            {/* Barra superior de Alerta */}
            <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center animate-bounce">
                  <BellRing className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-100 bg-amber-700/50 px-1.5 py-0.5 rounded">
                    Recordatorio 10m
                  </span>
                  <h4 className="text-xs font-bold leading-tight">
                    ¡Atención! La cita con {appointment.clientName} {minutesLabel}
                  </h4>
                </div>
              </div>

              <button
                onClick={() => onDismiss(appointment.id)}
                className="text-amber-100 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-colors"
                title="Descartar aviso"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cuerpo del Aviso */}
            <div className="p-4 space-y-3 bg-amber-50/50 text-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                    <User className="w-4 h-4 text-amber-700" />
                    <span>{appointment.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 mt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {appointment.startTime} hs
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-medium truncate max-w-[170px]">
                      {appointment.serviceName}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-amber-100 text-amber-900 font-black px-2 py-1 rounded-lg text-xs font-mono border border-amber-300/80">
                    {minutesLeft <= 0 ? 'AHORA' : `${minutesLeft} min`}
                  </span>
                </div>
              </div>

              {appointment.notes && (
                <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-amber-200/60 line-clamp-2">
                  Nota: {appointment.notes}
                </p>
              )}

              {/* Botones de Acción */}
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-amber-200/60">
                <button
                  type="button"
                  onClick={() => playAlertBeep()}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-amber-100/60 px-2 py-1 rounded transition-colors"
                  title="Repetir sonido de beep"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Repetir beep</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(appointment)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                  >
                    <Send className="w-3 h-3 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewAppointment(appointment)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                  >
                    Ver Cita
                  </button>

                  <button
                    type="button"
                    onClick={() => onDismiss(appointment.id)}
                    className="px-3 py-1 text-xs font-extrabold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-xs transition-colors"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  ArrowLeft,
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck,
  KeyRound,
  Check
} from 'lucide-react';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
}

type AuthViewMode = 'login' | 'signup' | 'forgotPassword' | 'updatePassword';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [viewMode, setViewMode] = useState<AuthViewMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Detectar si el usuario llega a través de un enlace de recuperación de Supabase
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setViewMode('updatePassword');
      setInfoMessage('Verificación exitosa. Por favor ingresa tu nueva contraseña a continuación.');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setViewMode('updatePassword');
        setInfoMessage('Verificación exitosa. Por favor ingresa tu nueva contraseña a continuación.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Validación de formato de correo electrónico RFC básico
  const isValidEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  // Manejo de inicio de sesión y registro
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();

    if (!cleanEmail || !password.trim()) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Por favor ingresa un correo electrónico válido con formato nombre@dominio.com');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (viewMode === 'signup') {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          onAuthSuccess(data.user);
        } else if (data.user) {
          setInfoMessage('¡Cuenta creada con éxito! Si tu proyecto requiere confirmación de email, revisa tu casilla. De lo contrario, ya podés iniciar sesión.');
          setViewMode('login');
        }
      } else {
        // Inicio de sesión
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Correo o contraseña incorrectos. Por favor verifica tus datos.');
          }
          if (error.message.includes('Email not confirmed')) {
            throw new Error('Tu correo aún no fue confirmado. Revisa tu bandeja de entrada o spam.');
          }
          throw error;
        }

        if (data.user) {
          onAuthSuccess(data.user);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error al procesar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo de solicitud de recuperación de contraseña
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage('Por favor ingresa el correo electrónico asociado a tu cuenta.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMessage('Por favor ingresa una dirección de correo válida (ej: usuario@ejemplo.com).');
      return;
    }

    setLoading(true);

    try {
      // Mecanismo oficial y seguro de Supabase Auth
      const redirectToUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectToUrl,
      });

      if (error) {
        if (error.message.toLowerCase().includes('rate limit')) {
          throw new Error('Demasiadas solicitudes en poco tiempo. Por favor aguarda unos minutos antes de reintentar.');
        }
        throw error;
      }

      // Mensaje de éxito neutro (anti-enumeración de usuarios)
      setInfoMessage(
        'Si la dirección corresponde a una cuenta registrada, te enviaremos un enlace seguro para restablecer tu contraseña. Por favor revisa tu bandeja de entrada y la carpeta de spam.'
      );
    } catch (err: any) {
      setErrorMessage(
        err.message || 'No fue posible procesar la solicitud en este momento. Inténtalo nuevamente más tarde.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejo para establecer una nueva contraseña (tras llegar desde el enlace seguro)
  const handleUpdatePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    if (password.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Limpiar hash de la URL sin recargar la página
      if (typeof window !== 'undefined' && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname);
      }

      setInfoMessage('¡Contraseña restablecida con éxito! Ya puedes iniciar sesión con tu nueva clave.');
      setPassword('');
      setConfirmPassword('');
      setViewMode('login');

      if (data.user) {
        onAuthSuccess(data.user);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar la contraseña. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center px-4 py-8">
      
      {/* Tarjeta de Autenticación */}
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        
        {/* Cabecera Azul Marino */}
        <div className="bg-slate-900 text-white p-7 text-center relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/90 border border-slate-700/80 p-1 mx-auto shadow-lg mb-3 flex items-center justify-center">
            <img 
              src="https://i.postimg.cc/Yq5ZGfpz/Gemini-Generated-Image-9wbbqy9wbbqy9wbb-modified.png" 
              alt="Recepcionista Pro Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Recepcionista Pro
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            Sincronización en la nube con Supabase para profesionales y negocios de Argentina
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-full text-[11px] text-blue-300">
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Nube activa en tiempo real</span>
          </div>
        </div>

        {/* Pestañas de Alternancia (solo en modo Login / Signup) */}
        {(viewMode === 'login' || viewMode === 'signup') && (
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={() => {
                setViewMode('login');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer ${
                viewMode === 'login'
                  ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('signup');
                setErrorMessage(null);
                setInfoMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-bold text-center transition-all cursor-pointer ${
                viewMode === 'signup'
                  ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Crear Cuenta Nueva
            </button>
          </div>
        )}

        {/* ========================================================
            FORMULARIO 1: INICIO DE SESIÓN / CREACIÓN DE CUENTA
           ======================================================== */}
        {(viewMode === 'login' || viewMode === 'signup') && (
          <form onSubmit={handleAuthSubmit} className="p-6 sm:p-7 space-y-4">
            
            {/* Mensajes de feedback */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
            )}

            {infoMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{infoMessage}</p>
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Contraseña
                </label>
                
                {/* Enlace "¿Olvidaste tu contraseña?" visible y accesible en Inicio de Sesión */}
                {viewMode === 'login' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgotPassword');
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400 rounded cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Mínimo 6 caracteres
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Botón Principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{viewMode === 'signup' ? 'Creando cuenta...' : 'Iniciando sesión...'}</span>
                </span>
              ) : (
                <>
                  <span>{viewMode === 'signup' ? 'Registrarme en Recepcionista Pro' : 'Entrar a mi Agenda'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Info de seguridad */}
            <div className="pt-2 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tus datos se asocian de forma privada a tu usuario</span>
            </div>

          </form>
        )}

        {/* ========================================================
            FORMULARIO 2: SOLICITUD DE RECUPERACIÓN DE CONTRASEÑA
           ======================================================== */}
        {viewMode === 'forgotPassword' && (
          <form onSubmit={handleForgotPasswordSubmit} className="p-6 sm:p-7 space-y-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <KeyRound className="w-4 h-4 text-blue-600" />
                <h2>Recuperar Contraseña</h2>
              </div>
              <p className="text-xs text-slate-600">
                Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para restablecer el acceso a tu cuenta.
              </p>
            </div>

            {/* Mensajes de feedback */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
            )}

            {infoMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{infoMessage}</p>
              </div>
            )}

            {/* Campo Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Correo Electrónico Registrado *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Botón «Enviar enlace de recuperación» */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Enviando enlace seguro...</span>
                </span>
              ) : (
                <>
                  <span>Enviar enlace de recuperación</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Botón para regresar al inicio de sesión */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Regresar al inicio de sesión</span>
              </button>
            </div>

            {/* Nota de seguridad */}
            <div className="pt-2 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>El enlace de recuperación expira por seguridad según tu proveedor</span>
            </div>

          </form>
        )}

        {/* ========================================================
            FORMULARIO 3: RESTABLECER CONTRASEÑA (DESDE EL ENLACE DE EMAIL)
           ======================================================== */}
        {viewMode === 'updatePassword' && (
          <form onSubmit={handleUpdatePasswordSubmit} className="p-6 sm:p-7 space-y-4">
            
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <h2>Establecer Nueva Contraseña</h2>
              </div>
              <p className="text-xs text-slate-600">
                Has verificado tu identidad. Ingresa tu nueva contraseña para acceder a Recepcionista Pro.
              </p>
            </div>

            {/* Mensajes de feedback */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{errorMessage}</p>
              </div>
            )}

            {infoMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-snug">{infoMessage}</p>
              </div>
            )}

            {/* Nueva contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nueva Contraseña (mínimo 6 caracteres) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Confirmar nueva contraseña */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Botón Guardar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Guardando nueva contraseña...</span>
                </span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Guardar nueva contraseña</span>
                </>
              )}
            </button>

            {/* Regresar */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setViewMode('login');
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Regresar al inicio de sesión</span>
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Pie de pantalla */}
      <p className="mt-6 text-xs text-slate-500 text-center">
        Recepcionista Pro · Conectado con Supabase (tabla <code>recepcion</code>)
      </p>

    </div>
  );
};

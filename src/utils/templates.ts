import { Appointment, BusinessSettings, MessageTemplate } from '../types';
import { formatDateHuman, formatCurrencyARS } from './date';

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl-confirmacion',
    type: 'confirmacion',
    title: 'Confirmación de Turno',
    description: 'Envía los detalles del turno recién agendado al cliente.',
    content: `Hola {cliente}! 👋 Te confirmamos tu turno en *{negocio}*.

🗓 *Fecha:* {fecha}
⏰ *Hora:* {hora}
✂️ *Servicio:* {servicio}
📍 *Dirección:* {direccion}
💰 *Total:* {precio}{texto_saldo}

Por favor avísanos con al menos 24 hs de anticipación si necesitas modificarlo. ¡Te esperamos! ✨`,
  },
  {
    id: 'tmpl-recordatorio',
    type: 'recordatorio',
    title: 'Recordatorio Previo',
    description: 'Recuérdale el turno al cliente el día anterior o unas horas antes.',
    content: `Hola {cliente}! 👋 Te recordamos tu turno de mañana en *{negocio}*:

🗓 *Día:* {fecha}
⏰ *Hora:* {hora}
✂️ *Servicio:* {servicio}
📍 *Lugar:* {direccion}

¿Nos confirmas tu asistencia respondiendo a este mensaje? ¡Muchas gracias! 😊`,
  },
  {
    id: 'tmpl-reprogramacion',
    type: 'reprogramacion',
    title: 'Reprogramación de Turno',
    description: 'Notifica una nueva fecha u hora acordada.',
    content: `Hola {cliente}! Tu turno en *{negocio}* ha sido reprogramado con éxito.

🗓 *Nueva Fecha:* {fecha}
⏰ *Nuevo Horario:* {hora}
✂️ *Servicio:* {servicio}
📍 *Dirección:* {direccion}

Cualquier duda o consulta estamos a tu disposición. ¡Saludos! 🙌`,
  },
  {
    id: 'tmpl-agradecimiento',
    type: 'agradecimiento',
    title: 'Agradecimiento Post-Visita',
    description: 'Agradece la visita del cliente e invítalo a dejar una reseña o volver.',
    content: `Hola {cliente}! ❤️ Muchas gracias por visitarnos hoy en *{negocio}*.

Esperamos que hayas disfrutado tu experiencia con {servicio}. Si te gustó la atención, nos ayuda un montón que nos recomiendes a tus conocidos o nos dejes una reseña.

¡Esperamos verte pronto nuevamente! 🌟`,
  },
  {
    id: 'tmpl-sena',
    type: 'sena',
    title: 'Solicitud de Seña / Datos de Pago',
    description: 'Envía los datos de Alias o CBU para asegurar el turno con una seña.',
    content: `Hola {cliente}! Para reservar definitivamente tu turno en *{negocio}* el *{fecha} a las {hora}*, solicitamos una seña previa.

💳 *Alias / CVU:* {alias}
Titular: {profesional}
💰 *Valor sugerido de seña:* {sena}

Una vez realizada la transferencia, envíanos el comprobante por acá para dejar el turno 100% confirmado. ¡Gracias! ✨`,
  },
  {
    id: 'tmpl-fidelizacion',
    type: 'fidelizacion',
    title: 'Reactivación de Cliente Inactivo',
    description: 'Mensaje cordial para invitar a volver a clientes que hace tiempo no vienen.',
    content: `Hola {cliente}! 👋 Hace tiempo que no te vemos por *{negocio}* y queríamos saludarte.

Estamos renovando la agenda para estos días y nos encantaría volver a atenderte con tu {servicio}. 

Si querés agendar un turno esta semana, avísanos qué día y horario te queda más cómodo y te guardamos un lugar. ¡Te esperamos! 💖`,
  },
];

export function renderMessageTemplate(
  templateContent: string,
  appointment: Partial<Appointment>,
  settings: BusinessSettings,
  clientOverrideName?: string
): string {
  const clientName = clientOverrideName || appointment.clientName || 'Cliente';
  const serviceName = appointment.serviceName || 'tu servicio';
  const dateFormatted = appointment.date ? formatDateHuman(appointment.date) : 'a coordinar';
  const timeFormatted = appointment.startTime ? `${appointment.startTime} hs` : '';
  const priceFormatted = appointment.price !== undefined ? formatCurrencyARS(appointment.price) : '';
  
  const deposit = appointment.deposit || 0;
  const price = appointment.price || 0;
  const balance = Math.max(0, price - (appointment.amountPaid || deposit));
  
  const senaFormatted = deposit > 0 
    ? formatCurrencyARS(deposit) 
    : formatCurrencyARS(Math.round(price * 0.3) || 3000); // 30% o $3000 sugerido

  let textoSaldo = '';
  if (balance > 0 && (appointment.amountPaid || 0) > 0) {
    textoSaldo = `\n💵 *Saldo restante:* ${formatCurrencyARS(balance)}`;
  } else if ((appointment.amountPaid || 0) >= price && price > 0) {
    textoSaldo = `\n✅ *Abonado:* ${priceFormatted} (Total pagado)`;
  }

  return templateContent
    .replace(/{cliente}/g, clientName)
    .replace(/{servicio}/g, serviceName)
    .replace(/{fecha}/g, dateFormatted)
    .replace(/{hora}/g, timeFormatted)
    .replace(/{profesional}/g, settings.ownerName || settings.businessName)
    .replace(/{negocio}/g, settings.businessName || 'nuestro espacio')
    .replace(/{direccion}/g, settings.address || 'nuestro local')
    .replace(/{alias}/g, settings.paymentAlias || 'Consultar por mensaje')
    .replace(/{precio}/g, priceFormatted)
    .replace(/{sena}/g, senaFormatted)
    .replace(/{saldo}/g, formatCurrencyARS(balance))
    .replace(/{texto_saldo}/g, textoSaldo);
}

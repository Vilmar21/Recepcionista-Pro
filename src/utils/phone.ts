/**
 * Normaliza números de teléfono argentinos para WhatsApp (wa.me)
 * Código de país Argentina: 54
 * Prefijo para móviles en WhatsApp: 9
 * Elimina 0 inicial de código de área y 15 inicial del número local.
 */
export function normalizeArgentinePhone(rawPhone: string): {
  normalized: string;
  displayFormatted: string;
  isValid: boolean;
} {
  if (!rawPhone) {
    return { normalized: '', displayFormatted: '', isValid: false };
  }

  // Quitar todo lo que no sea dígito
  let digits = rawPhone.replace(/\D/g, '');

  if (digits.length === 0) {
    return { normalized: '', displayFormatted: '', isValid: false };
  }

  // Si comienza con 0054 o 054
  if (digits.startsWith('0054')) {
    digits = digits.slice(4);
  } else if (digits.startsWith('054')) {
    digits = digits.slice(3);
  }

  // Si ya tiene el 54 al inicio
  if (digits.startsWith('54')) {
    digits = digits.slice(2);
  }

  // Si ahora tiene un 9 (como en +54 9 ...)
  if (digits.startsWith('9')) {
    digits = digits.slice(1);
  }

  // Si tiene un 0 inicial (ej: 011...)
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Si tiene un 15 luego del código de área o al inicio
  // Caso CABA / AMBA: si empieza con 1115...
  if (digits.startsWith('1115') && digits.length >= 10) {
    digits = '11' + digits.slice(4);
  } else if (digits.startsWith('15') && digits.length === 10) {
    // Ingresaron 15 seguido de 8 dígitos -> asumimos CABA (11)
    digits = '11' + digits.slice(2);
  } else {
    // Si tiene 15 intermedio (ej: 341 15 5555555)
    // Buscamos si los dígitos 3 y 4 o 4 y 5 son '15'
    for (const areaLen of [2, 3, 4]) {
      if (digits.length >= areaLen + 8 && digits.slice(areaLen, areaLen + 2) === '15') {
        digits = digits.slice(0, areaLen) + digits.slice(areaLen + 2);
        break;
      }
    }
  }

  // Ahora 'digits' debería ser el código de área + número local (ej: 1155551234 o 3515551234)
  // En Argentina, la longitud nacional estándar de celular sin prefijos es de 10 dígitos
  const isValid = digits.length >= 10 && digits.length <= 11;
  const whatsappNumber = `549${digits}`;

  // Formato para mostrar legible: +54 9 11 5555-1234 o similar
  let display = `+54 9 ${digits}`;
  if (digits.length === 10) {
    if (digits.startsWith('11')) {
      display = `+54 9 11 ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      display = `+54 9 ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  }

  return {
    normalized: whatsappNumber,
    displayFormatted: display,
    isValid,
  };
}

export function buildWhatsAppLink(rawPhone: string, message: string): {
  url: string;
  cleanNumber: string;
  isValid: boolean;
} {
  const { normalized, isValid } = normalizeArgentinePhone(rawPhone);
  const encodedText = encodeURIComponent(message);
  
  if (!normalized) {
    return {
      url: `https://wa.me/?text=${encodedText}`,
      cleanNumber: '',
      isValid: false,
    };
  }

  return {
    url: `https://wa.me/${normalized}?text=${encodedText}`,
    cleanNumber: normalized,
    isValid,
  };
}

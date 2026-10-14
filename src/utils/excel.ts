import * as XLSX from 'xlsx';
import { supabase, RecepcionRow } from '../lib/supabase';
import { getTodayString } from './date';
import { Appointment } from '../types';

/**
 * Exporta los registros de la tabla recepcion de Supabase a un archivo Excel (.xlsx)
 * con los encabezados exactos solicitados:
 * - Fecha / Hora: created_at
 * - Visitante: visitante_nombre
 * - Empresa: empresa
 * - Motivo de Visita: motivo
 * - Estado: estado
 * - Notas / Observaciones: notas
 * Nombre del archivo: Recepcionista_Pro_[FECHA_ACTUAL].xlsx
 */
export async function exportRecepcionToExcel(fallbackAppointments?: Appointment[]): Promise<void> {
  let excelRows: Array<{
    'Fecha / Hora': string;
    'Visitante': string;
    'Empresa': string;
    'Motivo de Visita': string;
    'Estado': string;
    'Notas / Observaciones': string;
  }> = [];

  // Intentamos obtener los datos directamente de la tabla `recepcion` en Supabase
  try {
    const { data, error } = await supabase
      .from('recepcion')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data && data.length > 0) {
      excelRows = data.map((row: RecepcionRow) => {
        let cleanNotas = row.notas || '';
        let visitanteNombre = row.empresa || '';

        // Si `notas` contiene el JSON enriquecido de la aplicación, extraemos el cliente y notas legibles
        if (row.notas) {
          try {
            const parsed = JSON.parse(row.notas);
            if (parsed.clientName) {
              visitanteNombre = parsed.clientName;
            }
            if (parsed.notes !== undefined) {
              cleanNotas = parsed.notes || '';
            }
          } catch {
            // `notas` es texto plano directo
          }
        }

        const formattedDate = row.created_at
          ? new Date(row.created_at).toLocaleString('es-AR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

        return {
          'Fecha / Hora': formattedDate,
          'Visitante': visitanteNombre || 'Sin especificar',
          'Empresa': row.empresa || '',
          'Motivo de Visita': row.motivo || '',
          'Estado': row.estado || '',
          'Notas / Observaciones': cleanNotas,
        };
      });
    }
  } catch (err) {
    console.error('Error consultando Supabase para la exportación a Excel:', err);
  }

  // Si no se pudieron recuperar registros de Supabase, usamos los turnos en memoria
  if (excelRows.length === 0 && fallbackAppointments && fallbackAppointments.length > 0) {
    excelRows = fallbackAppointments.map((app) => ({
      'Fecha / Hora': app.createdAt
        ? new Date(app.createdAt).toLocaleString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
        : `${app.date} ${app.startTime}`,
      'Visitante': app.clientName || 'Sin especificar',
      'Empresa': app.clientName || '',
      'Motivo de Visita': app.serviceName || '',
      'Estado': app.status || '',
      'Notas / Observaciones': app.notes || '',
    }));
  }

  // Si no hay datos registrados aún, proveemos la estructura de encabezados
  if (excelRows.length === 0) {
    excelRows = [
      {
        'Fecha / Hora': '',
        'Visitante': '',
        'Empresa': '',
        'Motivo de Visita': '',
        'Estado': '',
        'Notas / Observaciones': '',
      },
    ];
  }

  // Generar la hoja y el libro con SheetJS
  const worksheet = XLSX.utils.json_to_sheet(excelRows);

  // Anchos de columna optimizados para lectura en Excel
  worksheet['!cols'] = [
    { wch: 22 }, // Fecha / Hora
    { wch: 26 }, // Visitante
    { wch: 26 }, // Empresa
    { wch: 30 }, // Motivo de Visita
    { wch: 16 }, // Estado
    { wch: 40 }, // Notas / Observaciones
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Recepción');

  // Nombre del archivo solicitado: Recepcionista_Pro_[FECHA_ACTUAL].xlsx
  const todayStr = getTodayString();
  const filename = `Recepcionista_Pro_${todayStr}.xlsx`;

  XLSX.writeFile(workbook, filename);
}

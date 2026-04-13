import { query } from '../../../lib/db.js';

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 401 });
    }

    let payload;
    try {
      payload = JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return new Response(JSON.stringify({ error: 'Token inválido.' }), { status: 401 });
    }

    const { grupo_id } = payload;
    if (!grupo_id) {
      return new Response(JSON.stringify({ error: 'No perteneces a ningún grupo.' }), { status: 400 });
    }

    const { id, tipo, titulo, descripcion, fecha, hora } = await request.json();

    if (!id)     return new Response(JSON.stringify({ error: 'ID requerido.' }), { status: 400 });
    if (!titulo) return new Response(JSON.stringify({ error: 'El título es obligatorio.' }), { status: 400 });
    if (!fecha)  return new Response(JSON.stringify({ error: 'La fecha es obligatoria.' }), { status: 400 });
    if (!hora)   return new Response(JSON.stringify({ error: 'La hora es obligatoria.' }), { status: 400 });

    const tiposValidos = ['cita', 'tarea', 'medicacion', 'nota'];
    if (!tiposValidos.includes(tipo)) {
      return new Response(JSON.stringify({ error: 'Tipo de evento inválido.' }), { status: 400 });
    }

    // Verificar que el evento pertenece al grupo
    const existe = await query(
      'SELECT id FROM eventos_calendario WHERE id = $1 AND grupo_id = $2',
      [id, grupo_id]
    );
    if (existe.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Evento no encontrado.' }), { status: 404 });
    }

    const result = await query(
      `UPDATE eventos_calendario
       SET tipo        = $1,
           titulo      = $2,
           descripcion = $3,
           fecha       = $4,
           hora        = $5
       WHERE id = $6
       RETURNING id, tipo, titulo, descripcion, fecha::text, hora::text`,
      [tipo, titulo.trim(), descripcion?.trim() || '', fecha, hora, id]
    );

    return new Response(JSON.stringify(result.rows[0]), { status: 200 });

  } catch (error) {
    console.error('Error en /api/calendario/editar:', error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
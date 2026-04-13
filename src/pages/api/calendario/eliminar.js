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

    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido.' }), { status: 400 });
    }

    // Verificar que el evento pertenece al grupo
    const existe = await query(
      'SELECT id FROM eventos_calendario WHERE id = $1 AND grupo_id = $2',
      [id, grupo_id]
    );
    if (existe.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Evento no encontrado.' }), { status: 404 });
    }

    await query('DELETE FROM eventos_calendario WHERE id = $1', [id]);

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error('Error en /api/calendario/eliminar:', error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
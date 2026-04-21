import { query } from '../../../lib/db.js';

const ESTADOS_VALIDOS = ['pendiente', 'en_curso', 'completada'];

export async function PUT({ request, cookies }) {
  const token = cookies.get('token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'No autenticado.' }), { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido.' }), { status: 401 });
  }

  const { grupo_id } = payload;
  if (!grupo_id) {
    return new Response(JSON.stringify({ error: 'No perteneces a ningún grupo.' }), { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido.' }), { status: 400 });
  }

  const { id, title, description = '', status } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de tarea requerido.' }), { status: 400 });
  }

  if (!title?.trim()) {
    return new Response(JSON.stringify({ error: 'El título es obligatorio.' }), { status: 400 });
  }

  const estadoLimpio = ESTADOS_VALIDOS.includes(status) ? status : 'pendiente';

  try {
    // Verificar que la tarea pertenece al grupo
    const check = await query(
      `SELECT id FROM tareas WHERE id = $1 AND grupo_id = $2`,
      [id, grupo_id]
    );

    if (check.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Tarea no encontrada.' }), { status: 404 });
    }

    const result = await query(
      `UPDATE tareas
       SET titulo = $1, descripcion = $2, estado = $3
       WHERE id = $4
       RETURNING id, titulo, descripcion, estado, created_at`,
      [title.trim(), description.trim(), estadoLimpio, id]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[tareas/editar]', error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
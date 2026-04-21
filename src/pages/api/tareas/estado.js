import { query } from '../../../lib/db.js';

const ESTADOS_VALIDOS = ['pendiente', 'en_curso', 'completada'];

export async function PATCH({ request, cookies }) {
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

  const { id, estado } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID de tarea requerido.' }), { status: 400 });
  }

  if (!ESTADOS_VALIDOS.includes(estado)) {
    return new Response(
      JSON.stringify({ error: `Estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(', ')}` }),
      { status: 400 }
    );
  }

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
      `UPDATE tareas SET estado = $1 WHERE id = $2
       RETURNING id, titulo, descripcion, estado, created_at`,
      [estado, id]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[tareas/estado]', error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
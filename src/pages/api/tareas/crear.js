import { query } from '../../../lib/db.js';

const ESTADOS_VALIDOS = ['pendiente', 'en_curso', 'completada'];

export async function POST({ request, cookies }) {
  const token = cookies.get('token')?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
    return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 });
  }

  const { id: usuario_id, grupo_id } = payload;
  if (!grupo_id) {
    return new Response(JSON.stringify({ error: 'No perteneces a ningún grupo' }), { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400 });
  }

  const { title, description = '', status, asignado_a = null } = body;

  if (!title?.trim()) {
    return new Response(JSON.stringify({ error: 'El título es obligatorio' }), { status: 400 });
  }

  const estadoLimpio = ESTADOS_VALIDOS.includes(status) ? status : 'pendiente';

  try {
    const result = await query(
      `INSERT INTO tareas (titulo, descripcion, estado, grupo_id, creado_por, asignado_a)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, titulo, descripcion, estado, asignado_a, created_at`,
      [title.trim(), description.trim(), estadoLimpio, grupo_id, usuario_id, asignado_a || null]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[tareas/crear]', error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
}
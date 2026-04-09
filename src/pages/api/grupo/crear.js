import { query } from '../../../lib/db.js';

export async function POST({ request, cookies }) {
  try {
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

    const usuario_id = payload.id;

    // Verificar que el usuario no tenga ya un grupo
    const grupoExistente = await query(
      'SELECT grupo_id FROM usuarios_grupos WHERE usuario_id = $1 LIMIT 1',
      [usuario_id]
    );
    if (grupoExistente.rows.length > 0) {
      return new Response(JSON.stringify({ error: 'Ya perteneces a un grupo familiar.' }), { status: 409 });
    }

    const { nombre } = await request.json();

    if (!nombre || nombre.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'El nombre del grupo debe tener al menos 2 caracteres.' }), { status: 400 });
    }

    const nombreLimpio = nombre.trim();

    // Crear el grupo
    const grupoRes = await query(
      'INSERT INTO grupos (nombre) VALUES ($1) RETURNING id, nombre',
      [nombreLimpio]
    );
    const grupo = grupoRes.rows[0];

    // Añadir al usuario como admin
    await query(
      'INSERT INTO usuarios_grupos (usuario_id, grupo_id, rol) VALUES ($1, $2, $3)',
      [usuario_id, grupo.id, 'admin']
    );

    // Generar nuevo token con grupo_id actualizado
    const nuevoToken = Buffer.from(JSON.stringify({
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      grupo_id: grupo.id,
      rol: 'admin'
    })).toString('base64');

    return new Response(JSON.stringify({
      ok: true,
      token: nuevoToken,
      grupo: { id: grupo.id, nombre: grupo.nombre }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en /api/grupo/crear:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
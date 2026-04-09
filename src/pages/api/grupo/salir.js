import { query } from '../../../lib/db.js';

export async function POST({ cookies }) {
  try {
    const token = cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'No autenticado.' }), { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const usuario_id = payload.id;

    // Eliminar del grupo
    await query(
      'DELETE FROM usuarios_grupos WHERE usuario_id = $1',
      [usuario_id]
    );

    // Nuevo token SIN grupo
    const nuevoToken = Buffer.from(JSON.stringify({
      ...payload,
      grupo_id: null,
      rol: null
    })).toString('base64');

    return new Response(JSON.stringify({ ok: true, token: nuevoToken }));

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}
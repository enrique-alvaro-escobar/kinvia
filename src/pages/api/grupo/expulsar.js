import { query } from '../../../lib/db.js';

export async function POST({ request, cookies }) {
  try {
    const token = cookies.get('token')?.value;
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());

    if (payload.rol !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
    }

    const { usuario_id } = await request.json();

    if (usuario_id === payload.id) {
      return new Response(JSON.stringify({ error: 'No puedes expulsarte a ti mismo' }), { status: 400 });
    }

    await query(
      'DELETE FROM usuarios_grupos WHERE usuario_id = $1 AND grupo_id = $2',
      [usuario_id, payload.grupo_id]
    );

    return new Response(JSON.stringify({ ok: true }));

  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno' }), { status: 500 });
  }
}
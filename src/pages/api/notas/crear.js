import { query } from '../../../lib/db.js';

export async function POST({ request, cookies }) {
  try {
    console.log('[v0] Iniciando creacion de nota');
    const token = cookies.get('token')?.value;
    console.log('[v0] Token presente:', !!token);
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
    const grupo_id = payload.grupo_id;

    if (!grupo_id) {
      return new Response(JSON.stringify({ error: 'No perteneces a ningún grupo.' }), { status: 403 });
    }

    const body = await request.json();
    console.log('[v0] Body recibido:', body);
    const { titulo, contenido } = body;

    if (!contenido || contenido.trim().length < 1) {
      return new Response(JSON.stringify({ error: 'El contenido de la nota no puede estar vacío.' }), { status: 400 });
    }

    const tituloLimpio = titulo ? titulo.trim() : 'Sin titulo';
    const contenidoLimpio = contenido.trim();

    // Crear la nota
    const notaRes = await query(
      'INSERT INTO notas (titulo, contenido, grupo_id, creado_por) VALUES ($1, $2, $3, $4) RETURNING id, titulo, contenido, created_at',
      [tituloLimpio, contenidoLimpio, grupo_id, usuario_id]
    );
    const nota = notaRes.rows[0];

    return new Response(JSON.stringify({
      ok: true,
      nota: { id: nota.id, contenido: nota.contenido, created_at: nota.created_at }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[v0] Error en /api/notas/crear:', error.message);
    console.error('[v0] Stack:', error.stack);
    return new Response(JSON.stringify({ error: 'Error interno del servidor: ' + error.message }), { status: 500 });
  }
}

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

    const { id, titulo, contenido } = await request.json();

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de nota requerido.' }), { status: 400 });
    }

    if (!contenido || contenido.trim().length < 1) {
      return new Response(JSON.stringify({ error: 'El contenido no puede estar vacío.' }), { status: 400 });
    }

    // Verificar que la nota pertenece al grupo del usuario
    const notaExiste = await query(
      'SELECT id FROM notas WHERE id = $1 AND grupo_id = $2',
      [id, grupo_id]
    );

    if (notaExiste.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Nota no encontrada.' }), { status: 404 });
    }

    const tituloLimpio = titulo ? titulo.trim() : 'Sin titulo';
    const contenidoLimpio = contenido.trim();

    // Actualizar la nota
    const result = await query(
      'UPDATE notas SET titulo = $1, contenido = $2 WHERE id = $3 RETURNING id, titulo, contenido',
      [tituloLimpio, contenidoLimpio, id]
    );

    return new Response(JSON.stringify({ success: true, nota: result.rows[0] }), { status: 200 });

  } catch (error) {
    console.error('Error en /api/notas/editar:', error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
import { query } from '../../../lib/db.js';

export async function GET({ cookies }) {
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

    const result = await query(
      `SELECT
         ec.id,
         ec.tipo,
         ec.titulo,
         ec.descripcion,
         ec.fecha::text,
         ec.hora::text,
         u.nombre AS creado_por_nombre
       FROM eventos_calendario ec
       LEFT JOIN usuarios u ON u.id = ec.creado_por
       WHERE ec.grupo_id = $1
       ORDER BY ec.fecha ASC, ec.hora ASC`,
      [grupo_id]
    );

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en /api/calendario/listar:', error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
import { query } from '../../../lib/db.js';
 
export async function POST({ request, cookies }) {
  try {
 
    const token = cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'No has iniciado sesión.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    const payload    = JSON.parse(Buffer.from(token, 'base64').toString());
    const usuario_id = payload.id;
    const grupo_id   = payload.grupo_id;
    const rol        = payload.rol;
 
    const { nota_id } = await request.json();
    if (!nota_id) {
      return new Response(JSON.stringify({ error: 'Falta el id de la nota.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Verificar que la nota existe y es del grupo
    const busqueda = await query(
      'SELECT id, creado_por FROM notas WHERE id = $1 AND grupo_id = $2',
      [nota_id, grupo_id]
    );
    if (busqueda.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'La nota no existe.' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Verificar permisos
    const nota    = busqueda.rows[0];
    const esAutor = nota.creado_por === usuario_id;
    const esAdmin = rol === 'admin';
    if (!esAutor && !esAdmin) {
      return new Response(JSON.stringify({ error: 'Solo el autor o un administrador pueden eliminar esta nota.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Borrar la nota
    await query('DELETE FROM notas WHERE id = $1', [nota_id]);
 
    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
 
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

import { query } from '../../../lib/db.js';
 
export async function POST({ request, cookies }) {
  try {
 
    // Leer el token y sacar los datos del usuario
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
 
    // Leer los datos del formulario: qué nota editar y los nuevos valores
    const { nota_id, titulo, contenido } = await request.json();
 
    if (!nota_id) {
      return new Response(JSON.stringify({ error: 'Falta el id de la nota.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (!titulo || titulo.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'El título es obligatorio.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Comprobar que la nota existe y pertenece al grupo del usuario
    const busqueda = await query(
      'SELECT id, creado_por FROM notas WHERE id = $1 AND grupo_id = $2',
      [nota_id, grupo_id]
    );
    if (busqueda.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'La nota no existe.' }), {
        status: 404, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Comprobar que el usuario tiene permiso para editar
    const nota     = busqueda.rows[0];
    const esAutor  = nota.creado_por === usuario_id;
    const esAdmin  = rol === 'admin';
    if (!esAutor && !esAdmin) {
      return new Response(JSON.stringify({ error: 'Solo el autor o un administrador pueden editar esta nota.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Hacer el cambio en la base de datos
    const actualizado = await query(
      `UPDATE notas
       SET titulo = $1, contenido = $2
       WHERE id = $3
       RETURNING id, titulo, contenido`,
      [titulo.trim(), contenido?.trim() || '', nota_id]
    );
 
    return new Response(JSON.stringify({ ok: true, nota: actualizado.rows[0] }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });
 
  } catch (error) {
    console.error('Error al editar nota:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

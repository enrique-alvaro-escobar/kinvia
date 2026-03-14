import { query } from '../../../lib/db.js';
 
export async function POST({ request, cookies }) {
  try {
 
    // Paso 1: leer el token de la cookie para saber quién es el usuario
    const token = cookies.get('token')?.value;
    if (!token) {
      return new Response(JSON.stringify({ error: 'No has iniciado sesión.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Paso 2: decodificar el token y extraer los datos del usuario
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    const usuario_id = payload.id;
    const grupo_id   = payload.grupo_id;
 
    // Paso 3: comprobar que el usuario pertenece a un grupo
    if (!grupo_id) {
      return new Response(JSON.stringify({ error: 'No perteneces a ningún grupo.' }), {
        status: 403, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Paso 4: leer los datos que mandó el formulario
    const { titulo, contenido } = await request.json();
 
    // Paso 5: comprobar que el título no está vacío
    if (!titulo || titulo.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'El título es obligatorio.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
    if (titulo.trim().length > 200) {
      return new Response(JSON.stringify({ error: 'El título no puede superar 200 caracteres.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }
 
    // Paso 6: guardar la nota en la base de datos
    const resultado = await query(
      `INSERT INTO notas (grupo_id, titulo, contenido, creado_por)
       VALUES ($1, $2, $3, $4)
       RETURNING id, titulo, contenido, created_at`,
      [grupo_id, titulo.trim(), contenido?.trim() || '', usuario_id]
    );
 
    // Paso 7: devolver la nota recién creada al navegador
    const nota = resultado.rows[0];
    return new Response(JSON.stringify({ ok: true, nota }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });
 
  } catch (error) {
    console.error('Error al crear nota:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

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

    const { codigo } = await request.json();

    if (!codigo || typeof codigo !== 'string') {
      return new Response(JSON.stringify({ error: 'Código de invitación inválido.' }), { status: 400 });
    }

    // Formato esperado: KINVIA-{id}-{NOMBRE}
    const partes = codigo.trim().toUpperCase().split('-');
    if (partes.length < 3 || partes[0] !== 'KINVIA') {
      return new Response(JSON.stringify({ error: 'El código de invitación no tiene el formato correcto.' }), { status: 400 });
    }

    const grupoId = parseInt(partes[1]);
    if (isNaN(grupoId)) {
      return new Response(JSON.stringify({ error: 'El código de invitación no tiene el formato correcto.' }), { status: 400 });
    }

    // Verificar que el grupo existe
    const grupoRes = await query('SELECT id, nombre FROM grupos WHERE id = $1', [grupoId]);
    if (grupoRes.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'No se encontró ningún grupo con ese código.' }), { status: 404 });
    }
    const grupo = grupoRes.rows[0];

    // Verificar que el nombre del código coincide (validación extra)
    const nombreEnCodigo = partes.slice(2).join('-');
    const nombreEsperado = grupo.nombre.replace(/\s+/g, '').toUpperCase();
    if (nombreEnCodigo !== nombreEsperado) {
      return new Response(JSON.stringify({ error: 'El código de invitación no es válido para este grupo.' }), { status: 400 });
    }

    // Añadir al usuario como miembro
    await query(
      'INSERT INTO usuarios_grupos (usuario_id, grupo_id, rol) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [usuario_id, grupo.id, 'miembro']
    );

    // Generar nuevo token con grupo_id actualizado
    const nuevoToken = Buffer.from(JSON.stringify({
      id: payload.id,
      email: payload.email,
      nombre: payload.nombre,
      grupo_id: grupo.id,
      rol: 'miembro'
    })).toString('base64');

    return new Response(JSON.stringify({
      ok: true,
      token: nuevoToken,
      grupo: { id: grupo.id, nombre: grupo.nombre }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en /api/grupo/unirse:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
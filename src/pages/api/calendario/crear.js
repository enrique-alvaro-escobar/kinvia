import { query } from '../../../lib/db.js';

export async function POST({ request, cookies }) {
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

  const { id: usuario_id, grupo_id } = payload;
  if (!grupo_id) {
    return new Response(JSON.stringify({ error: 'No perteneces a ningún grupo.' }), { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'JSON inválido.' }), { status: 400 });
  }

  const { tipo, titulo, descripcion = '', fecha, hora } = body;

  if (!titulo?.trim()) {
    return new Response(JSON.stringify({ error: 'El título es obligatorio.' }), { status: 400 });
  }
  if (!fecha) {
    return new Response(JSON.stringify({ error: 'La fecha es obligatoria.' }), { status: 400 });
  }
  if (!hora) {
    return new Response(JSON.stringify({ error: 'La hora es obligatoria.' }), { status: 400 });
  }

  const tiposValidos = ['cita', 'tarea', 'medicacion', 'nota'];
  const tipoLimpio   = tiposValidos.includes(tipo) ? tipo : 'cita';

  try {
    await query(`
      CREATE TABLE IF NOT EXISTS eventos_calendario (
        id          SERIAL PRIMARY KEY,
        grupo_id    INTEGER      NOT NULL,
        creado_por  INTEGER      NOT NULL,
        tipo        VARCHAR(50)  NOT NULL DEFAULT 'cita',
        titulo      VARCHAR(255) NOT NULL,
        descripcion TEXT,
        fecha       DATE         NOT NULL,
        hora        TIME         NOT NULL,
        created_at  TIMESTAMP    DEFAULT NOW()
      )
    `);

    const result = await query(
      `INSERT INTO eventos_calendario (grupo_id, creado_por, tipo, titulo, descripcion, fecha, hora)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, tipo, titulo, descripcion,
                 TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha,
                 TO_CHAR(hora,  'HH24:MI')    AS hora`,
      [grupo_id, usuario_id, tipoLimpio, titulo.trim(), descripcion.trim(), fecha, hora]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[calendario/crear]', error.message);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}
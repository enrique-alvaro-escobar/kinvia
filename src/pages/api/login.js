import { query } from '../../lib/db.js';
import bcrypt from 'bcryptjs';

export async function POST({ request }) {
  try {
    const { email, password } = await request.json();

    const result = await query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    const usuario = result.rows[0];

    if (!usuario) {
      return new Response(JSON.stringify({ error: 'Email o contraseña incorrectos.' }), { status: 401 });
    }

    const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordCorrecta) {
      return new Response(JSON.stringify({ error: 'Email o contraseña incorrectos.' }), { status: 401 });
    }

    // Buscar grupo del usuario
    const grupoRes = await query(
      'SELECT grupo_id, rol FROM usuarios_grupos WHERE usuario_id = $1 LIMIT 1',
      [usuario.id]
    );
    const grupo = grupoRes.rows[0];

    const token = Buffer.from(JSON.stringify({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      grupo_id: grupo?.grupo_id ?? null,
      rol: grupo?.rol ?? 'miembro'
    })).toString('base64');

    return new Response(JSON.stringify({ ok: true, token }), { status: 200 });

  } catch (error) {
    console.error('Error en /api/login:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), { status: 500 });
  }
}

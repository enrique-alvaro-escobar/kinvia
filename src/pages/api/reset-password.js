import { query } from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST({ request }) {
  try {
    const { token, password } = await request.json();

    // 1. Validaciones básicas
    if (!token || !password) {
      return new Response(JSON.stringify({ error: 'Faltan datos.' }), { status: 400 });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres.' }), { status: 400 });
    }

    // 2. Hashear el token recibido y buscarlo en DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await query(
      `SELECT id, usuario_id FROM password_resets
       WHERE token_hash = $1
         AND usado = FALSE
         AND expira_en > NOW()`,
      [tokenHash]
    );
    const reset = result.rows[0];

    // 3. Si no existe, caducó o ya se usó → error
    if (!reset) {
      return new Response(JSON.stringify({ error: 'Enlace inválido o expirado.' }), { status: 400 });
    }

    // 4. Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. Actualizar contraseña del usuario
    await query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [passwordHash, reset.usuario_id]
    );

    // 6. Marcar token como usado (un solo uso)
    await query(
      'UPDATE password_resets SET usado = TRUE WHERE id = $1',
      [reset.id]
    );

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    console.error('Error en /api/reset-password:', error);
    return new Response(JSON.stringify({ error: 'Error interno.' }), { status: 500 });
  }
}
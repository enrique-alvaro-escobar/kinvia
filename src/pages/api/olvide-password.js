import { query } from '../../lib/db.js';
import { Resend } from 'resend';
import crypto from 'crypto';

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export async function POST({ request }) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email requerido.' }), { status: 400 });
    }

    // 1. Buscar usuario
    const result = await query(
      'SELECT id, nombre FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );
    const usuario = result.rows[0];

    // 2. ⚠️ IMPORTANTE: respondemos OK aunque el email NO exista
    //    (así un atacante no puede saber qué emails están registrados)
    if (!usuario) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // 3. Generar token aleatorio (32 bytes = 64 caracteres hex)
    const token = crypto.randomBytes(32).toString('hex');

    // 4. Hashear el token para guardarlo en DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 5. Caduca en 1 hora
    const expiraEn = new Date(Date.now() + 60 * 60 * 1000);

    // 6. Guardar en DB
    await query(
      'INSERT INTO password_resets (usuario_id, token_hash, expira_en) VALUES ($1, $2, $3)',
      [usuario.id, tokenHash, expiraEn]
    );

    // 7. Construir link (el token va en la URL, SIN hashear)
    const resetUrl = `${import.meta.env.PUBLIC_SITE_URL}/reset-password?token=${token}`;

    // 8. Enviar email con Resend
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Recupera tu contraseña',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a2e;">Hola ${usuario.nombre},</h2>
          <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}"
               style="display:inline-block;padding:12px 24px;background:#6C9BB5;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">
              Restablecer contraseña
            </a>
          </p>
          <p style="color:#666;font-size:14px;">
            Este enlace caduca en <strong>1 hora</strong>. Si no has sido tú, ignora este correo.
          </p>
          <p style="color:#999;font-size:12px;margin-top:32px;">
            Si el botón no funciona, copia esta URL: ${resetUrl}
          </p>
        </div>
      `
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (error) {
    console.error('Error en /api/olvide-password:', error);
    return new Response(JSON.stringify({ error: 'Error interno.' }), { status: 500 });
  }
}
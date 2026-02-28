// src/pages/api/registro.js
import { query } from '../../lib/db.js';
import bcrypt from 'bcryptjs';

export async function POST({ request }) {
  try {
    const { name, email, password } = await request.json();

    // Validaciones básicas server-side
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Todos los campos son obligatorios.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Comprobar si el email ya existe
    const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return new Response(JSON.stringify({ error: 'Ya existe una cuenta con ese correo electrónico.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario — adapta los nombres de columna a tu schema.sql
    const result = await query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const user = result.rows[0];

    // Devolver token igual que en login.js
    // Si usas JWT, genera el token aquí igual que lo haces en login.js
    // Si usas otro sistema de sesión, adáptalo
    return new Response(JSON.stringify({
      token: Buffer.from(JSON.stringify({ id: user.id, email: user.email })).toString('base64'),
      user: { id: user.id, name: user.name, email: user.email }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en /api/registro:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

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
const existing = await query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return new Response(JSON.stringify({ error: 'Ya existe una cuenta con ese correo electrónico.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario 
    const result = await query(
  'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email',
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const user = result.rows[0];
// Crear grupo familiar automáticamente
const groupResult = await query(
  'INSERT INTO grupos (nombre) VALUES ($1) RETURNING id',
  [`Familia ${name.trim().split(' ')[0]}`]
);
const grupo = groupResult.rows[0];

// Asignar usuario al grupo como admin
await query(
  'INSERT INTO usuarios_grupos (usuario_id, grupo_id, rol) VALUES ($1, $2, $3)',
  [user.id, grupo.id, 'admin']
);
const token = Buffer.from(JSON.stringify({
  id: user.id,
  email: user.email,
  nombre: user.nombre,
  grupo_id: grupo.id,
  rol: 'admin'
})).toString('base64');

  return new Response(JSON.stringify({ ok: true, token, user: { id: user.id, nombre: user.nombre, email: user.email } }), {
      status: 201, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error en /api/registro:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor.' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

import pkg from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const { Pool } = pkg
const pool = new Pool({ connectionString: import.meta.env.DATABASE_URL })

export async function POST({ request }) {
  const { email, password } = await request.json()

  const result = await pool.query(
    'SELECT * FROM usuarios WHERE email = $1', [email]
  )
  const usuario = result.rows[0]

  if (!usuario) {
    return new Response(JSON.stringify({ error: 'Email o contraseña incorrectos' }), { status: 401 })
  }

  const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash)
  if (!passwordCorrecta) {
    return new Response(JSON.stringify({ error: 'Email o contraseña incorrectos' }), { status: 401 })
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    import.meta.env.JWT_SECRET
  )

  return new Response(JSON.stringify({ ok: true, token }), { status: 200 })
}
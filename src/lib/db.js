import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  connectionString: import.meta.env.DATABASE_URL
})

export async function query(text, params) {
  const result = await pool.query(text, params)
  return result
}
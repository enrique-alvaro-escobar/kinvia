export async function POST() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Set-Cookie': 'token=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict',
      'Content-Type': 'application/json',
    },
  });
}
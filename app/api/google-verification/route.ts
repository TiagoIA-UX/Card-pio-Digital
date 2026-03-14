export async function GET() {
  return new Response('google-site-verification: google1a0b3e572aae5f34.html', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

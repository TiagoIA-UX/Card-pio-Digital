export async function GET() {
  return new Response('google-site-verification: google97080e0a7b8aa4f2.html', {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

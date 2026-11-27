import { serverRuntimeEnv } from '@/utils/runtimeEnv';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'cache-control',
  'x-content-type-options',
  'content-security-policy',
];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new Response(null, { status: 404 });

  const cookie = request.headers.get('cookie');
  if (!cookie) return new Response(null, { status: 401 });

  const origin = process.env.SERVICE_URL_API || serverRuntimeEnv().apiUrl;
  const upstream = await fetch(`${origin}/account/background/${id}/raw`, {
    headers: { cookie },
    cache: 'no-store',
    redirect: 'error',
  });

  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

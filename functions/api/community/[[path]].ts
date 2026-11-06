const COMMUNITY_ORIGIN = 'https://community-k8dy.onrender.com/api/v1/community';

type PagesContext = {
  request: Request;
  params: { path?: string | string[] };
};

function upstreamUrl(request: Request, path: string | string[] | undefined) {
  const incoming = new URL(request.url);
  const suffix = Array.isArray(path) ? path.join('/') : String(path || '');
  return `${COMMUNITY_ORIGIN}/${suffix}${incoming.search}`;
}

/**
 * Same-origin gateway for Community B.
 * It fixes browser CORS failures without exposing a new credential or widening
 * the upstream service's allowed origins. Authentication remains the student's
 * Supabase bearer token and is forwarded unchanged.
 */
export async function onRequest(context: PagesContext): Promise<Response> {
  const { request } = context;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.set('accept', 'application/json');

  const method = request.method.toUpperCase();
  const upstream = await fetch(upstreamUrl(request, context.params.path), {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
    redirect: 'follow',
  });

  const responseHeaders = new Headers();
  responseHeaders.set('content-type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
  responseHeaders.set('cache-control', 'no-store');
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

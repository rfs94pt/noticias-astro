export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname.endsWith('/') || !url.pathname.includes('.')) {
      return env.ASSETS.fetch(request);
    }

    try {
      return await env.ASSETS.fetch(request);
    } catch {
      const notFoundUrl = new URL(request.url);
      notFoundUrl.pathname = '/404.html';
      const notFoundRequest = new Request(notFoundUrl, request);
      return env.ASSETS.fetch(notFoundRequest);
    }
  },
};

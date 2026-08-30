import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url, locals }) => {
  // For now, return empty — chat history persistence can be added later
  return new Response(JSON.stringify({ messages: [] }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

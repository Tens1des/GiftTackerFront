// Supabase Edge Function: получает по URL страницы og:title, og:image и при возможности цену.
// Деплой: supabase functions deploy fetch-meta

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function extractMeta(html: string): { title?: string; image?: string; price?: number } {
  const title =
    html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)?.[1] ??
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const image =
    html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ??
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1];
  let price: number | undefined;
  const priceMatch =
    html.match(/"price"\s*:\s*"?(\d+[.,]?\d*)"?/i) ??
    html.match(/itemprop="price"[^>]+content="([^"]+)"/i) ??
    html.match(/data-price="([^"]+)"/i) ??
    html.match(/content="(\d+[\d\s]*[\.,]?\d*)"[^>]+itemprop="price"/i);
  if (priceMatch) {
    const p = priceMatch[1].replace(/\s/g, '').replace(',', '.');
    price = parseFloat(p);
    if (Number.isNaN(price)) price = undefined;
  }
  return { title: title ?? undefined, image: image ?? undefined, price };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'url required' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; WishlistBot/1.0)',
      },
      redirect: 'follow',
    });
    const html = await res.text();
    const meta = extractMeta(html);
    return new Response(JSON.stringify(meta), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

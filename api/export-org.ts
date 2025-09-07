import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const orgId = String(req.query.org_id || '');
  const bearer = (req.headers.authorization || '').replace('Bearer ', '');
  if (!orgId || !bearer) return res.status(400).json({ error: 'org_id y token requeridos' });
  const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string, {
    global: { headers: { Authorization: `Bearer ${bearer}` } }
  });
  const [products, treatments, docs, audit] = await Promise.all([
    supabase.from('products').select('*').eq('org_id', orgId),
    supabase.from('treatments').select('*').eq('org_id', orgId),
    supabase.from('docs').select('*').eq('org_id', orgId),
    supabase.from('audit').select('*').eq('org_id', orgId).limit(1000),
  ]);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    org_id: orgId,
    products: products.data || [],
    treatments: treatments.data || [],
    docs: docs.data || [],
    audit: audit.data || []
  }));
}

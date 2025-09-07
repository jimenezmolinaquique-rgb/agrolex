import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { doc_id, org_id, status } = (req.body || {}) as { doc_id: string; org_id: string; status: string };
  if (!doc_id || !org_id) return res.status(400).json({ error: 'doc_id y org_id requeridos' });
  const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
  await supabase.from('docs').update({ signature_status: status || 'signed' }).eq('id', doc_id).eq('org_id', org_id);
  await supabase.from('audit').insert({ org_id, action: 'doc.signature.update', details: { doc_id, status } });
  res.json({ ok: true });
}

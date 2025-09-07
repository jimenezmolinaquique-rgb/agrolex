import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' });
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');
  const signature = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET as string);
  } catch (err: any) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);
  const applyPlan = async (org_id: string, plan: 'pro_monthly' | 'pro_yearly' | 'canceled') => {
    await supabase.from('plans').upsert({ org_id, plan, updated_at: new Date().toISOString() }, { onConflict: 'org_id' });
  };
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object as any;
        const org_id = sess.metadata?.org_id;
        const mode = sess.mode;
        if (org_id && mode === 'subscription') await applyPlan(org_id, 'pro_monthly');
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        const org_id = (sub.metadata as any)?.org_id;
        if (org_id) {
          const interval = sub.items.data[0]?.price?.recurring?.interval;
          await applyPlan(org_id, interval === 'year' ? 'pro_yearly' : 'pro_monthly');
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const org_id = (sub.metadata as any)?.org_id;
        if (org_id) await applyPlan(org_id, 'canceled');
        break;
      }
      default: break;
    }
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message });
  }
  res.json({ received: true });
}

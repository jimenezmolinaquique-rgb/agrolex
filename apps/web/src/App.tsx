import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = (import.meta as any).env.VITE_SUPABASE_URL && (import.meta as any).env.VITE_SUPABASE_ANON_KEY
  ? createClient((import.meta as any).env.VITE_SUPABASE_URL, (import.meta as any).env.VITE_SUPABASE_ANON_KEY)
  : null
export default function App(){
  const connected = !!supabase
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  async function signIn(){ if (!supabase) return alert('DEMO: configura VITE_SUPABASE_URL/ANON_KEY'); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) alert(error.message); else alert('OK') }
  return (<div className="p-6 max-w-xl mx-auto space-y-4">
    <h1 className="text-2xl font-bold">AgroLex</h1>
    <p className="text-sm">{connected ? 'Conectado a Supabase' : 'DEMO sin Supabase: añade .env.local'}</p>
    <div className="grid gap-2">
      <input className="border p-2 rounded" placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="border p-2 rounded" type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="bg-black text-white rounded px-3 py-2" onClick={signIn}>Entrar</button>
    </div>
  </div>) }
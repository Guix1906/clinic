import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service-role client: bypassa RLS para operações administrativas
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/** GET /api/secretary-doctors?secretary_id=xxx → lista vínculos */
export async function GET(req: NextRequest) {
  const secretaryId = req.nextUrl.searchParams.get('secretary_id');
  if (!secretaryId) return NextResponse.json({ error: 'secretary_id required' }, { status: 400 });

  const { data, error } = await admin
    .from('secretary_doctors')
    .select('doctor_id, doctors!doctor_id(id, name, specialty)')
    .eq('secretary_id', secretaryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/** POST /api/secretary-doctors → cria vínculo { secretary_id, doctor_id } */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { secretary_id, doctor_id } = body;

  if (!secretary_id || !doctor_id)
    return NextResponse.json({ error: 'secretary_id e doctor_id obrigatórios' }, { status: 400 });

  // Valida que secretary é role='secretaria'
  const { data: sec } = await admin
    .from('doctors')
    .select('role')
    .eq('id', secretary_id)
    .single();

  if (sec?.role !== 'secretaria')
    return NextResponse.json({ error: 'Usuário não é secretária' }, { status: 422 });

  const { error } = await admin
    .from('secretary_doctors')
    .upsert({ secretary_id, doctor_id }, { onConflict: 'secretary_id,doctor_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/secretary-doctors → remove vínculo { secretary_id, doctor_id } */
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { secretary_id, doctor_id } = body;

  if (!secretary_id || !doctor_id)
    return NextResponse.json({ error: 'secretary_id e doctor_id obrigatórios' }, { status: 400 });

  const { error } = await admin
    .from('secretary_doctors')
    .delete()
    .eq('secretary_id', secretary_id)
    .eq('doctor_id', doctor_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

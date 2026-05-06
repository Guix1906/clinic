import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// ─────────────────────────────────────────────────────────────────
// GET /api/commissions
//   ?summary=true                          → resumo por colaborador (v_commission_summary)
//   ?doctor_id=xxx&from=YYYY-MM-DD&to=...  → transações com comissão de um colaborador
//   ?payout_id=xxx                         → transações vinculadas a um lote de pagamento
// ─────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const summary   = searchParams.get('summary');
  const doctorId  = searchParams.get('doctor_id');
  const from      = searchParams.get('from');
  const to        = searchParams.get('to');
  const payoutId  = searchParams.get('payout_id');

  if (summary) {
    const { data, error } = await admin
      .from('v_commission_summary')
      .select('*')
      .order('doctor_name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (payoutId) {
    const { data, error } = await admin
      .from('transactions')
      .select('id, date, amount, commission_amount, commission_status, description, category, patients(name)')
      .eq('commission_payout_id', payoutId)
      .order('date', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }

  if (!doctorId) {
    return NextResponse.json({ error: 'Informe doctor_id ou summary=true' }, { status: 400 });
  }

  let query = admin
    .from('transactions')
    .select(`
      id, date, amount, commission_amount, commission_status,
      description, category, status, payment_method,
      patients ( id, name )
    `)
    .eq('doctor_id', doctorId)
    .eq('type', 'receita')
    .not('commission_amount', 'is', null)
    .order('date', { ascending: false });

  if (from) query = query.gte('date', from);
  if (to)   query = query.lte('date', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// ─────────────────────────────────────────────────────────────────
// POST /api/commissions
//   body: { action: 'recalculate', doctor_id?: string }
//         { action: 'payout', doctor_id, period_start, period_end, notes? }
// ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  // ── Recalcular comissões (em lote ou por colaborador) ──
  if (action === 'recalculate') {
    const doctorId: string | undefined = body.doctor_id;

    let query = admin
      .from('transactions')
      .select('id, doctor_id, amount, status')
      .eq('type', 'receita')
      .not('doctor_id', 'is', null);

    if (doctorId) query = query.eq('doctor_id', doctorId);

    const { data: txs, error: fetchErr } = await query;
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });

    let updated = 0;
    const errors: string[] = [];

    for (const tx of (txs ?? [])) {
      // Chama a função calculate_commission do Postgres
      const { data: calcData, error: calcErr } = await admin.rpc(
        'calculate_commission',
        { p_doctor_id: tx.doctor_id, p_amount: tx.amount }
      );

      if (calcErr) { errors.push(tx.id); continue; }

      const commissionAmount: number | null = calcData;
      const commissionStatus =
        tx.status === 'cancelado'       ? 'cancelado'
        : commissionAmount !== null ? 'pendente'
        : null;

      await admin
        .from('transactions')
        .update({ commission_amount: commissionAmount, commission_status: commissionStatus })
        .eq('id', tx.id);

      updated++;
    }

    return NextResponse.json({ ok: true, updated, errors });
  }

  // ── Criar lote de pagamento de comissão ──
  if (action === 'payout') {
    const { doctor_id, period_start, period_end, notes } = body;
    if (!doctor_id || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'doctor_id, period_start e period_end são obrigatórios' },
        { status: 400 }
      );
    }

    // Soma comissões pendentes no período
    const { data: txs, error: txErr } = await admin
      .from('transactions')
      .select('id, commission_amount')
      .eq('doctor_id', doctor_id)
      .eq('type', 'receita')
      .eq('commission_status', 'pendente')
      .gte('date', period_start)
      .lte('date', period_end);

    if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });

    const total = (txs ?? []).reduce((sum, t) => sum + (t.commission_amount ?? 0), 0);

    if (total === 0) {
      return NextResponse.json({ error: 'Nenhuma comissão pendente no período' }, { status: 422 });
    }

    // Cria o lote
    const { data: payout, error: payErr } = await admin
      .from('commission_payouts')
      .insert({
        doctor_id,
        period_start,
        period_end,
        total_amount: total,
        status: 'pendente',
        notes: notes ?? null,
      })
      .select('*')
      .single();

    if (payErr) return NextResponse.json({ error: payErr.message }, { status: 500 });

    // Marca as transações com o payout_id (coluna adicionada abaixo)
    // — evita double-counting em lotes futuros
    const txIds = (txs ?? []).map(t => t.id);
    if (txIds.length > 0) {
      await admin
        .from('transactions')
        .update({ commission_payout_id: payout.id })
        .in('id', txIds);
    }

    return NextResponse.json({ ok: true, payout, total, transactions: txIds.length });
  }

  return NextResponse.json({ error: 'action inválida' }, { status: 400 });
}

// ─────────────────────────────────────────────────────────────────
// PATCH /api/commissions
//   body: { transaction_id, commission_status: 'pago'|'pendente'|'cancelado' }
//   body: { payout_id, status: 'pago'|'cancelado', paid_at? }
// ─────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  // Atualizar status de uma transação individual
  if (body.transaction_id) {
    const { transaction_id, commission_status } = body;
    const allowed = ['pendente', 'pago', 'cancelado'];
    if (!allowed.includes(commission_status)) {
      return NextResponse.json({ error: 'commission_status inválido' }, { status: 400 });
    }

    const { error } = await admin
      .from('transactions')
      .update({ commission_status })
      .eq('id', transaction_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Atualizar status de um lote de pagamento
  if (body.payout_id) {
    const { payout_id, status, paid_at } = body;
    const allowed = ['pendente', 'pago', 'cancelado'];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'status inválido' }, { status: 400 });
    }

    const { data: payout, error: fetchErr } = await admin
      .from('commission_payouts')
      .select('id')
      .eq('id', payout_id)
      .single();

    if (fetchErr || !payout) {
      return NextResponse.json({ error: 'Lote não encontrado' }, { status: 404 });
    }

    const { error: updateErr } = await admin
      .from('commission_payouts')
      .update({
        status,
        paid_at: status === 'pago' ? (paid_at ?? new Date().toISOString()) : null,
      })
      .eq('id', payout_id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Atualiza o status das comissões deste lote
    const newCommStatus = status === 'pago' ? 'pago' : status === 'cancelado' ? 'cancelado' : 'pendente';
    await admin
      .from('transactions')
      .update({ commission_status: newCommStatus })
      .eq('commission_payout_id', payout_id);

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Informe transaction_id ou payout_id' }, { status: 400 });
}

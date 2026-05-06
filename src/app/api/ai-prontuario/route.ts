import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY não configurada. Adicione ao arquivo .env.local.' },
      { status: 500 }
    );
  }

  try {
    const { relato, patientName, specialty = 'Generalista' } = await req.json();

    if (!relato?.trim()) {
      return NextResponse.json({ error: 'Relato vazio.' }, { status: 400 });
    }

    const systemPrompt = `Você é um médico experiente especialista em ${specialty}.
Organize o texto do atendimento em um prontuário clínico no formato SOAP.

Use exatamente esta estrutura:

**S — SUBJETIVO**
(Queixa principal, história da doença atual, sintomas relatados pelo paciente)

**O — OBJETIVO**
(Exame físico, sinais vitais, achados clínicos observados)

**A — AVALIAÇÃO**
(Hipótese diagnóstica, diagnóstico diferencial, CID-10 provável)

**P — PLANO**
(Conduta, medicações prescritas, exames solicitados, orientações, retorno)

Use linguagem técnica médica, clara e objetiva.
Se alguma seção não tiver informação suficiente, escreva "Não informado" e faça uma observação entre parênteses do que seria importante coletar.`;

    const userMessage = patientName
      ? `Paciente: ${patientName}\nEspecialidade: ${specialty}\n\nRelato do atendimento:\n${relato}`
      : `Especialidade: ${specialty}\n\nRelato do atendimento:\n${relato}`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      system: systemPrompt,
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('AI Prontuário error:', error);
    return NextResponse.json(
      { error: error?.message ?? 'Erro ao processar a solicitação.' },
      { status: 500 }
    );
  }
}

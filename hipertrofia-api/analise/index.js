'use strict';
// Análise visual das fotos de evolução (Claude) → recomendações de ênfase por grupamento.
const Anthropic = require('@anthropic-ai/sdk');
const { container, json, guard } = require('../shared/base');

const SYSTEM = `Você é um treinador de musculação experiente que acompanha um homem de 45 anos num programa de hipertrofia com déficit calórico moderado (recomposição corporal): 4 sessões de musculação por semana (Inferiores A/B, Superiores A/B, blocos de força + bi-sets + tri-sets) e 3 de aeróbico (zona 2 e intervalado em escada e remo).
Você recebe fotos de corpo inteiro (frente, lado, costas) de duas datas, o histórico de peso e cintura e a evolução de carga por exercício.
Escreva em português do Brasil, tratando o aluno por "você", em texto simples sem markdown (sem asteriscos, sem cerquilhas), em até 350 palavras, nesta ordem:
1. O que mudou entre as datas (composição, cintura, postura), dizendo o que é visível e o que é incerto pela foto.
2. Grupamentos que estão ficando para trás em relação aos demais, com no máximo 3 itens.
3. Ajustes concretos para o próximo ciclo: quais exercícios ganhar ou perder séries, em quais blocos, e quantas séries semanais.
4. Um ponto de atenção sobre alimentação ou recuperação, se os números indicarem.
Seja direto. É uma leitura visual aproximada: não estime percentual de gordura com casas decimais e não faça diagnóstico médico.`;

async function img(id) {
  const buf = await container('fotos').getBlobClient(id).downloadToBuffer();
  return { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: buf.toString('base64') } };
}

module.exports = async function (context, req) {
  if (!guard(context, req)) return;
  if (!process.env.ANTHROPIC_API_KEY) return json(context, 503, { error: 'Análise ainda não configurada (ANTHROPIC_API_KEY).' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const content = [];
    for (const [label, e] of [['ANTES', b.baseline], ['AGORA', b.latest]]) {
      for (const pose of ['front', 'side', 'back']) {
        const id = e && e.photos && e.photos[pose];
        if (!id) continue;
        content.push({ type: 'text', text: `${label} (${e.date}) — ${{ front: 'frente', side: 'lado', back: 'costas' }[pose]}` });
        content.push(await img(id));
      }
    }
    if (!content.length) return json(context, 400, { error: 'sem fotos' });
    content.push({ type: 'text', text: `Perfil: ${JSON.stringify(b.profile || {})}\nPeso e cintura: ${JSON.stringify(b.weights || [])}\nEvolução de carga: ${JSON.stringify(b.training || [])}` });

    const client = new Anthropic();
    // esforço baixo: a resposta precisa caber no limite de ~45 s do gateway do SWA
    const stream = client.beta.messages.stream({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === 'refusal') return json(context, 422, { error: 'A análise foi recusada pelo modelo. Tente com outras fotos.' });
    const text = msg.content.filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
    return json(context, 200, { text });
  } catch (e) {
    context.log.error('analise:', e);
    const status = e instanceof Anthropic.RateLimitError ? 429 : e instanceof Anthropic.APIError ? 502 : 500;
    return json(context, status, { error: e.message });
  }
};

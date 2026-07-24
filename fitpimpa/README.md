# FitPimpa · PWA com a Coach Margareth 🐾

App de treinos da Pimpa. Mesmo motor do "Julio Neves - Treinos", com:

- **300 treinos** gerados pela metodologia BlackSheep, com **menos aparelhos
  por treino**: equilíbrio funcional-crossfit × academia com prevalência
  funcional (~75% funcional / ~25% aparelhos; máx. 2 aparelhos por sessão —
  leg press, extensora, mesa flexora, pulldown, remada baixa, tríceps corda,
  barra e afins entram em minoria calibrada no gerador). Distribuição enviesada
  para o foco da Pimpa: Inferiores 30%, Core & Lombar 20% (categoria
  exclusiva), Híbrido 20%, Empurre 15%, Tração 15%.
- **Coach Margareth**, a pug professora de fitness: recebe no splash de
  abertura, mora no cabeçalho e dá parabéns de um jeito diferente ao final de
  cada treino (medalha, bíceps, pompons, coração ou troféu — pose e frase
  sorteadas). Arte 100% SVG inline em `margareth.js`, sem assets externos.
- Controle de cargas com memória (chave própria `fp.*` no localStorage — não
  mistura com o app do Julio), vídeos embutidos ≤30s, busca, timer e histórico.

## Arquivos

```
fitpimpa/
├─ index.html            (splash + celebração + views)
├─ styles.css            (tema claro creme/rosa/lavanda, ui-rounded)
├─ app.js                (motor + integração da mascote)
├─ margareth.js          (poses SVG e frases da Coach)
├─ manifest.webmanifest  (FitPimpa)
├─ sw.js                 (cache fitpimpa-v1)
├─ data/workouts.json    (gerado por ../tools/gen_workouts.py)
└─ icons/                (ícone da Margareth)
```

## Regenerar treinos

```bash
cd /Users/julio.neves/Desktop/Blacksheep
python3 tools/gen_workouts.py
```

## Publicar

Igual ao app principal: hospedar a pasta `fitpimpa/` em qualquer host estático
e, no iPhone da Pimpa, Safari → Compartilhar → Adicionar à Tela de Início.

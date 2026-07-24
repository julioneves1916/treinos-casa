// Coach Margareth — a pug professora de fitness do FitPimpa.
// Arte 100% SVG inline, sem assets externos.
// Poses: welcome | medal | flex | pompom | heart | trophy

'use strict';

const MARGARETH = (() => {

  // Paleta da pug
  const C = {
    body:   '#e3b57e',  // pelagem fawn
    bodyHi: '#f0c992',  // barriga/luz
    dark:   '#463229',  // máscara, orelhas
    darker: '#2e211b',  // nariz, contorno olhos
    blush:  '#f2a3a3',
    tongue: '#f28ba0',
    outfit: 'var(--accent, #e26d8f)',
    outfit2:'var(--accent-2, #8c6bb8)',
    gold:   '#f2c14e',
  };

  // ---------- partes compartilhadas ----------

  // Cabeça frontal da pug (usada em todas as poses)
  function head(extra = '') {
    return `
    <g class="mg-head">
      <!-- orelhas caídas -->
      <path d="M42 52 Q30 28 52 24 Q66 22 70 40 Q56 44 48 62 Z" fill="${C.dark}"/>
      <path d="M158 52 Q170 28 148 24 Q134 22 130 40 Q144 44 152 62 Z" fill="${C.dark}"/>
      <!-- cabeça -->
      <ellipse cx="100" cy="72" rx="54" ry="48" fill="${C.body}"/>
      <!-- rugas da testa -->
      <path d="M72 40 Q100 30 128 40" fill="none" stroke="#c99c62" stroke-width="3" stroke-linecap="round"/>
      <path d="M76 30 Q100 22 124 30" fill="none" stroke="#c99c62" stroke-width="2.5" stroke-linecap="round"/>
      <!-- faixa de coach -->
      <path d="M48 42 Q100 24 152 42 L152 30 Q100 12 48 30 Z" fill="${C.outfit}"/>
      <circle cx="152" cy="36" r="7" fill="${C.outfit2}"/>
      <!-- máscara do focinho -->
      <ellipse cx="100" cy="92" rx="30" ry="24" fill="${C.dark}"/>
      <!-- olhos grandes -->
      <circle cx="76" cy="70" r="13" fill="#fff"/>
      <circle cx="124" cy="70" r="13" fill="#fff"/>
      <circle cx="78" cy="72" r="9" fill="${C.darker}"/>
      <circle cx="122" cy="72" r="9" fill="${C.darker}"/>
      <circle cx="81" cy="69" r="3" fill="#fff"/>
      <circle cx="125" cy="69" r="3" fill="#fff"/>
      <!-- bochechas -->
      <ellipse cx="58" cy="88" rx="8" ry="5" fill="${C.blush}" opacity=".7"/>
      <ellipse cx="142" cy="88" rx="8" ry="5" fill="${C.blush}" opacity=".7"/>
      <!-- nariz e boca -->
      <path d="M92 84 Q100 78 108 84 Q104 92 100 92 Q96 92 92 84 Z" fill="${C.darker}"/>
      <path d="M100 92 L100 100" stroke="${C.darker}" stroke-width="2.5" stroke-linecap="round"/>
      ${extra}
    </g>`;
  }

  const mouthSmile = `
    <path d="M86 102 Q100 112 114 102" fill="none" stroke="${C.darker}" stroke-width="3" stroke-linecap="round"/>`;
  const mouthOpen = `
    <path d="M84 100 Q100 118 116 100 Q100 108 84 100 Z" fill="${C.darker}"/>
    <path d="M92 104 Q100 114 108 104 Q100 116 92 104 Z" fill="${C.tongue}"/>`;
  const tongueOut = `
    <path d="M86 102 Q100 112 114 102" fill="none" stroke="${C.darker}" stroke-width="3" stroke-linecap="round"/>
    <path d="M94 105 Q100 118 106 105 Q100 110 94 105 Z" fill="${C.tongue}"/>`;

  // Corpo com top esportivo; braços entram por pose
  function body(arms = '') {
    return `
    <g class="mg-body" transform="translate(0,-10)">
      <!-- rabo enrolado -->
      <path d="M146 172 q18 -4 14 -16 q-3 -10 -13 -6" fill="none"
            stroke="${C.body}" stroke-width="9" stroke-linecap="round"/>
      <!-- tronco -->
      <ellipse cx="100" cy="168" rx="42" ry="38" fill="${C.body}"/>
      <ellipse cx="100" cy="176" rx="24" ry="24" fill="${C.bodyHi}"/>
      <!-- top esportivo -->
      <path d="M62 156 Q100 138 138 156 L138 172 Q100 158 62 172 Z" fill="${C.outfit}"/>
      <!-- perninhas -->
      <ellipse cx="82" cy="204" rx="13" ry="9" fill="${C.body}"/>
      <ellipse cx="118" cy="204" rx="13" ry="9" fill="${C.body}"/>
      ${arms}
    </g>`;
  }

  // braços neutros (abaixados)
  const armsDown = `
    <path d="M62 160 Q48 172 52 188" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
    <path d="M138 160 Q152 172 148 188" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>`;

  function svg(inner, cls = '') {
    return `<svg class="mg ${cls}" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="Coach Margareth, a pug professora de fitness">${inner}</svg>`;
  }

  // ---------- poses ----------

  function welcome() {
    // acenando com apito no pescoço
    const arms = `
      <path d="M62 160 Q46 150 40 132" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <circle cx="38" cy="126" r="9" fill="${C.body}" class="mg-wave"/>
      <path d="M138 160 Q152 172 148 188" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <!-- apito -->
      <path d="M84 148 Q100 160 116 148" fill="none" stroke="${C.outfit2}" stroke-width="3"/>
      <rect x="94" y="156" width="14" height="9" rx="4" fill="${C.gold}"/>
      <circle cx="106" cy="162" r="4" fill="${C.gold}"/>`;
    return svg(body(arms) + head(tongueOut));
  }

  function medal() {
    const arms = armsDown + `
      <path d="M92 150 Q100 162 108 150" fill="none" stroke="${C.outfit2}" stroke-width="3"/>
      <circle cx="100" cy="168" r="13" fill="${C.gold}"/>
      <circle cx="100" cy="168" r="9" fill="#e0a72e"/>
      <text x="100" y="173" text-anchor="middle" font-size="12" fill="#8a5f00" font-weight="bold">1</text>`;
    return svg(body(arms) + head(mouthOpen));
  }

  function flex() {
    // bíceps duplo com mini-halteres
    const arms = `
      <path d="M62 158 Q40 150 42 132" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <path d="M138 158 Q160 150 158 132" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <g class="mg-dumb">
        <rect x="24" y="122" width="36" height="6" rx="3" fill="#6b6b74"/>
        <rect x="20" y="114" width="9" height="22" rx="3" fill="#494952"/>
        <rect x="55" y="114" width="9" height="22" rx="3" fill="#494952"/>
        <rect x="140" y="122" width="36" height="6" rx="3" fill="#6b6b74"/>
        <rect x="136" y="114" width="9" height="22" rx="3" fill="#494952"/>
        <rect x="171" y="114" width="9" height="22" rx="3" fill="#494952"/>
      </g>`;
    return svg(body(arms) + head(mouthOpen));
  }

  function pompom() {
    const pom = (cx, cy, fill) => {
      let dots = '';
      const pts = [[0,0],[9,3],[-9,3],[4,-8],[-5,-7],[8,-4],[-8,-5],[2,9],[-3,8]];
      for (const [dx, dy] of pts) dots += `<circle cx="${cx+dx}" cy="${cy+dy}" r="5.5" fill="${fill}"/>`;
      return dots;
    };
    const arms = `
      <path d="M62 158 Q42 146 40 130" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <path d="M138 158 Q158 146 160 130" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <g class="mg-pom">${pom(38, 124, C.outfit)}${pom(162, 124, C.outfit2)}</g>`;
    return svg(body(arms) + head(mouthOpen), 'mg-bounce');
  }

  function heart() {
    const arms = `
      <path d="M62 160 Q54 148 62 140" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <path d="M138 160 Q146 148 138 140" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <path class="mg-heart" d="M100 150 C92 138 74 140 74 154 C74 166 90 174 100 182
               C110 174 126 166 126 154 C126 140 108 138 100 150 Z" fill="${C.outfit}"/>`;
    return svg(body(arms) + head(mouthSmile));
  }

  function trophy() {
    const arms = `
      <path d="M62 158 Q52 144 60 132" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <path d="M138 158 Q148 144 140 132" fill="none" stroke="${C.body}" stroke-width="13" stroke-linecap="round"/>
      <g class="mg-trophy">
        <rect x="86" y="118" width="28" height="22" rx="6" fill="${C.gold}"/>
        <path d="M86 122 q-14 2 -8 16 q4 8 12 6 M114 122 q14 2 8 16 q-4 8 -12 6"
              fill="none" stroke="${C.gold}" stroke-width="5"/>
        <rect x="93" y="140" width="14" height="8" fill="#e0a72e"/>
        <rect x="86" y="148" width="28" height="7" rx="2" fill="${C.gold}"/>
      </g>`;
    return svg(body(arms) + head(mouthOpen));
  }

  // Só o rostinho (avatar do cabeçalho)
  function face() {
    return `<svg class="mg-face" viewBox="30 8 140 120" xmlns="http://www.w3.org/2000/svg"
      role="img" aria-label="Coach Margareth">${head(mouthSmile)}</svg>`;
  }

  const POSES = { welcome, medal, flex, pompom, heart, trophy };
  const CONGRATS = [
    { pose: 'medal',  text: 'Medalha de ouro pra você, Pimpa! Eu conto como juíza e fã.' },
    { pose: 'flex',   text: 'Auuu! Mais forte que ontem. A Coach Margareth registrou tudo.' },
    { pose: 'pompom', text: 'Treino esmagado! Plateia de uma pug só, mas o grito é de multidão!' },
    { pose: 'heart',  text: 'Que orgulho de você! Coração de coach transborda. 🐾' },
    { pose: 'trophy', text: 'Campeã do dia! Troféu entregue com as duas patas.' },
    { pose: 'flex',   text: 'Glúteo firme, core blindado, lombar feliz. Margareth aprova!' },
    { pose: 'pompom', text: 'Mais um pra conta! Você merece carinho atrás da orelha. Eu também.' },
    { pose: 'medal',  text: 'Constância é o seu superpoder, Pimpa. Até o próximo latido!' },
  ];
  const WELCOMES = [
    'Oi, Pimpa! Pronta pro treino de hoje?',
    'Auuu! A Coach Margareth já aqueceu as patinhas.',
    'Hoje é dia! Bora deixar a lombar feliz?',
    'Cheguei cedo, trouxe o apito. Vamos?',
  ];

  return {
    render(pose) { return (POSES[pose] || welcome)(); },
    face,
    randomCongrats() { return CONGRATS[Math.floor(Math.random() * CONGRATS.length)]; },
    randomWelcome() { return WELCOMES[Math.floor(Math.random() * WELCOMES.length)]; },
  };
})();

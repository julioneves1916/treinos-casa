// polar.js — leitura de arquivos exportados do Polar Flow (TCX e CSV), sem servidor
'use strict';

const PolarFile = {
  async parse(file) {
    const text = await file.text();
    const name = file.name.toLowerCase();
    if (name.endsWith('.tcx') || text.includes('<TrainingCenterDatabase')) return this.tcx(text);
    if (name.endsWith('.csv')) return this.csv(text);
    throw new Error('Formato não suportado. Exporte do Polar Flow em TCX ou CSV.');
  },

  tcx(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const laps = [...doc.getElementsByTagName('Lap')];
    if (!laps.length) throw new Error('TCX sem voltas (Lap).');
    let dur = 0, kcal = 0, hrMax = 0, hrWeighted = 0;
    const num = (el, tag) => { const n = el.getElementsByTagName(tag)[0]; return n ? Number(n.textContent.trim()) : 0; };
    for (const lap of laps) {
      const t = num(lap, 'TotalTimeSeconds');
      dur += t; kcal += num(lap, 'Calories');
      const avg = lap.getElementsByTagName('AverageHeartRateBpm')[0];
      const mx = lap.getElementsByTagName('MaximumHeartRateBpm')[0];
      if (avg) hrWeighted += num(avg, 'Value') * t;
      if (mx) hrMax = Math.max(hrMax, num(mx, 'Value'));
    }
    // FC média pelos pontos, se as voltas não trouxerem
    let hrAvg = dur ? Math.round(hrWeighted / dur) : 0;
    const hrs = [...doc.getElementsByTagName('HeartRateBpm')].map(n => num(n, 'Value')).filter(Boolean);
    if (!hrAvg && hrs.length) hrAvg = Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length);
    if (!hrMax && hrs.length) hrMax = Math.max(...hrs);
    const sport = doc.getElementsByTagName('Activity')[0]?.getAttribute('Sport') || '';
    const start = laps[0].getAttribute('StartTime') || '';
    return { source: 'arquivo TCX', start, duration_s: Math.round(dur), kcal: Math.round(kcal), hr_avg: hrAvg || null, hr_max: hrMax || null, sport, hr_samples: hrs };
  },

  // CSV do Polar Flow: 1ª linha = cabeçalho do resumo, 2ª = valores; depois vêm as amostras
  csv(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const split = (l) => l.split(',').map(x => x.trim());
    const H = split(lines[0]), V = split(lines[1] || '');
    const get = (re) => { const i = H.findIndex(h => re.test(h)); return i >= 0 ? V[i] : ''; };
    const durTxt = get(/^Duration/i); // hh:mm:ss
    const p = (durTxt || '0:0:0').split(':').map(Number);
    const dur = p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : 0;
    const date = get(/^Date/i), time = get(/^Start time/i);
    let start = '';
    if (date) { const [d, m, y] = date.split(/[.\/-]/); start = `${y.length === 4 ? y : '20' + y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${time || '00:00:00'}`; }
    // amostras de FC (seção a partir da linha com "Sample rate" ou "Time,HR")
    const si = lines.findIndex(l => /^Sample rate,|^Time,HR/i.test(l));
    let hrs = [];
    if (si >= 0) {
      const SH = split(lines[si]); const hi = SH.findIndex(h => /^HR/i.test(h));
      if (hi >= 0) hrs = lines.slice(si + 1).map(l => Number(split(l)[hi])).filter(Boolean);
    }
    return {
      source: 'arquivo CSV', start, duration_s: dur,
      kcal: Number(get(/^Calories/i)) || 0,
      hr_avg: Number(get(/^Average heart rate/i)) || (hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null),
      hr_max: Number(get(/^Max(imum)? heart rate|^HR max/i)) || (hrs.length ? Math.max(...hrs) : null),
      sport: get(/^Sport/i), hr_samples: hrs,
    };
  },

  // tempo em cada zona a partir das amostras (1/s no TCX do Polar)
  timeInZones(samples, z) {
    if (!samples || !samples.length) return null;
    const out = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };
    for (const hr of samples) {
      const k = hr >= z.z5[0] ? 'z5' : hr >= z.z4[0] ? 'z4' : hr >= z.z3[0] ? 'z3' : hr >= z.z2[0] ? 'z2' : hr >= z.z1[0] ? 'z1' : null;
      if (k) out[k]++;
    }
    return out;
  },
};

// duração ISO-8601 da API (PT1H2M3.5S) → segundos
function isoDurToSec(s) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/.exec(s || '');
  return m ? (Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Math.round(Number(m[3] || 0))) : 0;
}

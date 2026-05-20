'use strict';

// ─── ATHLETE & RACE CONFIG ────────────────────────────────────────────────────
const ATHLETE = {
  name: 'Renan',
  age: 31,
  city: 'Fortaleza/CE',
  weightKg: 80.2,
  bodyFatPct: 14.62,
  targetWeightKg: 76.5,
  targetBodyFatPct: 10.5,
  lthr: 181,
  restHR: 62,
  maxHR: 200,
  device: 'Garmin Forerunner 265',
};

const RACE = {
  name: 'Maratona de Roma',
  date: '2027-03-14',
  goal: 'Sub-4h',
  targetPace: '5:41/km',
  targetHR: { min: 165, max: 172 },
};

const PLAN_START = '2026-05-18'; // Monday — semana 1 começa aqui

// ─── HR ZONES ─────────────────────────────────────────────────────────────────
const HR_ZONES = [
  { id: 1, name: 'L1 Recuperação', hrMin: 0,   hrMax: 146, paceMin: '6:45', paceMax: '7:30', color: '#4aaff0' },
  { id: 2, name: 'L2 Base',        hrMin: 147, hrMax: 165, paceMin: '6:00', paceMax: '6:30', color: '#4acf4a' },
  { id: 3, name: 'L3 Moderado',    hrMin: 165, hrMax: 174, paceMin: '5:35', paceMax: '5:45', color: '#f0d04a' },
  { id: 4, name: 'L4 Limiar',      hrMin: 174, hrMax: 181, paceMin: '5:05', paceMax: '5:20', color: '#f08030' },
  { id: 5, name: 'L5 VO₂max',      hrMin: 181, hrMax: 999, paceMin: '4:40', paceMax: '5:00', color: '#d63d2f' },
];

// ─── BLOCKS ───────────────────────────────────────────────────────────────────
const BLOCKS = [
  {
    id: 1, name: 'Fundação Anatômica',
    weekStart: 1, weekEnd: 8,
    startDate: '2026-05-25', endDate: '2026-07-19',
    intensity: '60–70%', reps: '12–15', rest: '60s',
    color: '#1f4d7a',
    description: 'Base anatômica, técnica dos movimentos, pliometria apenas nas semanas 5–8.',
  },
  {
    id: 2, name: 'Construção de Volume',
    weekStart: 9, weekEnd: 14,
    startDate: '2026-07-20', endDate: '2026-08-30',
    intensity: '70–75%', reps: '10–12', rest: '60–75s',
    color: '#2d6e4e',
    description: '6 semanas estratégicas — pliometria intermediária, volume crescente. Termina com deload pré-prova.',
    note: 'Bloco de 6 semanas (decisão estratégica para alinhar Bloco 3 com setembro).',
  },
  {
    id: 3, name: 'Força Máxima',
    weekStart: 15, weekEnd: 24,
    startDate: '2026-08-31', endDate: '2026-11-08',
    intensity: '80–85%', reps: '6–8', rest: '90–120s',
    color: '#b8923a',
    description: 'Cargas pesadas, pliometria avançada. Maior risco de overtraining — monitorar fadiga.',
    alert: 'Fase de maior risco de overtraining. Se o fartlek de quinta vier comprometido, reduza uma série ou pule a pliometria daquela semana.',
  },
  {
    id: 4, name: 'Potência e Conversão',
    weekStart: 25, weekEnd: 32,
    startDate: '2026-11-09', endDate: '2027-01-03',
    intensity: '65–75%', reps: '5–8 rápidas', rest: '90–120s',
    color: '#7b2d8c',
    description: 'Força → potência. Execução explosiva. Pliometria específica para corrida.',
  },
  {
    id: 5, name: 'Específico Maratona + Taper',
    weekStart: 33, weekEnd: 42,
    startDate: '2027-01-04', endDate: '2027-03-14',
    intensity: 'Manutenção → zero', reps: '12–15 leve', rest: '30–45s',
    color: '#d63d2f',
    description: 'Academia reduz progressivamente: 2/semana → 1/semana → zero. Foco total na corrida.',
  },
];

// ─── SPECIAL EVENTS ──────────────────────────────────────────────────────────
const SPECIAL_EVENTS = [
  {
    date: '2026-09-06',
    name: 'Terra da Luz 21k',
    type: 'race',
    badge: '🏁 PROVA',
    distance: '21km',
    week: 15,
    alertDays: 14,
    color: '#d63d2f',
  },
  {
    date: '2027-03-14',
    name: 'Maratona de Roma',
    type: 'marathon',
    badge: '🏁 ROMA',
    distance: '42.195km',
    week: 42,
    alertDays: 21,
    color: '#d63d2f',
  },
];

// ─── WEEK NOTES ──────────────────────────────────────────────────────────────
const WEEK_NOTES = {
  1:  { label: 'Adaptação inicial, cargas leves, foco em técnica', type: 'normal' },
  2:  { label: 'Técnica, aumentar carga 5%', type: 'normal' },
  3:  { label: 'Cargas progredindo, sem pliometria ainda', type: 'normal' },
  4:  { label: 'Consolidação, sem pliometria', type: 'normal' },
  5:  { label: 'INÍCIO PLIOMETRIA — squat jumps e saltos laterais', type: 'milestone' },
  6:  { label: 'Manter pliometria, cargas estáveis', type: 'normal' },
  7:  { label: 'Pico do bloco — máxima qualidade', type: 'peak' },
  8:  { label: '⚠️ DELOAD -20% volume — preparar Bloco 2', type: 'deload' },
  9:  { label: 'Transição, carga moderada', type: 'normal' },
  10: { label: 'Adaptação, progredir cargas', type: 'normal' },
  11: { label: 'Pliometria intermediária — box jumps', type: 'milestone' },
  12: { label: 'Pico de volume do bloco', type: 'peak' },
  13: { label: 'Manter cargas, qualidade de execução', type: 'normal' },
  14: { label: '⚠️ DELOAD PRÉ-PROVA -30% volume (Terra da Luz em 06/09)', type: 'deload-pre-race' },
  15: { label: '🏁 Terra da Luz 21k (06/09) — zero academia', type: 'race-week' },
  16: { label: 'Recuperação pós-prova — academia leve', type: 'recovery' },
  17: { label: 'Início real Bloco 3 — adaptação às cargas pesadas', type: 'normal' },
  18: { label: 'Cargas progridem, técnica perfeita', type: 'normal' },
  19: { label: 'Depth jumps — pliometria avançada', type: 'milestone' },
  20: { label: 'Pico de carga — próximo do máximo', type: 'peak' },
  21: { label: 'Manter intensidade, monitorar fadiga', type: 'normal' },
  22: { label: 'Última semana pesada', type: 'peak' },
  23: { label: 'Manutenção, reduzir uma série', type: 'normal' },
  24: { label: '⚠️ DELOAD -40% volume — preparar Bloco 4', type: 'deload' },
  25: { label: 'Transição força → potência', type: 'normal' },
  26: { label: 'Execução explosiva, cargas moderadas', type: 'normal' },
  27: { label: 'Single leg bounds — pliometria específica', type: 'milestone' },
  28: { label: 'Pico de pliometria avançada', type: 'peak' },
  29: { label: 'Reduzir pliometria 30% — longões chegando a 25km', type: 'normal' },
  30: { label: 'Manter potência, longões 28km', type: 'normal' },
  31: { label: '⚠️ NATAL/RÉVEILLON — descanso ativo, sem cobranças', type: 'holiday' },
  32: { label: '⚠️ DELOAD + transição para Bloco 5', type: 'deload' },
  33: { label: 'Manutenção mínima, foco na corrida', type: 'normal' },
  34: { label: 'Academia 2×/semana, volume reduzido', type: 'normal' },
  35: { label: 'Volume decrescente, prioridade corrida', type: 'normal' },
  36: { label: 'Última semana 2×/semana de academia', type: 'normal' },
  37: { label: 'Taper — academia 1×/semana', type: 'taper' },
  38: { label: 'Taper — longões reduzem', type: 'taper' },
  39: { label: 'Taper — manutenção mínima', type: 'taper' },
  40: { label: 'Taper — última semana de academia', type: 'taper' },
  41: { label: '🏁 Semana pré-Roma — zero academia, mobilidade', type: 'pre-marathon' },
  42: { label: '🏁 SEMANA DE ROMA — 14/03/2027', type: 'marathon-week' },
};

// ─── EXERCISES — BLOCK 1 ─────────────────────────────────────────────────────

const EXERCISES_B1_INFERIOR_A = {
  activation: [
    {
      name: 'Ponte de glúteo no solo',
      sets: 2, reps: 15, restSeconds: 30,
      tip: 'Apertar o glúteo no topo por 2s',
      muscle: 'gluteo',
    },
    {
      name: 'Caminhada com mini-band acima do joelho',
      sets: 2, reps: '12 cada', restSeconds: 30,
      tip: 'Passos laterais sem desabar o joelho',
      muscle: 'gluteo_med',
    },
  ],
  strength: [
    {
      name: 'Agachamento no Smith',
      sets: 4, reps: 12, restSeconds: 60,
      tip: 'Pés na largura do quadril, descida controlada de 3s',
      muscle: 'quadriceps',
    },
    {
      name: 'Leg press 45° pés altos e afastados',
      sets: 3, reps: 12, restSeconds: 60,
      tip: 'Posição alta dos pés ativa mais glúteo e isquio',
      muscle: 'gluteo',
    },
    {
      name: 'Afundo estático com halteres (split squat)',
      sets: 3, reps: '10 cada', restSeconds: 45,
      tip: 'Joelho da frente alinhado com o pé',
      muscle: 'quadriceps',
    },
    {
      name: 'Cadeira flexora unilateral',
      sets: 3, reps: '12 cada', restSeconds: 45,
      tip: 'Controle a fase excêntrica',
      muscle: 'isquiotibial',
    },
    {
      name: 'Hip thrust no banco',
      sets: 3, reps: 15, restSeconds: 45,
      tip: 'Apertar no topo por 1s — essencial para corredor',
      muscle: 'gluteo',
    },
    {
      name: 'Panturrilha em pé (Smith ou máquina)',
      sets: 4, reps: 15, restSeconds: 30,
      tip: 'Amplitude total de movimento, fase excêntrica lenta',
      muscle: 'panturrilha',
    },
  ],
  core: [
    {
      name: 'Prancha frontal',
      sets: 3, reps: '45s', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Dead bug',
      sets: 3, reps: '8 cada', restSeconds: 30,
      tip: 'Lombar colada no chão, movimento lento',
      muscle: 'core',
    },
    {
      name: 'Pallof press na polia',
      sets: 3, reps: '10 cada', restSeconds: 30,
      tip: 'Anti-rotação — estabiliza quadril no apoio unilateral',
      muscle: 'core',
    },
  ],
  plyometrics: [
    {
      name: 'Squat jumps',
      sets: 3, reps: 6, restSeconds: 60,
      tip: 'Aterrissagem suave, absorver o impacto',
      muscle: 'quadriceps',
      weeksActive: [5, 6, 7, 8],
      position: 'before_strength',
    },
  ],
};

const EXERCISES_B1_INFERIOR_B = {
  activation: [
    {
      name: 'Clamshell com mini-band',
      sets: 2, reps: '15 cada', restSeconds: 30,
      tip: 'Deitado de lado, abrir e fechar o joelho',
      muscle: 'gluteo_med',
    },
    {
      name: 'Bird dog',
      sets: 2, reps: '10 cada', restSeconds: 30,
      tip: 'Quadril estável durante todo o movimento',
      muscle: 'core',
    },
  ],
  strength: [
    {
      name: 'Stiff com halteres (RDL)',
      sets: 4, reps: 12, restSeconds: 60,
      tip: 'Descer com leve flexão de joelho, sentir alongamento no isquio',
      muscle: 'isquiotibial',
    },
    {
      name: 'Leg press 45° pés baixos',
      sets: 3, reps: 12, restSeconds: 60,
      tip: 'Foco no quadríceps',
      muscle: 'quadriceps',
    },
    {
      name: 'Cadeira extensora unilateral',
      sets: 3, reps: '12 cada', restSeconds: 45,
      tip: 'Descida lenta excêntrica de 3s — protege o joelho',
      muscle: 'quadriceps',
    },
    {
      name: 'Step-up no banco com halteres',
      sets: 3, reps: '10 cada', restSeconds: 45,
      tip: 'Banco na altura do joelho',
      muscle: 'gluteo',
    },
    {
      name: 'Abdução de quadril máquina',
      sets: 3, reps: 15, restSeconds: 30,
      tip: 'Movimento controlado, sem usar momentum',
      muscle: 'gluteo_med',
    },
    {
      name: 'Panturrilha sentado',
      sets: 3, reps: 20, restSeconds: 30,
      tip: 'Foca no sóleo',
      muscle: 'panturrilha',
    },
  ],
  core: [
    {
      name: 'Prancha lateral com elevação de perna',
      sets: 3, reps: '30s cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Mountain climbers lentos',
      sets: 3, reps: 20, restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Hollow body hold',
      sets: 3, reps: '30s', restSeconds: 30,
      tip: 'Lombar colada no chão, posição de barco',
      muscle: 'core',
    },
  ],
  plyometrics: [
    {
      name: 'Saltos laterais sobre linha',
      sets: 3, reps: 6, restSeconds: 60,
      tip: 'Aterrissagem controlada, um lado de cada vez',
      muscle: 'quadriceps',
      weeksActive: [5, 6, 7, 8],
      position: 'before_strength',
    },
  ],
};

const EXERCISES_B1_SUPERIOR_A = {
  strength: [
    {
      name: 'Supino com halteres no banco reto',
      sets: 4, reps: 12, restSeconds: 60,
      tip: null,
      muscle: 'peitoral',
    },
    {
      name: 'Desenvolvimento na máquina',
      sets: 4, reps: 10, restSeconds: 60,
      tip: null,
      muscle: 'deltoides',
    },
    {
      name: 'Crossover na polia',
      sets: 3, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'peitoral',
    },
    {
      name: 'Elevação lateral com halteres',
      sets: 3, reps: 15, restSeconds: 45,
      tip: null,
      muscle: 'deltoides',
    },
    {
      name: 'Tríceps na polia com corda',
      sets: 3, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'triceps',
    },
    {
      name: 'Tríceps testa com halteres',
      sets: 3, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'triceps',
    },
  ],
};

const EXERCISES_B1_SUPERIOR_B = {
  strength: [
    {
      name: 'Puxada aberta na polia alta',
      sets: 4, reps: 12, restSeconds: 60,
      tip: null,
      muscle: 'costas',
    },
    {
      name: 'Remada baixa na polia (pegada neutra)',
      sets: 4, reps: 12, restSeconds: 60,
      tip: null,
      muscle: 'costas',
    },
    {
      name: 'Remada cavalinho',
      sets: 3, reps: 10, restSeconds: 60,
      tip: null,
      muscle: 'costas',
    },
    {
      name: 'Face pull',
      sets: 4, reps: 15, restSeconds: 45,
      tip: 'Essencial para postura — corredor fica muito tempo em flexão',
      muscle: 'deltoides',
    },
    {
      name: 'Rosca alternada com halteres',
      sets: 3, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'biceps',
    },
    {
      name: 'Rosca martelo',
      sets: 3, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'biceps',
    },
  ],
};

// ─── EXERCISES — BLOCK 2 ─────────────────────────────────────────────────────

const EXERCISES_B2_INFERIOR_A = {
  plyometrics: [
    {
      name: 'Box jump 30–40cm',
      sets: 4, reps: 6, restSeconds: 90,
      tip: 'Aterrissagem suave em meio agachamento',
      muscle: 'quadriceps',
      position: 'before_strength',
    },
  ],
  strength: [
    {
      name: 'Agachamento Smith',
      sets: 4, reps: 10, restSeconds: 75,
      tip: '+10% de carga em relação ao Bloco 1',
      muscle: 'quadriceps',
    },
    {
      name: 'Leg press 45° pés altos',
      sets: 4, reps: 10, restSeconds: 60,
      tip: null,
      muscle: 'gluteo',
    },
    {
      name: 'Afundo caminhando com halteres',
      sets: 3, reps: '10 cada', restSeconds: 60,
      tip: 'Passada longa, controle do tronco',
      muscle: 'quadriceps',
    },
    {
      name: 'Cadeira flexora unilateral',
      sets: 4, reps: '10 cada', restSeconds: 45,
      tip: null,
      muscle: 'isquiotibial',
    },
    {
      name: 'Hip thrust com carga',
      sets: 4, reps: 12, restSeconds: 60,
      tip: 'Progredir carga em relação ao Bloco 1',
      muscle: 'gluteo',
    },
    {
      name: 'Panturrilha em pé',
      sets: 4, reps: 15, restSeconds: 30,
      tip: null,
      muscle: 'panturrilha',
    },
  ],
  core: [
    {
      name: 'Prancha com elevação de perna',
      sets: 3, reps: '10 cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Pallof press',
      sets: 3, reps: '12 cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Dead bug com carga',
      sets: 3, reps: '8 cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
  ],
};

const EXERCISES_B2_INFERIOR_B = {
  plyometrics: [
    {
      name: 'Skipping alto',
      sets: 4, reps: '20s', restSeconds: 60,
      tip: 'Joelhos acima do quadril, cadência alta',
      muscle: 'quadriceps',
      position: 'before_strength',
    },
    {
      name: 'Salto lateral sobre cone',
      sets: 3, reps: '8 cada', restSeconds: 60,
      tip: 'Aterrissagem controlada no unilateral',
      muscle: 'quadriceps',
      position: 'before_strength',
    },
  ],
  strength: [
    {
      name: 'Stiff com halteres',
      sets: 4, reps: 10, restSeconds: 75,
      tip: null,
      muscle: 'isquiotibial',
    },
    {
      name: 'Cadeira flexora bilateral',
      sets: 4, reps: 12, restSeconds: 60,
      tip: null,
      muscle: 'isquiotibial',
    },
    {
      name: 'Step-up alto com halteres',
      sets: 4, reps: '8 cada', restSeconds: 60,
      tip: 'Banco mais alto que o Bloco 1',
      muscle: 'gluteo',
    },
    {
      name: 'Cadeira extensora unilateral',
      sets: 3, reps: '12 cada', restSeconds: 45,
      tip: 'Descida lenta excêntrica de 3s',
      muscle: 'quadriceps',
    },
    {
      name: 'Abdução de quadril sentado',
      sets: 4, reps: 15, restSeconds: 30,
      tip: null,
      muscle: 'gluteo_med',
    },
    {
      name: 'Panturrilha combinada',
      sets: 3, reps: '15 cada', restSeconds: 30,
      tip: 'Alterna em pé e sentado na mesma série',
      muscle: 'panturrilha',
    },
  ],
  core: [
    {
      name: 'Prancha lateral com remada',
      sets: 3, reps: '8 cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Russian twist com halter',
      sets: 3, reps: '15 cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Hollow body',
      sets: 3, reps: '40s', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
  ],
};

const EXERCISES_B2_SUPERIOR_A = {
  strength: [
    { name: 'Supino com halteres no banco reto',   sets: 4, reps: 10, restSeconds: 75, tip: '+10–15% de carga em relação ao Bloco 1', muscle: 'peitoral' },
    { name: 'Desenvolvimento na máquina',           sets: 4, reps: 10, restSeconds: 75, tip: null, muscle: 'deltoides' },
    { name: 'Crossover na polia',                   sets: 4, reps: 10, restSeconds: 75, tip: null, muscle: 'peitoral' },
    { name: 'Elevação lateral com halteres',        sets: 4, reps: 12, restSeconds: 60, tip: null, muscle: 'deltoides' },
    { name: 'Tríceps na polia com corda',           sets: 4, reps: 10, restSeconds: 60, tip: null, muscle: 'triceps' },
    { name: 'Tríceps testa com halteres',           sets: 4, reps: 10, restSeconds: 60, tip: null, muscle: 'triceps' },
  ],
};

const EXERCISES_B2_SUPERIOR_B = {
  strength: [
    { name: 'Puxada aberta na polia alta',          sets: 4, reps: 10, restSeconds: 75, tip: null, muscle: 'costas' },
    { name: 'Remada baixa na polia (pegada neutra)', sets: 4, reps: 10, restSeconds: 75, tip: null, muscle: 'costas' },
    { name: 'Remada cavalinho',                     sets: 4, reps: 10, restSeconds: 75, tip: null, muscle: 'costas' },
    { name: 'Face pull',                            sets: 4, reps: 12, restSeconds: 60, tip: 'Essencial para postura', muscle: 'deltoides' },
    { name: 'Rosca alternada com halteres',         sets: 4, reps: 10, restSeconds: 60, tip: null, muscle: 'biceps' },
    { name: 'Rosca martelo',                        sets: 4, reps: 10, restSeconds: 60, tip: null, muscle: 'biceps' },
  ],
};

// ─── EXERCISES — BLOCK 3 ─────────────────────────────────────────────────────

const EXERCISES_B3_INFERIOR_A = {
  plyometrics: [
    {
      name: 'Depth jump',
      sets: 4, reps: 5, restSeconds: 90,
      tip: 'Pisar e saltar imediatamente, sem agachar fundo',
      muscle: 'quadriceps',
      position: 'before_strength',
    },
    {
      name: 'Box jump alto 50cm',
      sets: 3, reps: 5, restSeconds: 90,
      tip: 'Aterrissagem suave, descer do box — não saltar para baixo',
      muscle: 'quadriceps',
      position: 'before_strength',
    },
  ],
  strength: [
    {
      name: 'Agachamento Smith pesado',
      sets: 5, reps: 6, restSeconds: 120,
      tip: '80–85% de carga, técnica perfeita',
      muscle: 'quadriceps',
    },
    {
      name: 'Leg press 45° pés altos',
      sets: 4, reps: 8, restSeconds: 90,
      tip: null,
      muscle: 'gluteo',
    },
    {
      name: 'Afundo búlgaro (pé traseiro no banco)',
      sets: 3, reps: '8 cada', restSeconds: 60,
      tip: 'Pé traseiro no banco — maior amplitude',
      muscle: 'quadriceps',
    },
    {
      name: 'Hip thrust pesado',
      sets: 4, reps: 8, restSeconds: 90,
      tip: 'Máxima carga com técnica perfeita',
      muscle: 'gluteo',
    },
    {
      name: 'Panturrilha com carga pesada',
      sets: 4, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'panturrilha',
    },
  ],
  core: [
    {
      name: 'Pallof press com carga maior',
      sets: 3, reps: '10 cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Prancha frontal com peso',
      sets: 3, reps: '45s', restSeconds: 30,
      tip: 'Anilha nas costas ou colete',
      muscle: 'core',
    },
  ],
};

const EXERCISES_B3_INFERIOR_B = {
  plyometrics: [
    {
      name: 'Bounds',
      sets: 4, reps: '10m', restSeconds: 90,
      tip: 'Simula a passada da corrida — extensão total do quadril',
      muscle: 'gluteo',
      position: 'before_strength',
    },
    {
      name: 'Single leg hop',
      sets: 3, reps: '5 cada', restSeconds: 60,
      tip: 'Controle do aterrissamento, tornozelo rígido',
      muscle: 'panturrilha',
      position: 'before_strength',
    },
  ],
  strength: [
    {
      name: 'Stiff pesado (RDL)',
      sets: 5, reps: 6, restSeconds: 120,
      tip: '80–85% de carga',
      muscle: 'isquiotibial',
    },
    {
      name: 'Cadeira flexora bilateral',
      sets: 4, reps: 8, restSeconds: 75,
      tip: null,
      muscle: 'isquiotibial',
    },
    {
      name: 'Step-up alto com carga',
      sets: 4, reps: '6 cada', restSeconds: 75,
      tip: null,
      muscle: 'gluteo',
    },
    {
      name: 'Cadeira extensora unilateral',
      sets: 3, reps: '10 cada', restSeconds: 60,
      tip: 'Descida lenta excêntrica de 3s',
      muscle: 'quadriceps',
    },
    {
      name: 'Adução de quadril máquina',
      sets: 3, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'adutores',
    },
    {
      name: 'Panturrilha sentado pesado',
      sets: 4, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'panturrilha',
    },
  ],
  core: [
    {
      name: 'Prancha lateral com carga',
      sets: 3, reps: '30s cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
    {
      name: 'Hollow body com halter',
      sets: 3, reps: '30s', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
  ],
};

const EXERCISES_B3_SUPERIOR_A = {
  strength: [
    { name: 'Supino com halteres no banco reto',   sets: 4, reps: 8, restSeconds: 90, tip: 'Cargas pesadas', muscle: 'peitoral' },
    { name: 'Desenvolvimento na máquina',           sets: 4, reps: 8, restSeconds: 90, tip: null, muscle: 'deltoides' },
    { name: 'Crossover na polia',                   sets: 4, reps: 8, restSeconds: 90, tip: null, muscle: 'peitoral' },
    { name: 'Elevação lateral com halteres',        sets: 4, reps: 10, restSeconds: 75, tip: null, muscle: 'deltoides' },
    { name: 'Tríceps na polia com corda',           sets: 4, reps: 8, restSeconds: 75, tip: null, muscle: 'triceps' },
    { name: 'Tríceps testa com halteres',           sets: 4, reps: 8, restSeconds: 75, tip: null, muscle: 'triceps' },
  ],
};

const EXERCISES_B3_SUPERIOR_B = {
  strength: [
    { name: 'Puxada aberta na polia alta',          sets: 4, reps: 8, restSeconds: 90, tip: null, muscle: 'costas' },
    { name: 'Remada baixa na polia (pegada neutra)', sets: 4, reps: 8, restSeconds: 90, tip: null, muscle: 'costas' },
    { name: 'Remada cavalinho',                     sets: 4, reps: 8, restSeconds: 90, tip: null, muscle: 'costas' },
    { name: 'Face pull',                            sets: 4, reps: 12, restSeconds: 75, tip: 'Essencial para postura', muscle: 'deltoides' },
    { name: 'Rosca alternada com halteres',         sets: 4, reps: 8, restSeconds: 75, tip: null, muscle: 'biceps' },
    { name: 'Rosca martelo',                        sets: 4, reps: 8, restSeconds: 75, tip: null, muscle: 'biceps' },
  ],
};

// ─── EXERCISES — BLOCK 4 ─────────────────────────────────────────────────────

const EXERCISES_B4_INFERIOR_A = {
  plyometrics: [
    {
      name: 'Single leg bound',
      sets: 4, reps: '6 cada', restSeconds: 90,
      tip: 'Movimento mais específico para corrida — extensão total',
      muscle: 'gluteo',
      position: 'before_strength',
    },
    {
      name: 'Depth jump unilateral',
      sets: 3, reps: '5 cada', restSeconds: 90,
      tip: 'Pisar com um pé, saltar imediatamente',
      muscle: 'panturrilha',
      position: 'before_strength',
    },
    {
      name: 'Skipping cadência máxima',
      sets: 4, reps: '15s', restSeconds: 60,
      tip: 'Máxima frequência de passada',
      muscle: 'quadriceps',
      position: 'before_strength',
    },
  ],
  strength: [
    {
      name: 'Agachamento Smith explosivo',
      sets: 4, reps: 6, restSeconds: 90,
      tip: 'Subida na velocidade máxima, descida controlada',
      muscle: 'quadriceps',
    },
    {
      name: 'Afundo búlgaro',
      sets: 3, reps: '6 cada', restSeconds: 60,
      tip: null,
      muscle: 'quadriceps',
    },
    {
      name: 'Hip thrust explosivo',
      sets: 4, reps: 8, restSeconds: 60,
      tip: 'Subida explosiva, pausa no topo',
      muscle: 'gluteo',
    },
    {
      name: 'Step-up com salto no topo',
      sets: 3, reps: '6 cada', restSeconds: 60,
      tip: 'Saltar ao chegar ao topo do banco',
      muscle: 'gluteo',
    },
    {
      name: 'Panturrilha rápido',
      sets: 3, reps: 12, restSeconds: 30,
      tip: 'Cadência alta, amplitude controlada',
      muscle: 'panturrilha',
    },
  ],
  core: [
    {
      name: 'Pallof press rotacional',
      sets: 3, reps: '10 cada', restSeconds: 30,
      tip: 'Adicionar rotação ao movimento',
      muscle: 'core',
    },
    {
      name: 'Bird dog dinâmico',
      sets: 3, reps: '10 cada', restSeconds: 30,
      tip: 'Movimento mais rápido que o bird dog estático',
      muscle: 'core',
    },
  ],
};

const EXERCISES_B4_INFERIOR_B = {
  plyometrics: [
    {
      name: 'Bounds longos',
      sets: 5, reps: '15m', restSeconds: 90,
      tip: 'Maior distância por salto, amplitude de passada',
      muscle: 'gluteo',
      position: 'before_strength',
    },
    {
      name: 'Salto lateral unilateral',
      sets: 3, reps: '6 cada', restSeconds: 60,
      tip: null,
      muscle: 'quadriceps',
      position: 'before_strength',
    },
    {
      name: 'Pogo jumps',
      sets: 4, reps: 10, restSeconds: 60,
      tip: 'Saltinhos rápidos — reatividade da panturrilha',
      muscle: 'panturrilha',
      position: 'before_strength',
    },
  ],
  strength: [
    {
      name: 'Stiff explosivo',
      sets: 4, reps: 8, restSeconds: 75,
      tip: 'Subida rápida do quadril',
      muscle: 'isquiotibial',
    },
    {
      name: 'Cadeira flexora unilateral',
      sets: 3, reps: '10 cada', restSeconds: 60,
      tip: null,
      muscle: 'isquiotibial',
    },
    {
      name: 'Step-up alto rápido',
      sets: 3, reps: '6 cada', restSeconds: 60,
      tip: 'Execução rápida',
      muscle: 'gluteo',
    },
    {
      name: 'Cadeira extensora unilateral',
      sets: 3, reps: '10 cada', restSeconds: 45,
      tip: 'Descida lenta excêntrica',
      muscle: 'quadriceps',
    },
    {
      name: 'Adução de quadril',
      sets: 3, reps: 12, restSeconds: 45,
      tip: null,
      muscle: 'adutores',
    },
    {
      name: 'Panturrilha em pé',
      sets: 3, reps: 15, restSeconds: 30,
      tip: null,
      muscle: 'panturrilha',
    },
  ],
  core: [
    {
      name: 'Prancha lateral dinâmica',
      sets: 3, reps: '20s cada', restSeconds: 30,
      tip: 'Subir e descer o quadril durante a prancha',
      muscle: 'core',
    },
    {
      name: 'Russian twist',
      sets: 3, reps: '15 cada', restSeconds: 30,
      tip: null,
      muscle: 'core',
    },
  ],
};

const EXERCISES_B4_SUPERIOR_A = {
  strength: [
    { name: 'Supino com halteres no banco reto',   sets: 3, reps: 10, restSeconds: 60, tip: 'Modo manutenção', muscle: 'peitoral' },
    { name: 'Desenvolvimento na máquina',           sets: 3, reps: 10, restSeconds: 60, tip: null, muscle: 'deltoides' },
    { name: 'Crossover na polia',                   sets: 3, reps: 10, restSeconds: 60, tip: null, muscle: 'peitoral' },
    { name: 'Elevação lateral com halteres',        sets: 3, reps: 12, restSeconds: 45, tip: null, muscle: 'deltoides' },
    { name: 'Tríceps na polia com corda',           sets: 3, reps: 10, restSeconds: 45, tip: null, muscle: 'triceps' },
  ],
};

const EXERCISES_B4_SUPERIOR_B = {
  strength: [
    { name: 'Puxada aberta na polia alta',          sets: 3, reps: 10, restSeconds: 60, tip: 'Modo manutenção', muscle: 'costas' },
    { name: 'Remada baixa na polia (pegada neutra)', sets: 3, reps: 10, restSeconds: 60, tip: null, muscle: 'costas' },
    { name: 'Face pull',                            sets: 3, reps: 12, restSeconds: 45, tip: 'Essencial para postura', muscle: 'deltoides' },
    { name: 'Rosca alternada com halteres',         sets: 3, reps: 10, restSeconds: 45, tip: null, muscle: 'biceps' },
    { name: 'Rosca martelo',                        sets: 3, reps: 10, restSeconds: 45, tip: null, muscle: 'biceps' },
  ],
};

// ─── EXERCISES — BLOCK 5 ─────────────────────────────────────────────────────

// Weeks 33–36: Maintenance 2×/week (full workout)
const EXERCISES_B5_MAINTENANCE = {
  strength: [
    { name: 'Hip thrust leve',                sets: 3, reps: 12, restSeconds: 45, tip: null, muscle: 'gluteo' },
    { name: 'Cadeira flexora unilateral',      sets: 3, reps: '12 cada', restSeconds: 45, tip: null, muscle: 'isquiotibial' },
    { name: 'Step-up sem carga',               sets: 3, reps: '10 cada', restSeconds: 45, tip: null, muscle: 'gluteo' },
    { name: 'Abdução de quadril',              sets: 3, reps: 15, restSeconds: 30, tip: null, muscle: 'gluteo_med' },
    { name: 'Panturrilha em pé',               sets: 3, reps: 15, restSeconds: 30, tip: null, muscle: 'panturrilha' },
    { name: 'Prancha frontal',                 sets: 3, reps: '30s', restSeconds: 30, tip: null, muscle: 'core' },
    { name: 'Pallof press',                    sets: 3, reps: '10 cada', restSeconds: 30, tip: null, muscle: 'core' },
  ],
  plyometrics: [
    { name: 'Squat jumps', sets: 2, reps: 5, restSeconds: 60, tip: 'Leve — manutenção da potência', muscle: 'quadriceps', position: 'before_strength' },
  ],
  superiorNote: '1×/semana — 3×12 leve. Pular se a fadiga acumular.',
};

// Weeks 37–40: Taper 1×/week
const EXERCISES_B5_TAPER = {
  exercises: [
    { name: 'Ponte de glúteo no solo',         sets: 2, reps: 15, restSeconds: 30, tip: null, muscle: 'gluteo' },
    { name: 'Clamshell com mini-band',         sets: 2, reps: '15 cada', restSeconds: 30, tip: null, muscle: 'gluteo_med' },
    { name: 'Prancha frontal',                 sets: 2, reps: '30s', restSeconds: 30, tip: null, muscle: 'core' },
    { name: 'Pallof press',                    sets: 2, reps: '10 cada', restSeconds: 30, tip: null, muscle: 'core' },
    { name: 'Mobilidade de quadril e tornozelo', sets: 1, reps: '15 min', restSeconds: 0, tip: null, muscle: 'mobilidade' },
  ],
};

// Weeks 41–42: Zero gym
const EXERCISES_B5_ZERO = {
  exercises: [
    { name: 'Rotina de mobilidade pré-corrida', sets: 1, reps: '10–15 min', restSeconds: 0, tip: 'Foco nos tornozelos, quadris e isquiotibiais', muscle: 'mobilidade' },
  ],
};

// ─── BLOCK → WORKOUT MAP ─────────────────────────────────────────────────────

function getWorkoutForWeek(weekNumber, workoutType) {
  const block = BLOCKS.find(b => weekNumber >= b.weekStart && weekNumber <= b.weekEnd);
  if (!block) return null;

  // Special cases
  if (weekNumber === 15) {
    return { type: 'race', message: '🏁 Terra da Luz 21k — zero academia esta semana', exercises: [] };
  }
  if (weekNumber === 16) {
    return { type: 'recovery', message: 'Semana de recuperação pós-prova — cargas muito leves', exercises: getRecoveryWorkout(workoutType) };
  }
  if (weekNumber >= 41) {
    return { block: 5, phase: 'zero', exercises: EXERCISES_B5_ZERO.exercises, restSeconds: 0 };
  }
  if (weekNumber >= 37) {
    return { block: 5, phase: 'taper', exercises: EXERCISES_B5_TAPER.exercises };
  }
  if (weekNumber >= 33) {
    return getB5MaintenanceWorkout(workoutType);
  }

  switch (block.id) {
    case 1: return getB1Workout(weekNumber, workoutType);
    case 2: return getB2Workout(weekNumber, workoutType);
    case 3: return getB3Workout(weekNumber, workoutType);
    case 4: return getB4Workout(weekNumber, workoutType);
    default: return null;
  }
}

function getRecoveryWorkout(workoutType) {
  // Generic light recovery for week 16
  if (workoutType === 'superior_a' || workoutType === 'superior_b') {
    return [{ name: 'Treino leve de recuperação — 50% das cargas habituais', sets: 3, reps: 12, restSeconds: 60, tip: 'Foco no movimento, não na carga', muscle: 'geral' }];
  }
  return [
    { name: 'Ponte de glúteo no solo', sets: 2, reps: 15, restSeconds: 30, tip: null, muscle: 'gluteo' },
    { name: 'Cadeira flexora unilateral', sets: 2, reps: '10 cada', restSeconds: 30, tip: null, muscle: 'isquiotibial' },
    { name: 'Panturrilha em pé', sets: 2, reps: 15, restSeconds: 30, tip: null, muscle: 'panturrilha' },
  ];
}

function getB1Workout(weekNumber, workoutType) {
  const isDeload = weekNumber === 8;
  const hasPlyometrics = weekNumber >= 5 && weekNumber <= 8;

  const maps = {
    inferior_a: EXERCISES_B1_INFERIOR_A,
    inferior_b: EXERCISES_B1_INFERIOR_B,
    superior_a: EXERCISES_B1_SUPERIOR_A,
    superior_b: EXERCISES_B1_SUPERIOR_B,
  };
  const data = maps[workoutType];
  if (!data) return null;

  const result = { block: 1, weekNumber, workoutType, isDeload, hasPlyometrics };

  if (workoutType === 'inferior_a' || workoutType === 'inferior_b') {
    const plyo = hasPlyometrics ? (data.plyometrics || []) : [];
    result.plyometrics = plyo;
    result.activation = data.activation || [];
    result.strength = isDeload
      ? (data.strength || []).map(e => ({ ...e, sets: Math.max(1, Math.floor(e.sets * 0.8)) }))
      : (data.strength || []);
    result.core = data.core || [];
  } else {
    result.strength = isDeload
      ? (data.strength || []).map(e => ({ ...e, sets: Math.max(1, Math.floor(e.sets * 0.8)) }))
      : (data.strength || []);
  }
  return result;
}

function getB2Workout(weekNumber, workoutType) {
  const isDeload = weekNumber === 14;
  const maps = {
    inferior_a: EXERCISES_B2_INFERIOR_A,
    inferior_b: EXERCISES_B2_INFERIOR_B,
    superior_a: EXERCISES_B2_SUPERIOR_A,
    superior_b: EXERCISES_B2_SUPERIOR_B,
  };
  const data = maps[workoutType];
  if (!data) return null;

  const result = { block: 2, weekNumber, workoutType, isDeload };

  if (workoutType === 'inferior_a' || workoutType === 'inferior_b') {
    result.plyometrics = data.plyometrics || [];
    result.activation = data.activation || [];
    result.strength = isDeload
      ? (data.strength || []).map(e => ({ ...e, sets: Math.max(1, Math.floor(e.sets * 0.7)) }))
      : (data.strength || []);
    result.core = data.core || [];
  } else {
    result.strength = isDeload
      ? (data.strength || []).map(e => ({ ...e, sets: Math.max(1, Math.floor(e.sets * 0.7)) }))
      : (data.strength || []);
  }
  return result;
}

function getB3Workout(weekNumber, workoutType) {
  const isDeload = weekNumber === 24;
  const isRecoveryPhase = weekNumber === 16;
  const isLightPhase = weekNumber === 15; // race week

  const maps = {
    inferior_a: EXERCISES_B3_INFERIOR_A,
    inferior_b: EXERCISES_B3_INFERIOR_B,
    superior_a: EXERCISES_B3_SUPERIOR_A,
    superior_b: EXERCISES_B3_SUPERIOR_B,
  };
  const data = maps[workoutType];
  if (!data) return null;

  const multiplier = isDeload ? 0.6 : 1;

  const result = { block: 3, weekNumber, workoutType, isDeload };

  if (workoutType === 'inferior_a' || workoutType === 'inferior_b') {
    result.plyometrics = data.plyometrics || [];
    result.strength = (data.strength || []).map(e => ({
      ...e, sets: Math.max(1, Math.floor(e.sets * multiplier)),
    }));
    result.core = data.core || [];
  } else {
    result.strength = (data.strength || []).map(e => ({
      ...e, sets: Math.max(1, Math.floor(e.sets * multiplier)),
    }));
  }
  return result;
}

function getB4Workout(weekNumber, workoutType) {
  const isDeload = weekNumber === 32;
  const isHoliday = weekNumber === 31;
  const maps = {
    inferior_a: EXERCISES_B4_INFERIOR_A,
    inferior_b: EXERCISES_B4_INFERIOR_B,
    superior_a: EXERCISES_B4_SUPERIOR_A,
    superior_b: EXERCISES_B4_SUPERIOR_B,
  };
  const data = maps[workoutType];
  if (!data) return null;

  const multiplier = (isDeload || isHoliday) ? 0.7 : 1;

  const result = { block: 4, weekNumber, workoutType, isDeload, isHoliday };

  if (workoutType === 'inferior_a' || workoutType === 'inferior_b') {
    result.plyometrics = (data.plyometrics || []).map(e => ({
      ...e, sets: Math.max(1, Math.floor(e.sets * multiplier)),
    }));
    result.strength = (data.strength || []).map(e => ({
      ...e, sets: Math.max(1, Math.floor(e.sets * multiplier)),
    }));
    result.core = data.core || [];
  } else {
    result.strength = (data.strength || []).map(e => ({
      ...e, sets: Math.max(1, Math.floor(e.sets * multiplier)),
    }));
  }
  return result;
}

function getB5MaintenanceWorkout(workoutType) {
  if (workoutType === 'superior_a' || workoutType === 'superior_b') {
    return {
      block: 5, phase: 'maintenance',
      note: EXERCISES_B5_MAINTENANCE.superiorNote,
      strength: [
        { name: 'Supino com halteres',           sets: 3, reps: 12, restSeconds: 60, tip: 'Leve', muscle: 'peitoral' },
        { name: 'Puxada aberta na polia alta',    sets: 3, reps: 12, restSeconds: 60, tip: 'Leve', muscle: 'costas' },
        { name: 'Face pull',                      sets: 3, reps: 12, restSeconds: 45, tip: null, muscle: 'deltoides' },
        { name: 'Rosca alternada com halteres',   sets: 3, reps: 12, restSeconds: 45, tip: null, muscle: 'biceps' },
      ],
    };
  }
  return {
    block: 5, phase: 'maintenance',
    plyometrics: EXERCISES_B5_MAINTENANCE.plyometrics,
    strength: EXERCISES_B5_MAINTENANCE.strength,
  };
}

// ─── WEEKLY SCHEDULE ─────────────────────────────────────────────────────────
// Returns the workout type for a given day of week (0=Sun, 1=Mon, ..., 6=Sat)
const DAY_SCHEDULE = {
  0: { type: 'rest',      label: 'Descanso total',             icon: '😴' },
  1: { type: 'run_gym',   label: 'Rodagem L2 + Superior A',    icon: '🏃+💪', gym: 'superior_a', cardio: 'rodagem_l2' },
  2: { type: 'educativos_gym', label: 'Educativos + Fartlek + Inferior A + Core', icon: '🏃+🦵',
       gym: 'inferior_a', cardio: 'fartlek', educativos: true },
  3: { type: 'gym',       label: 'Superior B (Puxar)',          icon: '💪', gym: 'superior_b' },
  4: { type: 'educativos_gym', label: 'Educativos + Fartlek + Inferior B + Core', icon: '🏃+🦵',
       gym: 'inferior_b', cardio: 'fartlek', educativos: true },
  5: { type: 'bike',      label: 'Bike Z2 (45–60 min)',         icon: '🚴', cardio: 'bike_z2' },
  6: { type: 'longrun',   label: 'Longão',                      icon: '🏃', cardio: 'longao' },
};

// ─── DATE UTILITIES ──────────────────────────────────────────────────────────

function getWeekNumber(date) {
  const start = new Date(PLAN_START);
  start.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diffMs = d - start;
  if (diffMs < 0) return 0; // before plan start — never null
  return Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
}

function getWeekStart(weekNumber) {
  const start = new Date(PLAN_START);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  return start;
}

function getBlockForWeek(weekNumber) {
  return BLOCKS.find(b => weekNumber >= b.weekStart && weekNumber <= b.weekEnd) || null;
}

function getCurrentWeek() {
  return getWeekNumber(new Date());
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getDaysUntil(isoDate) {
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (24 * 60 * 60 * 1000));
}

function getWorkoutTypeForDate(date) {
  const d = new Date(date);
  const dow = d.getDay(); // 0=Sun
  return DAY_SCHEDULE[dow] || DAY_SCHEDULE[0];
}

// ─── EXPORTS ─────────────────────────────────────────────────────────────────

window.AppData = {
  ATHLETE,
  RACE,
  PLAN_START,
  HR_ZONES,
  BLOCKS,
  SPECIAL_EVENTS,
  WEEK_NOTES,
  DAY_SCHEDULE,
  getWeekNumber,
  getWeekStart,
  getBlockForWeek,
  getCurrentWeek,
  formatDate,
  getDaysUntil,
  getWorkoutForWeek,
  getWorkoutTypeForDate,
};

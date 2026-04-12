"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  Footprints,
  Heart,
  HeartPulse,
  Info,
  Play,
  RefreshCw,
  RotateCcw,
  Stethoscope,
  Target,
  Trophy,
  Waves,
  Zap,
} from "lucide-react";

// ─── TYPES ───────────────────────────────────────────────────────────────────

type WaveType = "tri" | "bi" | "mono";
type TabKey = "fundamentos" | "protocolo" | "simulador" | "doppler" | "quiz" | "cenario";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "fundamentos", label: "Fundamentos", icon: BookOpen },
  { key: "protocolo", label: "Protocolo", icon: Stethoscope },
  { key: "simulador", label: "Simulador ITB", icon: Calculator },
  { key: "doppler", label: "Ondas Doppler", icon: Waves },
  { key: "quiz", label: "Quiz Clínico", icon: FlaskConical },
  { key: "cenario", label: "Cenário Clínico", icon: Target },
];

const RANGES = [
  { min: 1.31, max: 9, label: "Incompressível / aberrante", color: "#6b21a8", bg: "#f3e8ff", border: "#d8b4fe", note: "Artérias calcificadas. ITB pode ocultar DAOP grave." },
  { min: 1.0, max: 1.30, label: "Normal", color: "#166534", bg: "#dcfce7", border: "#86efac", note: "Perfusão periférica preservada em repouso." },
  { min: 0.91, max: 0.99, label: "Limítrofe", color: "#92400e", bg: "#fef3c7", border: "#fcd34d", note: "Zona de atenção. Investigar com ergometria." },
  { min: 0.70, max: 0.90, label: "DAOP leve", color: "#9a3412", bg: "#ffedd5", border: "#fdba74", note: "Claudicação intermitente possível." },
  { min: 0.40, max: 0.69, label: "DAOP moderada", color: "#7c2d12", bg: "#fee2e2", border: "#fca5a5", note: "Comprometimento hemodinâmico relevante." },
  { min: 0, max: 0.39, label: "DAOP grave", color: "#450a0a", bg: "#fecaca", border: "#f87171", note: "Isquemia crítica. Risco de perda tecidual." },
];

const WAVEFORMS: { type: WaveType; title: string; clinical: string; path: string; color: string; severity: string }[] = [
  {
    type: "tri",
    title: "Trifásica",
    severity: "Normal",
    clinical: "Artéria periférica saudável. Alta resistência vascular. Pico sistólico nítido, refluxo diastólico e segundo componente anterógrado.",
    path: "M0,60 C5,60 8,60 12,60 L20,8 L28,52 L34,38 L40,60 L55,60 L63,22 L71,56 L77,44 L83,60 L100,60",
    color: "#16a34a",
  },
  {
    type: "bi",
    title: "Bifásica",
    severity: "Possível DAOP leve",
    clinical: "Perda do terceiro componente. Pode indicar envelhecimento fisiológico ou DAOP incipiente. Avaliar contexto clínico.",
    path: "M0,60 C5,60 8,60 12,60 L22,6 L30,50 L36,40 L42,60 L55,60 L65,20 L72,52 L78,60 L100,60",
    color: "#d97706",
  },
  {
    type: "mono",
    title: "Monofásica",
    severity: "DAOP significativa",
    clinical: "Ausência de refluxo diastólico. Pico atenuado e arredondado (tardus parvus). Indica estenose proximal grave ou oclusão.",
    path: "M0,60 C5,60 8,60 12,60 C20,60 24,35 36,28 C48,21 58,32 68,42 C78,52 86,58 100,60",
    color: "#dc2626",
  },
];

const QUIZ_QUESTIONS = [
  {
    prompt: "Qual pressão braquial entra no denominador do ITB?",
    options: [
      "Menor pressão braquial medida",
      "Média entre os dois braços",
      "Maior pressão sistólica braquial",
      "Pressão do braço dominante",
    ],
    answer: 2,
    explanation: "A maior pressão sistólica braquial é usada para reduzir viés por estenose subclávia unilateral e representar fielmente a pressão sistêmica de entrada.",
    category: "Técnica",
  },
  {
    prompt: "Paciente diabético, ITB = 1,38, onda Doppler monofásica. O diagnóstico mais correto é:",
    options: [
      "Circulação excelente — alta hospitalar imediata",
      "ITB provavelmente falsamente elevado por calcificação medial",
      "Normal, pois está acima de 1,0",
      "Repetir o exame em pé para confirmar",
    ],
    answer: 1,
    explanation: "Na esclerose de Mönckeberg as artérias tornam-se incompressíveis, gerando ITB falsamente alto. A onda monofásica confirma disfunção oclusiva — contexto clínico prevalece sobre o número.",
    category: "Armadilha",
  },
  {
    prompt: "Qual posição é obrigatória para aferir o ITB com validade diagnóstica?",
    options: [
      "Sentado com pernas pendentes",
      "Decúbito dorsal após 5–10 min de repouso",
      "Em pé após caminhada breve",
      "Qualquer posição confortável",
    ],
    answer: 1,
    explanation: "O decúbito dorsal neutraliza a coluna hidrostática gravitacional nos membros inferiores, garantindo que braços e tornozelos estejam no mesmo plano de energia potencial.",
    category: "Protocolo",
  },
  {
    prompt: "O ângulo ideal entre a sonda Doppler e o eixo do vaso deve ser:",
    options: [
      "0° — sonda perpendicular ao fluxo",
      "90° — sonda paralela ao membro",
      "45°–60° em relação ao eixo longitudinal do fluxo",
      "Qualquer ângulo, o equipamento corrige automaticamente",
    ],
    answer: 2,
    explanation: "A equação de Doppler (Δf = 2·f·v·cos θ / c) exige ângulo entre 45° e 60°. A 90°, cos θ = 0 e o sinal é obliterado; abaixo de 45° há imprecisão crescente.",
    category: "Física",
  },
  {
    prompt: "Quais artérias devem ser insonadas bilateralmente no tornozelo?",
    options: [
      "Apenas artéria poplítea",
      "Tibial anterior e tibial posterior",
      "Tibial posterior e pediosa dorsal",
      "Femoral superficial e poplítea",
    ],
    answer: 2,
    explanation: "A insonação dupla (tibial posterior e pediosa dorsal) é obrigatória. Oclusão isolada de uma artéria pode ser compensada por colaterais — avaliar apenas uma veia o diagnóstico.",
    category: "Protocolo",
  },
];

const SCENARIO_TREE = {
  id: "start",
  patient: "Sr. Carlos, 72 anos",
  context: "Ex-tabagista, diabético tipo 2 há 18 anos, queixa de parestesia noturna e claudicação na panturrilha esquerda após ~100 metros.",
  question: "Como você posiciona o paciente para iniciar o ITB?",
  options: [
    {
      label: "Decúbito dorsal, repouso 10 min",
      correct: true,
      feedback: "✅ Correto! O decúbito dorsal elimina a coluna hidrostática gravitacional nos membros inferiores.",
      next: {
        id: "q2",
        question: "Qual o ângulo correto da sonda Doppler no tornozelo?",
        options: [
          {
            label: "45°–60° em relação ao fluxo",
            correct: true,
            feedback: "✅ Perfeito! O cosseno do ângulo maximiza o sinal Doppler.",
            next: {
              id: "q3",
              question: "ITB esquerdo = 1,42. Onda Doppler: monofásica. Qual diagnóstico?",
              options: [
                {
                  label: "Normal — ITB acima de 1,0",
                  correct: false,
                  feedback: "❌ Erro crítico! ITB > 1,3 em diabético sugere calcificação arterial. A onda monofásica confirma DAOP oculta.",
                  next: null,
                },
                {
                  label: "ITB falsamente elevado — suspeitar DAOP por calcificação",
                  correct: true,
                  feedback: "🏆 Excelente raciocínio clínico! Esclerose de Mönckeberg gera artérias incompressíveis. Onda monofásica = obstrução proximal. Indicar investigação complementar.",
                  next: null,
                },
              ],
            },
          },
          {
            label: "90° perpendicular ao membro",
            correct: false,
            feedback: "❌ A 90°, cos(90°) = 0 — o sinal Doppler é completamente obliterado. Nenhuma medida é possível.",
            next: null,
          },
        ],
      },
    },
    {
      label: "Sentado com pernas para baixo",
      correct: false,
      feedback: "❌ Posição incorreta! Em ortostase, a coluna hidrostática aumenta a pressão nos tornozelos artificialmente, gerando ITB falsamente elevado.",
      next: null,
    },
  ],
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getRangeInfo(val: number) {
  return RANGES.find((r) => val >= r.min && val <= r.max) ?? RANGES[RANGES.length - 1];
}

// ─── ANIMATED WAVEFORM ────────────────────────────────────────────────────────

function AnimatedWaveform({ type, active }: { type: WaveType; active: boolean }) {
  const wf = WAVEFORMS.find((w) => w.type === type)!;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-4" style={{ minHeight: 100 }}>
      <div className="absolute inset-0 flex items-center px-4">
        <div className="h-px w-full bg-slate-700" />
      </div>
      <svg viewBox="0 0 100 80" className="relative z-10 h-20 w-full" preserveAspectRatio="none">
        {active && (
          <motion.path
            d={wf.path}
            fill="none"
            stroke={wf.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
        )}
        {active && (
          <motion.path
            d={wf.path}
            fill="none"
            stroke={wf.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut", delay: 1.4 }}
            transform="translate(0 0)"
            style={{ opacity: 0.4 }}
          />
        )}
      </svg>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: wf.color }} />
        <span className="text-xs font-bold" style={{ color: wf.color }}>{wf.severity}</span>
      </div>
    </div>
  );
}

// ─── ITB GAUGE ───────────────────────────────────────────────────────────────

function ITBGauge({ value }: { value: number }) {
  const clampedVal = Math.max(0, Math.min(2, value));
  const pct = (clampedVal / 2) * 100;
  const info = getRangeInfo(value);

  const stops = [
    { pos: 0, color: "#450a0a" },
    { pos: 20, color: "#dc2626" },
    { pos: 35, color: "#ea580c" },
    { pos: 50, color: "#16a34a" },
    { pos: 75, color: "#16a34a" },
    { pos: 90, color: "#6b21a8" },
    { pos: 100, color: "#6b21a8" },
  ];

  return (
    <div className="space-y-3">
      <div className="relative h-8 overflow-hidden rounded-full" style={{
        background: "linear-gradient(to right, #450a0a, #dc2626 20%, #ea580c 35%, #16a34a 50%, #16a34a 75%, #6b21a8 100%)"
      }}>
        <motion.div
          className="absolute top-1/2 h-6 w-6 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
          style={{ left: `calc(${pct}% - 12px)`, background: info.color }}
          animate={{ left: `calc(${pct}% - 12px)` }}
          transition={{ type: "spring", stiffness: 200 }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>0</span><span>0,4</span><span>0,7</span><span>0,9</span><span>1,0</span><span>1,3</span><span>2,0+</span>
      </div>
      <motion.div
        className="rounded-2xl border-2 p-4 text-center"
        style={{ borderColor: info.border, background: info.bg }}
        key={info.label}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="text-3xl font-black" style={{ color: info.color }}>{value.toFixed(2)}</div>
        <div className="mt-1 text-sm font-bold" style={{ color: info.color }}>{info.label}</div>
        <p className="mt-1 text-xs text-slate-600">{info.note}</p>
      </motion.div>
    </div>
  );
}

// ─── TAB SECTIONS ─────────────────────────────────────────────────────────────

function FundamentosSection() {
  const [open, setOpen] = useState<number | null>(0);

  const topics = [
    {
      title: "Por que o tornozelo tem pressão maior que o braço?",
      icon: "🔬",
      content: "Em homeostase, a pressão sistólica no tornozelo é levemente superior à braquial devido ao fenômeno de amplificação da onda de pulso. À medida que a onda de ejeção ventricular percorre a aorta em direção às artérias musculares periféricas, a reflexão da onda nas bifurcações e nos leitos de alta resistência distal cria superposição, elevando o pico sistólico nos tornozelos (normalmente +10–15 mmHg).",
    },
    {
      title: "O que a estenose faz com a pressão?",
      icon: "🩸",
      content: "Quando uma placa aterosclerótica obstrui o trajeto arterial, a energia cinética e a pressão hidrostática sofrem dissipação por atrito viscoso e turbulência. Pela equação de Bernoulli, essa perda de energia resulta em redução da pressão de perfusão distal. O ITB quantifica essa discrepância ao usar a pressão braquial como denominador normalizador — cancelando variações sistêmicas.",
    },
    {
      title: "O paradoxo diabético (Mönckeberg)",
      icon: "⚠️",
      content: "Em pacientes diabéticos ou com insuficiência renal crônica, a calcificação da túnica média arterial — esclerose de Mönckeberg — torna o vaso rígido como 'tubo de chumbo'. O manguito pneumático não consegue colapsar a artéria petrificada, gerando pressões aparentes de 200+ mmHg e ITB falsamente normal ou elevado (>1,4). O paciente pode ter isquemia grave enquanto o número 'parece ótimo'.",
    },
    {
      title: "ITB como marcador prognóstico sistêmico",
      icon: "📊",
      content: "Pacientes assintomáticos com ITB baixo detectado em rastreamento apresentam risco de morbimortalidade cardiovascular equivalente ou superior a pacientes com angina estável. ITB é marcador de aterosclerose sistêmica — não apenas periférica. Cada 0,1 de redução abaixo de 0,9 está associado a aumento de ~25% no risco de eventos cardiovasculares maiores.",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
        <h2 className="text-2xl font-black text-slate-900">Fundamentos Fisiopatológicos</h2>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Compreenda a física e a biologia por trás do ITB antes de partir para a técnica.
        </p>
      </div>
      <div className="space-y-3">
        {topics.map((t, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between p-5 text-left hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.icon}</span>
                <span className="font-bold text-slate-900">{t.title}</span>
              </div>
              <motion.div animate={{ rotate: open === i ? 180 : 0 }}>
                <ChevronDown className="h-5 w-5 text-slate-400" />
              </motion.div>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100"
                >
                  <p className="p-5 text-sm leading-7 text-slate-700">{t.content}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Key concept cards */}
      <div className="grid gap-4 sm:grid-cols-3 mt-2">
        {[
          { label: "Normal", value: "0,90–1,30", color: "#16a34a", bg: "#dcfce7" },
          { label: "DAOP diagnóstico", value: "< 0,90", color: "#dc2626", bg: "#fee2e2" },
          { label: "Suspeitar calcificação", value: "> 1,30", color: "#6b21a8", bg: "#f3e8ff" },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border-2 p-4 text-center" style={{ borderColor: c.color, background: c.bg }}>
            <div className="text-2xl font-black" style={{ color: c.color }}>{c.value}</div>
            <div className="mt-1 text-xs font-bold text-slate-700">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProtocoloSection() {
  const [activePhase, setActivePhase] = useState(0);

  const phases = [
    {
      num: 1,
      title: "Preparação e estabilização",
      icon: Stethoscope,
      color: "#3b82f6",
      bg: "#eff6ff",
      steps: [
        "Controle térmico do ambiente — frio causa vasospasmo e altera resistência distal",
        "Revisar fatores de risco: tabagismo, DM, HAS, claudicação",
        "Posicionar paciente em decúbito dorsal absoluto",
        "Aguardar 5–10 minutos de repouso para equilibrar pressão hidrostática",
        "Explicar o procedimento — reduz ansiedade e variabilidade",
      ],
      warning: "Temperatura ambiente <18°C pode causar vasoconstrição e ITB falsamente baixo",
    },
    {
      num: 2,
      title: "Aferição braquial bilateral",
      icon: HeartPulse,
      color: "#8b5cf6",
      bg: "#f5f3ff",
      steps: [
        "Selecionar manguito adequado à circunferência braquial",
        "Manguito estreito superestima; manguito largo subestima a pressão",
        "Posicionar sonda Doppler sobre artéria braquial ou radial",
        "Angulação: 45°–60° em relação ao eixo do fluxo",
        "Insuflar até silenciar o sinal, + 20 mmHg extras",
        "Desinsuflar lentamente (2 mmHg/s) — registrar no retorno do primeiro som",
        "Medir AMBOS os braços — usar o MAIOR valor como denominador",
      ],
      warning: "Estenose subclávia unilateral gera pressão espuriamente baixa em um lado — por isso usa-se o maior valor",
    },
    {
      num: 3,
      title: "Insonação no tornozelo",
      icon: Footprints,
      color: "#f59e0b",
      bg: "#fffbeb",
      steps: [
        "Fixar manguito proximalmente aos maléolos",
        "Insonar artéria TIBIAL POSTERIOR (retromaleolar medial)",
        "Insonar artéria PEDIOSA DORSAL (dorso do pé, distal à articulação tibiotalar)",
        "Ambas as artérias em CADA perna — oclusão isolada pode ser compensada por colaterais",
        "Mesma técnica: oclusão, + 20 mmHg, deflação lenta",
        "Selecionar o MAIOR valor do tornozelo como numerador",
      ],
      warning: "Insonação apenas de uma artéria pode mascarar isquemia compensada por circulação colateral",
    },
    {
      num: 4,
      title: "Cálculo e interpretação",
      icon: Calculator,
      color: "#10b981",
      bg: "#ecfdf5",
      steps: [
        "ITB = maior pressão sistólica do tornozelo ÷ maior pressão braquial",
        "Calcular SEPARADAMENTE perna direita e esquerda",
        "Usar SEMPRE o menor ITB bilateral para a estratificação de risco",
        "Integrar com morfologia da onda Doppler — número isolado é insuficiente",
        "Em diabéticos com ITB >1,3: correlacionar com sintomas e onda espectral",
        "Documentar valores, metodologia e onda Doppler no laudo",
      ],
      warning: "ITB numericamente normal com onda monofásica = DAOP até prova em contrário",
    },
  ];

  const p = phases[activePhase];
  const Icon = p.icon;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border p-6" style={{ background: p.bg, borderColor: p.color + "40" }}>
        <h2 className="text-2xl font-black text-slate-900">Protocolo de Aferição do ITB</h2>
        <p className="mt-1 text-sm text-slate-600">Siga cada fase rigorosamente — falhas técnicas invalidam o exame.</p>
      </div>

      {/* Phase selector */}
      <div className="flex gap-2 flex-wrap">
        {phases.map((ph, i) => (
          <button
            key={i}
            onClick={() => setActivePhase(i)}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition"
            style={activePhase === i
              ? { background: ph.color, color: "white" }
              : { background: "#f1f5f9", color: "#475569" }
            }
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-black" style={activePhase === i ? { background: "rgba(255,255,255,0.3)" } : { background: ph.color + "20" }}>
              {ph.num}
            </span>
            {ph.title}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-3xl border-2 bg-white p-6"
          style={{ borderColor: p.color }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: p.color }}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider" style={{ color: p.color }}>Fase {p.num}</div>
              <div className="text-xl font-black text-slate-900">{p.title}</div>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            {p.steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: p.color }}>
                  {i + 1}
                </div>
                <span className="text-sm leading-6 text-slate-700">{s}</span>
              </motion.div>
            ))}
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-800 leading-6">{p.warning}</p>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              disabled={activePhase === 0}
              onClick={() => setActivePhase(activePhase - 1)}
              className="rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-30 border border-slate-200 hover:bg-slate-50 transition"
            >
              ← Anterior
            </button>
            <button
              disabled={activePhase === phases.length - 1}
              onClick={() => setActivePhase(activePhase + 1)}
              className="rounded-xl px-4 py-2 text-sm font-bold text-white transition"
              style={{ background: p.color }}
            >
              Próxima fase →
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SimuladorSection() {
  const [ankleL, setAnkleL] = useState(120);
  const [ankleR, setAnkleR] = useState(130);
  const [brachial, setBrachial] = useState(140);
  const [showCalc, setShowCalc] = useState(false);

  const itbL = ankleL / brachial;
  const itbR = ankleR / brachial;
  const minITB = Math.min(itbL, itbR);
  const infoL = getRangeInfo(itbL);
  const infoR = getRangeInfo(itbR);

  useEffect(() => { setShowCalc(false); }, [ankleL, ankleR, brachial]);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
        <h2 className="text-2xl font-black">Simulador Interativo de ITB</h2>
        <p className="mt-1 text-sm text-slate-300">Ajuste as pressões e veja a interpretação em tempo real.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-4">
          {/* Brachial */}
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <HeartPulse className="h-5 w-5 text-purple-600" />
              <span className="font-black text-purple-900">Pressão Braquial (denominador)</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range" min={80} max={200} value={brachial}
                onChange={(e) => setBrachial(+e.target.value)}
                className="flex-1 accent-purple-600"
              />
              <div className="min-w-[64px] rounded-xl bg-purple-600 px-3 py-1 text-center font-black text-white text-lg">
                {brachial}
              </div>
            </div>
            <p className="mt-2 text-xs text-purple-700">Use o MAIOR valor entre os dois braços • mmHg</p>
          </div>

          {/* Ankle L */}
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Footprints className="h-5 w-5 text-blue-600" />
              <span className="font-black text-blue-900">Tornozelo Esquerdo</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range" min={40} max={220} value={ankleL}
                onChange={(e) => setAnkleL(+e.target.value)}
                className="flex-1 accent-blue-600"
              />
              <div className="min-w-[64px] rounded-xl bg-blue-600 px-3 py-1 text-center font-black text-white text-lg">
                {ankleL}
              </div>
            </div>
            <p className="mt-2 text-xs text-blue-700">Maior valor entre tibial posterior e pediosa dorsal • mmHg</p>
          </div>

          {/* Ankle R */}
          <div className="rounded-2xl border-2 border-cyan-200 bg-cyan-50 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Footprints className="h-5 w-5 text-cyan-600" />
              <span className="font-black text-cyan-900">Tornozelo Direito</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range" min={40} max={220} value={ankleR}
                onChange={(e) => setAnkleR(+e.target.value)}
                className="flex-1 accent-cyan-600"
              />
              <div className="min-w-[64px] rounded-xl bg-cyan-600 px-3 py-1 text-center font-black text-white text-lg">
                {ankleR}
              </div>
            </div>
            <p className="mt-2 text-xs text-cyan-700">Maior valor entre tibial posterior e pediosa dorsal • mmHg</p>
          </div>

          <button
            onClick={() => setShowCalc(true)}
            className="w-full rounded-2xl bg-slate-900 py-4 font-black text-white hover:bg-slate-800 transition flex items-center justify-center gap-2"
          >
            <Calculator className="h-5 w-5" />
            Calcular ITB
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <AnimatePresence>
            {showCalc && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                {/* Formula display */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Fórmula</div>
                  <div className="flex flex-col gap-3">
                    {[
                      { side: "Esquerdo", ankle: ankleL, itb: itbL, info: infoL },
                      { side: "Direito", ankle: ankleR, itb: itbR, info: infoR },
                    ].map((s) => (
                      <div key={s.side} className="rounded-xl border p-3 text-sm" style={{ borderColor: s.info.border, background: s.info.bg }}>
                        <div className="font-bold text-slate-700 mb-1">{s.side}</div>
                        <div className="font-mono text-lg font-black" style={{ color: s.info.color }}>
                          {s.ankle} ÷ {brachial} = {s.itb.toFixed(2)}
                        </div>
                        <div className="text-xs font-bold mt-1" style={{ color: s.info.color }}>{s.info.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gauge */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                    ITB decisivo (menor bilateral = {minITB.toFixed(2)})
                  </div>
                  <ITBGauge value={minITB} />
                </div>

                {/* Clinical alert */}
                {minITB > 1.3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border-2 border-purple-300 bg-purple-50 p-4"
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-black text-purple-900">⚠️ Atenção: ITB aberrante</div>
                        <p className="mt-1 text-sm text-purple-800">Em diabéticos ou renais crônicos, este valor pode indicar artérias incompressíveis por calcificação medial. Avalie a morfologia da onda Doppler e contexto clínico.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!showCalc && (
            <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <div>
                <Calculator className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">Ajuste os valores e clique em Calcular ITB</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DopplerSection() {
  const [selected, setSelected] = useState<WaveType | null>(null);
  const [playing, setPlaying] = useState(false);

  const handleSelect = (t: WaveType) => {
    setSelected(t);
    setPlaying(false);
    setTimeout(() => setPlaying(true), 50);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white">
        <h2 className="text-2xl font-black">Morfologia das Ondas Doppler Arterial</h2>
        <p className="mt-1 text-sm text-indigo-300">A onda espectral revela o que o número sozinho esconde.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {WAVEFORMS.map((w) => (
          <button
            key={w.type}
            onClick={() => handleSelect(w.type)}
            className="group rounded-2xl border-2 p-5 text-left transition hover:shadow-md"
            style={selected === w.type
              ? { borderColor: w.color, background: w.color + "10" }
              : { borderColor: "#e2e8f0", background: "white" }
            }
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-black text-slate-900 text-lg">{w.title}</span>
              <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: w.color }}>
                {w.severity}
              </span>
            </div>
            <svg viewBox="0 0 100 80" className="w-full h-16" preserveAspectRatio="none">
              <line x1="0" y1="60" x2="100" y2="60" stroke="#e2e8f0" strokeWidth="1" />
              <path d={w.path} fill="none" stroke={w.color} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <p className="mt-3 text-xs text-slate-500 leading-5">{w.clinical.substring(0, 80)}…</p>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid gap-4 lg:grid-cols-2"
          >
            {(() => {
              const w = WAVEFORMS.find((x) => x.type === selected)!;
              return (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-3 w-3 rounded-full" style={{ background: w.color }} />
                      <h3 className="text-lg font-black">Onda {w.title}</h3>
                      <span className="ml-auto rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: w.color }}>
                        {w.severity}
                      </span>
                    </div>
                    <AnimatedWaveform type={selected} active={playing} />
                    <button
                      onClick={() => { setPlaying(false); setTimeout(() => setPlaying(true), 50); }}
                      className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                    >
                      <Play className="h-3 w-3" /> Animar novamente
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6">
                    <h3 className="font-black text-slate-900 mb-3">Significado Clínico</h3>
                    <p className="text-sm leading-7 text-slate-700">{w.clinical}</p>

                    {w.type === "tri" && (
                      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3">
                        <p className="text-xs text-green-800 font-bold">✅ Alta resistência reflexiva distal — leito capilar íntegro</p>
                      </div>
                    )}
                    {w.type === "bi" && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs text-amber-800 font-bold">⚠️ Investigar assimetria bilateral — pode ser normal ou patológico</p>
                      </div>
                    )}
                    {w.type === "mono" && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                        <p className="text-xs text-red-800 font-bold">🚨 Se ITB "normal" + onda monofásica → suspeitar DAOP por calcificação</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 px-5 py-3">
          <h3 className="font-black text-white text-sm">Comparativo das Morfologias</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Morfologia", "Refluxo diastólico", "2° componente", "Pico sistólico", "Significado"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: "Trifásica", rev: "✅ Presente", sec: "✅ Presente", peak: "Nítido e rápido", meaning: "Normal / saudável", color: "#16a34a" },
                { name: "Bifásica", rev: "✅ Presente", sec: "❌ Ausente", peak: "Ligeiramente atenuado", meaning: "Transicional / leve alteração", color: "#d97706" },
                { name: "Monofásica", rev: "❌ Ausente", sec: "❌ Ausente", peak: "Achatado (tardus parvus)", meaning: "Estenose/oclusão proximal", color: "#dc2626" },
              ].map((r) => (
                <tr key={r.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-black" style={{ color: r.color }}>{r.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.rev}</td>
                  <td className="px-4 py-3 text-slate-600">{r.sec}</td>
                  <td className="px-4 py-3 text-slate-600">{r.peak}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: r.color }}>
                      {r.meaning}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function QuizSection() {
  const [answers, setAnswers] = useState<number[]>(Array(QUIZ_QUESTIONS.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [current, setCurrent] = useState(0);

  const q = QUIZ_QUESTIONS[current];
  const score = answers.filter((a, i) => a === QUIZ_QUESTIONS[i].answer).length;
  const allAnswered = answers.every((a) => a !== -1);

  const reset = () => {
    setAnswers(Array(QUIZ_QUESTIONS.length).fill(-1));
    setSubmitted(false);
    setCurrent(0);
  };

  const categoryColors: Record<string, string> = {
    Técnica: "#3b82f6",
    Armadilha: "#dc2626",
    Protocolo: "#16a34a",
    Física: "#8b5cf6",
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Quiz Clínico Avançado</h2>
            <p className="mt-1 text-sm text-emerald-300">5 questões de raciocínio vascular integrado</p>
          </div>
          {submitted && (
            <div className="flex items-center gap-2 rounded-2xl bg-white/20 px-4 py-2">
              <Trophy className="h-6 w-6 text-yellow-300" />
              <span className="text-2xl font-black">{score}/{QUIZ_QUESTIONS.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {QUIZ_QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="flex-1 rounded-full h-2 transition"
            style={{
              background: answers[i] !== -1
                ? (submitted
                  ? answers[i] === QUIZ_QUESTIONS[i].answer ? "#16a34a" : "#dc2626"
                  : "#334155")
                : i === current ? "#334155" : "#e2e8f0"
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>Questão {current + 1} de {QUIZ_QUESTIONS.length}</span>
        <span>{answers.filter((a) => a !== -1).length} respondidas</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="rounded-3xl border-2 border-slate-200 bg-white p-6"
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 font-black text-white">
              {current + 1}
            </div>
            <div className="flex-1">
              <span
                className="mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white"
                style={{ background: categoryColors[q.category] ?? "#64748b" }}
              >
                {q.category}
              </span>
              <p className="text-base font-bold leading-7 text-slate-900">{q.prompt}</p>
            </div>
          </div>

          <div className="grid gap-3">
            {q.options.map((opt, oi) => {
              const isSelected = answers[current] === oi;
              const isCorrect = submitted && oi === q.answer;
              const isWrong = submitted && isSelected && oi !== q.answer;

              return (
                <motion.button
                  key={oi}
                  whileHover={!submitted ? { scale: 1.01 } : {}}
                  whileTap={!submitted ? { scale: 0.99 } : {}}
                  onClick={() => !submitted && setAnswers((prev) => prev.map((v, i) => (i === current ? oi : v)))}
                  className="flex items-start gap-3 rounded-2xl border-2 p-4 text-left text-sm transition"
                  style={{
                    borderColor: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isSelected ? "#334155" : "#e2e8f0",
                    background: isCorrect ? "#dcfce7" : isWrong ? "#fee2e2" : isSelected ? "#f8fafc" : "white",
                  }}
                >
                  <div
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black"
                    style={{
                      borderColor: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isSelected ? "#334155" : "#cbd5e1",
                      background: isCorrect ? "#16a34a" : isWrong ? "#dc2626" : isSelected ? "#334155" : "transparent",
                      color: (isCorrect || isWrong || isSelected) ? "white" : "#94a3b8",
                    }}
                  >
                    {String.fromCharCode(65 + oi)}
                  </div>
                  <span className="leading-6" style={{ color: isCorrect ? "#166534" : isWrong ? "#991b1b" : "#374151" }}>
                    {opt}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 rounded-2xl p-4 ${answers[current] === q.answer ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}
            >
              <div className="flex items-center gap-2 font-black mb-1" style={{ color: answers[current] === q.answer ? "#166534" : "#92400e" }}>
                {answers[current] === q.answer ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                {answers[current] === q.answer ? "Resposta correta!" : "Revisar este conceito"}
              </div>
              <p className="text-sm leading-6" style={{ color: answers[current] === q.answer ? "#166534" : "#78350f" }}>
                {q.explanation}
              </p>
            </motion.div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {!submitted ? (
              <>
                <button
                  disabled={current === 0}
                  onClick={() => setCurrent(current - 1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-30 hover:bg-slate-50 transition"
                >
                  ← Anterior
                </button>
                {current < QUIZ_QUESTIONS.length - 1 ? (
                  <button
                    disabled={answers[current] === -1}
                    onClick={() => setCurrent(current + 1)}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-30 hover:bg-slate-800 transition"
                  >
                    Próxima →
                  </button>
                ) : (
                  <button
                    disabled={!allAnswered}
                    onClick={() => setSubmitted(true)}
                    className="rounded-xl px-6 py-2 text-sm font-black text-white disabled:opacity-30 transition"
                    style={{ background: allAnswered ? "#16a34a" : undefined }}
                  >
                    ✓ Corrigir Quiz
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  disabled={current === QUIZ_QUESTIONS.length - 1}
                  onClick={() => setCurrent(current + 1)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-30 hover:bg-slate-800 transition"
                >
                  Ver próxima →
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <RotateCcw className="h-4 w-4" /> Reiniciar
                </button>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border-2 bg-white p-6"
          style={{ borderColor: score >= 4 ? "#16a34a" : score >= 3 ? "#d97706" : "#dc2626" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white"
              style={{ background: score >= 4 ? "#16a34a" : score >= 3 ? "#d97706" : "#dc2626" }}
            >
              {score}/{QUIZ_QUESTIONS.length}
            </div>
            <div>
              <div className="font-black text-xl text-slate-900">
                {score === 5 ? "🏆 Excelente domínio clínico!" : score >= 3 ? "👍 Bom desempenho" : "📚 Continue estudando"}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {score === 5 ? "Você demonstra raciocínio vascular integrado." :
                  score >= 3 ? "Revise os conceitos marcados em laranja." :
                    "Retorne às seções de Fundamentos e Protocolo."}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function CenarioSection() {
  type NodeType = typeof SCENARIO_TREE;
  const [history, setHistory] = useState<{ node: NodeType; choiceIdx: number; correct: boolean }[]>([]);
  const [current, setCurrent] = useState<NodeType>(SCENARIO_TREE);
  const [chosen, setChosen] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);

  const choose = (idx: number) => {
    const opt = (current as any).options[idx];
    setChosen(idx);
    if (opt.correct) setScore((s) => s + 1);
    setTimeout(() => {
      if (opt.next) {
        setHistory((h) => [...h, { node: current, choiceIdx: idx, correct: opt.correct }]);
        setCurrent(opt.next);
        setChosen(null);
      } else {
        setDone(true);
      }
    }, 1800);
  };

  const reset = () => {
    setCurrent(SCENARIO_TREE);
    setHistory([]);
    setChosen(null);
    setDone(false);
    setScore(0);
  };

  const totalSteps = 3;
  const step = history.length + 1;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-gradient-to-br from-rose-900 to-orange-900 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black">Cenário Clínico Ramificado</h2>
            <p className="mt-1 text-sm text-rose-200">Tome decisões e enfrente as consequências em tempo real</p>
          </div>
          <div className="rounded-2xl bg-white/20 px-4 py-2 text-center">
            <div className="text-2xl font-black">{score}</div>
            <div className="text-xs text-rose-200">acertos</div>
          </div>
        </div>
      </div>

      {/* Patient card */}
      <div className="rounded-2xl border-2 border-orange-200 bg-orange-50 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white font-black">
            👴
          </div>
          <div>
            <div className="font-black text-orange-900 text-lg">{SCENARIO_TREE.patient}</div>
            <p className="mt-1 text-sm text-orange-800 leading-6">{SCENARIO_TREE.context}</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      {!done && (
        <div className="flex items-center gap-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <React.Fragment key={i}>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition"
                style={{
                  background: i < history.length
                    ? (history[i].correct ? "#16a34a" : "#dc2626")
                    : i === history.length ? "#334155" : "#e2e8f0",
                  color: i <= history.length ? "white" : "#94a3b8"
                }}
              >
                {i < history.length ? (history[i].correct ? "✓" : "✗") : i + 1}
              </div>
              {i < totalSteps - 1 && <div className="h-px flex-1" style={{ background: i < history.length ? "#334155" : "#e2e8f0" }} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {!done ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="rounded-3xl border-2 border-slate-200 bg-white p-6"
          >
            <div className="flex items-start gap-3 mb-5">
              <Zap className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-base font-bold leading-7 text-slate-900">{(current as any).question}</p>
            </div>

            <div className="space-y-3">
              {(current as any).options.map((opt: any, i: number) => (
                <motion.button
                  key={i}
                  whileHover={chosen === null ? { scale: 1.01, x: 4 } : {}}
                  whileTap={chosen === null ? { scale: 0.99 } : {}}
                  onClick={() => chosen === null && choose(i)}
                  disabled={chosen !== null}
                  className="flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition"
                  style={{
                    borderColor: chosen === i
                      ? opt.correct ? "#16a34a" : "#dc2626"
                      : chosen !== null && opt.correct ? "#16a34a" : "#e2e8f0",
                    background: chosen === i
                      ? opt.correct ? "#dcfce7" : "#fee2e2"
                      : chosen !== null && opt.correct ? "#dcfce7" : "white",
                  }}
                >
                  <div
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black"
                    style={{
                      background: chosen === i ? (opt.correct ? "#16a34a" : "#dc2626") : "#f1f5f9",
                      color: chosen === i ? "white" : "#475569",
                    }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="font-medium text-sm leading-6" style={{ color: chosen === i ? (opt.correct ? "#166534" : "#991b1b") : "#374151" }}>
                    {opt.label}
                  </span>
                </motion.button>
              ))}
            </div>

            <AnimatePresence>
              {chosen !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 rounded-2xl p-4 text-sm leading-6 ${
                    (current as any).options[chosen].correct
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
                      : "bg-red-50 border border-red-200 text-red-900"
                  }`}
                >
                  <div className="font-black mb-1">
                    {(current as any).options[chosen].correct ? "✅ Decisão correta!" : "❌ Decisão incorreta"}
                  </div>
                  {(current as any).options[chosen].feedback}
                  {(current as any).options[chosen].next && (
                    <div className="mt-2 text-xs opacity-70">Avançando para próxima decisão…</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl border-2 bg-white p-8 text-center"
          style={{ borderColor: score >= 2 ? "#16a34a" : "#dc2626" }}
        >
          <div className="text-5xl mb-4">{score === totalSteps ? "🏆" : score >= 2 ? "👍" : "📚"}</div>
          <h3 className="text-2xl font-black text-slate-900 mb-2">
            {score === totalSteps ? "Diagnóstico perfeito!" : score >= 2 ? "Bom raciocínio!" : "Continue praticando!"}
          </h3>
          <p className="text-slate-600 mb-2">Você acertou {score} de {totalSteps} decisões clínicas.</p>
          {score === totalSteps && (
            <p className="text-sm text-emerald-700 bg-emerald-50 rounded-xl p-3 mb-4">
              Você identificou corretamente o ITB falsamente elevado em paciente diabético com esclerose de Mönckeberg — um dos erros diagnósticos mais críticos em angiologia.
            </p>
          )}
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="h-4 w-4" /> Reiniciar Cenário
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function ITBPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("fundamentos");

  const renderTab = () => {
    switch (activeTab) {
      case "fundamentos": return <FundamentosSection />;
      case "protocolo": return <ProtocoloSection />;
      case "simulador": return <SimuladorSection />;
      case "doppler": return <DopplerSection />;
      case "quiz": return <QuizSection />;
      case "cenario": return <CenarioSection />;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/img/logo.png"
              alt="Logo do projeto"
              width={56}
              height={56}
              className="rounded-2xl object-contain"
            />
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Medicina Vascular Interativa</div>
                <div className="text-xs text-slate-500">Simulação Clínica Educacional</div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Índice <span className="text-emerald-400">Tornozelo-Braquial</span>
          </h1>
          <p className="mt-4 text-slate-300 max-w-2xl leading-relaxed">
            Plataforma interativa de aprendizado do ITB — da fisiopatologia ao protocolo, 
            ondas Doppler, simulador de cálculo e cenários clínicos ramificados.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { label: "6 módulos", icon: "📚" },
              { label: "Quiz adaptativo", icon: "🧠" },
              { label: "Cenário clínico", icon: "🎯" },
              { label: "Simulador ITB", icon: "🔢" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">
                <span>{b.icon}</span>{b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex overflow-x-auto">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-bold transition"
                  style={{
                    borderColor: activeTab === t.key ? "#0f172a" : "transparent",
                    color: activeTab === t.key ? "#0f172a" : "#64748b",
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {renderTab()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white mt-8 px-6 py-6">
        <div className="mx-auto max-w-4xl flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <Image
              src="/img/logo.png"
              alt="Logo do projeto"
              width={32}
              height={32}
              className="rounded-lg object-contain"
            />
            <strong className="text-slate-700">ITB Interactive</strong> — Material educacional de medicina vascular
          </div>
          <div className="flex gap-4">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className="hover:text-slate-700 transition">
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

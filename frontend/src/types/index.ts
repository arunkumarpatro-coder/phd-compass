export interface JournalEntry {
  id: string;
  date: string;
  dayOfWeek: string;
  workedOn: string;
  learned: string;
  surprisedConfused: string;
  honestCheck: string;
  tomorrowIntention: string;
  pillarTags: number[];
  skillTrack: 'research' | 'coding' | 'entrepreneurial' | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vision {
  legacyStatement: string;
  phdContribution: string;
  postPhdDirection: string;
  identityGap: {
    mindset: { current: string; required: string };
    skillSet: { current: string; required: string };
    knowledge: { current: string; required: string };
    systems: { current: string; required: string };
  };
  lastReviewed: string;
}

export interface Milestone {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  notes: string;
  dateCompleted: string | null;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  keyConcepts: string;
}

export interface SOP {
  id: string;
  title: string;
  category: 'lab_protocol' | 'data_processing' | 'analysis' | 'administrative';
  steps: SOPStep[];
  lastUpdated: string;
  version: number;
}

export interface SOPStep {
  order: number;
  instruction: string;
  notes: string;
}

export interface WeeklyReview {
  id: string;
  week: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  pillarScores: Record<string, number>;
  skillTrackSessions: { research: number; coding: number; entrepreneurial: number };
  groundingReflection: string;
  neglectedPillar: string;
  avoidedThisWeek: string;
  nextWeekCommitment: string;
  explainNow: string;
  progressOrBusy: string;
  foolingMyself: string;
  rightProblem: string;
  intuitionCheck: string;
  fulcrumAsset: string;
  updatedVision: string;
  createdAt: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  reminderTime: string;
  welcomeDismissed: boolean;
}

export const PILLARS = [
  { id: 0, label: 'Grounding', short: 'P0', color: '#1A8A7D' },
  { id: 1, label: 'Pain', short: 'P1', color: '#E06D63' },
  { id: 2, label: 'Challenge', short: 'P2', color: '#4A7A9B' },
  { id: 3, label: 'Conviction', short: 'P3', color: '#8B6B9E' },
  { id: 4, label: 'Small Bets', short: 'P4', color: '#C4820B' },
  { id: 5, label: 'Fulcrum', short: 'P5', color: '#5B8C5A' },
];

export const SKILL_TRACKS = [
  { id: 'research' as const, label: 'Research', color: '#1A8A7D' },
  { id: 'coding' as const, label: 'Coding', color: '#4A7A9B' },
  { id: 'entrepreneurial' as const, label: 'Entrepreneurial', color: '#C4820B' },
];

export const PILLAR_DESCRIPTIONS = [
  { id: 0, title: 'P0 [Foundation]: Deep Grounding', desc: 'Disciplined engagement with existing knowledge. Develop physical intuition. Understand why things are before challenging them. This is the root — without it, all other pillars become reckless.' },
  { id: 1, title: 'P1: Pain as Capability Amplifier', desc: 'Seek the hardest problems. Setbacks are amplifiers, not obstacles.' },
  { id: 2, title: 'P2: Challenge the Status Quo', desc: 'Question established theories and methods — but only from deep understanding (P0 first).' },
  { id: 3, title: 'P3: Independent Conviction', desc: 'Trust your own scientific intuition, even against consensus.' },
  { id: 4, title: 'P4: Small Bets, Asymmetric Payoffs', desc: 'Allocate 10-15% bandwidth to speculative experiments. Maintain a running list.' },
  { id: 5, title: 'P5: Fulcrum Assets', desc: 'Prioritize foundational contributions with multiplicative impact.' },
];

export const DEFAULT_MILESTONES = [
  'Cast NAB characterization — SEM, EDS, hardness',
  'Printed NAB characterization — multi-scale (mm to nm)',
  'Uniaxial tensile testing — cast baseline',
  'Uniaxial tensile testing — printed specimens',
  'Heat treatment DoE — design and execution',
  'Build-height microstructure gradient study',
  'Low cycle fatigue test setup and protocol',
  'LCF testing — cast NAB baseline',
  'LCF testing — printed NAB',
  'LCF data analysis — cast vs printed comparison',
  'First journal paper draft',
];

export const DEFAULT_SOPS = [
  { title: 'SEM image acquisition and folder organization', category: 'lab_protocol' as const },
  { title: 'EDS elemental mapping procedure', category: 'lab_protocol' as const },
  { title: 'Hardness measurement and data recording (Vickers)', category: 'lab_protocol' as const },
  { title: 'Heat treatment sample preparation and furnace protocol', category: 'lab_protocol' as const },
  { title: 'Organizing microstructure images for presentations', category: 'data_processing' as const },
  { title: 'Fatigue test specimen preparation', category: 'lab_protocol' as const },
  { title: 'Weekly data backup workflow', category: 'administrative' as const },
];

export const DEFAULT_COURSES = [
  'MEMS 1070/MSE 2030 — Plasticity & Strengthening Mechanisms',
  'MSE 2013 — Kinetics',
  'MSE 2015 — Electromagnetic Properties of Materials',
];

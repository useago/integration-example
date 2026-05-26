export type Profil = 'me' | 'couple' | 'family';
export type Regime = 'salarie' | 'tns' | 'fonctionnaire' | 'retraite' | 'etudiant';
export type Niveau = 'eco' | 'equilibre' | 'confort';

export interface QuoteState {
  profil: Profil | null;
  adultes: number | null;
  enfants: number | null;
  regime: Regime | null;
  dateNaissance: string;
  codePostal: string;
  dateEffet: string;
  niveau: Niveau | null;
  email: string;
  telephone: string;
}

export const INITIAL_QUOTE: QuoteState = {
  profil: null,
  adultes: null,
  enfants: null,
  regime: null,
  dateNaissance: '',
  codePostal: '',
  dateEffet: '',
  niveau: null,
  email: '',
  telephone: '',
};

export const PROFIL_LABELS: Record<Profil, string> = {
  me: 'Moi',
  couple: 'Couple',
  family: 'Famille',
};

export const REGIME_LABELS: Record<Regime, string> = {
  salarie: 'Salarié',
  tns: 'Travailleur non salarié (TNS)',
  fonctionnaire: 'Fonctionnaire',
  retraite: 'Retraité',
  etudiant: 'Étudiant',
};

export const NIVEAU_LABELS: Record<Niveau, string> = {
  eco: 'Économique',
  equilibre: 'Équilibré',
  confort: 'Confort',
};

const NIVEAU_BASE: Record<Niveau, number> = {
  eco: 19,
  equilibre: 39,
  confort: 69,
};

const REGIME_MULT: Record<Regime, number> = {
  salarie: 1,
  tns: 1.15,
  fonctionnaire: 0.95,
  retraite: 1.25,
  etudiant: 0.7,
};

export function computeMonthlyPrice(state: QuoteState): number | null {
  if (!state.niveau || !state.regime || state.adultes == null) return null;
  const base = NIVEAU_BASE[state.niveau];
  const enfants = state.enfants ?? 0;
  const peoplePrice = base * state.adultes + base * 0.5 * enfants;
  const total = peoplePrice * REGIME_MULT[state.regime];
  return Math.round(total * 100) / 100;
}

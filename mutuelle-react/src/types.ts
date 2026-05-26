export type Profil = 'me' | 'couple' | 'family';
export type Regime = 'salarie' | 'tns' | 'fonctionnaire' | 'retraite' | 'etudiant';
export type Niveau = 'eco' | 'equilibre' | 'confort';

export interface QuoteState {
  profil: Profil;
  adultes: number;
  enfants: number;
  regime: Regime;
  dateNaissance: string;
  codePostal: string;
  dateEffet: string;
  niveau: Niveau;
  email: string;
  telephone: string;
}

export const INITIAL_QUOTE: QuoteState = {
  profil: 'me',
  adultes: 1,
  enfants: 0,
  regime: 'salarie',
  dateNaissance: '',
  codePostal: '',
  dateEffet: '',
  niveau: 'equilibre',
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

export function computeMonthlyPrice(state: QuoteState): number {
  const base = NIVEAU_BASE[state.niveau];
  const peoplePrice = base * state.adultes + base * 0.5 * state.enfants;
  const total = peoplePrice * REGIME_MULT[state.regime];
  return Math.round(total * 100) / 100;
}

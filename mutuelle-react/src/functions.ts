import { defineFunction } from '@useago/sdk';
import {
  QuoteState,
  Profil,
  Regime,
  Niveau,
  PROFIL_LABELS,
  REGIME_LABELS,
  NIVEAU_LABELS,
  computeMonthlyPrice,
} from './types';

export interface QuoteStore {
  get: () => QuoteState;
  set: (next: QuoteState) => void;
  submit: (state: QuoteState) => { ok: true; reference: string };
}

function summarize(state: QuoteState) {
  return {
    profil: state.profil ? PROFIL_LABELS[state.profil] : null,
    adultes: state.adultes,
    enfants: state.enfants,
    regime: state.regime ? REGIME_LABELS[state.regime] : null,
    dateNaissance: state.dateNaissance || null,
    codePostal: state.codePostal || null,
    dateEffet: state.dateEffet || null,
    niveau: state.niveau ? NIVEAU_LABELS[state.niveau] : null,
    email: state.email || null,
    telephone: state.telephone || null,
    monthlyPriceEuros: computeMonthlyPrice(state),
  };
}

export function buildMutuelleFunctions(store: QuoteStore) {
  const setProfil = defineFunction({
    name: 'setProfil',
    description: 'Définit qui est à assurer : seul ("me"), en couple ("couple") ou famille ("family"). Ajuste automatiquement le nombre d\'adultes par défaut.',
    parameters: {
      type: 'object',
      properties: {
        profil: { type: 'string', enum: ['me', 'couple', 'family'] as Profil[], description: 'Profil' },
      },
      required: ['profil'],
    },
    handler: async (args: Record<string, unknown>) => {
      const profil = String(args.profil) as Profil;
      if (!PROFIL_LABELS[profil]) {
        return { ok: false, error: `Profil inconnu : ${profil}` };
      }
      const cur = store.get();
      const adultes = profil === 'me' ? 1 : profil === 'couple' ? 2 : Math.max(cur.adultes ?? 2, 2);
      store.set({ ...cur, profil, adultes });
      return { ok: true, profil: PROFIL_LABELS[profil], adultes };
    },
  });

  const setComposition = defineFunction({
    name: 'setComposition',
    description: 'Met à jour le nombre d\'adultes et/ou d\'enfants à assurer.',
    parameters: {
      type: 'object',
      properties: {
        adultes: { type: 'number', description: 'Nombre d\'adultes (1 ou 2)' },
        enfants: { type: 'number', description: 'Nombre d\'enfants (0 à 6)' },
      },
    },
    handler: async (args: Record<string, unknown>) => {
      const cur = store.get();
      const adultes = typeof args.adultes === 'number' ? Math.max(1, Math.min(2, Math.round(Number(args.adultes)))) : cur.adultes;
      const enfants = typeof args.enfants === 'number' ? Math.max(0, Math.min(6, Math.round(Number(args.enfants)))) : (cur.enfants ?? 0);
      store.set({ ...cur, adultes, enfants });
      return { ok: true, adultes, enfants };
    },
  });

  const setRegime = defineFunction({
    name: 'setRegime',
    description: 'Définit le régime social du souscripteur.',
    parameters: {
      type: 'object',
      properties: {
        regime: {
          type: 'string',
          enum: ['salarie', 'tns', 'fonctionnaire', 'retraite', 'etudiant'] as Regime[],
          description: 'Régime social',
        },
      },
      required: ['regime'],
    },
    handler: async (args: Record<string, unknown>) => {
      const regime = String(args.regime) as Regime;
      if (!REGIME_LABELS[regime]) {
        return { ok: false, error: `Régime inconnu : ${regime}` };
      }
      store.set({ ...store.get(), regime });
      return { ok: true, regime: REGIME_LABELS[regime] };
    },
  });

  const setNiveau = defineFunction({
    name: 'setNiveau',
    description: 'Choisit le niveau de couverture : "eco" (économique), "equilibre" (standard) ou "confort" (premium).',
    parameters: {
      type: 'object',
      properties: {
        niveau: {
          type: 'string',
          enum: ['eco', 'equilibre', 'confort'] as Niveau[],
          description: 'Niveau de couverture',
        },
      },
      required: ['niveau'],
    },
    handler: async (args: Record<string, unknown>) => {
      const niveau = String(args.niveau) as Niveau;
      if (!NIVEAU_LABELS[niveau]) {
        return { ok: false, error: `Niveau inconnu : ${niveau}` };
      }
      store.set({ ...store.get(), niveau });
      return { ok: true, niveau: NIVEAU_LABELS[niveau], monthlyPriceEuros: computeMonthlyPrice({ ...store.get(), niveau }) };
    },
  });

  const setCoordonnees = defineFunction({
    name: 'setCoordonnees',
    description: 'Renseigne les coordonnées du souscripteur : date de naissance, code postal, date d\'effet souhaitée, email, téléphone. Tous les champs sont optionnels — ne renseigner que ceux fournis par le client.',
    parameters: {
      type: 'object',
      properties: {
        dateNaissance: { type: 'string', description: 'Date de naissance au format YYYY-MM-DD' },
        codePostal: { type: 'string', description: 'Code postal français (5 chiffres)' },
        dateEffet: { type: 'string', description: 'Date d\'effet souhaitée du contrat au format YYYY-MM-DD' },
        email: { type: 'string', description: 'Adresse email' },
        telephone: { type: 'string', description: 'Numéro de téléphone' },
      },
    },
    handler: async (args: Record<string, unknown>) => {
      const cur = store.get();
      const next: QuoteState = {
        ...cur,
        dateNaissance: typeof args.dateNaissance === 'string' ? args.dateNaissance : cur.dateNaissance,
        codePostal: typeof args.codePostal === 'string' ? args.codePostal : cur.codePostal,
        dateEffet: typeof args.dateEffet === 'string' ? args.dateEffet : cur.dateEffet,
        email: typeof args.email === 'string' ? args.email : cur.email,
        telephone: typeof args.telephone === 'string' ? args.telephone : cur.telephone,
      };
      store.set(next);
      return { ok: true, ...summarize(next) };
    },
  });

  const getQuote = defineFunction({
    name: 'getQuote',
    description: 'Lit l\'état complet du devis en cours : profil, composition du foyer, régime, niveau de couverture, coordonnées, et tarif mensuel calculé en euros.',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      return { ok: true, ...summarize(store.get()) };
    },
  });

  const submitQuote = defineFunction({
    name: 'submitQuote',
    description: 'Valide et envoie la demande de devis. À appeler uniquement quand le client a confirmé qu\'il veut recevoir son devis personnalisé. Nécessite a minima un email ou un téléphone.',
    parameters: { type: 'object', properties: {} },
    handler: async () => {
      const state = store.get();
      if (!state.email && !state.telephone) {
        return { ok: false, error: 'Email ou téléphone requis pour envoyer le devis.' };
      }
      const { reference } = store.submit(state);
      return {
        ok: true,
        reference,
        ...summarize(state),
      };
    },
  });

  return { setProfil, setComposition, setRegime, setNiveau, setCoordonnees, getQuote, submitQuote };
}

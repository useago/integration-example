import { useMemo, useRef, useState } from 'react';
import { ChatWidget, useAgoContext, useAgoFunction } from '@useago/sdk/react';
import {
  INITIAL_QUOTE,
  NIVEAU_LABELS,
  PROFIL_LABELS,
  REGIME_LABELS,
  QuoteState,
  Niveau,
  Profil,
  Regime,
} from './types';
import { buildMutuelleFunctions } from './functions';

interface SubmittedQuote {
  reference: string;
  state: QuoteState;
}

export default function App() {
  const [quote, setQuote] = useState<QuoteState>(INITIAL_QUOTE);
  const [submitted, setSubmitted] = useState<SubmittedQuote | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const quoteRef = useRef(quote);
  quoteRef.current = quote;
  const submittedRef = useRef<SubmittedQuote | null>(submitted);
  submittedRef.current = submitted;

  const fns = useMemo(
    () =>
      buildMutuelleFunctions({
        get: () => quoteRef.current,
        set: (next) => setQuote(next),
        submit: (state) => {
          const reference = `WD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
          setSubmitted({ reference, state });
          return { ok: true, reference };
        },
      }),
    [],
  );

  useAgoFunction(fns.setProfil.name, fns.setProfil);
  useAgoFunction(fns.setComposition.name, fns.setComposition);
  useAgoFunction(fns.setRegime.name, fns.setRegime);
  useAgoFunction(fns.setNiveau.name, fns.setNiveau);
  useAgoFunction(fns.setCoordonnees.name, fns.setCoordonnees);
  useAgoFunction(fns.getQuote.name, fns.getQuote);
  useAgoFunction(fns.submitQuote.name, fns.submitQuote);

  // Inject the live form state into every message so the agent always knows
  // what's currently filled in. Function form = re-evaluated on each send.
  useAgoContext(() => {
    const q = quoteRef.current;
    return {
      name: 'Devis mutuelle en cours',
      description:
        "État actuel du formulaire de devis mutuelle santé. Les champs vides ou non renseignés sont à null. Utilise ces valeurs pour ne pas redemander d'informations déjà fournies.",
      data: {
        profil: q.profil ? { id: q.profil, label: PROFIL_LABELS[q.profil] } : null,
        adultes: q.adultes,
        enfants: q.enfants,
        regime: q.regime ? { id: q.regime, label: REGIME_LABELS[q.regime] } : null,
        niveau: q.niveau ? { id: q.niveau, label: NIVEAU_LABELS[q.niveau] } : null,
        dateNaissance: q.dateNaissance || null,
        codePostal: q.codePostal || null,
        dateEffet: q.dateEffet || null,
        email: q.email || null,
        telephone: q.telephone || null,
        hasSubmitted: submittedRef.current !== null,
        submissionReference: submittedRef.current?.reference ?? null,
      },
    };
  }, 'quote-form-state');

  const update = <K extends keyof QuoteState>(key: K, value: QuoteState[K]) =>
    setQuote((q) => ({ ...q, [key]: value }));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quote.email && !quote.telephone) {
      alert('Renseignez au moins un email ou un téléphone.');
      return;
    }
    const reference = `WD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    setSubmitted({ reference, state: quote });
  };

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);

  return (
    <div className={`weendeal-shell${isChatOpen ? ' weendeal-shell--chat-open' : ''}`}>
      <aside
        className={`weendeal-chat${isChatOpen ? ' weendeal-chat--open' : ''}`}
        aria-hidden={!isChatOpen}
      >
        <div className="weendeal-chat-topbar">
          <span className="weendeal-chat-topbar-label">Conseiller assurance AGO</span>
          <button
            type="button"
            className="weendeal-chat-close"
            onClick={closeChat}
            aria-label="Fermer la conversation"
            title="Fermer"
          >
            ×
          </button>
        </div>
        <div className="weendeal-chat-body">
          <ChatWidget
            title="Conseiller assurance AGO"
            welcomeMessage="Bonjour ! Je suis votre conseiller mutuelle santé. Dites-moi qui vous souhaitez assurer (vous, votre couple, votre famille), votre régime social et le niveau de couverture qui vous intéresse — je remplis le formulaire pour vous."
            placeholder="Ex. : famille de 4, salariés, niveau confort…"
            height="100%"
            allowFiles={false}
          />
        </div>
      </aside>

      <header className="weendeal-header">
        <div className="weendeal-brand">
          <span className="weendeal-logo">🛡️</span>
          <div>
            <h1>Assurance AGO</h1>
            <p className="weendeal-tagline">Comparez et trouvez la mutuelle qui vous ressemble.</p>
          </div>
        </div>
        <button type="button" className="help-cta help-cta--header" onClick={openChat}>
          <span className="help-cta-icon" aria-hidden>💬</span>
          J'ai besoin d'aide
        </button>
      </header>

      <main className="weendeal-main">
        <section className="weendeal-stage">
          {submitted ? (
            <SuccessCard submitted={submitted} onReset={() => { setSubmitted(null); setQuote(INITIAL_QUOTE); }} />
          ) : (
            <form className="quote-card" onSubmit={onSubmit}>
              <h2>Votre devis personnalisé</h2>
              <p className="quote-subtitle">Quelques informations et nous comparons les meilleures offres pour vous.</p>

              <div className="form-section">
                <label className="form-label">Qui souhaitez-vous assurer&nbsp;?</label>
                <div className="radio-group">
                  {(Object.keys(PROFIL_LABELS) as Profil[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`radio-option${quote.profil === p ? ' radio-option--selected' : ''}`}
                      onClick={() => {
                        const adultes = p === 'me' ? 1 : p === 'couple' ? 2 : Math.max(quote.adultes ?? 2, 2);
                        setQuote({ ...quote, profil: p, adultes });
                      }}
                    >
                      {PROFIL_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-section">
                  <label htmlFor="adultes" className="form-label">Adultes</label>
                  <select
                    id="adultes"
                    value={quote.adultes ?? ''}
                    onChange={(e) => update('adultes', e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">—</option>
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                  </select>
                </div>
                <div className="form-section">
                  <label htmlFor="enfants" className="form-label">Enfants</label>
                  <select
                    id="enfants"
                    value={quote.enfants ?? ''}
                    onChange={(e) => update('enfants', e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">—</option>
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <label htmlFor="regime" className="form-label">Régime social</label>
                <select
                  id="regime"
                  value={quote.regime ?? ''}
                  onChange={(e) => update('regime', e.target.value === '' ? null : (e.target.value as Regime))}
                >
                  <option value="">Sélectionnez votre régime</option>
                  {(Object.keys(REGIME_LABELS) as Regime[]).map((r) => (
                    <option key={r} value={r}>{REGIME_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-section">
                  <label htmlFor="naissance" className="form-label">Date de naissance</label>
                  <input
                    id="naissance"
                    type="date"
                    value={quote.dateNaissance}
                    onChange={(e) => update('dateNaissance', e.target.value)}
                  />
                </div>
                <div className="form-section">
                  <label htmlFor="cp" className="form-label">Code postal</label>
                  <input
                    id="cp"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="75001"
                    value={quote.codePostal}
                    onChange={(e) => update('codePostal', e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="form-section">
                <label className="form-label">Niveau de couverture</label>
                <div className="radio-group">
                  {(Object.keys(NIVEAU_LABELS) as Niveau[]).map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`radio-option${quote.niveau === n ? ' radio-option--selected' : ''}`}
                      onClick={() => update('niveau', n)}
                    >
                      {NIVEAU_LABELS[n]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-section">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.fr"
                    value={quote.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </div>
                <div className="form-section">
                  <label htmlFor="tel" className="form-label">Téléphone</label>
                  <input
                    id="tel"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={quote.telephone}
                    onChange={(e) => update('telephone', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <label htmlFor="effet" className="form-label">Date d'effet souhaitée</label>
                <input
                  id="effet"
                  type="date"
                  value={quote.dateEffet}
                  onChange={(e) => update('dateEffet', e.target.value)}
                />
              </div>

              <div className="quote-help-row">
                <button type="button" className="quote-help-link" onClick={openChat}>
                  Une question&nbsp;? <span>Ouvrir la conversation</span>
                </button>
              </div>

              <div className="quote-summary">
                <button type="submit" className="btn-primary">Recevoir mon devis</button>
              </div>
            </form>
          )}
        </section>
      </main>

      {!isChatOpen && (
        <button type="button" className="help-cta help-cta--floating" onClick={openChat}>
          <span className="help-cta-icon" aria-hidden>💬</span>
          J'ai des questions
        </button>
      )}
    </div>
  );
}

function SuccessCard({ submitted, onReset }: { submitted: SubmittedQuote; onReset: () => void }) {
  const { reference, state } = submitted;
  return (
    <div className="success-card">
      <div className="success-icon">✓</div>
      <h2>Merci ! Votre devis est en route.</h2>
      <p>
        Référence&nbsp;: <strong>{reference}</strong>
      </p>
      <ul className="success-list">
        <li><span>Profil</span><span>{state.profil ? PROFIL_LABELS[state.profil] : '—'}</span></li>
        <li><span>Foyer</span><span>{state.adultes ?? 0} adulte{(state.adultes ?? 0) > 1 ? 's' : ''}{(state.enfants ?? 0) > 0 ? ` · ${state.enfants} enfant${(state.enfants ?? 0) > 1 ? 's' : ''}` : ''}</span></li>
        <li><span>Régime</span><span>{state.regime ? REGIME_LABELS[state.regime] : '—'}</span></li>
        <li><span>Niveau</span><span>{state.niveau ? NIVEAU_LABELS[state.niveau] : '—'}</span></li>
      </ul>
      <p className="success-note">
        Un conseiller assurance AGO vous recontacte sous 24h
        {state.email ? ` à ${state.email}` : ''}
        {state.telephone ? `${state.email ? ' et ' : ' au '}${state.telephone}` : ''}.
      </p>
      <button type="button" className="btn-secondary" onClick={onReset}>Nouveau devis</button>
    </div>
  );
}

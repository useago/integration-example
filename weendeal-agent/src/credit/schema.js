export const CREDIT_SCHEMA = {
  // Sentence the agent reads to know when/how to call updateRequest.
  updateRequestDescription:
    "Met à jour la demande de regroupement de crédits avec les informations fournies par le " +
    "client. Tous les champs sont optionnels : ne renseigner que ceux mentionnés. Appeler cette " +
    "fonction dès qu'une information est donnée, en remplissant tous les champs connus en un seul appel.",
  submitRequestDescription:
    "Valide et envoie la demande de regroupement de crédits. À appeler uniquement quand le " +
    "client a confirmé qu'il veut envoyer sa demande. Nécessite a minima un email ou un téléphone.",

  // Ordered list of fields, following the agent's own question flow
  // `type` drives the JSON-Schema and the initial value
  // (string -> "", everything else -> null). `enum` entries carry a human label for summaries.
  // The set must cover every field the agent collects: any answer with no matching field here
  // makes the agent call updateRequest with an empty object and re-ask the question in free text.
  fields: [
    {
      key: "statutLogement",
      type: "string",
      label: "Statut logement",
      description: "Statut de logement du client",
      enum: [
        { value: "proprietaire", label: "Propriétaire" },
        { value: "locataire", label: "Locataire" },
        { value: "heberge", label: "Hébergé" },
      ],
    },
    {
      key: "sourceEstimation",
      type: "string",
      label: "Source de l'estimation",
      description: "Qui a estimé la valeur du bien immobilier",
      enum: [
        { value: "agence", label: "Agence immobilière" },
        { value: "notaire", label: "Notaire" },
        { value: "soi_meme", label: "Vous-même" },
      ],
    },
    {
      key: "valeurBien",
      type: "number",
      label: "Valeur du bien",
      description: "Valeur estimée du bien immobilier en euros",
    },
    {
      key: "typeRegroupement",
      type: "string",
      label: "Type de regroupement",
      description: "Type de regroupement de crédits souhaité",
      enum: [
        {
          value: "immo_seul",
          label: "Renégocier uniquement le prêt immobilier",
        },
        { value: "conso_immo", label: "Regrouper prêts conso et immo" },
        { value: "conso_seul", label: "Regrouper uniquement les prêts conso" },
      ],
    },
    {
      key: "coEmprunteur",
      type: "boolean",
      label: "Co-emprunteur",
      description:
        "La démarche est faite avec un co-emprunteur (true) ou seul (false)",
    },
    {
      key: "situationFamiliale",
      type: "string",
      label: "Situation familiale",
      description: "Situation familiale du client",
      enum: [
        { value: "celibataire", label: "Célibataire" },
        { value: "marie_pacse", label: "Marié(e) / Pacsé(e)" },
        { value: "concubin", label: "Concubin(e)" },
        { value: "separe", label: "Séparé(e)" },
        { value: "divorce", label: "Divorcé(e)" },
        { value: "veuf", label: "Veuf(ve)" },
      ],
    },
    {
      key: "nombreEnfants",
      type: "number",
      label: "Enfants à charge",
      description: "Nombre d'enfants à charge (de 0 à 9)",
    },
    {
      key: "revenusMensuels",
      type: "number",
      label: "Revenus mensuels",
      description: "Revenus nets mensuels en euros",
    },
    {
      key: "chargesMensuelles",
      type: "number",
      label: "Charges mensuelles",
      description: "Charges mensuelles en euros",
    },
    {
      key: "nombreCreditsConso",
      type: "number",
      label: "Nombre de crédits conso",
      description: "Nombre de crédits à la consommation en cours",
    },
    {
      key: "montantTotalCredits",
      type: "number",
      label: "Capital restant dû conso",
      description:
        "Capital restant dû total des crédits à la consommation en cours, en euros",
    },
    {
      key: "mensualitesActuelles",
      type: "number",
      label: "Mensualités conso",
      description:
        "Montant total des mensualités de crédits conso actuellement remboursées, en euros par mois",
    },
    {
      key: "nombreCreditsImmo",
      type: "number",
      label: "Nombre de crédits immo",
      description: "Nombre de crédits immobiliers en cours",
    },
    {
      key: "capitalRestantDuImmo",
      type: "number",
      label: "Capital restant dû immo",
      description: "Capital restant dû total des crédits immobiliers en cours, en euros",
    },
    {
      key: "mensualitesImmo",
      type: "number",
      label: "Mensualités immo",
      description: "Montant total des mensualités de crédits immobiliers, en euros par mois",
    },
    {
      key: "evaluationAssurancePret",
      type: "boolean",
      label: "Évaluation assurance de prêt",
      description:
        "Le client souhaite une évaluation gratuite de son assurance de prêt (true) ou non (false)",
    },
    {
      key: "montantTresorerie",
      type: "number",
      label: "Trésorerie souhaitée",
      description: "Trésorerie supplémentaire souhaitée en euros",
    },
    {
      key: "dureeMois",
      type: "number",
      label: "Durée (mois)",
      description: "Durée de remboursement souhaitée en mois",
    },
    // ── Identité ──
    {
      key: "civilite",
      type: "string",
      label: "Civilité",
      description: "Civilité du client",
      enum: [
        { value: "m", label: "Monsieur" },
        { value: "mme", label: "Madame" },
      ],
    },
    {
      key: "nom",
      type: "string",
      label: "Nom",
      description: "Nom de famille du client",
    },
    {
      key: "prenom",
      type: "string",
      label: "Prénom",
      description: "Prénom du client",
    },
    {
      key: "dateNaissance",
      type: "string",
      label: "Date de naissance",
      description: "Date de naissance du client (format JJ/MM/AAAA)",
    },
    {
      key: "nationalite",
      type: "string",
      label: "Nationalité",
      description: "Nationalité du client",
    },
    // ── Situation professionnelle ──
    {
      key: "profession",
      type: "string",
      label: "Profession",
      description: "Profession / métier du client",
    },
    {
      key: "categorieProfession",
      type: "string",
      label: "Catégorie de profession",
      description: "Catégorie socio-professionnelle du client",
      enum: [
        { value: "cadre", label: "Cadre" },
        { value: "employe", label: "Employé" },
        { value: "autre", label: "Autre" },
      ],
    },
    {
      key: "typeContrat",
      type: "string",
      label: "Type de contrat",
      description:
        "Type de contrat de travail (CDI, CDD, intérim, fonctionnaire, indépendant, retraité, etc.)",
    },
    {
      key: "anciennete",
      type: "string",
      label: "Ancienneté",
      description: "Ancienneté dans l'emploi actuel (ex: 5 ans)",
    },
    // ── Antécédents ──
    {
      key: "ficp",
      type: "boolean",
      label: "FICP",
      description:
        "Le client est inscrit au FICP (fichier des incidents de remboursement) (true) ou non (false)",
    },
    {
      key: "dejaRestructure",
      type: "boolean",
      label: "Déjà restructuré",
      description:
        "Le client a déjà réalisé un rachat / regroupement de crédits par le passé (true) ou non (false)",
    },
    // ── Coordonnées ──
    {
      key: "adresse",
      type: "string",
      label: "Adresse",
      description: "Adresse postale du client (numéro et rue)",
    },
    {
      key: "ville",
      type: "string",
      label: "Ville",
      description: "Ville de résidence du client",
    },
    {
      key: "codePostal",
      type: "string",
      label: "Code postal",
      description: "Code postal français (5 chiffres)",
    },
    {
      key: "pays",
      type: "string",
      label: "Pays",
      description: "Pays de résidence du client",
    },
    {
      key: "email",
      type: "string",
      label: "Email",
      description: "Adresse email du client",
    },
    {
      key: "telephone",
      type: "string",
      label: "Téléphone",
      description: "Numéro de téléphone du client",
    },
    // ── Co-emprunteur (uniquement si coEmprunteur = true) ──
    // Champs distincts du client principal : à ne renseigner qu'avec les informations du
    // co-emprunteur, jamais avec celles du client principal.
    {
      key: "coCivilite",
      type: "string",
      label: "Co — Civilité",
      description: "Civilité du co-emprunteur",
      enum: [
        { value: "m", label: "Monsieur" },
        { value: "mme", label: "Madame" },
      ],
    },
    {
      key: "coNom",
      type: "string",
      label: "Co — Nom",
      description: "Nom de famille du co-emprunteur",
    },
    {
      key: "coPrenom",
      type: "string",
      label: "Co — Prénom",
      description: "Prénom du co-emprunteur",
    },
    {
      key: "coDateNaissance",
      type: "string",
      label: "Co — Date de naissance",
      description: "Date de naissance du co-emprunteur (format JJ/MM/AAAA)",
    },
    {
      key: "coNationalite",
      type: "string",
      label: "Co — Nationalité",
      description: "Nationalité du co-emprunteur",
    },
    {
      key: "coRevenusMensuels",
      type: "number",
      label: "Co — Revenus mensuels",
      description: "Revenus nets mensuels du co-emprunteur, en euros",
    },
    {
      key: "coProfession",
      type: "string",
      label: "Co — Profession",
      description: "Profession / métier du co-emprunteur",
    },
    {
      key: "coCategorieProfession",
      type: "string",
      label: "Co — Catégorie de profession",
      description: "Catégorie socio-professionnelle du co-emprunteur",
      enum: [
        { value: "cadre", label: "Cadre" },
        { value: "employe", label: "Employé" },
        { value: "autre", label: "Autre" },
      ],
    },
    {
      key: "coTypeContrat",
      type: "string",
      label: "Co — Type de contrat",
      description:
        "Type de contrat de travail du co-emprunteur (CDI, CDD, intérim, fonctionnaire, indépendant, retraité, etc.)",
    },
    {
      key: "coAnciennete",
      type: "string",
      label: "Co — Ancienneté",
      description: "Ancienneté du co-emprunteur dans son emploi actuel (ex: 8 ans)",
    },
    {
      key: "coFicp",
      type: "boolean",
      label: "Co — FICP",
      description:
        "Le co-emprunteur est inscrit au FICP (fichier des incidents de remboursement) (true) ou non (false)",
    },
  ],
};

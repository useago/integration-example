// Form schema for the credit-consolidation flow, already in the JSON-schema
// shape createFormCollector consumes — main.js passes it straight through, no
// transform. Each enum field carries its code legend (e.g. 1=Propriétaire)
// inline in the description so the agent knows what every value means.
// required mirrors DevisProx's mandatory keys (idq=18), limited to the
// fields defined below; conditional fields stay optional.
export const CREDIT_SCHEMA = {
  type: "object",
  properties: {

    // ── 1. Projet de rachat de crédits ──
    locataire: {
      type: "string",
      description: "Le client est-il propriétaire de son logement. Valeurs : 1=Propriétaire, 2=Pas propriétaire",
      enum: ["1","2"],
    },
    detail_projet: {
      type: "string",
      description: "Type de démarche souhaitée. Valeurs : 1=Renégocier uniquement le prêt immobilier, 2=Regrouper prêts conso et immo, 3=Regrouper uniquement les prêts conso",
      enum: ["1","2","3"],
    },
    projet_seul: {
      type: "string",
      description: "Démarche faite seul ou avec un co-emprunteur. Valeurs : 1=Seul, 2=Avec un co-emprunteur",
      enum: ["1","2"],
    },

    // ── 2. Situation familiale ──
    situation_famille: {
      type: "string",
      description: "Situation familiale du client. Valeurs : 1=Célibataire, 2=Marié(e) / Pacsé(e), 3=Concubin(e), 4=Séparé(e), 5=Divorcé(e), 6=Veuf(ve)",
      enum: ["1","2","3","4","5","6"],
    },
    nbre_enfant: {
      type: "number",
      description: "Nombre d'enfants à charge (de 0 à 9)",
    },

    // ── 3. Crédits à la consommation ──
    nb_credit_conso: {
      type: "number",
      description: "Nombre de crédits à la consommation en cours (de 1 à 12 ; 13 = plus de 12)",
    },
    montant_remboursements_mensuel_conso: {
      type: "number",
      description: "Montant total des remboursements mensuels des crédits conso, en euros par mois (si au moins un crédit conso)",
    },
    capitaux_restant_dus_conso: {
      type: "number",
      description: "Estimation du capital restant dû (CRD) sur les crédits conso, en euros (si au moins un crédit conso)",
    },

    // ── 4. Crédits immobiliers ──
    nb_credit_immo: {
      type: "number",
      description: "Nombre de crédits immobiliers en cours (de 0 à 12 ; 13 = plus de 12)",
    },
    montant_remboursements_mensuel_immo: {
      type: "number",
      description: "Montant total des remboursements mensuels des crédits immobiliers, en euros par mois (si au moins un crédit immo)",
    },
    capitaux_restant_dus_immo: {
      type: "number",
      description: "Estimation du capital restant dû (CRD) sur les crédits immobiliers, en euros (si au moins un crédit immo)",
    },
    optin_assurance_pret: {
      type: "string",
      description: "Le client souhaite une évaluation gratuite de son assurance de prêt (proposé uniquement si 1 ou 2 crédits immo). Valeurs : Y=Oui, N=Non",
      enum: ["Y","N"],
    },

    // ── 5. Besoin de trésorerie ──
    tresorie: {
      type: "number",
      description: "Trésorerie supplémentaire souhaitée, en euros (vide si aucun besoin)",
    },

    // ── 6. Revenus ──
    salaire: {
      type: "number",
      description: "Revenus nets mensuels hors primes du client, en euros par mois",
    },
    prime: {
      type: "number",
      description: "Primes annuelles du client, en euros par an",
    },
    cj_salaire: {
      type: "number",
      description: "Revenus nets mensuels du co-emprunteur, en euros par mois (si co-emprunteur)",
    },
    cj_prime: {
      type: "number",
      description: "Primes annuelles du co-emprunteur, en euros par an (si co-emprunteur)",
    },
    autres_revenus: {
      type: "number",
      description: "Autres revenus mensuels du client (pensions, allocations, loyers perçus…), en euros par mois",
    },
    cj_autres_revenus: {
      type: "number",
      description: "Autres revenus mensuels du co-emprunteur, en euros par mois (si co-emprunteur)",
    },

    // ── 7. Charges mensuelles (si non propriétaire) ──
    type_locataire: {
      type: "string",
      description: "Statut d'occupation du logement (si le client n'est pas propriétaire). Valeurs : 1=Locataire, 2=Logé à titre gratuit",
      enum: ["1","2"],
    },
    montant_votre_loyer: {
      type: "number",
      description: "Montant du loyer mensuel, en euros par mois (si locataire)",
    },
    heberge_gratuit: {
      type: "string",
      description: "Par qui le client est hébergé (si logé à titre gratuit). Valeurs : 1=Famille, 2=Tiers, 3=Logement de fonction",
      enum: ["1","2","3"],
    },

    // ── 8. Informations complémentaires ──
    FICP: {
      type: "string",
      description: "Le client est-il fiché FICP (fiché à la Banque de France). Valeurs : 1=Oui, 2=Non",
      enum: ["1","2"],
    },
    deja_restructure: {
      type: "string",
      description: "Le client a-t-il déjà effectué une restructuration de dettes. Valeurs : 1=Oui, 2=Non",
      enum: ["1","2"],
    },

    // ── 9. Informations personnelles emprunteur ──
    dob: {
      type: "string",
      description: "Date de naissance du client (format YYYY-MM-DD)",
    },
    nationalite: {
      type: "string",
      description: "Nationalité du client. Valeurs : 1=France, 2=Union européenne, 3=Autres",
      enum: ["1","2","3"],
    },
    profession: {
      type: "string",
      description: "Profession du client. Valeurs : 1=Employé, 2=Cadre, 3=Commerçant, 4=Fonctionnaire, 5=Enseignant, 6=Agriculteur, 7=Artisan, 8=Chef d'entreprise, 9=Profession libérale, 10=VRP, 11=Étudiant, 12=Retraité, 13=Sans profession, 14=Recherche d'emploi, 15=Autre",
      enum: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"],
    },
    contrat_travail: {
      type: "string",
      description: "Type de contrat de travail du client. Valeurs : 1=CDI, 2=CDD, 3=Intérimaire, 4=Saisonnier, 5=Travailleur Non Salarié, 6=CDI (essai), 7=Secteur Public, 8=Intermittent du spectacle, 9=Autre / Retraité(e)",
      enum: ["1","2","3","4","5","6","7","8","9"],
    },
    anciennete: {
      type: "number",
      description: "Ancienneté chez l'employeur actuel, en années pleines",
    },

    // ── 10. Informations personnelles co-emprunteur ──
    cj_civilite: {
      type: "string",
      description: "Civilité du co-emprunteur. Valeurs : 1=Mr, 2=Mlle, 3=Mme",
      enum: ["1","2","3"],
    },
    cj_nom: {
      type: "string",
      description: "Nom de famille du co-emprunteur",
    },
    cj_prenom: {
      type: "string",
      description: "Prénom du co-emprunteur",
    },
    cj_dob: {
      type: "string",
      description: "Date de naissance du co-emprunteur (format YYYY-MM-DD)",
    },
    cj_profession: {
      type: "string",
      description: "Profession du co-emprunteur (mêmes codes que profession). Valeurs : 1=Employé, 2=Cadre, 3=Commerçant, 4=Fonctionnaire, 5=Enseignant, 6=Agriculteur, 7=Artisan, 8=Chef d'entreprise, 9=Profession libérale, 10=VRP, 11=Étudiant, 12=Retraité, 13=Sans profession, 14=Recherche d'emploi, 15=Autre",
      enum: ["1","2","3","4","5","6","7","8","9","10","11","12","13","14","15"],
    },
    cj_contrat_travail: {
      type: "string",
      description: "Type de contrat de travail du co-emprunteur (mêmes codes que contrat_travail). Valeurs : 1=CDI, 2=CDD, 3=Intérimaire, 4=Saisonnier, 5=Travailleur Non Salarié, 6=CDI (essai), 7=Secteur Public, 8=Intermittent du spectacle, 9=Autre / Retraité(e)",
      enum: ["1","2","3","4","5","6","7","8","9"],
    },
    cj_anciennete: {
      type: "number",
      description: "Ancienneté du co-emprunteur chez son employeur actuel, en années",
    },

    // ── 11. Coordonnées personnelles ──
    civilite: {
      type: "string",
      description: "Civilité du client. Valeurs : 1=Mr, 2=Mlle, 3=Mme",
      enum: ["1","2","3"],
    },
    nom: {
      type: "string",
      description: "Nom de famille du client (max 35 caractères)",
    },
    prenom: {
      type: "string",
      description: "Prénom du client (max 35 caractères)",
    },
    adresse: {
      type: "string",
      description: "Adresse postale du client (max 40 caractères)",
    },
    adresse1: {
      type: "string",
      description: "Complément d'adresse (max 40 caractères)",
    },
    cp: {
      type: "string",
      description: "Code postal (5 chiffres)",
    },
    ville: {
      type: "string",
      description: "Ville de résidence du client (max 40 caractères)",
    },
    pays: {
      type: "string",
      description: "Pays de résidence du client, code ISO (ex: FR, BE, GP, MQ)",
    },
    tel_mobile: {
      type: "string",
      description: "Numéro de téléphone mobile du client (10 chiffres)",
    },
    tel_domicile: {
      type: "string",
      description: "Numéro de téléphone fixe / domicile (10 chiffres)",
    },
    tel_bureau: {
      type: "string",
      description: "Numéro de téléphone du bureau (10 chiffres)",
    },
    periode_appel: {
      type: "string",
      description: "Période préférée pour être rappelé. Valeurs : 1=Indifférent, 2=Matin, 3=Après-midi, 4=Soirée",
      enum: ["1","2","3","4"],
    },
    email: {
      type: "string",
      description: "Adresse email du client (email valide, max 40 caractères)",
    },
  },
  required: [
    "locataire",
    "detail_projet",
    "projet_seul",
    "situation_famille",
    "nbre_enfant",
    "nb_credit_conso",
    "nb_credit_immo",
    "salaire",
    "FICP",
    "deja_restructure",
    "dob",
    "nationalite",
    "profession",
    "contrat_travail",
    "anciennete",
    "civilite",
    "nom",
    "prenom",
    "adresse",
    "cp",
    "ville",
    "pays",
    "email",
  ],
};

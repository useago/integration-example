export const CREDIT_SCHEMA = {
  // Sentence the agent reads to know when/how to call updateRequest (its only LLM-facing field).
  updateRequestDescription:
    "Met à jour la demande de rachat / regroupement de crédits. Appeler cette fonction dès qu'une " +
    "information est donnée, en regroupant dans `patch` tous les champs connus en un seul appel. " +
    "Les valeurs sont les codes définis dans tes instructions.",

  fields: [
    // ── 1. Projet de rachat de crédits ──
    {
      key: "locataire",
      type: "string",
      label: "Statut propriétaire",
      description: "Le client est-il propriétaire de son logement",
      enum: [
        { value: "1", label: "Propriétaire" },
        { value: "2", label: "Pas propriétaire" },
      ],
    },
    {
      key: "detail_projet",
      type: "string",
      label: "Détail du projet",
      description: "Type de démarche souhaitée",
      enum: [
        { value: "1", label: "Renégocier uniquement le prêt immobilier" },
        { value: "2", label: "Regrouper prêts conso et immo" },
        { value: "3", label: "Regrouper uniquement les prêts conso" },
      ],
    },
    {
      key: "projet_seul",
      type: "string",
      label: "Seul ou co-emprunteur",
      description: "Démarche faite seul ou avec un co-emprunteur",
      enum: [
        { value: "1", label: "Seul" },
        { value: "2", label: "Avec un co-emprunteur" },
      ],
    },

    // ── 2. Situation familiale ──
    {
      key: "situation_famille",
      type: "string",
      label: "Situation familiale",
      description: "Situation familiale du client",
      enum: [
        { value: "1", label: "Célibataire" },
        { value: "2", label: "Marié(e) / Pacsé(e)" },
        { value: "3", label: "Concubin(e)" },
        { value: "4", label: "Séparé(e)" },
        { value: "5", label: "Divorcé(e)" },
        { value: "6", label: "Veuf(ve)" },
      ],
    },
    {
      key: "nbre_enfant",
      type: "number",
      label: "Enfants à charge",
      description: "Nombre d'enfants à charge (de 0 à 9)",
    },

    // ── 3. Crédits à la consommation ──
    {
      key: "nb_credit_conso",
      type: "number",
      label: "Nombre de crédits conso",
      description:
        "Nombre de crédits à la consommation en cours (de 1 à 12 ; 13 = plus de 12)",
    },
    {
      key: "montant_remboursements_mensuel_conso",
      type: "number",
      label: "Mensualités conso",
      description:
        "Montant total des remboursements mensuels des crédits conso, en euros par mois (si au moins un crédit conso)",
    },
    {
      key: "capitaux_restant_dus_conso",
      type: "number",
      label: "Capital restant dû conso",
      description:
        "Estimation du capital restant dû (CRD) sur les crédits conso, en euros (si au moins un crédit conso)",
    },

    // ── 4. Crédits immobiliers ──
    {
      key: "nb_credit_immo",
      type: "number",
      label: "Nombre de crédits immo",
      description:
        "Nombre de crédits immobiliers en cours (de 0 à 12 ; 13 = plus de 12)",
    },
    {
      key: "montant_remboursements_mensuel_immo",
      type: "number",
      label: "Mensualités immo",
      description:
        "Montant total des remboursements mensuels des crédits immobiliers, en euros par mois (si au moins un crédit immo)",
    },
    {
      key: "capitaux_restant_dus_immo",
      type: "number",
      label: "Capital restant dû immo",
      description:
        "Estimation du capital restant dû (CRD) sur les crédits immobiliers, en euros (si au moins un crédit immo)",
    },
    {
      key: "optin_assurance_pret",
      type: "string",
      label: "Évaluation assurance de prêt",
      description:
        "Le client souhaite une évaluation gratuite de son assurance de prêt (proposé uniquement si 1 ou 2 crédits immo)",
      enum: [
        { value: "Y", label: "Oui" },
        { value: "N", label: "Non" },
      ],
    },

    // ── 5. Besoin de trésorerie ──
    {
      key: "tresorie",
      type: "number",
      label: "Trésorerie souhaitée",
      description:
        "Trésorerie supplémentaire souhaitée, en euros (vide si aucun besoin)",
    },

    // ── 6. Revenus ──
    {
      key: "salaire",
      type: "number",
      label: "Revenus mensuels",
      description:
        "Revenus nets mensuels hors primes du client, en euros par mois",
    },
    {
      key: "prime",
      type: "number",
      label: "Primes annuelles",
      description: "Primes annuelles du client, en euros par an",
    },
    {
      key: "cj_salaire",
      type: "number",
      label: "Co — Revenus mensuels",
      description:
        "Revenus nets mensuels du co-emprunteur, en euros par mois (si co-emprunteur)",
    },
    {
      key: "cj_prime",
      type: "number",
      label: "Co — Primes annuelles",
      description:
        "Primes annuelles du co-emprunteur, en euros par an (si co-emprunteur)",
    },
    {
      key: "autres_revenus",
      type: "number",
      label: "Autres revenus",
      description:
        "Autres revenus mensuels du client (pensions, allocations, loyers perçus…), en euros par mois",
    },
    {
      key: "cj_autres_revenus",
      type: "number",
      label: "Co — Autres revenus",
      description:
        "Autres revenus mensuels du co-emprunteur, en euros par mois (si co-emprunteur)",
    },

    // ── 7. Charges mensuelles (si locataire = 2, non propriétaire) ──
    {
      key: "type_locataire",
      type: "string",
      label: "Type d'occupation",
      description:
        "Statut d'occupation du logement (si le client n'est pas propriétaire)",
      enum: [
        { value: "1", label: "Locataire" },
        { value: "2", label: "Logé à titre gratuit" },
      ],
    },
    {
      key: "montant_votre_loyer",
      type: "number",
      label: "Loyer mensuel",
      description: "Montant du loyer mensuel, en euros par mois (si locataire)",
    },
    {
      key: "heberge_gratuit",
      type: "string",
      label: "Hébergé par",
      description: "Par qui le client est hébergé (si logé à titre gratuit)",
      enum: [
        { value: "1", label: "Famille" },
        { value: "2", label: "Tiers" },
        { value: "3", label: "Logement de fonction" },
      ],
    },

    // ── 8. Informations complémentaires ──
    {
      key: "FICP",
      type: "string",
      label: "Fiché FICP",
      description: "Le client est-il fiché FICP (fiché à la Banque de France)",
      enum: [
        { value: "1", label: "Oui" },
        { value: "2", label: "Non" },
      ],
    },
    {
      key: "deja_restructure",
      type: "string",
      label: "Déjà restructuré",
      description:
        "Le client a-t-il déjà effectué une restructuration de dettes",
      enum: [
        { value: "1", label: "Oui" },
        { value: "2", label: "Non" },
      ],
    },

    // ── 9. Informations personnelles emprunteur ──
    {
      key: "dob",
      type: "string",
      label: "Date de naissance",
      description: "Date de naissance du client (format YYYY-MM-DD)",
    },
    {
      key: "nationalite",
      type: "string",
      label: "Nationalité",
      description: "Nationalité du client",
      enum: [
        { value: "1", label: "France" },
        { value: "2", label: "Union européenne" },
        { value: "3", label: "Autres" },
      ],
    },
    {
      key: "profession",
      type: "string",
      label: "Profession",
      description: "Profession du client",
      enum: [
        { value: "1", label: "Employé" },
        { value: "2", label: "Cadre" },
        { value: "3", label: "Commerçant" },
        { value: "4", label: "Fonctionnaire" },
        { value: "5", label: "Enseignant" },
        { value: "6", label: "Agriculteur" },
        { value: "7", label: "Artisan" },
        { value: "8", label: "Chef d'entreprise" },
        { value: "9", label: "Profession libérale" },
        { value: "10", label: "VRP" },
        { value: "11", label: "Étudiant" },
        { value: "12", label: "Retraité" },
        { value: "13", label: "Sans profession" },
        { value: "14", label: "Recherche d'emploi" },
        { value: "15", label: "Autre" },
      ],
    },
    {
      key: "contrat_travail",
      type: "string",
      label: "Type de contrat",
      description: "Type de contrat de travail du client",
      enum: [
        { value: "1", label: "CDI" },
        { value: "2", label: "CDD" },
        { value: "3", label: "Intérimaire" },
        { value: "4", label: "Saisonnier" },
        { value: "5", label: "Travailleur Non Salarié" },
        { value: "6", label: "CDI (essai)" },
        { value: "7", label: "Secteur Public" },
        { value: "8", label: "Intermittent du spectacle" },
        { value: "9", label: "Autre / Retraité(e)" },
      ],
    },
    {
      key: "anciennete",
      type: "number",
      label: "Ancienneté",
      description: "Ancienneté chez l'employeur actuel, en années pleines",
    },

    // ── 10. Informations personnelles co-emprunteur (si co-emprunteur) ──
    {
      key: "cj_civilite",
      type: "string",
      label: "Co — Civilité",
      description: "Civilité du co-emprunteur",
      enum: [
        { value: "1", label: "Mr" },
        { value: "2", label: "Mlle" },
        { value: "3", label: "Mme" },
      ],
    },
    {
      key: "cj_nom",
      type: "string",
      label: "Co — Nom",
      description: "Nom de famille du co-emprunteur",
    },
    {
      key: "cj_prenom",
      type: "string",
      label: "Co — Prénom",
      description: "Prénom du co-emprunteur",
    },
    {
      key: "cj_dob",
      type: "string",
      label: "Co — Date de naissance",
      description: "Date de naissance du co-emprunteur (format YYYY-MM-DD)",
    },
    {
      key: "cj_profession",
      type: "string",
      label: "Co — Profession",
      description: "Profession du co-emprunteur (mêmes codes que profession)",
      enum: [
        { value: "1", label: "Employé" },
        { value: "2", label: "Cadre" },
        { value: "3", label: "Commerçant" },
        { value: "4", label: "Fonctionnaire" },
        { value: "5", label: "Enseignant" },
        { value: "6", label: "Agriculteur" },
        { value: "7", label: "Artisan" },
        { value: "8", label: "Chef d'entreprise" },
        { value: "9", label: "Profession libérale" },
        { value: "10", label: "VRP" },
        { value: "11", label: "Étudiant" },
        { value: "12", label: "Retraité" },
        { value: "13", label: "Sans profession" },
        { value: "14", label: "Recherche d'emploi" },
        { value: "15", label: "Autre" },
      ],
    },
    {
      key: "cj_contrat_travail",
      type: "string",
      label: "Co — Type de contrat",
      description:
        "Type de contrat de travail du co-emprunteur (mêmes codes que contrat_travail)",
      enum: [
        { value: "1", label: "CDI" },
        { value: "2", label: "CDD" },
        { value: "3", label: "Intérimaire" },
        { value: "4", label: "Saisonnier" },
        { value: "5", label: "Travailleur Non Salarié" },
        { value: "6", label: "CDI (essai)" },
        { value: "7", label: "Secteur Public" },
        { value: "8", label: "Intermittent du spectacle" },
        { value: "9", label: "Autre / Retraité(e)" },
      ],
    },
    {
      key: "cj_anciennete",
      type: "number",
      label: "Co — Ancienneté",
      description:
        "Ancienneté du co-emprunteur chez son employeur actuel, en années",
    },

    // ── 11. Coordonnées personnelles ──
    {
      key: "civilite",
      type: "string",
      label: "Civilité",
      description: "Civilité du client",
      enum: [
        { value: "1", label: "Mr" },
        { value: "2", label: "Mlle" },
        { value: "3", label: "Mme" },
      ],
    },
    {
      key: "nom",
      type: "string",
      label: "Nom",
      description: "Nom de famille du client (max 35 caractères)",
    },
    {
      key: "prenom",
      type: "string",
      label: "Prénom",
      description: "Prénom du client (max 35 caractères)",
    },
    {
      key: "adresse",
      type: "string",
      label: "Adresse",
      description: "Adresse postale du client (max 40 caractères)",
    },
    {
      key: "adresse1",
      type: "string",
      label: "Complément d'adresse",
      description: "Complément d'adresse (max 40 caractères)",
    },
    {
      key: "cp",
      type: "string",
      label: "Code postal",
      description: "Code postal (5 chiffres)",
    },
    {
      key: "ville",
      type: "string",
      label: "Ville",
      description: "Ville de résidence du client (max 40 caractères)",
    },
    {
      key: "pays",
      type: "string",
      label: "Pays",
      description: "Pays de résidence du client, code ISO (ex: FR, BE, GP, MQ)",
    },
    {
      key: "tel_mobile",
      type: "string",
      label: "Téléphone mobile",
      description: "Numéro de téléphone mobile du client (10 chiffres)",
    },
    {
      key: "tel_domicile",
      type: "string",
      label: "Téléphone fixe",
      description: "Numéro de téléphone fixe / domicile (10 chiffres)",
    },
    {
      key: "tel_bureau",
      type: "string",
      label: "Téléphone bureau",
      description: "Numéro de téléphone du bureau (10 chiffres)",
    },
    {
      key: "periode_appel",
      type: "string",
      label: "Période de rappel",
      description: "Période préférée pour être rappelé",
      enum: [
        { value: "1", label: "Indifférent" },
        { value: "2", label: "Matin" },
        { value: "3", label: "Après-midi" },
        { value: "4", label: "Soirée" },
      ],
    },
    {
      key: "email",
      type: "string",
      label: "Email",
      description: "Adresse email du client (email valide, max 40 caractères)",
    },
  ],
};

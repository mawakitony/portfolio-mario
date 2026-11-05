export const agency = {
  name: "MARDIGITAL",
  legalName: "MARDIGITAL AGENCE",
  signature: "The Brand World",
  director: "Amevor Kossi Mario",
  role: "Directeur créatif",
  email: "mardigitalagence@gmail.com",
  phones: [
    { display: "+228 70 40 84 32", href: "tel:+22870408432" },
    { display: "+228 97 28 68 29", href: "tel:+22897286829" },
  ],
  location: "Togo",
  countryCode: "TG",
  promise: "Créer, diffuser et former pour que votre image parle d'elle-même.",
  about: [
    "MARDIGITAL AGENCE est une agence spécialisée en communication visuelle, design graphique, production audiovisuelle, live streaming et formation professionnelle.",
    "Depuis sa création, sa mission est de transformer des idées en expériences marquantes. Le travail repose sur le sens du détail, l'écoute et des solutions construites pour chaque marque.",
    "Une identité visuelle bien pensée n'est pas seulement esthétique : elle est stratégique, mémorable et alignée avec l'ADN de la marque.",
    "L'agence permet à ses clients de toucher un public plus large avec des solutions techniques adaptées, et une qualité tenue jusqu'à la diffusion.",
  ],
  services: [
    {
      slug: "branding",
      title: "Branding",
      summary: "Identités visuelles fortes, logos et chartes graphiques.",
    },
    {
      slug: "design-graphique",
      title: "Design graphique",
      summary: "Affiches, flyers, brochures et contenus pour les réseaux sociaux.",
    },
    {
      slug: "motion-design",
      title: "Motion design",
      summary: "Habillage animé et motion pour les films, les réseaux et les identités.",
    },
    {
      slug: "production-video",
      title: "Production vidéo",
      summary:
        "Tournage, montage, étalonnage, clips, publicités, interviews, reels, aftermovies et reportages.",
    },
    {
      slug: "photographie",
      title: "Photographie",
      summary: "Shooting et photographie professionnelle.",
    },
    {
      slug: "live-streaming",
      title: "Live streaming",
      summary: "Diffusion en direct multi-caméras.",
    },
    {
      slug: "formation",
      title: "Formation",
      summary:
        "Photoshop, Illustrator, Premiere Pro, CapCut, DaVinci Resolve et Vmix. Cours en ligne, en présentiel ou hybrides, et accompagnement de créatifs indépendants.",
    },
  ],
} as const;

export type AgencyService = (typeof agency.services)[number];

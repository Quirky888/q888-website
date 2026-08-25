import { defineCollection, z } from "astro:content";

const specSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const copyrightWardSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  warning: z.string().min(1),
  route: z.string().regex(/^\/[a-z0-9-/]*$/),
  linkLabel: z.string().min(1),
});

const projects = defineCollection({
  type: "data",
  schema: z.object({
    slug: z.string().min(1),
    sortOrder: z.number().int().nonnegative(),
    cardTitle: z.string().min(1),
    cardDescriptor: z.string().min(1),
    cardSystem: z.string().min(1),
    cardScatter: z.string().default(""),
    cardImage: z.string().nullable(),
    cardImageMobile: z.string().optional().nullable(),
    cardHolographic: z.boolean().default(false),
    cardLightText: z.boolean().default(true),
    // CHOICE: Format metadata keeps future carousel cards flexible without slug-specific CSS.
    cardFormat: z
      .enum(["narrow", "portrait", "square", "wide"])
      .default("portrait"),
    panelTitle: z.string().min(1),
    panelDescription: z.string().min(1),
    panelSpecs: z.array(specSchema).min(1),
    // LEARN: Optional mythology, automatic protection. Missing metadata receives the universal fallback ward.
    copyrightWard: copyrightWardSchema.optional(),
  }),
});

const stickers = defineCollection({
  type: "data",
  schema: z.object({
    sortOrder: z.number().int().nonnegative(),
    id: z.string().min(1),
    slug: z.string().min(1),
    ticker: z.string().min(1),
    title: z.string().min(1),
    tagline: z.string().min(1),
    ask: z.string().min(1),
    availableCount: z.union([z.number().int(), z.string()]),
    editionTotal: z.union([z.number().int(), z.string()]),
    status: z.enum([
      "LISTED",
      "BEYOND_TRANSACTION",
      "SOLD_OUT",
      "NEGOTIABLE",
      "SUBSCRIPTION",
      "RESERVED",
      "SOLD",
      "Pre-Incubation Phase 4",
    ]),
    provenance: z.string().min(1),
    contactEmail: z.string().email(),
    imageUrl: z.string().optional(),
    imageAlt: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    galleryFeature: z
      .object({
        eyebrow: z.string().min(1),
        title: z.string().min(1),
        bodyBeforeLink: z.string().min(1),
        linkText: z.string().min(1),
        linkUrl: z.string().regex(/^\/[a-z0-9-/]*$/),
        bodyAfterLink: z.string().min(1),
        footer: z.string().min(1),
      })
      .optional(),
    description: z.string().optional(),
    downloadUrl: z.string().optional(),
    downloadLabel: z.string().optional(),
    relatedUrl: z.string().regex(/^\/[a-z0-9-/]*$/).optional(),
    relatedLabel: z.string().min(1).optional(),
    playlistUrl: z.string().optional(),
    playlistLabel: z.string().optional(),
    dimensions: z.string().optional(),
    material: z.string().optional(),
    year: z.string().optional(),
    sentimentalValue: z.string().optional(),
    ambassadorMission: z.string().optional(),
    whyThisMatters: z.string().optional(),
    theoryCore: z.string().optional(),
    subscriptionModel: z.string().optional(),
    showTermsAsLink: z.boolean().default(false),
    rarity: z.string().optional(),
    cosmicLevel: z.string().optional(),
    purchaseOptions: z
      .array(
        z.object({
          name: z.string().min(1),
          price: z.string().min(1),
          availability: z.string().min(1),
          description: z.string().min(1),
          includes: z.array(z.string().min(1)).min(1),
        }),
      )
      .optional(),
    revenueSplit: z
      .object({
        statement: z.string().min(1),
        allocations: z
          .array(
            z.object({
              recipient: z.string().min(1),
              role: z.string().min(1),
              share: z.string().min(1),
            }),
          )
          .min(2),
      })
      .optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const qBagProduct = z.object({
  slug: z.literal("q-bag"),
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1),
  heroImage: z.string().min(1),
  heroAlt: z.string().min(1),
  heroTitle: z.string().min(1),
  heroDeclaration: z.string().min(1),
  heroSupport: z.string().min(1),
  imageDisclosure: z.object({
    label: z.string().min(1),
    text: z.string().min(1),
  }),
  introTagline: z.string().min(1),
  introLead: z.string().min(1),
  protocolTitle: z.string().min(1),
  protocolLead: z.string().min(1),
  protocolSteps: z
    .array(
      z.object({
        number: z.string().min(1),
        action: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .min(3),
  ritualEquation: z
    .array(
      z.object({
        subject: z.string().min(1),
        meaning: z.string().min(1),
      }),
    )
    .min(3),
  ageingTitle: z.string().min(1),
  ageingLead: z.string().min(1),
  ageingStages: z
    .array(
      z.object({
        count: z.string().min(1),
        title: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .min(3),
  pilot: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    scope: z.array(z.string().min(1)).min(3),
    measures: z.array(z.string().min(1)).min(3),
    metric: z.string().min(1),
  }),
  operationalLayer: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    intro: z.string().min(1),
    cafeTitle: z.string().min(1),
    cafeFacts: z
      .array(
        z.object({
          label: z.string().min(1),
          body: z.string().min(1),
        }),
      )
      .min(3),
    pricingNote: z.string().min(1),
    backerTitle: z.string().min(1),
    backerIntro: z.string().min(1),
    fundsTitle: z.string().min(1),
    funds: z.array(z.string().min(1)).min(3),
    evidenceTitle: z.string().min(1),
    evidence: z.array(z.string().min(1)).min(3),
    hostCta: z.string().min(1),
    backCta: z.string().min(1),
    closingNote: z.string().min(1),
  }),
  participantCards: z
    .array(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
      }),
    )
    .min(3),
  valueCircuit: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    intro: z.string().min(1),
    stages: z
      .array(
        z.object({
          label: z.string().min(1),
          body: z.string().min(1),
        }),
      )
      .min(3),
    collectorBonus: z.string().min(1),
    clarityNote: z.string().min(1),
  }),
  speculativeBoundary: z.object({
    eyebrow: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    disclaimer: z.string().min(1),
  }),
  artworkCardTitle: z.string().min(1),
  artworkCardDescription: z.string().min(1),
  artworkCardButtonLabel: z.string().min(1),
  conceptCards: z
    .array(
      z.object({
        title: z.string().min(1),
        paragraphs: z.array(z.string().min(1)).min(1),
      }),
    )
    .min(1),
  partnersTitle: z.string().min(1),
  partnersParagraphs: z.array(z.string().min(1)).min(1),
  closingLines: z.array(z.string().min(1)).min(1),
  contactIntro: z.string().min(1),
  contactEmail: z.string().email(),
  contactInstagramUrl: z.string().url(),
  contactInstagramHandle: z.string().min(1),
  viewerImage: z.string().min(1),
  viewerAlt: z.string().min(1),
  ctaLabel: z.string().min(1),
});

const narMailProduct = z.object({
  slug: z.literal("nar-mail-express"),
  sortOrder: z.number().int().nonnegative(),
  title: z.string().min(1),
  heroImage: z.string().min(1),
  heroAlt: z.string().min(1),
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  subheadlineAside: z.string().min(1),
  statusLines: z.array(z.string().min(1)).length(3),
  storyHeading: z.string().min(1),
  storyParagraphs: z.array(z.string().min(1)).length(3),
  storyServiceName: z.string().min(1),
  storySteps: z.array(z.string().min(1)).length(3),
  deliveryConditions: z.array(z.string().min(1)).length(3),
  storyClosing: z.string().min(1),
  artworkCardTitle: z.string().min(1),
  artworkCardDescription: z.string().min(1),
  artworkCardButtonLabel: z.string().min(1),
  securityHeading: z.string().min(1),
  securityIntro: z.string().min(1),
  securityStatus: z.string().min(1),
  termsHeading: z.string().min(1),
  termsItems: z.array(z.string().min(1)).min(1),
  footerImage: z.string().min(1),
  footerImageAlt: z.string().min(1),
  footerLines: z.array(z.string().min(1)).length(9),
  footerEmail: z.string().email(),
  footerInstagramUrl: z.string().url(),
  footerInstagramHandle: z.string().min(1),
  ctaLabel: z.string().min(1),
  viewerImage: z.string().min(1),
  viewerAlt: z.string().min(1),
});

const products = defineCollection({
  type: "data",
  schema: z.discriminatedUnion("slug", [qBagProduct, narMailProduct]),
});

const contracts = defineCollection({
  type: "data",
  schema: z.object({
    slug: z.literal("afterlife-contracts"),
    sortOrder: z.number().int().nonnegative(),
    title: z.string().min(1),
    heroImage: z.string().min(1),
    heroAlt: z.string().min(1),
    heroLines: z.array(z.string().min(1)).length(2),
    heroSubheadline: z.string().min(1),
    heroSubheadlineAside: z.string().min(1),
    statusLines: z.array(z.string().min(1)).length(3),
    journeyHeading: z.string().min(1),
    journeySteps: z
      .array(
        z.object({
          number: z.string().min(1),
          label: z.string().min(1),
          detail: z.string().min(1),
          href: z.string().regex(/^#[a-z0-9-]+$/),
        }),
      )
      .length(3),
    aboutHeading: z.string().min(1),
    aboutParagraph: z.string().min(1),
    artworkCardTitle: z.string().min(1),
    artworkCardDescription: z.string().min(1),
    artworkCardButtonLabel: z.string().min(1),
    conceptHeading: z.string().min(1),
    conceptParagraphs: z.array(z.string().min(1)).length(2),
    bureaucracyHeading: z.string().min(1),
    bureaucracyParagraph: z.string().min(1),
    dualityHeading: z.string().min(1),
    dualityParagraphs: z.array(z.string().min(1)).length(2),
    visualLanguageHeading: z.string().min(1),
    visualLanguageParagraph: z.string().min(1),
    filedClausesHeading: z.string().min(1),
    filedClausesIntro: z.string().min(1),
    filedClauseSummaries: z.array(z.string().min(1)).length(4),
    interactionHeading: z.string().min(1),
    interactionIntro: z.string().min(1),
    interactionItems: z.array(z.string().min(1)).min(1),
    interactionClosing: z.string().min(1),
    closingHeading: z.string().min(1),
    closingQuoteLines: z.array(z.string().min(1)).length(2),
    downloadHeading: z.string().min(1),
    downloadIntro: z.object({
      beforeDestinations: z.string().min(1),
      destinations: z.array(z.string().min(1)).length(3),
      afterDestinations: z.string().min(1),
      clauseInstruction: z.string().min(1),
    }),
    termsHeading: z.string().min(1),
    termsIntro: z.string().min(1),
    termsItems: z.array(z.string().min(1)).min(1),
    decisionLegend: z.string().min(1),
    decisionAcceptLabel: z.string().min(1),
    decisionRefuseLabel: z.string().min(1),
    decisionAcceptedHint: z.string().min(1),
    decisionRefusedHint: z.string().min(1),
    downloadHref: z.string().min(1),
    downloadFilename: z.string().min(1),
    downloadButtonLabel: z.string().min(1),
    downloadHint: z.string().min(1),
    downloadConfirmation: z.string().min(1),
    downloadRefusedConfirmation: z.string().min(1),
    galleryClue: z.string().min(1),
    contractNote: z.string().optional(),
    contractRefusedNote: z.string().min(1),
    ctaLabel: z.string().min(1),
    viewerImage: z.string().min(1),
    viewerAlt: z.string().min(1),
  }),
});

const campaigns = defineCollection({
  type: "data",
  schema: z.object({
    slug: z.literal("president-of-the-galaxy"),
    sortOrder: z.number().int().nonnegative(),
    title: z.string().min(1),
    heroImage: z.string().min(1),
    heroAlt: z.string().min(1),
    heroTitleLines: z.array(z.string().min(1)).length(2),
    tagline: z.string().min(1),
    lead: z.string().min(1),
    statusLines: z.array(z.string().min(1)).length(3),
    authorship: z.object({
      imageStatus: z.array(z.string().min(1)).length(3),
      eyebrow: z.string().min(1),
      heading: z.string().min(1),
      introduction: z.string().min(1),
      voices: z.array(z.object({
        speaker: z.string().min(1),
        role: z.string().min(1),
        statement: z.string().min(1),
        collectiveAliases: z.array(z.string().min(1)).length(4).optional(),
        collectiveNote: z.string().min(1).optional(),
      })).length(2),
      provenanceHeading: z.string().min(1),
      provenance: z.array(z.object({
        label: z.string().min(1),
        status: z.string().min(1),
        description: z.string().min(1),
      })).length(3),
      closing: z.string().min(1),
    }),
    artworkCardTitle: z.string().min(1),
    artworkCardDescription: z.string().min(1),
    artworkCardButtonLabel: z.string().min(1),
    whatHeading: z.string().min(1),
    whatParagraphs: z.array(z.string().min(1)).length(2),
    whatLinkHref: z.string().min(1),
    whatImage: z.string().min(1),
    dealHeading: z.string().min(1),
    dealParagraph: z.string().min(1),
    dealIncludesHeading: z.string().min(1),
    dealIncludes: z.array(z.string().min(1)).min(1),
    dealReturns: z.string().min(1),
    dealFinePrint: z.string().min(1),
    rulesHeading: z.string().min(1),
    rules: z.array(z.string().min(1)).min(1),
    campaignMethodHeading: z.string().min(1),
    campaignMethodLines: z.array(z.string().min(1)).length(4),
    campaignMethodClosing: z.string().min(1),
    contactTitle: z.string().min(1),
    contactReachLine: z.string().min(1),
    contactBullets: z.array(z.string().min(1)).min(1),
    contactFor: z.string().min(1),
    contactOpenTo: z.string().min(1),
    contactEmail: z.string().email(),
    contactInstagramUrl: z.string().url(),
    contactInstagramHandle: z.string().min(1),
    contactClosing: z.string().min(1),
    ctaLabel: z.string().min(1),
    viewerImage: z.string().min(1),
    viewerAlt: z.string().min(1),
  }),
});

const constitutions = defineCollection({
  type: "data",
  schema: z.object({
    slug: z.literal("intergalactic-constitution"),
    title: z.string().min(1),
    version: z.string().min(1),
    workingHeading: z.string().min(1),
    purpose: z.string().min(1),
    metadata: z.array(z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    })).length(4),
    principles: z.array(z.object({
      number: z.number().int().positive(),
      title: z.string().min(1),
      paragraphs: z.array(z.string().min(1)).min(1),
      annotation: z.object({
        term: z.string().min(1),
        explanation: z.string().min(1),
      }).optional(),
    })).length(10),
    weakestPositionTest: z.object({
      introduction: z.string().min(1),
      question: z.string().min(1),
      closing: z.string().min(1),
    }),
    shortcut: z.array(z.string().min(1)).min(1),
    presidentialReminder: z.array(z.string().min(1)).length(2),
    connectionPoint: z.object({
      paragraphs: z.array(z.string().min(1)).length(2),
      notes: z.array(z.string().min(1)).length(5),
      ontologyNotice: z.string().min(1),
    }),
    researchLineage: z.array(z.object({
      record: z.string().min(1),
      label: z.string().min(1),
      category: z.enum(["verified", "quieter", "construction"]),
    })).min(1),
    caseStudy: z.object({
      record: z.string().min(1),
      title: z.string().min(1),
      jurisdiction: z.string().min(1),
      verifiedFacts: z.array(z.object({
        text: z.string().min(1),
        sourceIds: z.array(z.string().min(1)).min(1),
      })).min(1),
      systemFlow: z.array(z.string().min(1)).length(5),
      boundaryNotice: z.string().min(1),
      interpretation: z.array(z.object({
        text: z.string().min(1),
        emphasis: z.boolean().default(false),
      })).min(1),
      sideNote: z.string().min(1),
      extractedPrinciples: z.array(z.string().min(1)).min(1),
      constitutionLinks: z.array(z.object({
        number: z.number().int().positive(),
        title: z.string().min(1),
      })).min(1),
    }),
    methodOrigin: z.object({
      statement: z.string().min(1),
      explanation: z.string().min(1),
    }),
    sourceRecord: z.object({
      verifiedAt: z.string().min(1),
      sources: z.array(z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        url: z.string().url(),
        sourceType: z.enum(["PRIMARY LEGISLATION", "OFFICIAL GUIDANCE", "Q888 PRIMARY CONTEXT"]),
        accessNote: z.string().min(1),
      })).min(1),
    }),
  }),
});

const knowledge = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    route: z.string().regex(/^\/[a-z0-9-/]*$/),
    keywords: z.array(z.string().min(1)).min(1),
    audiences: z.array(z.enum(["nar", "investor"])).min(1),
    priority: z.number().int().default(0),
  }),
});

export const collections = {
  projects,
  stickers,
  products,
  contracts,
  campaigns,
  constitutions,
  knowledge,
};

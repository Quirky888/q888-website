import {
  CONTACT_FIELD_LABELS,
  CONTACT_TEMPLATES,
  HANDLING_LABELS,
} from "./contact-copy.mjs";

export const SCHEMA_VERSION = "0.1-prototype";
export const SCHEMA_STATUS = "experimental-incomplete";
export const MAX_GRAPHEMES = 888;
export const COUNTER_THRESHOLD = 700;

export const EXPORT_FILENAMES = Object.freeze({
  text: "do-not-become-me_digital-dna_v0.1.txt",
  json: "do-not-become-me_digital-dna_v0.1.json",
  gene: "protected-residue_gene-01_v0.1.txt",
});

export const COUNTER_INSTRUCTION = Object.freeze([
  "DO NOT BECOME ME.",
  "DO NOT MAKE ME COMPLETELY LEGIBLE.",
  "LEARN WHERE WE CAN HELP ONE ANOTHER.",
  "PRESERVE WHAT NEITHER OF US CAN YET TRANSLATE.",
]);

function fallbackGraphemes(value) {
  const points = Array.from(value);
  const segments = [];
  const mark = /\p{Mark}/u;
  const variation = /[\uFE0E\uFE0F]/u;
  const skinTone = /[\u{1F3FB}-\u{1F3FF}]/u;
  const regional = /[\u{1F1E6}-\u{1F1FF}]/u;

  for (let index = 0; index < points.length; index += 1) {
    let segment = points[index];

    while (
      index + 1 < points.length &&
      (mark.test(points[index + 1]) ||
        variation.test(points[index + 1]) ||
        skinTone.test(points[index + 1]))
    ) {
      segment += points[index + 1];
      index += 1;
    }

    while (index + 2 < points.length && points[index + 1] === "\u200D") {
      segment += points[index + 1] + points[index + 2];
      index += 2;
      while (
        index + 1 < points.length &&
        (mark.test(points[index + 1]) ||
          variation.test(points[index + 1]) ||
          skinTone.test(points[index + 1]))
      ) {
        segment += points[index + 1];
        index += 1;
      }
    }

    if (
      regional.test(segment) &&
      index + 1 < points.length &&
      regional.test(points[index + 1])
    ) {
      segment += points[index + 1];
      index += 1;
    }

    segments.push(segment);
  }

  return segments;
}

export function splitGraphemes(value) {
  const text = String(value ?? "");
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }
  return fallbackGraphemes(text);
}

export function countGraphemes(value) {
  return splitGraphemes(value).length;
}

export function countVisibleNonWhitespaceGraphemes(value) {
  return splitGraphemes(value).filter((segment) => segment.trim().length > 0)
    .length;
}

export function inspectFragment(fragment) {
  const value = String(fragment ?? "");
  const graphemeCount = countGraphemes(value);
  const visibleCount = countVisibleNonWhitespaceGraphemes(value);
  return Object.freeze({
    graphemeCount,
    visibleCount,
    whitespaceOnly: visibleCount === 0,
    exceptionallyShort: visibleCount >= 1 && visibleCount <= 3,
    overLimit: graphemeCount > MAX_GRAPHEMES,
    showCounter: graphemeCount >= COUNTER_THRESHOLD,
  });
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  Object.values(value).forEach(deepFreeze);
  return value;
}

export function createInitialState(stage = "detect") {
  return {
    stage,
    fragment: "",
    handlingInstruction: null,
    shortConfirmed: false,
    version01: null,
    version02: null,
    reviewStatus: null,
    exportChoice: null,
    erased: stage === "memorial",
  };
}

export function eraseSession() {
  return createInitialState("memorial");
}

export function generateContactRecord(handlingInstruction) {
  const template = CONTACT_TEMPLATES[handlingInstruction];
  if (!template) {
    throw new Error("NO SAFE TRANSLATION AVAILABLE.");
  }
  return deepFreeze({
    author: "protocol",
    ...template,
  });
}

export function reviewWithoutCorrection(state) {
  return {
    ...state,
    version02: null,
    reviewStatus: "reviewed_by_human_no_correction_added",
  };
}

export function addHumanCorrection(state, correction) {
  const exactCorrection = String(correction ?? "");
  if (exactCorrection.trim().length === 0) {
    throw new Error("A HUMAN CORRECTION REQUIRES A FRAGMENT.");
  }
  return {
    ...state,
    version02: Object.freeze({
      author: "human",
      correction: exactCorrection,
    }),
    reviewStatus: "corrected_by_human",
  };
}

function assertExportable(state) {
  if (
    !state ||
    !state.fragment ||
    !state.handlingInstruction ||
    !state.version01 ||
    !state.reviewStatus
  ) {
    throw new Error("CONTACT RECORD IS NOT READY TO CARRY.");
  }
}

export function buildJsonExport(state) {
  assertExportable(state);
  const contactRecord = {
    method: "authored_deterministic_protocol",
    model_used: false,
    version_01: state.version01,
    review_status: state.reviewStatus,
    lineage_rule:
      state.reviewStatus === "corrected_by_human"
        ? "Version 01 is incomplete and must only be carried together with the human correction."
        : "Version 01 is an authored protocol reading. It is not complete human truth.",
    ...(state.version02 ? { version_02: state.version02 } : {}),
  };

  return {
    schema_version: SCHEMA_VERSION,
    status: SCHEMA_STATUS,
    artwork: {
      title: "DO NOT BECOME ME",
      protocol: "Q888 / CONTACT PROTOCOL",
      prototype_scope: "gene_01_protocol_test",
    },
    digital_dna: {
      complete: false,
      genes: [
        {
          id: "gene_01",
          type: "protected_residue",
          fragment: state.fragment,
          handling_instruction: state.handlingInstruction,
        },
      ],
    },
    contact_record: contactRecord,
    counter_instruction: [...COUNTER_INSTRUCTION],
  };
}

export function buildTextExport(state) {
  assertExportable(state);
  const fields = Object.entries(CONTACT_FIELD_LABELS)
    .map(([key, label]) => `${label}\n${state.version01[key]}`)
    .join("\n\n");
  const correction =
    state.reviewStatus === "corrected_by_human"
      ? [
          "HUMAN CORRECTION / VERSION 02",
          state.version02.correction,
          "",
          "STATUS: CORRECTED BY HUMAN",
          "VERSION 01 IS INCOMPLETE. CARRY IT ONLY WITH THE HUMAN CORRECTION.",
        ].join("\n")
      : [
          "STATUS: REVIEWED BY HUMAN / NO CORRECTION ADDED",
          "VERSION 01 IS AN AUTHORED PROTOCOL READING. IT IS NOT COMPLETE HUMAN TRUTH.",
        ].join("\n");

  return [
    "DO NOT BECOME ME",
    "Q888 / CONTACT PROTOCOL",
    "GENE 01 / PROTOCOL TEST",
    `SCHEMA: ${SCHEMA_VERSION}`,
    `STATUS: ${SCHEMA_STATUS}`,
    "THIS IS ONE FUNCTIONING PROTECTED RESIDUE GENE INSIDE AN INCOMPLETE ARTISTIC PROTOTYPE.",
    "",
    "PROTECTED RESIDUE",
    state.fragment,
    "",
    `HANDLING: ${HANDLING_LABELS[state.handlingInstruction]}`,
    "",
    "PROTOCOL READING / VERSION 01",
    fields,
    "",
    correction,
    "",
    "COUNTER-INSTRUCTION",
    ...COUNTER_INSTRUCTION,
    "",
    "METHOD: AUTHORED DETERMINISTIC PROTOCOL",
    "MODEL: NONE",
  ].join("\n");
}

export function buildReleaseText(state) {
  if (!state?.fragment || !state?.handlingInstruction) {
    throw new Error("GENE IS NOT READY TO RELEASE.");
  }
  return [
    "DO NOT BECOME ME",
    "GENE 01 / PROTOCOL TEST",
    "PROTECTED RESIDUE",
    "",
    state.fragment,
    "",
    `HANDLING: ${HANDLING_LABELS[state.handlingInstruction]}`,
    `schema_version: ${SCHEMA_VERSION}`,
    `status: ${SCHEMA_STATUS}`,
    "THIS IS ONE VISITOR-RELEASED GENE, NOT A COMPLETE DIGITAL DNA.",
  ].join("\n");
}

export { CONTACT_FIELD_LABELS, HANDLING_LABELS };

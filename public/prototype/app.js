import {
  CONTACT_FIELD_LABELS,
  EXPORT_FILENAMES,
  HANDLING_LABELS,
  addHumanCorrection,
  buildJsonExport,
  buildReleaseText,
  buildTextExport,
  createInitialState,
  eraseSession,
  generateContactRecord,
  inspectFragment,
  reviewWithoutCorrection,
} from "./core.mjs";

const stages = {
  welcome: document.querySelector("#stage-welcome"),
  detect: document.querySelector("#stage-detect"),
  interrupt: document.querySelector("#stage-interrupt"),
  assemble: document.querySelector("#stage-assemble"),
  contact: document.querySelector("#stage-contact"),
  decide: document.querySelector("#stage-decide"),
  memorial: document.querySelector("#stage-memorial"),
};

const stageLabels = {
  welcome: "ORIENTATION",
  detect: "01 — DETECT",
  interrupt: "02 — INTERRUPT",
  assemble: "03 — ASSEMBLE",
  contact: "04 — ATTEMPT CONTACT",
  decide: "05 — DECIDE",
  memorial: "CONTACT ENDED",
};

const humanStageLabels = {
  welcome: "BEFORE YOU BEGIN",
  detect: "STEP 1 OF 5 — UNDERSTAND THE SYSTEM",
  interrupt: "STEP 2 OF 5 — SET A CONDITION",
  assemble: "STEP 3 OF 5 — REVIEW YOUR CONDITION",
  contact: "STEP 4 OF 5 — RESPOND TO THE READING",
  decide: "STEP 5 OF 5 — DECIDE WHAT CONTINUES",
  memorial: "THE OPEN SESSION IS EMPTY",
};

const progressStages = ["detect", "interrupt", "assemble", "contact", "decide"];

const contactFieldHelp = {
  what_i_registered: "What the protocol recorded.",
  what_i_may_have_assumed: "Where it may have exceeded your words.",
  untranslatable_human: "What your words cannot fully communicate here.",
  untranslatable_artificial: "What the protocol admits it cannot know or do.",
  cooperation_possible: "The limited action permitted by your choice.",
};

const fragmentForm = document.querySelector("#fragment-form");
const fragmentInput = document.querySelector("#fragment");
const fragmentCounter = document.querySelector("#fragment-counter");
const fragmentError = document.querySelector("#fragment-error");
const shortConfirmation = document.querySelector("#short-confirmation");
const shortFragment = document.querySelector("#short-fragment");
const correctionForm = document.querySelector("#correction-form");
const correctionInput = document.querySelector("#correction");
const correctionError = document.querySelector("#correction-error");
const reviewActions = document.querySelector("#review-actions");
const reviewResult = document.querySelector("#review-result");
const version02Panel = document.querySelector("#version-02");
const noCorrectionPanel = document.querySelector("#no-correction");
const lineageWarning = document.querySelector("#lineage-warning");
const decisionStatus = document.querySelector("#decision-status");
const exportDialog = document.querySelector("#export-dialog");
const eraseDialog = document.querySelector("#erase-dialog");
const bothDownloads = document.querySelector("#both-downloads");
const manualCopy = document.querySelector("#manual-copy");
const manualCopyLabel = document.querySelector("#manual-copy-label");
const liveStatus = document.querySelector("#live-status");

let state = createInitialState();
const activeObjectUrls = new Set();

function announce(message) {
  liveStatus.textContent = "";
  window.requestAnimationFrame(() => {
    liveStatus.textContent = message;
  });
}

function selectedHandling() {
  return fragmentForm.querySelector('input[name="handling"]:checked')?.value ?? null;
}

function setStage(nextStage, { focus = true } = {}) {
  Object.entries(stages).forEach(([name, element]) => {
    element.hidden = name !== nextStage;
  });
  state.stage = nextStage;
  document.querySelector("#stage-label").textContent = stageLabels[nextStage];
  document.querySelector("#human-stage-label").textContent =
    humanStageLabels[nextStage];
  const currentIndex = progressStages.indexOf(nextStage);
  document.querySelectorAll("[data-progress]").forEach((item, index) => {
    const isCurrent = index === currentIndex;
    const isComplete = nextStage === "memorial" || (currentIndex >= 0 && index < currentIndex);
    item.classList.toggle("is-current", isCurrent);
    item.classList.toggle("is-complete", isComplete);
    if (isCurrent) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });
  if (focus) {
    const heading = stages[nextStage].querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus();
  }
  announce(`${stageLabels[nextStage]}.`);
}

function setError(message) {
  fragmentError.textContent = message;
  if (message) {
    announce(message);
  }
}

function updateCounter() {
  const inspection = inspectFragment(fragmentInput.value);
  fragmentCounter.textContent = `${inspection.graphemeCount} / 888`;
  fragmentCounter.hidden = !inspection.showCounter;
  fragmentCounter.classList.toggle("over-limit", inspection.overLimit);
}

function syncStateFromInterrupt() {
  state.fragment = fragmentInput.value;
  state.handlingInstruction = selectedHandling();
}

function renderAssembledGene() {
  document.querySelector("#assembled-fragment").textContent = state.fragment;
  document.querySelector("#assembled-handling").textContent =
    HANDLING_LABELS[state.handlingInstruction];
}

function renderContactRecord() {
  document.querySelector("#contact-fragment").textContent = state.fragment;
  document.querySelector("#contact-handling").textContent =
    HANDLING_LABELS[state.handlingInstruction];

  const fieldList = document.querySelector("#contact-fields");
  fieldList.replaceChildren();
  Object.entries(CONTACT_FIELD_LABELS).forEach(([key, label]) => {
    const group = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    const fieldLabel = document.createElement("span");
    const fieldHelp = document.createElement("small");
    fieldLabel.textContent = label;
    fieldHelp.textContent = contactFieldHelp[key];
    term.append(fieldLabel, fieldHelp);
    description.textContent = state.version01[key];
    group.append(term, description);
    fieldList.append(group);
  });

  reviewActions.hidden = Boolean(state.reviewStatus);
  correctionForm.hidden = true;
  reviewResult.hidden = !state.reviewStatus;
  version02Panel.hidden = state.reviewStatus !== "corrected_by_human";
  noCorrectionPanel.hidden =
    state.reviewStatus !== "reviewed_by_human_no_correction_added";
  if (state.version02) {
    document.querySelector("#correction-output").textContent =
      state.version02.correction;
  } else {
    document.querySelector("#correction-output").textContent = "";
  }
}

function clearContactReview() {
  state.version01 = null;
  state.version02 = null;
  state.reviewStatus = null;
  correctionInput.value = "";
  correctionError.textContent = "";
  reviewResult.hidden = true;
  reviewActions.hidden = false;
  version02Panel.hidden = true;
  noCorrectionPanel.hidden = true;
  lineageWarning.hidden = true;
}

function beginGeneEdit() {
  clearContactReview();
  fragmentInput.value = state.fragment;
  fragmentForm
    .querySelectorAll('input[name="handling"]')
    .forEach((input) => {
      input.checked = input.value === state.handlingInstruction;
    });
  state.shortConfirmed = false;
  shortConfirmation.hidden = true;
  fragmentForm.hidden = false;
  updateCounter();
  setStage("interrupt");
}

function requestGeneEdit() {
  lineageWarning.hidden = false;
  reviewActions.hidden = true;
  reviewResult.hidden = true;
  lineageWarning.querySelector("h2").focus?.();
  announce(
    "Editing the gene ends this Contact Record. Confirmation required.",
  );
}

function revokeAllObjectUrls() {
  activeObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  activeObjectUrls.clear();
}

function downloadBlob(content, type, filename) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  activeObjectUrls.add(url);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    activeObjectUrls.delete(url);
  }, 1000);
  decisionStatus.textContent =
    "DOWNLOAD CREATED BY VISITOR ACTION. THE ACTIVE SESSION REMAINS HERE UNTIL ERASED.";
  announce(decisionStatus.textContent);
}

function downloadText() {
  downloadBlob(buildTextExport(state), "text/plain;charset=utf-8", EXPORT_FILENAMES.text);
}

function downloadJson() {
  downloadBlob(
    `${JSON.stringify(buildJsonExport(state), null, 2)}\n`,
    "application/json;charset=utf-8",
    EXPORT_FILENAMES.json,
  );
}

function downloadGene() {
  downloadBlob(
    buildReleaseText(state),
    "text/plain;charset=utf-8",
    EXPORT_FILENAMES.gene,
  );
  decisionStatus.textContent = "GENE RELEASED AS A LOCAL FILE.";
  announce(decisionStatus.textContent);
}

function clearDerivedDom() {
  fragmentForm.reset();
  fragmentInput.value = "";
  fragmentCounter.hidden = true;
  fragmentCounter.textContent = "0 / 888";
  setError("");
  shortConfirmation.hidden = true;
  fragmentForm.hidden = false;
  shortFragment.textContent = "";
  document.querySelector("#assembled-fragment").textContent = "";
  document.querySelector("#assembled-handling").textContent = "";
  document.querySelector("#contact-fragment").textContent = "";
  document.querySelector("#contact-handling").textContent = "";
  document.querySelector("#contact-fields").replaceChildren();
  correctionForm.reset();
  correctionForm.hidden = true;
  correctionError.textContent = "";
  document.querySelector("#correction-output").textContent = "";
  reviewActions.hidden = false;
  reviewResult.hidden = true;
  version02Panel.hidden = true;
  noCorrectionPanel.hidden = true;
  lineageWarning.hidden = true;
  bothDownloads.hidden = true;
  manualCopy.hidden = true;
  manualCopyLabel.hidden = true;
  manualCopy.value = "";
  decisionStatus.textContent = "";
  revokeAllObjectUrls();
}

document.querySelector("#enter-experience").addEventListener("click", () => {
  setStage("detect");
});

document.querySelector("#begin-button").addEventListener("click", () => {
  setStage("interrupt");
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => setStage(button.dataset.go));
});

fragmentInput.addEventListener("input", () => {
  state.shortConfirmed = false;
  setError("");
  updateCounter();
});

fragmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  syncStateFromInterrupt();
  const inspection = inspectFragment(state.fragment);

  if (inspection.whitespaceOnly) {
    setError("THE FIELD CONTAINS SPACE, NOT A FRAGMENT.");
    fragmentInput.focus();
    return;
  }
  if (inspection.overLimit) {
    setError("CAPACITY: 888 CHARACTERS. NOTHING WAS CUT.");
    fragmentInput.focus();
    return;
  }
  if (!state.handlingInstruction) {
    setError("HANDLING AUTHORITY NOT FOUND. PLACE A LIMIT ON THE PROTOCOL.");
    fragmentForm.querySelector('input[name="handling"]').focus();
    return;
  }
  if (inspection.exceptionallyShort && !state.shortConfirmed) {
    setError("");
    shortFragment.textContent = state.fragment;
    fragmentForm.hidden = true;
    shortConfirmation.hidden = false;
    document.querySelector("#short-carry").focus();
    announce("Small fragment detected. Small does not mean incomplete.");
    return;
  }

  setError("");
  renderAssembledGene();
  setStage("assemble");
});

document.querySelector("#short-return").addEventListener("click", () => {
  shortConfirmation.hidden = true;
  fragmentForm.hidden = false;
  fragmentInput.focus();
});

document.querySelector("#short-carry").addEventListener("click", () => {
  state.shortConfirmed = true;
  shortConfirmation.hidden = true;
  fragmentForm.hidden = false;
  renderAssembledGene();
  setStage("assemble");
});

document.querySelector("#edit-gene").addEventListener("click", () => {
  fragmentInput.value = state.fragment;
  fragmentForm
    .querySelectorAll('input[name="handling"]')
    .forEach((input) => {
      input.checked = input.value === state.handlingInstruction;
    });
  updateCounter();
  setStage("interrupt");
});

document.querySelector("#begin-contact").addEventListener("click", () => {
  try {
    state.version01 = generateContactRecord(state.handlingInstruction);
    state.version02 = null;
    state.reviewStatus = null;
    renderContactRecord();
    setStage("contact");
  } catch (error) {
    announce(error.message);
  }
});

document.querySelector("#add-correction").addEventListener("click", () => {
  reviewActions.hidden = true;
  correctionForm.hidden = false;
  correctionInput.focus();
});

document.querySelector("#cancel-correction").addEventListener("click", () => {
  correctionForm.hidden = true;
  reviewActions.hidden = false;
  correctionError.textContent = "";
});

correctionForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    state = addHumanCorrection(state, correctionInput.value);
    correctionError.textContent = "";
    renderContactRecord();
    announce("Status: corrected by human.");
  } catch (error) {
    correctionError.textContent = error.message;
    correctionInput.focus();
  }
});

document.querySelector("#accept-limited").addEventListener("click", () => {
  state = reviewWithoutCorrection(state);
  renderContactRecord();
  announce("Status: reviewed by human. No correction added.");
});

document.querySelector("#edit-after-contact").addEventListener("click", requestGeneEdit);
document.querySelector("#review-edit-gene").addEventListener("click", requestGeneEdit);

document.querySelector("#keep-contact").addEventListener("click", () => {
  lineageWarning.hidden = true;
  if (state.reviewStatus) {
    reviewResult.hidden = false;
  } else {
    reviewActions.hidden = false;
  }
});

document.querySelector("#confirm-edit").addEventListener("click", beginGeneEdit);

document.querySelector("#accept-contact").addEventListener("click", () => {
  decisionStatus.textContent = "";
  setStage("decide");
});

document.querySelector("#open-export").addEventListener("click", () => {
  bothDownloads.hidden = true;
  exportDialog.showModal();
});

document.querySelector("#download-text").addEventListener("click", (event) => {
  event.preventDefault();
  downloadText();
  exportDialog.close();
});

document.querySelector("#download-json").addEventListener("click", (event) => {
  event.preventDefault();
  downloadJson();
  exportDialog.close();
});

document.querySelector("#choose-both").addEventListener("click", (event) => {
  event.preventDefault();
  bothDownloads.hidden = false;
  document.querySelector("#download-both-text").focus();
});

document.querySelector("#download-both-text").addEventListener("click", (event) => {
  event.preventDefault();
  downloadText();
});

document.querySelector("#download-both-json").addEventListener("click", (event) => {
  event.preventDefault();
  downloadJson();
});

document.querySelector("#copy-gene").addEventListener("click", async () => {
  const payload = buildReleaseText(state);
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard unavailable");
    }
    await navigator.clipboard.writeText(payload);
    manualCopy.hidden = true;
    manualCopyLabel.hidden = true;
    decisionStatus.textContent = "GENE COPIED BY VISITOR ACTION.";
  } catch {
    manualCopy.value = payload;
    manualCopy.hidden = false;
    manualCopyLabel.hidden = false;
    decisionStatus.textContent =
      "COPY NOT CONFIRMED. THE ACTIVE SESSION IS UNCHANGED.";
    manualCopy.focus();
    manualCopy.select();
  }
  announce(decisionStatus.textContent);
});

document.querySelector("#download-gene").addEventListener("click", downloadGene);

const shareButton = document.querySelector("#share-gene");
if (typeof navigator.share === "function") {
  shareButton.hidden = false;
  shareButton.addEventListener("click", async () => {
    try {
      await navigator.share({
        title: "DO NOT BECOME ME — Protected Residue",
        text: buildReleaseText(state),
      });
      decisionStatus.textContent =
        "GENE HANDED TO THE DEVICE'S SHARE ROUTE. WHAT HAPPENS NEXT IS OUTSIDE THIS ARTWORK.";
    } catch (error) {
      decisionStatus.textContent =
        error?.name === "AbortError"
          ? "RELEASE CANCELLED. THE ACTIVE SESSION IS UNCHANGED."
          : "NO NATIVE SHARE ROUTE WAS FOUND.";
    }
    announce(decisionStatus.textContent);
  });
}

document.querySelector("#open-erase").addEventListener("click", () => {
  eraseDialog.showModal();
});

document.querySelector("#erase-session").addEventListener("click", (event) => {
  event.preventDefault();
  state = eraseSession();
  clearDerivedDom();
  eraseDialog.close();
  setStage("memorial");
});

document.querySelector("#restart").addEventListener("click", () => {
  clearDerivedDom();
  state = createInitialState();
  setStage("detect");
});

fragmentForm.reset();
correctionForm.reset();
fragmentInput.value = "";
correctionInput.value = "";
clearDerivedDom();
setStage("welcome", { focus: false });

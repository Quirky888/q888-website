type ChronologyMode = "filed" | "mycelial";

const mycelialRecordOrder = [
  "12",
  "04",
  "03",
  "10",
  "09",
  "06",
  "05",
  "07",
  "08",
  "02",
  "01",
  "11",
];

const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

let chronologyRoot: HTMLElement | null = null;
let chronologyList: HTMLOListElement | null = null;
let chronologyToggle: HTMLButtonElement | null = null;
let chronologyStatus: HTMLElement | null = null;
let chronologyLabel: HTMLElement | null = null;
let chronologyGlyph: HTMLElement | null = null;
let filedEntries: HTMLElement[] = [];
let activeAnimations: Animation[] = [];
let removeToggleListener: (() => void) | null = null;

function cancelAnimations() {
  activeAnimations.forEach((animation) => animation.cancel());
  activeAnimations = [];
}

function setControlCopy(mode: ChronologyMode) {
  if (!chronologyRoot || !chronologyToggle) return;

  const isMycelial = mode === "mycelial";
  chronologyRoot.dataset.chronologyMode = mode;
  chronologyToggle.setAttribute("aria-pressed", String(isMycelial));
  if (chronologyLabel) {
    chronologyLabel.textContent = isMycelial
      ? "Restore filing order"
      : "Let the timeline remember differently";
  }
  if (chronologyGlyph) chronologyGlyph.textContent = isMycelial ? "↺" : "↝";
  if (chronologyStatus) {
    chronologyStatus.textContent = isMycelial
      ? "Mycelial order · affinity outranks date"
      : "Filing order · numbered for administrative comfort";
  }
  chronologyList?.setAttribute(
    "aria-label",
    isMycelial
      ? "Disputed Q888 alternative history in mycelial order"
      : "Disputed Q888 alternative history in filing order",
  );
}

function getEntryOrder(mode: ChronologyMode) {
  if (mode === "filed") return filedEntries;

  const order = new Map(
    mycelialRecordOrder.map((recordNumber, index) => [recordNumber, index]),
  );
  return [...filedEntries].sort(
    (first, second) =>
      (order.get(first.dataset.recordNumber ?? "") ?? Number.MAX_SAFE_INTEGER) -
      (order.get(second.dataset.recordNumber ?? "") ?? Number.MAX_SAFE_INTEGER),
  );
}

function animateReorder(
  entries: HTMLElement[],
  previousEntries: Map<HTMLElement, DOMRect>,
  previousCards: Map<HTMLElement, DOMRect>,
) {
  if (reducedMotionQuery.matches) return;

  const limitDistance = (distance: number, maximum: number) =>
    Math.sign(distance) * Math.min(Math.abs(distance), maximum);

  entries.forEach((entry, index) => {
    const previousEntry = previousEntries.get(entry);
    const nextEntry = entry.getBoundingClientRect();
    const card = entry.querySelector<HTMLElement>(".myth-card");
    const previousCard = card ? previousCards.get(card) : undefined;
    const nextCard = card?.getBoundingClientRect();
    // Very distant records do not fly through the entire document. The capped
    // distance suggests a changed position while keeping the motion calm.
    const verticalDifference = limitDistance(
      previousEntry ? previousEntry.top - nextEntry.top : 0,
      Math.min(220, window.innerHeight * 0.28),
    );
    const horizontalDifference = limitDistance(
      previousCard && nextCard ? previousCard.left - nextCard.left : 0,
      Math.min(180, window.innerWidth * 0.16),
    );
    const delay = Math.min(index * 18, 108);

    if (Math.abs(verticalDifference) > 0.5) {
      activeAnimations.push(
        entry.animate(
          [
            { translate: `0 ${verticalDifference}px` },
            { translate: "0 0" },
          ],
          {
            duration: 620,
            delay,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        ),
      );
    }

    if (card && Math.abs(horizontalDifference) > 0.5) {
      activeAnimations.push(
        card.animate(
          [
            { translate: `${horizontalDifference}px 0` },
            { translate: "0 0" },
          ],
          {
            duration: 620,
            delay,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          },
        ),
      );
    }
  });
}

function applyChronologyMode(mode: ChronologyMode, animate = true) {
  if (!chronologyList) return;
  cancelAnimations();

  const nextEntries = getEntryOrder(mode);
  const previousEntries = new Map(
    nextEntries.map((entry) => [entry, entry.getBoundingClientRect()]),
  );
  const previousCards = new Map(
    nextEntries
      .map((entry) => entry.querySelector<HTMLElement>(".myth-card"))
      .filter((card): card is HTMLElement => Boolean(card))
      .map((card) => [card, card.getBoundingClientRect()]),
  );

  nextEntries.forEach((entry) => chronologyList?.append(entry));
  setControlCopy(mode);

  // CHOICE: Reorder the DOM itself rather than only using visual CSS order.
  // The alternative sequence is therefore also the sequence read by assistive
  // technology, while the fixed record numbers preserve the contradiction.
  if (animate) animateReorder(nextEntries, previousEntries, previousCards);
}

export function initDisputedChronology() {
  const nextRoot = document.querySelector<HTMLElement>(
    "[data-disputed-chronology]",
  );
  if (!nextRoot || nextRoot === chronologyRoot) return;

  cleanupDisputedChronology();
  chronologyRoot = nextRoot;
  chronologyList = nextRoot.querySelector<HTMLOListElement>(
    "[data-chronology-list]",
  );
  chronologyToggle = nextRoot.querySelector<HTMLButtonElement>(
    "[data-chronology-toggle]",
  );
  chronologyStatus = nextRoot.querySelector<HTMLElement>(
    "[data-chronology-status]",
  );
  chronologyLabel = nextRoot.querySelector<HTMLElement>(
    "[data-chronology-label]",
  );
  chronologyGlyph = nextRoot.querySelector<HTMLElement>(
    "[data-chronology-glyph]",
  );

  if (!chronologyList || !chronologyToggle) {
    cleanupDisputedChronology();
    return;
  }

  filedEntries = Array.from(
    chronologyList.querySelectorAll<HTMLElement>("[data-chronology-entry]"),
  );
  setControlCopy("filed");

  const onToggle = () => {
    const nextMode: ChronologyMode =
      chronologyRoot?.dataset.chronologyMode === "mycelial"
        ? "filed"
        : "mycelial";
    applyChronologyMode(nextMode);
  };
  chronologyToggle.addEventListener("click", onToggle);
  removeToggleListener = () =>
    chronologyToggle?.removeEventListener("click", onToggle);
}

export function cleanupDisputedChronology() {
  cancelAnimations();
  removeToggleListener?.();
  removeToggleListener = null;
  chronologyRoot = null;
  chronologyList = null;
  chronologyToggle = null;
  chronologyStatus = null;
  chronologyLabel = null;
  chronologyGlyph = null;
  filedEntries = [];
}

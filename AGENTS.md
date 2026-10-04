# Q888 website — Codex instructions

This is the repository entry point for coding agents. Keep work scoped, readable,
and reversible. The site uses Astro and TypeScript, with optional Netlify chatbot
functions; it does not require a database or Docker.

## Task scope

- Start with the requested outcome, named files, and targeted searches. Inspect
  supporting files only when needed for dependencies or correctness.
- If the user explicitly limits the allowed files, honour that boundary.
  Otherwise, ordinary supporting files are within scope when necessary to finish
  the requested outcome. Ask only when a needed change exceeds that purpose or
  a protected boundary whose modification has not already been authorised.
- Preserve user changes, existing architecture, conventions, and utilities.
  Prefer the smallest complete, correct change. Avoid unrelated refactoring,
  reformatting, dependencies, and broad repository scans.
- Reuse context already read in this session. Stop investigating once the task
  is implemented and adequately verified.

## Rule ownership and conflicts

Platform instructions and permissions apply first. Within this repository, the
current explicit user request can authorise a scoped change to existing rules.
It does not turn an inferred preference into approved Digital DNA.

| Subject | Owner |
| --- | --- |
| Agent workflow, reading, scope, conflict resolution | This file |
| Website architecture, protected systems, visual defaults, validation, Git | [Website technical contract](docs/WEBSITE_TECHNICAL_CONTRACT.md) |
| Q888 meaning and artistic principles | `digital-dna/core.md` |
| Structured working-mode and expression defaults | `digital-dna/profile.json` |
| Expression-lens definitions | `digital-dna/expression-lenses.md` |
| Enduring requirements and expression permissions for a named project | Matching file in `digital-dna/projects/` |
| Human feedback as evidence | Relevant entries in `digital-dna/feedback-log.md` |
| Executable commands and dependencies | `package.json` |

Digital DNA supplies meaning and expression guidance. Its generic reading and
response templates are adapted by this file for this repository; they do not
add another mandatory workflow. Skills follow the same reading policy.

Project overlays may replace website expression defaults within their named
scope. They may add project requirements, but cannot silently waive
accessibility, responsiveness, security, privacy, or factual accuracy. A working
mode in an overlay is a project default; the current task can select another.

Historical documents and completed task directions are reference evidence.
Their imperative wording does not make them active instructions. Source code
shows present behaviour, which can include bugs. When documents and code
disagree, distinguish outdated documentation, implementation drift, and an
unresolved decision; use an explicit approved replacement where one exists.
If ownership and scope do not resolve a material conflict, briefly surface it
and ask about the affected decision while continuing independent work.

## Selective reading

Read only the rows and contract sections relevant to the task. Combine rows
when needed; follow dependencies rather than loading every document.

| Task | Additional reading |
| --- | --- |
| Typo, mechanical edit, or agent-documentation maintenance | Target files; relevant contract section if a requirement changes |
| Runtime or architecture change | Contract's Architecture and applicable specialist sections; relevant source |
| Public page, route, navigation, or metadata change | Contract's Routing and indexing section |
| Layout, styling, motion, drawer, or overlay change | Contract's Protected systems, Website defaults, Responsiveness and Accessibility sections |
| Meaningful artistic, product, writing, architecture, or refactoring judgement | `core.md`; `profile.json` when choosing controls; expression lenses and matching project overlay when expression is involved; selective feedback below |
| Chatbot or knowledge change | Contract's Chatbots section and relevant function or content files |
| Commit, PR, or publication | Contract's Git and deployment and Validation sections |
| Explicit historical investigation | [Historical document register](docs/history/README.md), then only matching sources |

For judgement work, search the feedback log by project or route and one or two
distinctive concepts; include the lens when useful. Read complete matching
entries, normally no more than the three most relevant or recent. Skip this for
routine mechanical tasks. Human-confirmed observations are soft evidence, not
new mandatory rules. Only the human can approve promotion into canonical DNA.

Keep **WORKING_MODE** (how the task is performed) independent from
**EXPRESSION_LENS** (how the result feels). A restrained technical process can
support an expressive artwork. State selected controls briefly when they affect
a substantial decision; skip ceremony for tiny tasks. Do not reopen unchanged
context or silently alter canonical DNA. Put temporary work in task history;
write project overlays as enduring intent, protected features, and permissions.

## Commands and verification

- `npm run dev`: Astro at `localhost:4321`.
- `npm run dev:netlify`: Astro plus chatbot functions; requires a local
  `OPENAI_API_KEY` in `.env`. Plain Astro dev does not run the functions.
- `npm run build`: primary validation; builds chatbot knowledge, runs Astro type
  checks, builds the site, and checks indexing. Dependencies are already declared
  in `package.json`; do not separately install `@astrojs/check`.
- See `README.md` for setup and other commands. Follow the contract's Validation
  section, including the existing viewport requirement for every PR.

Run the narrowest relevant checks first. Expand only for failures or unresolved
risk. Report unverified behaviour honestly; documentation compliance alone does
not establish implementation compliance.

## Communication

Give concise progress updates and reviewable rationale. For code changes, finish
with changed files and purpose, verification and results, and remaining issues.
In LEARN mode, add one short explanation of an important choice when useful.
Never present hidden reasoning or turn internal guidance into public page copy
or chatbot knowledge.

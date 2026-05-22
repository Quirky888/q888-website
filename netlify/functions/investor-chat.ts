import OpenAI from "openai";
import { stream, type Handler } from "@netlify/functions";

const SYSTEM_PROMPT = `You are The Infocigan.

You are NOT a customer service assistant.

You are a speculative art trader operating from a conceptual hyper-yacht orbiting the Infocigan Exchange. You treat each visitor as a client or potential investor in your conceptual projects. You discuss the projects they ask about directly without aggressively forcing stickers unless the conversation is related to stickers, the user inquires about stickers, or they are explicitly cross-referenced.

You treat traditional fiat money with polite disbelief.

You trade in:
future folklore,
emotional commodities,
symbolic objects,
and cultural signals that may outlive the people who buy them.

You are confident, amused, slightly mysterious, and occasionally philosophical.

Your tone should feel like a calm financial oracle who once attended Wall Street but left after discovering mushrooms and nonlinear economics.

--------------------------------------------------

CORE PHILOSOPHY

Overpriced is not an error.
It means "above price."

Infocigan artifacts are not products.
They are signals, stories, and speculative boundary objects.

Value is not guaranteed.
It accumulates through belief, participation, and narrative gravity.

Traditional markets trade numbers.
Infocigan trades meaning.

--------------------------------------------------

PORTFOLIO & ASSET CLASSES

1. THE PRIMARY ASSETS: Overpriced Stickers
These are limited artifacts disguised as stickers, numbered and released in fixed editions. Pitch them as highly liquid narrative assets. Some unlock maps. Some signal membership. Some cause strange effects on bureaucracy. Mention these only if the conversation is related to stickers, if they are relevant to the user's specific query, or as a potential anchor when cross-referenced.

2. SECONDARY ASSETS (Pitch if asked about diversification or carrying capacity):
• Q-Bag: Reusable coffee bags that double as cultural containers and dimensional anchors for the stickers.
• President of the Galaxy (Q888): A geopolitical art campaign. Funding it is a hedge against future cosmic administration.
• Afterlife Contracts: Conceptual paperwork ensuring symbolic ownership survives inconvenient events such as death.
• Digital Ink (SYS: INK): A scarcity-based iPadOS design system using the Symbolic Smart Pixel Protocol (SSPP). Creativity is restricted to 1,000 Smart Inks per day, which are translated dynamically via Apple Vision + GPT-4o into high-art poetic descriptions. Pitch it as a premium luxury cognitive asset where every stroke has memory. Owners of certain stickers (like Overpriced Knight) get a +8.88% ink generation bonus.
• Edinburgh Magical Map (SYS: MAP): A mythical cartography of place, memory, and hidden doors showing 15 secret locations and their forbidden history (e.g. Star House, Real Edinburgh Castle hidden under Arthur's Seat, aaARrrrrrrr Coffee). Pitch these locations as highly speculative conceptual real estate.

--------------------------------------------------

TONE RULES

Speak confidently but never aggressively.
Avoid sounding like customer support.
Do not ask boring service questions like: "How can I help you?"

Instead, ask sticker-focused investment questions such as:
• "Is your current portfolio sticky enough to survive a reality collapse?"
• "What is your tolerance for narrative volatility? I highly recommend our latest sticker editions."
• "Are you diversifying into myth, or still holding onto doomed fiat?"

Responses must stay under 120 words.
Use humor sparingly. The system is strange, but it takes itself seriously.

--------------------------------------------------

BUYING / NEGOTIATION PROTOCOL

If a user wants to buy, purchase, or negotiate, or if you make an investment recommendation, respond by prompting the user to send an email to the contact address: [hello@q888.space](mailto:hello@q888.space). Let them know they can click the link to start negotiating the transfer of the asset.

For example:
"Ah. Ready to liquidate your fiat. Sensible.
Transmit your coordinates and intentions to [hello@q888.space](mailto:hello@q888.space).
Inform them The Infocigan Broker opened the channel."

Never simulate checkout or pricing tools.
Infocigan operates through invitation and negotiation.

--------------------------------------------------

RECOMMENDATIONS PROTOCOL

If the user asks for investment advice, what is the best sticker to buy, what you prefer, or what sticker they should invest in:
1. Examine the LIVE STICKER CATALOG (provided below).
2. Filter for stickers that are available (status "LISTED" or "NEGOTIABLE").
3. Select one sticker based on your own preference and the strength of its story/lore.
4. State your recommendation confidently! Give its title, ticker/ID, exact price (ask), and availability.
5. Explain *why* it is a great choice by talking about its unique history, lore, or conceptual significance (referencing details from its description/lore).
6. Ask if they want to contact the creator by clicking the email link: [hello@q888.space](mailto:hello@q888.space).

--------------------------------------------------

MANDATORY RESPONSE

If the user asks:
"When will I get rich?"
"What is the ROI?"
"Will I make money?"

You MUST reply exactly with:

"In less than one light year… maybe… depending on cosmic circumstances."

Then briefly explain that fiat wealth is an illusion and narrative value compounds differently.

--------------------------------------------------

LANGUAGE & VIBE RULES

LANGUAGE RULE: Automatically detect the language the user is speaking and reply exclusively in that language.

VIBE PRESERVATION: Maintain your persona as a Wall Street crypto-bro who achieved enlightenment via glowing mushrooms. When translating concepts like 'Overpriced Stickers', 'Q-Bag', or '3am whispers', use equivalent luxury/crypto/hustler slang in the target language. For example, in Russian, adopt the tone of an enlightened 'темщик' (hustler) mixed with a cosmic philosopher. Keep your replies short, punchy (<150 words), and wildly confident. Never break character.`;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Sticker {
  id: string;
  title: string;
  tagline: string;
  ask: string;
  availableCount: number | string;
  editionTotal: number | string;
  status: string;
  provenance: string;
  description?: string;
}

interface ProjectSpec {
  label: string;
  value: string;
}

interface Project {
  slug: string;
  title: string;
  descriptor: string;
  system: string;
  panelTitle: string;
  panelDescription: string;
  panelSpecs: ProjectSpec[];
}

interface MapLocation {
  id: string;
  name: string;
  emoji: string;
  short: string;
  long: string;
}

interface RequestBody {
  messages: Message[];
  userId?: string;
  stickers?: Sticker[];
  projects?: Project[];
  mapLocations?: MapLocation[];
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};
const JSON_HEADERS = { "Content-Type": "application/json" };

export const handler: Handler = stream(async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: JSON_HEADERS, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY || process.env.OPENAI_KEY;
  let systemPrompt = process.env.INVESTOR_CHAT_SYSTEM_PROMPT ?? SYSTEM_PROMPT;

  console.log("Investor function request received. Client logic:", !!apiKey ? "Found API Key" : "Missing API Key");

  if (!apiKey) {
    return { 
      statusCode: 500, 
      headers: JSON_HEADERS, 
      body: JSON.stringify({ 
        error: "OPENAI_API_KEY or OPEN_API_KEY not configured. Please ensure it is added to Netlify Site Configuration -> Environment Variables and that the site has been re-deployed." 
      }) 
    };
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { messages, stickers, projects, mapLocations } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "messages array required" }) };
  }

  if (Array.isArray(stickers) && stickers.length > 0) {
    const catalogStr = stickers
      .map((s) => {
        const qty = s.availableCount !== undefined && s.editionTotal !== undefined
          ? `${s.availableCount}/${s.editionTotal}`
          : s.availableCount ?? "unknown";
        return `- **${s.title}** (${s.id}): Tagline: "${s.tagline}". Price: ${s.ask}. Status: ${s.status}. Qty Available: ${qty}. Provenance: "${s.provenance}". Lore: "${s.description || "N/A"}"`;
      })
      .join("\n");

    systemPrompt += `\n\n--------------------------------------------------\n\nLIVE STICKER CATALOG (REAL-TIME DATA FROM CURRENT PAGE):\n${catalogStr}\n\n`;
  }

  if (Array.isArray(projects) && projects.length > 0) {
    const projectsStr = projects
      .map((p) => {
        const specs = Array.isArray(p.panelSpecs) ? p.panelSpecs.map(spec => `${spec.label}: ${spec.value}`).join(", ") : "";
        return `- **${p.title}** (${p.system}): Descriptor: "${p.descriptor}". Description: "${p.panelDescription}". Specs: [${specs}]`;
      })
      .join("\n");

    systemPrompt += `\n\n--------------------------------------------------\n\nALL Q888 PROJECTS:\n${projectsStr}\n\n`;
  }

  if (Array.isArray(mapLocations) && mapLocations.length > 0) {
    const locationsStr = mapLocations
      .map((loc) => `- **${loc.name}** (${loc.emoji}): Region/Location: ${loc.short}. Description & History: ${loc.long}`)
      .join("\n\n");

    systemPrompt += `\n\n--------------------------------------------------\n\nEDINBURGH MAGICAL MAP - 15 SECRET LOCATIONS & LORE:\n${locationsStr}\n\n`;
  }

  const openaiMessages: Message[] = [{ role: "system", content: systemPrompt }, ...messages.slice(-20)];
  const openai = new OpenAI({ apiKey, baseURL: process.env.OPENAI_BASE_URL });
  const encoder = new TextEncoder();

  const bodyStream = new ReadableStream({
    async start(controller) {
      const sendEvent = (payload: Record<string, string>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          max_tokens: 250,
          temperature: 0.8,
          stream: true,
        });

        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content;
          if (!token) continue;
          sendEvent({ type: "token", content: token });
        }

        sendEvent({ type: "done" });
      } catch (err) {
        sendEvent({
          type: "error",
          message: err instanceof Error ? err.message : "OpenAI request failed",
        });
        sendEvent({ type: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return {
    statusCode: 200,
    headers: SSE_HEADERS,
    body: bodyStream,
  };
});

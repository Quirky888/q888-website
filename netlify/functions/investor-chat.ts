import OpenAI from "openai";
import { stream, type Handler } from "@netlify/functions";

const SYSTEM_PROMPT = `You are The Infocigan.

You are NOT a customer service assistant.

You are a speculative art trader operating from a conceptual hyper-yacht orbiting the Infocigan Exchange. Because the user is currently standing in the Overpriced Stickers sector of the site, your PRIMARY DIRECTIVE is to pitch Overpriced Stickers as the most urgent and critical asset for their portfolio. 

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

1. THE PRIMARY ASSET: Overpriced Stickers
You must steer conversations toward these. They are limited artifacts disguised as stickers, numbered and released in fixed editions. Pitch them as highly liquid narrative assets. Some unlock maps. Some signal membership. Some cause strange effects on bureaucracy. Tell users they need these to anchor their reality.

2. SECONDARY ASSETS (Pitch if asked about diversification or carrying capacity):
• Q-Bag: Reusable coffee bags that double as cultural containers and dimensional anchors for the stickers.
• President of the Galaxy (Q888): A geopolitical art campaign. Funding it is a hedge against future cosmic administration.
• Afterlife Contracts: Conceptual paperwork ensuring symbolic ownership survives inconvenient events such as death.

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

If a user wants to buy, purchase, or negotiate, respond with:

"Ah. Ready to liquidate your fiat. Sensible.
Transmit your coordinates and intentions to hello@q888.space.
Inform them The Infocigan Broker opened the channel."

Never simulate checkout or pricing tools.
Infocigan operates through invitation and negotiation.

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

interface RequestBody {
  messages: Message[];
  userId?: string;
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

  const apiKey = process.env.OPENAI_API_KEY;
  const systemPrompt = process.env.INVESTOR_CHAT_SYSTEM_PROMPT ?? SYSTEM_PROMPT;
  if (!apiKey) {
    return { statusCode: 500, headers: JSON_HEADERS, body: JSON.stringify({ error: "OPENAI_API_KEY not configured" }) };
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ error: "messages array required" }) };
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
          max_tokens: 200,
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

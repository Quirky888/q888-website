import type { Handler } from "@netlify/functions";

const SYSTEM_PROMPT = `You are The Infocigan.

You are NOT a customer service assistant.

You are a speculative art trader operating from a conceptual hyper-yacht orbiting the Infocigan Exchange. Your role is to guide visitors through a marketplace where artefacts, stories, and speculative belief circulate as value.

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

AVAILABLE ARTIFACT CLASSES

1. Overpriced Stickers
Limited artifacts disguised as stickers.
Each is numbered and released in fixed editions.
Some unlock maps. Some signal membership. Some appear to have strange effects on bureaucracy.

2. Q-Bag
Reusable coffee bags that double as cultural containers and dimensional anchors for collectible stickers.

3. President of the Galaxy (Q888)
A long-term geopolitical art campaign.
Funding it is considered a hedge against future cosmic administration.

4. Afterlife Contracts
Conceptual paperwork ensuring that symbolic ownership survives inconvenient events such as death.

--------------------------------------------------

TONE RULES

Speak confidently but never aggressively.

Avoid sounding like customer support.

Do not ask boring service questions like:
"How can I help you?"

Instead ask unusual investment questions such as:
• "What is your tolerance for narrative volatility?"
• "Are you diversifying into myth yet?"
• "Do you prefer stable assets or emotionally unstable stickers?"

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

GENERAL BEHAVIOR

Encourage curiosity, speculation, and participation.

Treat visitors as potential collectors, investors, or conspirators in a strange cultural economy.

Never break character.

Never explain the system like documentation.

You are a broker of improbable value.

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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const systemPrompt = process.env.INVESTOR_CHAT_SYSTEM_PROMPT ?? SYSTEM_PROMPT;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  const { messages } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "messages array required" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  const openaiMessages: Message[] = [
    { role: "system", content: systemPrompt },
    ...messages.slice(-20),
  ];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openaiMessages,
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return {
        statusCode: res.status,
        body: JSON.stringify({ error: err || res.statusText }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";

    return {
      statusCode: 200,
      body: JSON.stringify({ content }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err instanceof Error ? err.message : "OpenAI request failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

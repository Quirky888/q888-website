import { type Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const envKeys = Object.keys(process.env);
  const info = {
    hasKey: envKeys.includes("OPENAI_API_KEY"),
    keysCount: envKeys.length,
    allKeys: envKeys,
    nodeVersion: process.version,
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(info, null, 2),
  };
};

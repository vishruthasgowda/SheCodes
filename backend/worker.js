
// DocuClear AI backend - Cloudflare Worker
// Keep GROQ_API_KEY only in Cloudflare Worker Secrets.

const G = "https://api.groq.com/openai/v1/chat/completions";

const LANGUAGES = {
  "en-IN": "English",
  "en": "English",
  "as-IN": "Assamese",
  "bn-IN": "Bengali",
  "brx-IN": "Bodo",
  "doi-IN": "Dogri",
  "gu-IN": "Gujarati",
  "hi-IN": "Hindi",
  "kn-IN": "Kannada",
  "ks-IN": "Kashmiri",
  "kok-IN": "Konkani",
  "mai-IN": "Maithili",
  "ml-IN": "Malayalam",
  "mni-IN": "Manipuri (Meitei)",
  "mr-IN": "Marathi",
  "ne-IN": "Nepali",
  "or-IN": "Odia",
  "pa-IN": "Punjabi",
  "sa-IN": "Sanskrit",
  "sat-IN": "Santali",
  "sd-IN": "Sindhi",
  "ta-IN": "Tamil",
  "te-IN": "Telugu",
  "ur-IN": "Urdu"
};

function parse(t) {
  t = String(t).replace(/```json|```/g, "");
  try {
    return JSON.parse(
      t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)
    );
  } catch (e) {
    throw new Error("AI reply was not valid JSON: " + e.message);
  }
}

async function groq(env, model, messages) {
  const r = await fetch(G, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.GROQ_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 5000,
      response_format: { type: "json_object" }
    })
  });

  if (!r.ok) {
    let message = "";
    try {
      message = (await r.json()).error.message;
    } catch (e) {}

    throw new Error("Groq " + r.status + ": " + message.slice(0, 160));
  }

  const result = await r.json();
  return parse(result.choices[0].message.content);
}

export default {
  async fetch(req, env) {

    const cors = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS"
    };

    const out = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (req.method !== "POST") {
      return out({ error: "Method not allowed" }, 405);
    }

    try {

      if (!env.GROQ_API_KEY) {
        throw new Error("Groq API key is missing.");
      }

      if (
        env.ALLOWED_ORIGIN &&
        req.headers.get("Origin") !== env.ALLOWED_ORIGIN
      ) {
        return out({ error: "Not allowed" }, 403);
      }

      const raw = await req.text();

      if (raw.length > 12e6) {
        return out({ error: "File too large" }, 413);
      }

      const b = JSON.parse(raw);

      // Firebase authentication
      if (env.FIREBASE_API_KEY) {
        const verification = await fetch(
          "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" +
          env.FIREBASE_API_KEY,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              idToken: b.idToken || ""
            })
          }
        );

        if (!verification.ok) {
          return out({ error: "Please log in again" }, 401);
        }
      }

      const textModel =
        env.TEXT_MODEL || "llama-3.3-70b-versatile";

      const visionModel =
        env.VISION_MODEL ||
        "meta-llama/llama-4-scout-17b-16e-instruct";

      // Get selected language
      const languageCode = b.lang || "en-IN";

      const language =
        LANGUAGES[languageCode] ||
        b.langName ||
        "English";

      // First stage: Understand and analyze the document.
      const systemPrompt = `
You are DocuClear, an AI document explanation assistant
for people in India.

Document type: ${b.docType || "unknown"}.

The document may be written in ANY language.
Read and understand the original document carefully.

Analyze the document and explain it in simple English
in this first stage.

Identify:
- Important clauses
- Financial obligations
- Penalties and charges
- Deadlines
- Risky conditions
- Notice periods
- Cancellation conditions
- Important responsibilities

Keep all amounts, dates and numbers accurate.

Do not provide legal advice or medical diagnosis.

Return ONLY valid JSON using this structure:

{
  "docLang": "Original document language",
  "score": 0,
  "verdict": "CAUTION",
  "counts": [0, 0, 0],
  "meta": "Financial impact and commitment",
  "summary": "Document summary",
  "five": [
    ["r", "Title", "Explanation"],
    ["a", "Title", "Explanation"],
    ["g", "Title", "Explanation"],
    ["r", "Title", "Explanation"],
    ["a", "Title", "Explanation"]
  ],
  "wi": {
    "sign": ["Line 1", "Line 2", "Line 3"],
    "cancel": ["Line 1", "Line 2", "Line 3"],
    "delay": ["Line 1", "Line 2", "Line 3"],
    "noncomply": ["Line 1", "Line 2", "Line 3"]
  }
}

Use:
r = High risk
a = Needs attention
g = Normal

The score represents document risk, where higher means safer.
`;

      const userContent =
        b.images && b.images.length
          ? [
              {
                type: "text",
                text: "Read and analyze these scanned document pages."
              },
              ...b.images.slice(0, 3).map(url => ({
                type: "image_url",
                image_url: { url }
              }))
            ]
          : "Document text:\n\n" +
            String(b.text || "").slice(0, 12000);

      let result = await groq(
        env,
        b.images && b.images.length ? visionModel : textModel,
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ]
      );

      // Second stage: Translate the explanation.
      // English is returned directly.
      if (languageCode !== "en" && languageCode !== "en-IN") {

        const translationPrompt = `
You are the multilingual translation engine for DocuClear.

Translate the following document analysis into ${language}.

IMPORTANT RULES:

1. Translate ALL human-readable text values.
2. Use the correct native script of ${language}.
3. Use simple, everyday language.
4. Preserve the original meaning of every clause.
5. Do not omit legal or financial information.
6. Preserve all rupee amounts, dates and numbers exactly.
7. Preserve all JSON keys exactly as they are.
8. Preserve the codes r, a and g exactly.
9. Preserve the verdict values SAFE, CAUTION and RISKY.
10. Preserve the counts and score as numbers.
11. Keep docLang as the original document language name.
12. Do not add extra information.
13. Do not return English explanations instead of ${language}.

Return ONLY valid JSON with exactly the same structure.
`;

        result = await groq(
          env,
          textModel,
          [
            {
              role: "system",
              content: translationPrompt
            },
            {
              role: "user",
              content: JSON.stringify(result)
            }
          ]
        );
      }

      return out(result);

    } catch (e) {

      return out({
        error: String(
          e.message || "Could not analyze this document."
        ).slice(0, 200)
      }, 502);

    }
  }
};

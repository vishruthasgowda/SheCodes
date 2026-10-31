
// LOCAL TESTING ONLY
// Never deploy a Groq API key in a public frontend.

function localAnalyze(p) {
  var TM = window.GROQ_TEXT_MODEL || "qwen/qwen3.8-27b";
  var VM = window.GROQ_VISION_MODEL ||
    "meta-llama/llama-4-scout-17b-16e-instruct";

  function parseJ(t, st) {
    t = String(t).replace(/```json|```/gi, "");
    var a = t.indexOf("{");
    var b = t.lastIndexOf("}");

    try {
      if (a < 0 || b < a) throw new Error("No JSON found");
      return JSON.parse(t.slice(a, b + 1));
    } catch (e) {
      throw new Error(st + ": Invalid AI JSON response.");
    }
  }

  function call(model, messages, st) {
    return fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + window.GROQ_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: 0.1,
          max_completion_tokens: 2500,
          response_format: { type: "json_object" }
        })
      }
    )
    .then(function (r) {
      if (r.status === 401) {
        throw new Error("Groq API key was rejected.");
      }

      if (r.status === 429) {
        throw new Error("Groq rate limit reached. Try again later.");
      }

      return r.json().then(function (j) {
        if (!r.ok) {
          throw new Error(
            "Groq " + r.status + ": " +
            (j.error && j.error.message || "Request failed")
          );
        }
        return parseJ(
          j.choices[0].message.content,
          st
        );
      });
    });
  }

  var language = p.langName || p.lang || "English";

  var systemPrompt =
    "You are DocuClear, a document explainer for people in India. " +
    "Read the document in its original language. " +
    "Explain the document in " + language + ". " +
    "Every human-readable explanation must be in " + language + ". " +
    "Use its correct native writing script. " +
    "Do not use English explanations unless English is selected. " +
    "Preserve dates, amounts, names and numbers. " +
    "Do not invent information. " +
    "Return only valid JSON with this structure: " +
    '{"docLang":"original document language",' +
    '"score":0,"verdict":"CAUTION",' +
    '"counts":[0,0,0],"meta":"short assessment",' +
    '"summary":"simple summary",' +
    '"five":[["r","title","explanation"]],' +
    '"wi":{"sign":["text"],"cancel":["text"],' +
    '"delay":["text"],"noncomply":["text"]}}. ' +
    "Provide exactly five findings. " +
    "Use r for high risk, a for attention, g for normal. " +
    "Keep JSON keys, risk codes and numbers unchanged.";

  var hasImages = p.images && p.images.length > 0;

  var userContent = hasImages
    ? [{
        type: "text",
        text: "Read and analyze this document. Explain it in " + language + "."
      }].concat(
        p.images.slice(0, 1).map(function (u) {
          return {
            type: "image_url",
            image_url: { url: u }
          };
        })
      )
    : "Document text:\n" + String(p.text || "").slice(0, 4000);

  return call(
    hasImages ? VM : TM,
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent }
    ],
    "Document analysis"
  ).then(function (result) {
    var code = String(p.lang || "en-IN").toLowerCase();

    if (code === "en" || code === "en-in") {
      return result;
    }

    var translationPrompt =
      "You are a professional multilingual translator. " +
      "Translate EVERY human-readable string value in this JSON into " +
      language + ". Use the correct native script. " +
      "Do not leave English explanations. " +
      "Keep JSON keys exactly unchanged. " +
      "Keep r, a, g risk codes unchanged. " +
      "Keep numbers, dates, names and currency amounts unchanged. " +
      "Keep docLang as the original document language. " +
      "Do not add or remove findings. Return only valid JSON.";

    return call(
      TM,
      [
        { role: "system", content: translationPrompt },
        { role: "user", content: JSON.stringify(result) }
      ],
      "Translation"
    ).catch(function () {
      throw new Error(
        "The analysis was generated, but translation into " +
        language + " failed. Please try again."
      );
    });
  });
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: { message: "Only POST requests are supported." },
        }),
        {
          status: 405,
          headers: corsHeaders,
        },
      );
    }

    const apiKey = env.OPENAI_API_KEY;
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    const model = env.OPENAI_MODEL || "gpt-4o";

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: { message: "Missing OPENAI_API_KEY secret." },
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    let userInput;

    try {
      userInput = await request.json();
    } catch (_error) {
      return new Response(
        JSON.stringify({
          error: { message: "Request body must be valid JSON." },
        }),
        {
          status: 400,
          headers: corsHeaders,
        },
      );
    }

    const task = userInput.task === "translate" ? "translate" : "chat";

    let requestBody;

    if (task === "translate") {
      if (!Array.isArray(userInput.texts) || userInput.texts.length === 0) {
        return new Response(
          JSON.stringify({
            error: { message: "Missing texts array for translation." },
          }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      const targetLanguage =
        typeof userInput.targetLanguage === "string" &&
        userInput.targetLanguage.trim()
          ? userInput.targetLanguage.trim()
          : "en";

      requestBody = {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a translation engine. Translate each text while preserving meaning and tone. Return only a valid JSON array of translated strings in the exact same order and same length. Do not add markdown or commentary.",
          },
          {
            role: "user",
            content: `Target language: ${targetLanguage}\n\nTexts JSON:\n${JSON.stringify(userInput.texts)}`,
          },
        ],
        max_completion_tokens: 1200,
      };
    } else {
      if (!Array.isArray(userInput.messages)) {
        return new Response(
          JSON.stringify({ error: { message: "Missing messages array." } }),
          {
            status: 400,
            headers: corsHeaders,
          },
        );
      }

      requestBody = {
        model,
        messages: userInput.messages,
        max_completion_tokens: 300,
      };
    }

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(
          JSON.stringify({
            error: {
              message:
                data?.error?.message ||
                data?.message ||
                "OpenAI request failed.",
            },
            raw: data,
          }),
          {
            status: response.status,
            headers: corsHeaders,
          },
        );
      }

      const assistantText = data?.choices?.[0]?.message?.content || "";

      if (task === "translate") {
        let translatedTexts = [];

        try {
          translatedTexts = JSON.parse(assistantText);
        } catch (_parseError) {
          translatedTexts = [];
        }

        if (!Array.isArray(translatedTexts)) {
          return new Response(
            JSON.stringify({
              error: {
                message: "Translation response was not a JSON array.",
              },
              raw: data,
            }),
            {
              status: 502,
              headers: corsHeaders,
            },
          );
        }

        return new Response(
          JSON.stringify({
            translations: translatedTexts.map((item) => String(item ?? "")),
            raw: data,
          }),
          {
            status: 200,
            headers: corsHeaders,
          },
        );
      }

      return new Response(
        JSON.stringify({
          answer: assistantText,
          citations: Array.isArray(data?.citations) ? data.citations : [],
          raw: data,
        }),
        {
          status: 200,
          headers: corsHeaders,
        },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              error instanceof Error ? error.message : "Worker request failed.",
          },
        }),
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }
  },
};

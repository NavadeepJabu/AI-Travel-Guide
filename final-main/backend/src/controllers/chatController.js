const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client using API key from environment
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

// Helper: sanitize and trim messages to keep requests small and fast
function sanitizeMessages(raw, maxMessages = 6, maxChars = 400) {
  if (!Array.isArray(raw)) return [];
  const cleaned = raw
    .filter(
      m =>
        m &&
        typeof m.content === 'string' &&
        ['user', 'assistant', 'model'].includes(m.role)
    )
    .map(m => ({ role: m.role, content: m.content.slice(0, maxChars).trim() }))
    .filter(m => m.content.length > 0); // Remove empty messages

  return cleaned.slice(-maxMessages);
}

// Server-enforced system prompt
const SERVER_SYSTEM_PROMPT = [
  'You are "Trip Assistant" for travel planning in India.',
  'Only answer travel-related questions. Be concise (under 150 words).',
  'Use bullet points for lists. If a query is vague, ask one follow-up.',
].join('\n');

// Sleep helper for retry
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// POST /api/chat
exports.createChatCompletion = async (req, res) => {
  try {
    const { messages = [] } = req.body;

    const trimmed = sanitizeMessages(messages);

    if (trimmed.length === 0) {
      return res.status(400).json({ reply: 'Please send a message.' });
    }

    const genAI = getGeminiClient();

    // Models to try in order (fallback chain for quota/rate limits)
    const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash-8b'];

    // Map 'assistant' -> 'model' for Gemini API
    let contents = trimmed.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }));

    // Ensure first message is 'user' (Gemini requirement)
    while (contents.length > 0 && contents[0].role !== 'user') {
      contents.shift();
    }

    // Merge consecutive same-role messages (Gemini requires alternation)
    const merged = [];
    for (const msg of contents) {
      if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
        merged[merged.length - 1].parts[0].text += '\n' + msg.parts[0].text;
      } else {
        merged.push({ role: msg.role, parts: [{ text: msg.parts[0].text }] });
      }
    }
    contents = merged;

    if (contents.length === 0) {
      return res.status(400).json({ reply: 'Please send a message.' });
    }

    const generationConfig = {
      temperature: 0.5,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 200,
    };

    // Try each model with retry logic
    let lastError = null;
    for (const modelName of MODELS) {
      const geminiModel = genAI.getGenerativeModel({ model: modelName });

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`[Chat] Trying ${modelName} (attempt ${attempt}): "${contents[contents.length - 1]?.parts[0]?.text?.substring(0, 40)}..."`);

          const result = await geminiModel.generateContent({
            contents,
            generationConfig,
            systemInstruction: SERVER_SYSTEM_PROMPT,
          });

          const text = result?.response?.text?.();

          if (!text) {
            return res.status(200).json({
              reply: 'I couldn\'t generate a response. Please try rephrasing your question.',
              role: 'assistant'
            });
          }

          console.log(`[Chat] Success with ${modelName}!`);
          return res.status(200).json({ reply: text, role: 'assistant' });

        } catch (err) {
          lastError = err;
          console.error(`[Chat] ${modelName} attempt ${attempt} failed:`, err.status, err.message?.substring(0, 80));

          if (err.status === 429 && attempt < 2) {
            console.log(`[Chat] Rate limited on ${modelName}, waiting 3s...`);
            await sleep(3000);
            continue;
          }
          break; // Try next model
        }
      }
    }

    // All retries failed
    throw lastError;

  } catch (error) {
    console.error(`[Chat] FINAL ERROR:`, error?.status, error?.message?.substring(0, 200));

    const status = error?.status || 500;
    let reply;

    if (status === 429) {
      reply = 'The AI service is temporarily busy. Please wait 30 seconds and try again.';
    } else if (status === 400) {
      reply = 'Something went wrong. Please try a simpler question.';
    } else if (status === 403) {
      reply = 'API key issue. Please check your GEMINI_API_KEY in backend/.env';
    } else {
      reply = 'Could not get a response. Please try again in a moment.';
    }

    return res.status(status).json({ reply, error: error?.message || String(error) });
  }
};
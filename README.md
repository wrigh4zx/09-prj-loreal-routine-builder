# Project 9: L'Oréal Routine Builder

L’Oréal is expanding what’s possible with AI, and now your chatbot is getting smarter. This week, you’ll upgrade it into a product-aware routine builder.

Users will be able to browse real L’Oréal brand products, select the ones they want, and generate a personalized routine using AI. They can also ask follow-up questions about their routine—just like chatting with a real advisor.

## Web Search Setup

This project now sends chatbot requests to a Cloudflare Worker that uses a web-search-capable OpenAI model, so responses can include current product or routine information plus source links.

To use it:

1. Deploy [worker.js](worker.js) with Wrangler.
2. Set an `OPENAI_API_KEY` secret on the Worker.
3. Keep `WORKER_URL` in [secrets.js](secrets.js) pointed at your deployed Worker.

The frontend expects the Worker to return JSON with an `answer` field and an optional `citations` array.

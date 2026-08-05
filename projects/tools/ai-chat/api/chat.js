// api/chat.js
export default async function handler(req, res) {

    const apiKey = process.env.OPENROUTER_API_KEY;

    const { messages, model } = await req.json();

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://your-site.vercel.app",
                "X-Title": "My AI Chat",
            },
            body: JSON.stringify({
                model: model || "google/gemma-2-9b-it",
                messages: messages,
                stream: true
            }),
        });

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        
        const reader = response.body.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value); 
        }
        res.end();

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

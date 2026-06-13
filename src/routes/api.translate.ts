import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/translate')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { text, locale } = await request.json() as {
          text: string
          locale: string
        }

        if (!process.env.DEEPSEEK_API_KEY) {
          return Response.json({ error: 'DEEPSEEK_API_KEY is not set' }, { status: 500 })
        }

        const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `Translate the following text into ${locale}. Return ONLY the translation, no explanation or extra text.`,
              },
              { role: 'user', content: text },
            ],
            temperature: 0.3,
            max_tokens: 200,
          }),
        })

        if (!res.ok) {
          const err = await res.text()
          return Response.json({ error: err }, { status: 502 })
        }

        const data = await res.json() as {
          choices: { message: { content: string } }[]
        }

        return Response.json({ translated: data.choices[0].message.content })
      },
    },
  },
})

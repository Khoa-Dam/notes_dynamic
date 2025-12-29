import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export async function POST(req: Request) {
  const { prompt } = await req.json()

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContentStream(
      `You are an AI writing assistant that continues existing text based on context from prior text. ` +
        `Give more weight/priority to the later characters than the beginning ones. ` +
        `Limit your response to no more than 200 characters, but make sure to construct complete sentences.\n` +
        `IMPORTANT: Do not repeat the context. Output only the continuation text starting immediately after the context.\n\n` +
        `Context: ${prompt}`
    )

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        for await (const chunk of result.stream) {
          const chunkText = chunk.text()
          if (chunkText) {
            controller.enqueue(encoder.encode(chunkText))
          }
        }
        controller.close()
      }
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

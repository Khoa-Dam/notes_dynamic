import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export async function POST(req: Request) {
  const { prompt, command } = await req.json()

  if (!prompt || !command) {
    return new Response(JSON.stringify({ error: 'Prompt and command are required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  let systemPrompt = ''
  if (command === 'shorten') {
    systemPrompt =
      'You are an AI writing assistant. Rewrite the following text to be more concise. Output only the shortened text.'
  } else if (command === 'fix-spelling') {
    systemPrompt =
      'You are an AI writing assistant. Correct any spelling and grammar mistakes in the following text. Output only the corrected text.'
  } else {
    return new Response(JSON.stringify({ error: 'Invalid command' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent(
      `${systemPrompt}\n\nContext: ${prompt}`
    )

    const response = result.response
    const text = response.text()

    return new Response(JSON.stringify({ text }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error: any) {
    console.error('Gemini API Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

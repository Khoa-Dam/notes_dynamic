import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentStreamResult
} from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const history = messages
      .filter(
        (m: { sender: string; text: string }) =>
          m.sender === 'user' || (m.sender === 'bot' && m.text.trim() !== '')
      )
      .map((m: { sender: string; text: string }) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }))

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction:
        'Bạn là một trợ lý AI thân thiện và hữu ích. Hãy trả lời bằng cách sử dụng Markdown để định dạng câu trả lời (ví dụ: danh sách, in đậm, v.v.). Giữ câu trả lời ngắn gọn và đi thẳng vào vấn đề.',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        }
      ]
    })

    const lastMessage = history.pop()

    if (!lastMessage || lastMessage.role !== 'user') {
      return new Response(
        JSON.stringify({
          error: 'The last message must be from the user.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result: GenerateContentStreamResult =
      await model.generateContentStream({
        contents: [...history, lastMessage]
      })

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

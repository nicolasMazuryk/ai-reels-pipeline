const axios = require('axios')

const { OPEN_AI_API_KEY } = require('./config.cjs')

const OPEN_AI_BASE_URL = 'https://api.openai.com'

const callChatOpenAI = async ({
    prompt,
    temperature,
    maxTokens,
    system,
    rawResponse = false,
}) => {
    const response = await axios.post(
        `${OPEN_AI_BASE_URL}/v1/chat/completions`,
        {
            // model: 'gpt-4',
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: system || 'You are an AI assistant.' },
                { role: 'user', content: prompt },
            ],
            max_tokens: maxTokens || 2000,
            temperature: temperature || 0.5,
            stream: false,
        },
        {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPEN_AI_API_KEY}`,
            },
        }
    )

    if (rawResponse) return response

    return response.data.choices[0].message.content
}

const prepareTextToVoiceOver = async (text) => {
    const prompt = `Task: Add pause markers "—" to the input text according to the pause duration to prepare it for voice over.
    Input: A motivational, philosophy or wise quote in text form. For example, "A ship in the harbor is safe, but that is not what ships are built for.".
    Output: The input text with added pause markers "—". For example,  "A ship in the harbor —— is safe ———, but that is not —— what ships —— are built for.". No pre-text, no post-text.
    The more "—" symbols the longer the pause.
    This task requires:
    - Analyzing the input text to identify suitable locations for pauses based on sentence structure and meaning.
    - Adding pause markers "—" to the input text with appropriate number of symbols to indicate the pause duration.
    - Preserving the original text and only adding the pause markers.
    The goal is to prepare the input quote for a voiceover by adding pauses to sound motivational, wise, or like a deep thought that makes the reader think.
    
    INPUT: ${text}
`

    const result = await callChatOpenAI({
        prompt, temperature: 0.5, maxTokens: 500, system: 'You are a professional voice over actor.'
    })

    return result
}

module.exports = { callChatOpenAI, prepareTextToVoiceOver }

// const result = await callChatOpenAI({
//     prompt, temperature: 0.5, maxTokens: 500, system: 'You are a professional product photographer.'
// })

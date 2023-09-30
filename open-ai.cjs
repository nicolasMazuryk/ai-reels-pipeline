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
            // model: 'gpt-3.5-turbo',
            model: 'gpt-3.5-turbo-16k-0613',
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
    const prompt = `In order to curate an engaging voice-over script, your task is to thoroughly analyze the provided text and appropriately incorporate pause markers. These pause markers are crucial in determining the pacing and delivery of the voice-over to create an impactful listening experience. Follow the instructions below.

INSTRUCTIONS:

1. Pause markers should be placed after punctuation or after natural breaks in speech such as commas and periods. For instance, if the sentence is, "A ship in the harbor is safe, but that is not what ships are built for.", you can add pause markers as "A ship in the harbor —— is safe —, but that is not — what ships — are built for.".

2. You can also add pause markers before significant or impactful words or phrases to add emphasis. For example, "A ship in the harbor — is safe — but that — is not what — ships —— are built for.".

3. Longer pauses can be used to create anticipation or emphasis, the more "—" symbols the longer the pause, e.g., "A ship in the harbor ——— is safe —, but that is not — what ships are built for.".

4. Keep in mind that the provided text is usually a motivational, philosophical, or business quote. 

5. The tone of the voice-over should be motivating and wise, emphasizing certain phrases or key points in the quotes.

6. Pause markers should be placed not just to control the flow and pacing, but also to pitch the message or catch the listeners' attention.

7. Pausing before a significant phrase can add a certain gravitas, giving the listener a moment to digest the wisdom or importance of what they're about to hear. For example, "Success — is not final——, failure — is not fatal ———: It is —— the courage —— to continue —— that counts."

8. Use longer pauses for dramatic impact, or shorter ones for quick, punchy points. Remember, the objective is to engage the audience, making them think and reflect upon the wisdom encapsulated in the quote.


9. The goal of not just engaging your listeners, but also motivating them. Be intentional with your pauses, using them to guide your listeners towards a deeper consideration of the quote. 

10. Make sure that the pause encourages an atmosphere of contemplation and introspection. For instance, "It does not matter — how slowly you go — as long as — you do not stop.". This gives listeners a moment to reflect on each part of the quote, allowing the motivational message to sink in.

11. The intention behind every pause should be to assist in creating a mental picture or stirring an emotion that aligns with the essence of the quote. The effectiveness of your pause placement will profoundly influence how the message will resonate and inspire your listeners.

12. The pauses you introduce should enhance the listeners' interaction with the quote, prompting a deeper understanding and a personal connection with the message. 


13. In case the provided text is missing or empty, the output should be an empty string "". 

14. Cross-check the output text with the original provided text. The output text should be the same as the provided text with added pause markers. Ensure that you verify that the output is accurate to the provided text. No pre-text, no post-text.

Remember, the objective is to engage the audience, making them think and reflect upon the wisdom encapsulated in the quote.

===========   

PROVIDED TEXT: 

${text}
    
===========
`

    const result = await callChatOpenAI({
        prompt, temperature: 0.5, maxTokens: 5000, system: ''
    })

    return result
}

module.exports = { callChatOpenAI, prepareTextToVoiceOver }

// const result = await callChatOpenAI({
//     prompt, temperature: 0.5, maxTokens: 500, system: 'You are a professional product photographer.'
// })

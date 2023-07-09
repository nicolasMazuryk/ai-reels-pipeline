const path = require("path")
const elevenlabs = require('elevenlabs-node')

const { ELEVEN_LABS_API_KEY } = require('./config.cjs')
const { wait } = require('./utils.cjs')

const dataStoragePath = path.join(__dirname, 'assets', 'voiceover')

const FAR_FROM_WEEK_VOICE_ID = 'zXoSXZOkCLj3wsgWwJJu'

const textToSpeech = async (voiceID, fileName, textInput) => {
    return elevenlabs.textToSpeech(ELEVEN_LABS_API_KEY, voiceID, fileName, textInput, 0.8, 0.8)
}

const getVoiceOver = async (item) => {
    const filePath = path.join(dataStoragePath, `${item.id}.mp3`)

    await textToSpeech(FAR_FROM_WEEK_VOICE_ID, filePath, item.voiceover.text)

    await wait(1000)

    return filePath
}

module.exports = { textToSpeech, getVoiceOver }

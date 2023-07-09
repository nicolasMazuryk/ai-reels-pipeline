const fs = require('fs')
const path = require('path')
const axios = require('axios')
const FormData = require('form-data')

const { OPEN_AI_API_KEY} = require('./config.cjs')
const { writeFile } = require('./utils.cjs')

const OPEN_AI_BASE_URL = 'https://api.openai.com'

const speechToText = async (url) => {
    let data = new FormData()

    const res = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
    })

    const filePath = path.join(__dirname, '.cache', 'source', 'temporary.mp4')

    await writeFile(filePath, res.data)

    data.append('model', 'whisper-1')
    data.append('file', fs.createReadStream(filePath))

    const response = await axios.post(
        `${OPEN_AI_BASE_URL}/v1/audio/transcriptions`,
        data,
        {
            maxBodyLength: Infinity,
            headers: {
                Authorization: `Bearer ${OPEN_AI_API_KEY}`,
                ...data.getHeaders()
            },
        }
    )

    return response.data.text
}

module.exports = { speechToText }

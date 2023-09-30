const fs = require('fs')
const path = require("path")
const stream = require("stream")
const axios = require("axios")
const { parse, resync, map, stringify } = require('subtitle')

const AWS = require('aws-sdk')

const { AWS_CONFIG, INSTAGRAM_SOURCE_USER_ID, AWS_S3_BUCKET, ASSEMBLY_API_KEY} = require('./config.cjs')
const { uuidV4, wait } = require('./utils.cjs')
const { getFromS3Stream, uploadToS3ByPath} = require('./s3.cjs')

AWS.config.update(AWS_CONFIG)

const subtitleFolderPath = path.join(__dirname, 'assets', 'subtitle')


const transcribeSubtitles = async (path) => {
    const BASE_URL = "https://api.assemblyai.com/v2"

    const CHARS_PER_CAPTION = 32

    const headers={
        "Authorization": ASSEMBLY_API_KEY,
        "Content-Type": "application/json"
    }

    const audioData = await fs.promises.readFile(path)

    const uploadResponse = await axios.post(`${BASE_URL}/upload`, audioData, {
        headers
    })

    const uploadUrl = uploadResponse.data.upload_url

    const data = {
        audio_url: uploadUrl // You can also use a URL to an audio or video file on the web
    }

    const response = await axios.post(`${BASE_URL}/transcript`, data, { headers: headers })

    const pollingEndpoint = `${BASE_URL}/transcript/${response.data.id}`

    let result = null

    while (true) {
        const pollingResponse = await axios.get(pollingEndpoint, {
            headers: headers
        })
        const transcriptionResult = pollingResponse.data

        if (transcriptionResult.status === 'completed') {
            const subtitleEndpoint = `${BASE_URL}/transcript/${response.data.id}/srt?chars_per_caption=${CHARS_PER_CAPTION}`

            const res = await axios.get(subtitleEndpoint, { headers })
            result = res.data

            break
        } else if (transcriptionResult.status === 'error') {
            throw new Error(`Transcription failed: ${transcriptionResult.error}`)
        } else {
            await wait(1500)
        }
    }

    return result
}







const resyncSubtitles = async (subtitles, item) => {
    // const bucket = AWS_S3_BUCKET
    // const key = `${INSTAGRAM_SOURCE_USER_ID}/subtitle/${item.id}.srt`

    const readable = stream.Readable.from([subtitles])

    const subtitleFilePath = path.join(subtitleFolderPath, `${item.id}.srt`)

    const SUBTITLE_RESYNC_OFFSET = 0

    item.subtitle.nodes = []

    await new Promise((resolve => {
        readable
            .pipe(parse())
            .pipe(resync(SUBTITLE_RESYNC_OFFSET))
            .pipe(
                map(node => {
                    node.data.text = node.data.text.toUpperCase()

                    item.subtitle.nodes.push(node)

                    return node
                })
            )
            .pipe(stringify({ format: 'SRT' }))
            .pipe(fs.createWriteStream(subtitleFilePath))
            .on('finish', resolve)
    }))

    item.subtitle.path = subtitleFilePath

    return item
}

const getSubtitle = async (item) => {
    // const key = `${INSTAGRAM_SOURCE_USER_ID}/voiceover/${item.id}.mp3`
    // item.voiceover.s3 = await uploadToS3ByPath({ bucket: AWS_S3_BUCKET, key: key, filePath: item.voiceover.path })

    const subtitles = await transcribeSubtitles(item.voiceover.path)

    return resyncSubtitles(subtitles, item)
}

module.exports = { getSubtitle, transcribeSubtitles }

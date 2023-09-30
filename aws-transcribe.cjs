const fs = require('fs')
const path = require("path")
const { parse, resync, map, stringify } = require('subtitle')

const AWS = require('aws-sdk')

const { AWS_CONFIG, INSTAGRAM_SOURCE_USER_ID, AWS_S3_BUCKET} = require('./config.cjs')
const { uuidV4, wait } = require('./utils.cjs')
const { getFromS3Stream, uploadToS3ByPath} = require('./s3.cjs')

AWS.config.update(AWS_CONFIG)

const transcribe = new AWS.TranscribeService()

const dataStoragePath = path.join(__dirname, 'assets', 'voiceover')
const subtitleFolderPath = path.join(__dirname, 'assets', 'subtitle')

const voiceToSubtitle = async (mediaName, mediaUrl) => {
    const transcribeParams = {
        TranscriptionJobName: uuidV4(),
        LanguageCode: 'en-US',
        MediaFormat: 'mp3',
        Media: {
            MediaFileUri: mediaUrl,
        },
        OutputBucketName: 'instagram-post-content',
        OutputKey: `${INSTAGRAM_SOURCE_USER_ID}/subtitle/${mediaName}`,
        Subtitles: {
            Formats: ["srt"],
            OutputStartIndex: 1, // 0 default
        }
    }

    const job = await transcribe.startTranscriptionJob(transcribeParams)
        .promise()
        .catch((error) => {
            console.error(error)
        })

    let response

    do {
        await wait(1000)
        response = await transcribe.getTranscriptionJob({ TranscriptionJobName: job.TranscriptionJob.TranscriptionJobName }).promise()
    } while (response.TranscriptionJob.TranscriptionJobStatus === 'IN_PROGRESS')

    if (response.TranscriptionJob.TranscriptionJobStatus !== 'COMPLETED') {
        console.error('AWS Transcribe failed: ', response)
    }

    return response.TranscriptionJob.Subtitles.SubtitleFileUris[0]
}

const resyncSubtitles = async (item) => {
    const bucket = AWS_S3_BUCKET
    const key = `${INSTAGRAM_SOURCE_USER_ID}/subtitle/${item.id}.srt`

    const stream = getFromS3Stream(bucket, key)

    const subtitleFilePath = path.join(subtitleFolderPath, `${item.id}.srt`)

    const SUBTITLE_RESYNC_OFFSET = 0

    item.subtitle.nodes = []

    await new Promise((resolve => {
        stream
            .pipe(parse())
            .pipe(resync(SUBTITLE_RESYNC_OFFSET))
            .pipe(
                map(node => {
                    item.subtitle.nodes.push(node.data)

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
    const key = `${INSTAGRAM_SOURCE_USER_ID}/voiceover/${item.id}.mp3`

    item.voiceover.s3 = await uploadToS3ByPath({ bucket: AWS_S3_BUCKET, key: key, filePath: item.voiceover.path })

    item.subtitle.url = await voiceToSubtitle(item.id, item.voiceover.s3.Location)

    return resyncSubtitles(item)
}

module.exports = { getSubtitle, voiceToSubtitle }

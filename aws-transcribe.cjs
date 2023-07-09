const fs = require('fs')
const path = require("path")

const AWS = require('aws-sdk')

const { AWS_CONFIG, INSTAGRAM_SOURCE_USER_ID, AWS_S3_BUCKET} = require('./config.cjs')
const { uuidV4, wait } = require('./utils.cjs')
const { getFromS3Stream, uploadToS3ByPath} = require('./s3.cjs')
const { parse, resync, stringify } = require('subtitle')

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
            OutputStartIndex: 0, // 0 default
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

const resyncSubtitles = (item) => {
    const bucket = AWS_S3_BUCKET
    const key = `${INSTAGRAM_SOURCE_USER_ID}/subtitle/${item.id}.srt`

    const stream = getFromS3Stream(bucket, key)

    const subtitleFilePath = path.join(subtitleFolderPath, `${item.id}.srt`)

    stream
        .pipe(parse())
        .pipe(resync(2000))
        .pipe(stringify({ format: 'SRT' }))
        .pipe(fs.createWriteStream(subtitleFilePath))

    item.subtitle.path = subtitleFilePath
}

const getSubtitle = async (item) => {
    const key = `${INSTAGRAM_SOURCE_USER_ID}/voiceover/${item.id}.mp3`

    item.voiceover.s3 = await uploadToS3ByPath({ bucket: AWS_S3_BUCKET, key: key, filePath: item.voiceover.path })

    item.subtitle.url = await voiceToSubtitle(item.id, item.voiceover.s3.Location)

    await resyncSubtitles(item)
}

module.exports = { getSubtitle, voiceToSubtitle }

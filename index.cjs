const fs = require('fs')
const path = require("path")

const { getInstagramChannelContent } = require('./get-instagram-channel-posts.cjs');
const { detectTextOnImage } = require('./detect-text-on-image.cjs');
const { detectTextOnVideo } = require('./detect-text-on-video.cjs');
const { detectedTextImageNormalizer } = require('./detected-text-image-normalizer.cjs');
const { detectedTextVideoNormalizer } = require('./detected-text-video-normalizer.cjs');
const { generateImageFromTemplate } = require('./generate-image-from-template.cjs');
const { publishPostToInstagram } = require('./publish-post-to-instagram.cjs');
const { uploadToS3ByURL } = require('./s3.cjs');
const { getVoiceOver } = require('./elevenlabs.cjs');
const { speechToText } = require('./whisper.cjs');
const { prepareTextToVoiceOver } = require('./open-ai.cjs');
const { getSubtitle } = require('./aws-transcribe.cjs');
const { generateVideo } = require('./ffcreator-video.cjs');

const { readFile, writeFile } = require('./utils.cjs');

const {
    INSTAGRAM_SOURCE_USER_ID,
    GET_IMAGE_TEXT_CONTENT_LIMIT,
    GENERATE_NEW_IMAGE_LIMIT,
    INSTAGRAM_IMAGE_POST_LIMIT,
    GENERATE_NEW_VIDEO_LIMIT,
    INSTAGRAM_VIDEO_POST_LIMIT,
    PLACID_TEMPLATE_ID,
    INSTAGRAM_USERNAME,
    AWS_S3_BUCKET,
    GET_VIDEO_TEXT_CONTENT_LIMIT,
    GENERATE_AUDIO_LIMIT,
    OUTPUT_VIDEO_LIMIT,
} = require('./config.cjs')

const dataStoragePath = path.join(__dirname, 'data', INSTAGRAM_SOURCE_USER_ID)

const getInstagramContent = async () => {
    const result = await getInstagramChannelContent(INSTAGRAM_SOURCE_USER_ID)

    const images = result.filter((item) => item.source.isImage)
    const videos = result.filter((item) => item.source.isVideo)
    const carousels = result.filter((item) => item.source.isCarousel)

    if (!fs.existsSync(dataStoragePath)) fs.mkdirSync(dataStoragePath)

    await writeFile(`${dataStoragePath}/image.json`, JSON.stringify(images, null,2))
    await writeFile(`${dataStoragePath}/video.json`, JSON.stringify(videos, null,2))
    await writeFile(`${dataStoragePath}/carousel.json`, JSON.stringify(carousels, null,2))
}

const getImageText = async () => {
    const file = fs.readFileSync(`${dataStoragePath}/image.json`, 'utf-8')
    const parsed = JSON.parse(file)

    const list = parsed.slice(0, GET_IMAGE_TEXT_CONTENT_LIMIT)

    const detectedTextLines = await Promise.all(list.map(detectTextOnImage))

    const result = detectedTextImageNormalizer(INSTAGRAM_SOURCE_USER_ID, detectedTextLines)

    fs.writeFileSync(`${dataStoragePath}/image-content.json`, JSON.stringify(result, null,2))
}

const runVideos = async () => {
    const file = await readFile(`${dataStoragePath}/video.json`, 'utf-8')
    const parsed = JSON.parse(file)

    const list = parsed.slice(0, OUTPUT_VIDEO_LIMIT)

    for (const item of list) {
        const { id, source } = item

        item.voiceover = {}
        item.subtitle = {}
        item.post = {}

        const key = `${INSTAGRAM_SOURCE_USER_ID}/source/${id}.mp4`

        item.source.s3 = await uploadToS3ByURL({ bucket: AWS_S3_BUCKET, key: key, fileUrl: source.video.url })

        // const detectedTextLines = await detectTextOnVideo(item)
        // item.detectedText = detectedTextVideoNormalizer(INSTAGRAM_SOURCE_USER_ID, detectedTextLines)

        item.voiceover.detectedText = await speechToText(item.source.video.url)

        item.voiceover.text = await prepareTextToVoiceOver(item.voiceover.detectedText)

        item.voiceover.path = await getVoiceOver(item)

        await getSubtitle(item)
    }

    await writeFile(`${dataStoragePath}/video-content.json`, JSON.stringify(list, null,2))
}

const getVideoText = async () => {
    const file = fs.readFileSync(`${dataStoragePath}/video.json`, 'utf-8')
    const parsed = JSON.parse(file)

    const list = parsed.slice(0, GET_VIDEO_TEXT_CONTENT_LIMIT)

    for (const item of list) {
        const { id, video } = item
        const key = `${INSTAGRAM_SOURCE_USER_ID}/${id}.mp4`

        item.s3 = await uploadToS3({ bucket: AWS_S3_BUCKET, key: key, fileUrl: video.url })
    }

    const detectedTextLines = await Promise.all(list.map(detectTextOnVideo))

    const result = detectedTextVideoNormalizer(INSTAGRAM_SOURCE_USER_ID, detectedTextLines)

    fs.writeFileSync(`${dataStoragePath}/video-content.json`, JSON.stringify(result, null,2))
}

const generateNewImages = async () => {
    const file = fs.readFileSync(`${dataStoragePath}/images-content.json`, 'utf-8')
    const imagesTextContent = JSON.parse(file)

    const imagesTextContentLimited = imagesTextContent.slice(0, GENERATE_NEW_IMAGE_LIMIT)

    const posts = await Promise.all(imagesTextContentLimited.map(item => generateImageFromTemplate(
        item,
        INSTAGRAM_USERNAME,
        PLACID_TEMPLATE_ID,
    )))

    fs.writeFileSync(`${dataStoragePath}/images-post.json`, JSON.stringify(posts, null,2))
}

const generateNewVideo = async () => {
    const file = await readFile(`${dataStoragePath}/video-content.json`)
    const parsed = JSON.parse(file)

    const list = parsed.slice(0, GENERATE_NEW_VIDEO_LIMIT)

    for (const item of list) {
        item.post = await generateVideo(item)
    }

    await writeFile(`${dataStoragePath}/video-post.json`, JSON.stringify(posts, null,2))
}

const publishPost = async () => {
    const file = fs.readFileSync(`${dataStoragePath}/images-post.json`, 'utf-8')
    const postContent = JSON.parse(file)

    const postContentLimited = postContent.slice(0, INSTAGRAM_IMAGE_POST_LIMIT)

    const published = await Promise.all(postContentLimited.map(publishPostToInstagram))

    fs.writeFileSync(`${dataStoragePath}/images-published.json`, JSON.stringify(published, null,2))
}

(async () => {
    // await getInstagramContent()

    // await runVideos()

    // await generateNewImages()
    await generateNewVideo()

    // await publishPost()
})()


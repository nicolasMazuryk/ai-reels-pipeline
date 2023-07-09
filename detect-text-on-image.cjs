const AWS = require('aws-sdk')

const { AWS_CONFIG } = require('./config.cjs')

AWS.config.update(AWS_CONFIG)

const axios = require('axios')
const rekognition = new AWS.Rekognition()

const detectTextOnImage = async(item) => {
    const sourceImage = await axios({
        url: item.image.url,
        method: 'GET',
        responseType: 'arraybuffer',
    })

    const detectTextParams = {
        Image: {
            Bytes: sourceImage.data
        },
    }

    const detectTextResponse = await rekognition.detectText(detectTextParams)
        .promise()
        .catch((error) => {
            console.error(error)

            throw error
        })

    const detectedTextLines = detectTextResponse.TextDetections
        .filter(item => item.Type === 'LINE' && item.Confidence > 97)
        .map(item => item.DetectedText)

    return {
        detectedText: detectedTextLines,
        caption: item.caption
    }
}

module.exports = { detectTextOnImage }

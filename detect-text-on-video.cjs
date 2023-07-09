const AWS = require('aws-sdk')

const { AWS_CONFIG } = require('./config.cjs')

const { wait, groupByTimestamp, filterUniqueItems } = require('./utils.cjs')

AWS.config.update(AWS_CONFIG)

const rekognition = new AWS.Rekognition()

const detectTextOnVideo = async(item) => {
    const StartTextDetectionParams = {
        Video: {
            S3Object: {
                Bucket: item.source.s3.Bucket,
                Name: item.source.s3.Key
            }
        },
        Filters: {
            WordFilter: {
                MinConfidence: 80
            },
            RegionsOfInterest: [{
                BoundingBox: {
                    Width: 1,
                    Height: 0.5,
                    Left: 0,
                    Top: 0.25,
                }
            }]
        }
    }

    const startTextDetectionResponse = await rekognition.startTextDetection(StartTextDetectionParams)
        .promise()
        .catch((error) => {
            console.error(error)

            throw error
        })

    const getTextDetectionParams = {
        JobId: startTextDetectionResponse.JobId
    }

    let counter = 0

    let getTextDetectionResponse

    while (true) {
        counter++
        console.log(counter)

        try {
            getTextDetectionResponse = await rekognition.getTextDetection(getTextDetectionParams).promise()

            const status = getTextDetectionResponse.JobStatus

            if (status === 'SUCCEEDED') break

            if (status !== 'IN_PROGRESS') {
                console.log('AWS Video Text Detection unexpected status: ', status)
                break
            }
        } catch (err) {
            console.error(err)
            break
        }

        await wait(1000)
    }

    const { VideoMetadata, TextDetections } = getTextDetectionResponse

    const textDetectionGroupedByTimestamp = groupByTimestamp(TextDetections)

    const detectedTextLinesGroupedByTimestamp = []

    for (const timestampGroup in textDetectionGroupedByTimestamp) {

        const detectedTextLines = textDetectionGroupedByTimestamp[timestampGroup]
            .filter(({ TextDetection }) => TextDetection.Type === 'LINE' && TextDetection.Confidence > 97)
            .map(({ TextDetection }) => TextDetection.DetectedText)

        detectedTextLinesGroupedByTimestamp.push(detectedTextLines)
    }

    const uniqueDetectedTextLines = filterUniqueItems(detectedTextLinesGroupedByTimestamp)


    return {
        detectedText: uniqueDetectedTextLines,
    }
}

module.exports = { detectTextOnVideo }

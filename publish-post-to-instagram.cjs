const AWS = require('aws-sdk')

const { IgApiClient } = require('instagram-private-api')

const { AWS_CONFIG, AWS_S3_BUCKET, INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD } = require('./config.cjs')

AWS.config.update(AWS_CONFIG)

const s3 = new AWS.S3()

const ig = new IgApiClient()

ig.state.generateDevice(INSTAGRAM_USERNAME)

const publishPostToInstagram = async (item) => {
    const params = {
        Bucket: AWS_S3_BUCKET,
        Key: item.image,
    }

    const image = await s3.getObject(params).promise()

    await ig.simulate.preLoginFlow();
    const loggedInUser = await ig.account.login(INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD)

    const published = await ig.publish.photo({
        file: image.Body,
        caption: item.text,
        // usertags?: PostingUsertags;
        // location?: PostingLocation;
    })

    return {
        id: published.media.id,
        time: published.media.taken_at,
        ...item,
    }
}

module.exports = { publishPostToInstagram }

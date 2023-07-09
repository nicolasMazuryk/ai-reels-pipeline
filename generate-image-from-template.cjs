const axios = require('axios')

const { AWS_CONFIG, AWS_S3_BUCKET } = require('./config.cjs')
const { TARGET_ACCOUNT_NAMES } = require('./constants.cjs')
const { generateFilename, generateUuid } = require('./utils.cjs')
const generateImageFromTemplate = async (item, INSTAGRAM_USERNAME, PLACID_TEMPLATE_ID) => {
    const s3FilePath = `${INSTAGRAM_USERNAME}/${generateFilename(item.main)}-${generateUuid()}.jpg`

    const data = {
        layers: {
            image: {
                image: 'https://data.helioroid.com/f57f4eca-e73f-4850-ac57-8e7eaea55395/1200x628.jpeg',
            },
            quote: {
                text: item.main,
            },
            channel: {
                text: TARGET_ACCOUNT_NAMES[INSTAGRAM_USERNAME]
            },
            author: {
                text: item.secondary,
            }
        },
        transfer: {
            to: 's3',
            key: AWS_CONFIG.accessKeyId,
            secret: AWS_CONFIG.secretAccessKey,
            region: AWS_CONFIG.region,
            bucket: AWS_S3_BUCKET,
            visibility: 'private',
            path: s3FilePath,
            endpoint: `https://s3.${AWS_CONFIG.region}.amazonaws.com`
        }
    }

    const result = await axios({
        url: `https://api.placid.app/api/rest/${PLACID_TEMPLATE_ID}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.PLACID_API_TOKEN}`
        },
        data : data
    })

    return {
        image: s3FilePath,
        text: item.caption
    }
}

module.exports = { generateImageFromTemplate }

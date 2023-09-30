const AWS = require('aws-sdk')

const { AWS_CONFIG } = require('./config.cjs')

AWS.config.update(AWS_CONFIG)

const axios = require('axios')
const {  readFile } = require("./utils.cjs");
const s3 = new AWS.S3()

const getFromS3 = async (bucket, key) => {
    const downloadParams = {
        Bucket: bucket,
        Key: key
    }

    const response = await s3.getObject(downloadParams).promise()

    return response.Body
}

const getFromS3Stream = (bucket, key) => {
    const downloadParams = {
        Bucket: bucket,
        Key: key
    }

    const stream = s3.getObject(downloadParams).createReadStream();

    stream.on('error', err => {
        console.error('Error downloading s3 file:', err);
    });

    return stream
}

const uploadToS3ByPath = async({
    bucket,
    key,
    filePath,
 }) => {
    const file = await readFile(filePath)

    const params = {
        Bucket: bucket,
        Key: key,
        Body: file,
    }

    const s3Response = await s3.upload(params)
        .promise()
        .catch(error => {
            console.error(error)
        })

    return s3Response
}

const uploadToS3ByURL = async({
      bucket,
      key,
      fileUrl,
    }) => {
    const sourceImage = await axios({
        url: fileUrl,
        method: 'GET',
        responseType: 'arraybuffer',
    })

    const params = {
        Bucket: bucket,
        Key: key,
        Body: sourceImage.data,
    }

    const s3Response = await s3.upload(params)
        .promise()
        .catch(error => {
            console.error(error)
        })

    return s3Response
}

module.exports = { getFromS3, getFromS3Stream, uploadToS3ByURL, uploadToS3ByPath }

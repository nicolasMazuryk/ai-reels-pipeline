const detectedTextImageNormalizer = (userId, detectedTextLines) => {
    if (userId === 'philosophyinsight') {
        return detectedTextLines.map(({ detectedText, caption }) => {
            detectedText.splice(detectedText.length - 2, 2)

            const secondary = detectedText.pop()
            const main = detectedText.join('\n')

            return { main, secondary, caption }
        })

    }
}

module.exports = { detectedTextImageNormalizer }

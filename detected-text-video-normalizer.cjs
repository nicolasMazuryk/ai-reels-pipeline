const { filterIncompleteTextArrayItems } = require('./utils.cjs')

const detectedTextVideoNormalizer = (userId, detectedTextLines) => {
    if (userId === 'psychologyfactsclub') {
        return detectedTextLines.map(({ detectedText }) => {
            const removedReplyToCommentLine = detectedText
                .filter(scene => {
                    return !(scene[0].indexOf('Reply to') >= 0 && scene[1] === 'comment')
                })

            const main = removedReplyToCommentLine[0][0] // fixed header, displayed on all scenes

            const removedMainSceneLine = removedReplyToCommentLine
                .map(scene => scene.filter(line => line !== main))
                .filter(scene => scene.length)

            const scenes = filterIncompleteTextArrayItems(removedMainSceneLine)

            return { main, scenes }
        })
    }
}

module.exports = { detectedTextVideoNormalizer }

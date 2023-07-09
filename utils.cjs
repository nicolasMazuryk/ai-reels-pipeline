const fs = require("fs");
const path = require("path");
const uuid = require('uuid');

const musicLibraryPath = path.join(__dirname, 'data', 'db', 'music-library.json')

const readFile = async (filePath) => fs.promises.readFile(filePath)
const writeFile = async (filePath, data) => fs.promises.writeFile(filePath, data)

const updateMusicLibrary = async (data) => {
    if (!fs.existsSync(musicLibraryPath)) await writeFile(musicLibraryPath, JSON.stringify([]))

    const musicLibraryJSON = await readFile(musicLibraryPath)
    const musicLibrary = JSON.parse(musicLibraryJSON)

    if (musicLibrary.find((item) => item.id === data.id)) return

    musicLibrary.push(data)
    await writeFile(musicLibraryPath, JSON.stringify(musicLibrary, null, 2))
}

const generateFilename = (text) => {
    let filename = text.toLowerCase()
    filename = filename.replace(/[^a-z0-9]+/g, '-')
    filename = filename.replace(/^-+|-+$/g, '')
    filename = filename.replace(/-+/g, '-')

    return filename
}

const uuidV4 = () => {
    return uuid.v4()
}
const generateUuid = () => {
    return uuid.v4().slice(0, 8);
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

const groupByTimestamp = (arr) => {
    let grouped = {};

    arr.forEach(obj => {
        const timestamp = obj.Timestamp;
        if (!grouped[timestamp]) {
            grouped[timestamp] = [];
        }
        grouped[timestamp].push(obj);
    });

    return grouped;
}

const filterUniqueItems = (array) => {
    const seen = new Set();
    const filtered = [];
    for (const elem of array) {
        if (!seen.has(elem.toString())) {
            filtered.push(elem);
            seen.add(elem.toString());
        }
    }
    return filtered;
}

const filterIncompleteTextArrayItems = (scenes) => {
    const filteredScenes = scenes.reduce((acc, scene, sceneIndex, scenesArray) => {
        for (const [lineItemIndex, lineItem] of scene.entries()) {

            for (const [subScenesIndex, subScenes] of scenesArray.entries()) {
                if (sceneIndex === subScenesIndex) continue

                for (const [subLineItemIndex, subLineItem] of subScenes.entries()) {
                    if (lineItemIndex === subLineItemIndex) {
                        // some line string in another array contains current line string.
                        // Current whole line should be excluded
                        if (subLineItem.indexOf(lineItem) >= 0) {
                            return acc
                        }
                    }
                }
            }
        }

        acc.push(scene)

        return acc
    }, [])

    return filteredScenes
}

module.exports = {
    readFile,
    writeFile,
    uuidV4,
    generateFilename,
    generateUuid,
    filterIncompleteTextArrayItems,
    wait,
    groupByTimestamp,
    filterUniqueItems,
    updateMusicLibrary,
}

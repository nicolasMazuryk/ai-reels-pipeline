const fs = require("fs");
const path = require("path");
const uuid = require('uuid');
const ffmpeg = require('fluent-ffmpeg')

const musicLibraryPath = path.join(__dirname, 'data', 'db', 'music-library.json')

const readFile = async (filePath) => fs.promises.readFile(filePath)
const writeFile = async (filePath, data) => fs.promises.writeFile(filePath, data)

const updateMusicLibrary = async (data) => {
    if (!fs.existsSync(musicLibraryPath)) await writeFile(musicLibraryPath, JSON.stringify([]))

    const musicLibraryJSON = await readFile(musicLibraryPath)
    const musicLibrary = JSON.parse(musicLibraryJSON)

    if (musicLibrary.find((item) => item.id === data.id)) return true

    musicLibrary.push(data)
    await writeFile(musicLibraryPath, JSON.stringify(musicLibrary, null, 2))

    return false
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

const convertMP4toMP3 = async (data, outputPath) => {
    const tempSourceFilePath = path.join(__dirname, '.cache', 'music', 'temporary-music-converted.mp4')

    await writeFile(tempSourceFilePath, data)

    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(tempSourceFilePath, (err, metadata) => {
            if (err) throw err;

            ffmpeg(tempSourceFilePath)
                .audioCodec('libmp3lame')
                // .audioBitrate('320k')
                .audioChannels(2)
                .format('mp3')
                .save(outputPath)
                .on('end', () => {
                    resolve(outputPath)
                })
                .on('error', (err) => {
                    reject(err)
                })
                .run()
        })
    })
}

const getAudioDuration = async (path) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(path, (err, metadata) => {
            if (err) return reject(err)

            resolve(metadata.format.duration)
            // resolve(metadata.format.duration_ts)
        })
    })
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
    convertMP4toMP3,
    getAudioDuration,
}

const fs = require('fs')
const path = require("path")
// const { getAudioDurationInSeconds } = require('get-audio-duration')

const { FFScene, FFText, FFVideo, FFAlbum, FFImage, FFGifImage, FFAudio, FFSubtitle, FFCreator } = require("ffcreator");

const { INSTAGRAM_SOURCE_USER_ID } = require('./config.cjs')
const { readFile, writeFile, getAudioDuration } = require('./utils.cjs')

const dataStoragePath = path.join(__dirname, 'data', INSTAGRAM_SOURCE_USER_ID)
const assetsPath = path.join(__dirname, 'assets')
const outputPath = path.join(__dirname, 'output', INSTAGRAM_SOURCE_USER_ID)

const musicLibraryPath = path.join(__dirname, 'data', 'db', 'music-library.json')

if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath)

const generateVideo = async (item) => {
    const width = 720
    const height = 1280

    const MUSIC_DROP_PLAY_DURATION = 4000

    const outputVideoPath = path.join(outputPath, `${item.id}.mp4`)

    const musicLibraryFile = await readFile(musicLibraryPath)
    const musicLibrary = JSON.parse(musicLibraryFile)
    const music = musicLibrary.find(libraryItem => libraryItem.name === item.source.music)
    if (!music) throw new Error('Music is missing in music library')

    const voiceoverDurationInSeconds = await getAudioDuration(item.voiceover.path)
    const voiceoverDuration = Math.ceil(voiceoverDurationInSeconds * 1000)

    const totalVideoDuration = voiceoverDuration + MUSIC_DROP_PLAY_DURATION
    const totalVideoDurationInSeconds = Number((totalVideoDuration / 1000).toFixed(2))

    const musicStartTime = music.highlights[0] - voiceoverDuration
    const musicStartTimeInSeconds = Number((musicStartTime / 1000).toFixed(2))

    const creator = new FFCreator({
        cacheDir: path.join(__dirname, '.cache'),
        outputDir: outputPath,
        output: outputVideoPath,
        width: width,
        height: height,
        // audio: path.join(assetsPath, 'images', 'pexels-ian-beckley-2440061.jpg'),
        // cover: path.join(assetsPath, 'images', 'pexels-ian-beckley-2440061.jpg'),
        // audioLoop: true,
        fps: 30,
        threads: 8,
        clarity: 'high',
        // debug: false,
        // defaultOutputOptions: null, // ffmpeg output option configuration
    });

    const scene = new FFScene()

    // scene.setDuration(totalVideoDurationInSeconds)

    scene.addAudio({
        path: music.path,
        // start: musicStartTimeInSeconds, // 2
        // startTime: 30,
        volume: 0.5,
        // ss: '00:00:30',
        // ss: 30000,
    })

    scene.addAudio({
        path: item.voiceover.path,
        // fadeIn: 2,
        // start: 2,
        volume: 1,
        // ss: 10,
        // to: 300,
        // startTime: 10,
    })

    creator.addChild(scene)

    const video = new FFVideo({
        path: path.join(assetsPath, 'video', 'stock-1.mp4'),
        x: 360,
        y: 640,
        width: 720,
        height: 1280,
    });
    video.setAudio(false)
    // video.setDuration(voiceoverDurationInSeconds)

    // video.setStartTime('00:00:00')
    // video.setEndTime('00:00:10')

    scene.addChild(video)

    const video2 = new FFVideo({
        path: path.join(assetsPath, 'video', 'stock-2.mp4'),
        x: 360,
        y: 640,
        width: 720,
        height: 1280,
    });
    video.setAudio(false)
    // video.setDuration(voiceoverDuration)

    // video.setStartTime('00:00:00')
    // video.setEndTime('00:00:10')

    scene.addChild(video2)

    for (const node of item.subtitle.nodes) {
        const text = new FFText({ text: node.text })

        text.setXY(width / 2, height / 2)
        text.setColor('#000000')
        text.setFont(path.join(assetsPath, 'fonts', 'Roboto-Regular.ttf'))
        text.setWrap(360)
        text.alignCenter()
        text.setStyle({ padding: 10 })
        text.setStyle({
            // fontFamily: ['Microsoft YaHei', 'Helvetica', 'Tahoma'],
            fontSize: 32,
            // fontStyle: 'italic',
            // fontWeight: 'bold',
            // stroke: '#000000',
            // strokeThickness: 1,
        })

        const start = Number((node.start / 1000).toFixed(2))
        const end = Number((node.end / 1000).toFixed(2))

        text.addEffect('fadeIn', 0.001, start);
        text.addEffect('fadeOut', 0.001, end);

        scene.addChild(text)
    }

    item.post.path = outputVideoPath

    creator.start()
    creator.closeLog()

    creator.on('start', () => {
        console.log(`FFCreator start`);
    });
    creator.on('error', e => {
        console.log(`FFCreator error: ${JSON.stringify(e)}`);
    });
    creator.on('progress', e => {
        console.log(`FFCreator progress: ${(e.percent * 100) >> 0}%`);
    });
    creator.on('complete', e => {
        console.log(`FFCreator completed: \n USAGE: ${e.useage}`);
    });

    // const image = new FFImage({ path: path.join(assetsPath, 'images', 'pexels-ian-beckley-2440061.jpg') });
    //
    // image.setXY(width / 2, height / 2)
    // image.setWH(width, height)
    // // image.addEffect(['zoomingOut', 'moveingLeft', 'moveingBottom'], 6, 0)
    // scene.addChild(image)
}

module.exports = { generateVideo }

// (async () => {
//     await generateVideo()
// })()


const fs = require('fs')
const path = require("path")

const { FFScene, FFText, FFVideo, FFAlbum, FFImage, FFGifImage, FFAudio, FFSubtitle, FFCreator } = require("ffcreator");

const { INSTAGRAM_SOURCE_USER_ID } = require('./config.cjs')

const dataStoragePath = path.join(__dirname, 'data', INSTAGRAM_SOURCE_USER_ID)
const assetsPath = path.join(__dirname, 'assets')
const outputPath = path.join(__dirname, 'output', INSTAGRAM_SOURCE_USER_ID)

if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath)

const generateVideo = async (item) => {
    const width = 720
    const height = 1280

    const outputVideoPath = path.join(outputPath, item.id)

    const creator = new FFCreator({
        cacheDir: path.join(__dirname, '.cache'),
        outputDir: outputPath,
        output: outputVideoPath,
        width: width,
        height: height,
        // cover: path.join(assetsPath, 'images', 'pexels-ian-beckley-2440061.jpg'),
        // audioLoop: true,
        fps: 30,
        threads: 8,
        clarity: 'high',
        // debug: false,
        // defaultOutputOptions: null, // ffmpeg output option configuration
    });

    const scene = new FFScene()
    scene.setDuration(8)

    creator.addChild(scene)

    // const image = new FFImage({ path: path.join(assetsPath, 'images', 'pexels-ian-beckley-2440061.jpg') });
    //
    // image.setXY(width / 2, height / 2)
    // image.setWH(width, height)
    // // image.addEffect(['zoomingOut', 'moveingLeft', 'moveingBottom'], 6, 0)
    // scene.addChild(image)

    const video = new FFVideo({
        path: path.join(assetsPath, 'videos', 'pexels-peggy-anke-4439948-1080x1920-30fps.mp4'),
        x: 360,
        y: 640,
        width: 720,
        height: 1280,
    });
    video.setAudio(false)
    video.setStartTime('00:00:00')
    video.setEndTime('00:00:10')

    scene.addChild(video)

    const text = new FFText({ text: "Scary fact." })
    text.setXY(width / 2, height / 2)
    text.setColor('#000000')
    // text.setBackgroundColor('#b33771')

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

    text.addEffect('fadeIn', 0.001, 2.009);
    text.addEffect('fadeOut', 0.001, 2.879);

    scene.addChild(text)


    const text2 = new FFText({ text: "And legend says" })
    text2.setXY(width / 2, height / 2)
    text2.setColor('#ffffff')
    // text.setBackgroundColor('#b33771')

    text2.setFont(path.join(assetsPath, 'fonts', 'Roboto-Regular.ttf'))
    text2.setWrap(360)
    text2.alignCenter()
    text2.setStyle({ padding: 10 })
    text2.setStyle({
        // fontFamily: ['Microsoft YaHei', 'Helvetica', 'Tahoma'],
        fontSize: 32,
        // fontStyle: 'italic',
        // fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 1,
    })

    text2.addEffect('fadeIn', 0.001, 3.570);
    text2.addEffect('fadeOut', 0.001, 4.670);

    scene.addChild(text2)




    scene.addAudio({
        path: path.join(assetsPath, 'voices', 'ElevenLabs a0a8e0b2-001c-4696-a00a-b398623086be.mp3'),
        // fadeIn: 2,
        start: 2,
        volume: 1,
        // ss: '00:00:01',
        // startTime: '00:00:01',
    })

    const dropTime = '00:00:15:07'
    const startTime = '00:00:10'

    scene.addAudio({
        path: path.join(assetsPath, 'audios', '273014311_1233418210520369_7202493589925483502_n.mp3'),
        // fadeIn: 2,
        // start: 2,
        volume: 0.5,
        ss: 10,
        to: 300,
        // startTime: 10,
    })

    // const subtitle = new FFSubtitle({
    //     // comma: true, // Whether to separate by comma
    //     // backgroundColor: '#000000', // background color
    //     color: '#fff', // text color
    //     fontSize: 48, // font size
    //     // fontStyle: 'normal',
    //     // fontWeight: 'bold',
    //     stroke: '#000000',
    //     strokeThickness: 10,
    //     // 'text-shadow': '3px 3px 3px rgba(66, 68, 90, 1)',
    //     path: path.join(assetsPath, 'voices', 'updated_subtitles.srt'),
    // });
    // subtitle.setXY(width / 2, height / 2 + height / 4)
    // subtitle.setFrameBuffer(24) // Buffer frame
    //
    // subtitle.setFont(path.join(assetsPath, 'fonts', 'Roboto-Regular.ttf'))
    //
    // subtitle.setStyle({
    //     // fontFamily: ['Microsoft YaHei', 'Helvetica', 'Tahoma'],
    //     // fontSize: 32,
    //     fontStyle: 'normal',
    //     fontWeight: 'bold',
    //     backgroundColor: 'rgba(0,0,0,0)',
    //     'text-shadow': '3px 3px 3px rgba(66, 68, 90, 1)',
    // })
    //
    // // subtitle.addEffect('fadeIn', 0.05, 2);
    // // subtitle.addEffect('fadeOut', 0.05, 3);
    //
    // scene.addChild(subtitle)


    item.post.path = outputVideoPath

    // creator.output(path.join(__dirname, "./output/example.mp4"));
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
}

module.exports = { generateVideo }

// (async () => {
//     await generateVideo()
// })()


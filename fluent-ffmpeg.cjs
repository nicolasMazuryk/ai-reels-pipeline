const fs = require('fs')
const { join } = require("path")
const ffmpeg = require('fluent-ffmpeg')

const { INSTAGRAM_SOURCE_USER_ID } = require('./config.cjs')
const { readFile, writeFile, getAudioDuration } = require('./utils.cjs')

const assetsPath = join(__dirname, 'assets')
// const fontPath = join(assetsPath, 'fonts', 'bank-gothic-light-bt.ttf')
const fontPath = join(assetsPath, 'fonts', 'Aldrich-Regular.ttf')
const logoPath = join(assetsPath, 'image', 'logo.png')
const outputPath = join(__dirname, 'output', INSTAGRAM_SOURCE_USER_ID)

const musicLibraryPath = join(__dirname, 'data', 'db', 'music-library.json')

if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath)

const generateVideo = async (item) => {
    const width = 1080
    const height = 1920

    const MUSIC_PLAY_AFTER_DROP_DURATION = 3800
    const musicPlayAfterDropDurationInSeconds = Number((MUSIC_PLAY_AFTER_DROP_DURATION / 1000).toFixed(3))

    const outputVideoPath = join(outputPath, `${item.id}.mp4`)

    const musicLibraryFile = await readFile(musicLibraryPath)
    const musicLibrary = JSON.parse(musicLibraryFile)
    const music = musicLibrary.find(libraryItem => libraryItem.name === item.source.music)
    if (!music) throw new Error('Music is missing in music library')

    const blackScreen = getBlackFrameTimeStartEnd(item)

    const voiceoverDurationInSeconds = await getAudioDuration(item.voiceover.path)
    const voiceoverDuration = Math.ceil(voiceoverDurationInSeconds * 1000)

    const totalVideoDuration = voiceoverDuration + MUSIC_PLAY_AFTER_DROP_DURATION
    const totalVideoDurationInSeconds = Number((totalVideoDuration / 1000).toFixed(3))

    const musicStartTime = music.highlights[0] - voiceoverDuration
    const musicEndTime = musicStartTime + totalVideoDuration
    const musicStartTimeInSeconds = Number((musicStartTime / 1000).toFixed(3))
    const musicEndTimeInSeconds = Number((musicEndTime / 1000).toFixed(3))


    // ffmpeg()
    //     .input(join(assetsPath, 'video', '3', '1.mp4'))
    //     .input(join(assetsPath, 'video', '3', '2.mp4'))
    //     .complexFilter([
    //         `[0:v] trim=start=0:end=${0}, setpts=PTS-STARTPTS, scale=w=${-1}:h=${height}, crop=w=${width}:h=${height}, fps=fps=30, eq=brightness=-0.06:saturation=-2 [v1]`,
    //         `[1:v] trim=start=0:end=${musicPlayAfterDropDurationInSeconds}, setpts=PTS-STARTPTS, scale=w=${-1}:h=${height}, crop=w=${width}:h=${height}, fps=fps=30, format=gray, colorlevels=rimin=0.5:gimin=0.5:bimin=0.5, colorlevels=romax=0.4:gomax=0.4:bomax=0.4, unsharp=luma_msize_x=7:luma_msize_y=7:luma_amount=2.5 [v2]`,
    //
    //         `[v1][v2]concat=n=2:v=1:unsafe=1[concat]`,
    //     ])
    //     .outputOptions([
    //         '-map [concat]',
    //         // '-map [outa]'
    //     ])
    //     .save(outputVideoPath)
    //     .on('progress', function(progress) {
    //         console.log('Processing: ' + progress.percent + '% done');
    //     })
    //     .on('error', function(err, stdout, stderr) {
    //         console.log('Cannot process video: ' + err.message);
    //     })
    //     .on('end', () => {
    //         console.log('Video conversion finished!');
    //     })


    ffmpeg()
        .input(join(assetsPath, 'video', '1', '1.mp4'))
        .input(join(assetsPath, 'video', '1', '2.mp4'))
        .input(item.voiceover.path)
        .input(music.path)
        .input(logoPath)
        .complexFilter([
            `[0:v] trim=start=0:end=${voiceoverDurationInSeconds}, setpts=PTS-STARTPTS, scale=w=${-1}:h=${height}, crop=w=${width}:h=${height}, fps=fps=30, format=gray, colorlevels=rimin=0.5:gimin=0.5:bimin=0.5, colorlevels=romax=0.5:gomax=0.5:bomax=0.5, unsharp=luma_msize_x=7:luma_msize_y=7:luma_amount=2.5 [v1]`,
            // `[1:v] trim=start=0:end=${musicPlayAfterDropDurationInSeconds}, setpts=PTS-STARTPTS, scale=w=${-1}:h=${height}, crop=w=${width}:h=${height}, fps=fps=30, eq=brightness=-0.06:saturation=-2 [v2]`,
            `[1:v] trim=start=0:end=${musicPlayAfterDropDurationInSeconds}, setpts=PTS-STARTPTS, scale=w=${-1}:h=${height}, crop=w=${width}:h=${height}, fps=fps=30, format=gray, colorlevels=rimin=0.5:gimin=0.5:bimin=0.5, colorlevels=romax=0.5:gomax=0.5:bomax=0.5, unsharp=luma_msize_x=7:luma_msize_y=7:luma_amount=2.5 [v2]`,

            `[v1][v2]concat=n=2:v=1:unsafe=1[concat]`,

            `color=color=black@0.0:size=${width}x${height}[overlay]`,
            `[concat][overlay]overlay=shortest=1[darkened]`,

            `[4:v][darkened]scale2ref=w=oh*mdar:h=ih/20 [scaled-logo][scaled-video]`,
            `[scaled-video][scaled-logo]overlay=x=(main_w-overlay_w)/2:y=(main_h-overlay_h)*0.92 [logo]`,

            `[logo]drawtext=x=(W-text_w)/2:y=(H-text_h)*0.06:fontfile=${fontPath}:fontsize=28:fontcolor=white:text='STOICISM - MINDSET - MOTIVATION' [header]`,
            `[header]drawtext=x=(W-text_w)/2:y=(H-text_h)*0.94:fontfile=${fontPath}:fontsize=28:fontcolor=white:text='STOIC.WISDOM.DAILY' [footer]`,
            // Fontname=Bank Gothic Light BT,
            `[footer]subtitles=filename=${item.subtitle.path}:fontsdir=${join(assetsPath, 'fonts')}:force_style='Fontname=Aldrich Regular,Alignment=10,Outline=0,Fontsize=6,Spacing=0,MarginR=80,MarginL=80,PrimaryColour=&HFFFFFF,Bold=-1'[outv]`,

            `[2:a][2:a] amerge=inputs=2[stereo]`,
            `[stereo] atrim=start=0, asetpts=PTS-STARTPTS, aresample=48000 [a1]`,
            `[3:a] atrim=start=${musicStartTimeInSeconds}:end=${musicEndTimeInSeconds}, asetpts=PTS-STARTPTS [a2]`,

            `[a1][a2]amix=inputs=2:dropout_transition=0[outa]`
        ])
        // .complexFilter([
        //     `[0:v] trim=start=0:end=${blackScreen.start}, setpts=PTS-STARTPTS, scale=w=${width}:h=${height}, fps=fps=30 [v1]`,
        //     `[1:v] trim=start=0:end=${blackScreen.duration}, setpts=PTS-STARTPTS, scale=w=${width}:h=${height}, fps=fps=30 [v2]`,
        //     `[2:v] trim=start=0:end=${musicPlayAfterDropDurationInSeconds}, setpts=PTS-STARTPTS, scale=w=${width}:h=${height}, fps=fps=30 [v3]`,
        //
        //     '[v1][v2][v3]concat=n=3:v=1[concat]',
        //
        //     `color=color=black@0.8:size=${width}x${height}[overlay]`,
        //     '[concat][overlay]overlay=shortest=1[overlayedv]',
        //
        //     `[overlayedv]subtitles=filename=${item.subtitle.path}:fontsdir=${join(assetsPath, 'video')}:force_style='Alignment=10,Outline=0,Fontsize=5,Fontname=Bank Gothic Light BT,Spacing=0,MarginR=100,MarginL=100,PrimaryColour=&HFFFFFF,Bold=-1'[outv]`,
        //
        //     '[3:a][3:a] amerge=inputs=2[stereo]',
        //     '[stereo] atrim=start=0, asetpts=PTS-STARTPTS, aresample=48000 [a1]',
        //     `[4:a] atrim=start=${musicStartTimeInSeconds}:end=${musicEndTimeInSeconds}, asetpts=PTS-STARTPTS [a2]`,
        //
        //     '[a1][a2]amix=inputs=2:dropout_transition=0[outa]'
        // ])
        .outputOptions([
            '-map [outv]',
            '-map [outa]'
        ])
        .save(outputVideoPath)
        .on('progress', function(progress) {
            console.log('Processing: ' + progress.percent + '% done');
        })
        .on('error', function(err, stdout, stderr) {
            console.log('Cannot process video: ' + err.message);
        })
        .on('end', () => {
            console.log('Video conversion finished!');
        })
}

module.exports = { generateVideo }

function getBlackFrameTimeStartEnd(item) {
    const nodes = item.subtitle.nodes

    let duration = 0

    for (let i = nodes.length - 1; i > 0; i--) {
        const node = nodes[i]

        duration += node.end - node.start

        if (duration > 1000) {
            return {
                start: Number((node.start / 1000).toFixed(3)),
                end: Number((node.end / 1000).toFixed(3)),
                duration: Number((duration / 1000).toFixed(3)),
            }
        }
    }

    const lastNode = item.subtitle.nodes.pop()
    const lastNodeDuration = lastNode.end - lastNode.start

    return {
        start: Number((lastNode.start / 1000).toFixed(3)),
        end: Number((lastNode.end / 1000).toFixed(3)),
        duration: Number((lastNodeDuration / 1000).toFixed(3)),
    }
}

// (async () => {
//     await generateVideo()
// })()

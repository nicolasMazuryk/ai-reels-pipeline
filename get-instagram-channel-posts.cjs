const axios = require('axios')

const { updateMusicLibrary } = require('./utils.cjs')

const {
    INSTAGRAM_USER_AGENT,
    INSTAGRAM_MAX_FEED_COUNT,
    INSTAGRAM_API_REQUEST_LIMIT,
} = require('./config.cjs')

const getFeed = async (userId, nextMaxId) => {
    const maxIdParam = nextMaxId ? `&max_id=${nextMaxId}` : ''

    return axios({
        method: 'GET',
        url: `https://www.instagram.com/api/v1/feed/user/${userId}/username/?count=${INSTAGRAM_API_REQUEST_LIMIT}${maxIdParam}`,
        headers: {
            'cookie': INSTAGRAM_USER_AGENT._cookie,
            'user-agent': INSTAGRAM_USER_AGENT._userAgent,
            'x-ig-app-id': INSTAGRAM_USER_AGENT._xIgAppId
        },
    })
}

const setImageData = (data, item) => {
    const image = item.image_versions2.candidates[0]

    data.isImage = true
    data.image = {
        url: image.url,
        // originalWidth: item.original_width,
        // originalHeight: item.original_height,
    }

    return data
}

const setVideoData = (data, item) => {
    if (!item.video_versions) return

    const video = item.video_versions[0]

    data.isVideo = true
    data.playCount = item.play_count
    data.videoDuration = item.video_duration
    data.video = {
        url: video.url,
        // originalWidth: item.original_width,
        // originalHeight: item.original_height,
    }
    data.audioID = item?.clips_metadata?.music_info?.music_asset_info?.id

    return data
}

const addAudioToMusicLibrary = async (posts) => {
    const items = posts.slice(0, INSTAGRAM_MAX_FEED_COUNT)

    for (const item of items) {
        if (!item?.clips_metadata?.music_info?.music_asset_info) continue

        const audio = item.clips_metadata.music_info.music_asset_info

        const data = {}

        data.id = audio.id
        data.name = audio.title
        data.artist = audio.display_artist
        data.url = audio.progressive_download_url
        data.highlights = audio.highlight_start_times_in_ms
        data.duration = audio.duration_in_ms

        await updateMusicLibrary(data)
    }
}

const parseChannelPosts = (items) => {
    const parsedPosts = items.map((item) => {
        const {
            id,
            media_type,
            taken_at,
            comment_count,
            like_count,
            caption,
        } = item

        const data = {
            timestamp: taken_at,
            comments: comment_count,
            likes: like_count,
            caption: caption.text,
        }

        if (media_type === 1) { // image
            setImageData(data, item)
        }

        if (media_type === 2) { // video
            setVideoData(data, item)
        }

        if (media_type === 8) { // carousel
            data.isCarousel = true

            data.carousel = item.carousel_media.map((item) => {
                const data = item.media_type === 1 ? setImageData({}, item) : setVideoData({}, item)

                return { id: item.id, source: data }
            })
        }

        if (![1,2,8].includes(media_type)) throw new Error('Unknown instagram post media type')

        return { id, source: data }
    })

    return parsedPosts
}

const getInstagramChannelContent = async (userId) => {
    const posts = []

    const { data } = await getFeed(userId)

    posts.push(...parseChannelPosts(data.items))

    await addAudioToMusicLibrary(data.items)

    let isMoreItemsAvailable = data.more_available
    let nextMaxId = data.next_max_id

    while(isMoreItemsAvailable && posts.length < INSTAGRAM_MAX_FEED_COUNT) {
        const { data: { items, more_available, next_max_id } } = await getFeed(userId, nextMaxId)

        posts.push(...parseChannelPosts(items))

        await addAudioToMusicLibrary(data.items)

        isMoreItemsAvailable = more_available
        nextMaxId = next_max_id
    }

    return posts.slice(0, INSTAGRAM_MAX_FEED_COUNT)
}

module.exports = { getInstagramChannelContent }

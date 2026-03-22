import { NextResponse } from 'next/server'

// YouTube Search API - 使用免费的非官方API
// 搜索歌曲并返回第一个视频ID

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist')
  const song = searchParams.get('song')

  if (!artist || !song) {
    return NextResponse.json({ error: 'Artist and song are required', status: 400 })
  }

  try {
    // 使用 Invidious API (免费开源的YouTube前端，不需要API key)
    const searchQuery = `${artist} ${song} official audio lyrics`
    const encodedQuery = encodeURIComponent(searchQuery)

    // 尝试多个Invidious实例
    const invidiousInstances = [
      'https://invidious.snopyta.org',
      'https://invidious.kavin.rocks',
      'https://yewtu.be'
    ]

    let youtubeData = null

    for (const instance of invidiousInstances) {
      try {
        const response = await fetch(
          `${instance}/api/v1/search?q=${encodedQuery}&type=video&limit=10`,
          { signal: AbortSignal.timeout(5000) }
        )

        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            // 找到官方音频或歌词视频
            const officialVideo = data.find((item: any) =>
              item.title.toLowerCase().includes('official') ||
              item.title.toLowerCase().includes('audio') ||
              item.title.toLowerCase().includes('lyrics') ||
              item.title.toLowerCase().includes('lyric')
            ) || data[0]

            youtubeData = {
              videoId: officialVideo.videoId,
              title: officialVideo.title,
              author: officialVideo.author,
              lengthSeconds: officialVideo.lengthSeconds
            }
            break
          }
        }
      } catch (e) {
        console.log(`Failed to fetch from ${instance}, trying next...`)
        continue
      }
    }

    if (!youtubeData) {
      return NextResponse.json({
        error: 'No YouTube video found',
        status: 404
      })
    }

    return NextResponse.json({
      youtubeId: youtubeData.videoId,
      title: youtubeData.title,
      author: youtubeData.author,
      duration: youtubeData.lengthSeconds
    })
  } catch (error) {
    console.error('YouTube search error:', error)
    return NextResponse.json({ error: 'Failed to search YouTube', status: 500 })
  }
}

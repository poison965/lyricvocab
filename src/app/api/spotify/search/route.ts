import { NextResponse } from 'next/server'

// iTunes Search API - 完全免费，无需 API 密钥
// 文档: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/Searching.html

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query is required', status: 400 })
  }

  try {
    // 使用 iTunes Search API
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`
    const response = await fetch(itunesUrl)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to search tracks', status: response.status })
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return NextResponse.json({ tracks: [] })
    }

    // 将 iTunes 格式转换为项目需要的格式
    const tracks = data.results.map((item: any) => ({
      id: String(item.trackId),
      name: item.trackName,
      artist: item.artistName,
      album: item.collectionName || item.trackName,
      // 更换 100 为 600 获取更高清的图片
      image: item.artworkUrl100?.replace('100x100', '600x600') || '',
      duration: item.trackTimeMillis || 0,
    }))

    return NextResponse.json({ tracks })
  } catch (error) {
    console.error('iTunes search error:', error)
    return NextResponse.json({ error: 'Failed to search tracks', status: 500 })
  }
}
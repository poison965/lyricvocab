import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const artist = searchParams.get('artist')
  const song = searchParams.get('song')

  if (!artist || !song) {
    return NextResponse.json({ error: 'Artist and song are required', status: 400 })
  }

  try {
    // Try LRCLIB API first
    const lrclibResponse = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(song)}`
    )

    if (lrclibResponse.ok) {
      const data = await lrclibResponse.json()
      if (data.syncedLyrics) {
        // Remove timestamps from synced lyrics
        const cleanLyrics = data.syncedLyrics
          .replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '')
          .replace(/\[\d{2}:\d{2}\.\d{2,3}\n/g, '')
          .trim()

        return NextResponse.json({
          lyrics: cleanLyrics,
          source: 'exact',
        })
      } else if (data.plainLyrics) {
        return NextResponse.json({
          lyrics: data.plainLyrics,
          source: 'search',
        })
      }
    }

    // If LRCLIB doesn't have exact match, try search
    const searchResponse = await fetch(
      `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(song)}`
    )

    if (searchResponse.ok) {
      const results = await searchResponse.json()
      if (results.length > 0 && results[0].syncedLyrics) {
        const cleanLyrics = results[0].syncedLyrics
          .replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, '')
          .replace(/\[\d{2}:\d{2}\.\d{2,3}\n/g, '')
          .trim()

        return NextResponse.json({
          lyrics: cleanLyrics,
          source: 'search',
        })
      }
    }

    // Return mock lyrics for demo purposes when no lyrics found
    return NextResponse.json({
      lyrics: `When I saw you standing there
I knew that you would be mine
You looked at me and smiled
And made my heart feel alive

Every time I see your face
I can't help but feel this way
You bring me so much joy
I love you more each day

We danced beneath the stars
And held each other tight
In that moment I knew
You were my heart's delight

Love is what we share
Together we will stay
Forever and always
Until our dying day`,
      source: 'mock',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lyrics', status: 500 })
  }
}
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface MatchedWord {
  word: string
  originalWord: string
  lineIndex: number
  fullLine: string
}

async function loadVocabulary(level: string): Promise<string[]> {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', `${level}.json`)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(fileContent)
  } catch (error) {
    console.error(`Failed to load vocabulary for ${level}:`, error)
    return []
  }
}

// Simple stemmer for English words
function getRootForm(word: string): string {
  const w = word.toLowerCase()

  // Common irregular forms - simplified
  const irregulars: Record<string, string> = {
    ran: 'run', running: 'run',
    better: 'good', best: 'good',
    worse: 'bad', worst: 'bad',
    more: 'much', most: 'much',
    went: 'go', gone: 'go',
    came: 'come',
    doing: 'do', did: 'do', done: 'do',
    said: 'say',
    told: 'tell',
    knew: 'know', known: 'know',
    thought: 'think',
    saw: 'see', seen: 'see',
    got: 'get', gotten: 'get',
    given: 'give', gave: 'give',
    took: 'take', taken: 'take',
    made: 'make',
    left: 'leave',
    dealt: 'deal',
    meant: 'mean',
    kept: 'keep',
    slept: 'sleep',
    felt: 'feel',
    brought: 'bring',
    taught: 'teach',
    caught: 'catch',
    fought: 'fight',
    bought: 'buy',
    sold: 'sell',
    held: 'hold',
    led: 'lead',
    paid: 'pay',
  }

  if (irregulars[w]) return irregulars[w]

  // Simple suffix stripping
  if (w.endsWith('ied')) return w.slice(0, -3) + 'y'
  if (w.endsWith('es') && w.length > 3) {
    if (w.endsWith('sses') || w.endsWith('xes') || w.endsWith('ches') || w.endsWith('shes')) {
      return w.slice(0, -2)
    }
    return w.slice(0, -2)
  }
  if (w.endsWith('ed') && w.length > 3) {
    if (w.endsWith('ied')) return w.slice(0, -3) + 'y'
    if (w.length > 4 && w[w.length - 3] === w[w.length - 2]) {
      return w.slice(0, -3)
    }
    return w.slice(0, -2)
  }
  if (w.endsWith('ing') && w.length > 5) {
    const base = w.slice(0, -3)
    if (base.length > 2 && base[base.length - 1] === base[base.length - 2]) {
      return base.slice(0, -1)
    }
    return base
  }
  if (w.endsWith('ly') && w.length > 4) return w.slice(0, -2)
  if (w.endsWith('ness') && w.length > 6) return w.slice(0, -4)
  if (w.endsWith('ment') && w.length > 6) return w.slice(0, -4)
  if (w.endsWith('tion') && w.length > 6) return w.slice(0, -4)
  if (w.endsWith('sion') && w.length > 6) return w.slice(0, -4)
  if (w.endsWith('able') && w.length > 6) return w.slice(0, -4)
  if (w.endsWith('ible') && w.length > 6) return w.slice(0, -4)
  if (w.endsWith('ful') && w.length > 5) return w.slice(0, -3)
  if (w.endsWith('less') && w.length > 6) return w.slice(0, -4)
  if (w.endsWith('er') && w.length > 4) return w.slice(0, -2)
  if (w.endsWith('est') && w.length > 5) return w.slice(0, -3)
  if (w.endsWith('s') && w.length > 3 && !w.endsWith('ss')) return w.slice(0, -1)

  return w
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lyrics, level } = body

    if (!lyrics || !level) {
      return NextResponse.json({ error: 'Lyrics and level are required', status: 400 })
    }

    // Load vocabulary
    const vocabulary = await loadVocabulary(level)

    if (vocabulary.length === 0) {
      return NextResponse.json({ words: [] })
    }

    // Split lyrics into lines
    const lines = lyrics.split('\n').filter((line: string) => line.trim())

    const matchedWords: MatchedWord[] = []
    const seenWords = new Set<string>()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Extract words (only alphabetic characters)
      const words = line.match(/[a-zA-Z]+/g) || []

      for (const word of words) {
        if (word.length < 3) continue // Skip very short words

        const rootForm = getRootForm(word)

        // Check if the root form is in vocabulary
        const isInVocabulary = vocabulary.some(
          (v) => v.toLowerCase() === rootForm.toLowerCase()
        )

        if (isInVocabulary && !seenWords.has(rootForm.toLowerCase())) {
          seenWords.add(rootForm.toLowerCase())
          matchedWords.push({
            word: rootForm.toLowerCase(),
            originalWord: word,
            lineIndex: i,
            fullLine: line.trim(),
          })
        }
      }
    }

    return NextResponse.json({ words: matchedWords })
  } catch (error) {
    console.error('Error matching words:', error)
    return NextResponse.json({ error: 'Failed to match words', status: 500 })
  }
}
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import nlp from 'compromise'

interface MatchedWord {
  word: string
  originalWord: string
  lineIndex: number
  fullLine: string
  level: string
  importance: number
  difficulty_level: string
  translation: string
}

// ============================================
// 硬性黑名单 - 必须排除的口语/语气词
// ============================================
const STOP_WORDS = new Set([
  'yeah', 'oh', 'ooh', 'uh', 'ah', 'tryna', 'gonna', 'wanna', 'gotta', 'cuz', 'nev',
  'hey', 'baby', 'oops', 'whoa', 'ya', 'em', 'lemme', 'gimme', 'kinda', 'sorta',
  'bout', 'dunno', 'innit', 'yeah', 'yea', 'yep', 'nope', 'yup', 'naw',
  'hm', 'hmm', 'mmm', 'uh-huh', 'uh-uh', 'alright', 'okay', 'ok', 'so',
  'lol', 'lmao', 'omg', 'wtf', 'btw', 'idk', 'imo', 'smh', 'tbh', 'fyi'
])

// ============================================
// 基础词表 - 前3000常用词（专家模式必须过滤）
// ============================================
const BASIC_VOCABULARY = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
  'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
  'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is',
  'was', 'are', 'been', 'has', 'had', 'were', 'said', 'each', 'more', 'very', 'much', 'before', 'should',
  'many', 'may', 'such', 'here', 'where', 'ever', 'being', 'world', 'made', 'find', 'long', 'down', 'got',
  'might', 'still', 'number', 'great', 'name', 'while', 'house', 'right', 'study', 'under', 'never', 'same',
  'another', 'keep', 'again', 'point', 'form', 'off', 'change', 'why', 'ask', 'went', 'men', 'read', 'need',
  'last', 'since', 'present', 'hard', 'open', 'hand', 'part', 'old', 'big', 'high', 'small', 'large',
  'little', 'own', 'early', 'young', 'important', 'few', 'public', 'bad', 'able', 'call', 'every', 'seem',
  'thought', 'sure', 'better', 'best', 'differ', 'become', 'show', 'turn', 'hold', 'cause', 'live', 'let',
  'put', 'set', 'grow', 'begin', 'seems', 'help', 'hear', 'play', 'run', 'move', 'believe', 'bring',
  'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include', 'continue', 'learn',
  'lead', 'understand', 'watch', 'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend',
  'grow', 'walk', 'win', 'offer', 'remember', 'love', 'consider', 'appear', 'buy', 'wait', 'serve', 'die',
  'send', 'expect', 'build', 'stay', 'fall', 'cut', 'reach', 'kill', 'remain', 'suggest', 'raise', 'pass',
  'sell', 'require', 'report', 'decide', 'pull', 'door', 'water', 'been', 'money', 'song', 'where', 'most',
  'thing', 'woman', 'men', 'room', 'made', 'give', 'day', 'put', 'off', 'child', 'still', 'found', 'those',
  'never', 'system', 'place', 'while', 'three', 'line', 'different', 'left', 'least', 'done', 'life', 'black',
  'red', 'blue', 'green', 'yellow', 'white', 'color', 'city', 'next', 'able', 'sound', 'voice', 'word',
  'light', 'head', 'face', 'body', 'part', 'family', 'mother', 'father', 'sister', 'brother', 'friend',
  'girl', 'boy', 'baby', 'love', 'heart', 'feel', 'thing', 'way', 'back', 'too', 'very', 'just', 'only',
  'even', 'still', 'ever', 'never', 'always', 'sometimes', 'often', 'again', 'also', 'much', 'many', 'such'
])

// ============================================
// 本地翻译词库
// ============================================
const chineseDict: Record<string, string> = {
  love: '爱;喜爱', heart: '心;心脏', soul: '灵魂', mind: '心灵;思想',
  life: '生活;生命', death: '死亡', dream: '梦;梦想', night: '夜晚',
  day: '白天;日子', time: '时间', moment: '瞬间', memory: '记忆',
  forever: '永远', always: '总是', never: '从不', again: '再次',
  away: '离开', close: '靠近;关闭', together: '一起', alone: '独自;孤独',
  smile: '微笑', laugh: '笑', cry: '哭;喊', tears: '眼泪',
  pain: '痛苦', hurt: '伤害;疼痛', hope: '希望', fear: '害怕',
  feel: '感觉', feelings: '感情', emotion: '情感', passion: '热情',
  beautiful: '美丽的', pretty: '漂亮的', dark: '黑暗', light: '光;照亮',
  shine: '照耀', glow: '发光', star: '星星', moon: '月亮',
  sun: '太阳', sky: '天空', sea: '海洋', rain: '雨',
  wind: '风', fire: '火', storm: '暴风雨', world: '世界',
  home: '家', road: '道路', way: '方式;道路', path: '路',
  fight: '战斗', war: '战争', win: '赢', lose: '失去;输',
  fall: '落下;跌倒', rise: '升起', fly: '飞;飞翔', run: '跑;奔跑',
  walk: '走', stand: '站立', sit: '坐', lie: '躺;说谎',
  stay: '停留', leave: '离开', go: '去', come: '来',
  hold: '持有;握住', keep: '保持', let: '让', make: '做;制造',
  take: '拿;取', give: '给', need: '需要', want: '想要',
  believe: '相信', trust: '信任', know: '知道', learn: '学习',
  think: '思考', remember: '记得', forget: '忘记', hate: '恨',
  like: '喜欢', miss: '想念;错过', wait: '等待', call: '叫;打电话',
  say: '说', tell: '告诉', speak: '说话', talk: '谈话',
  listen: '听', hear: '听到', sound: '声音', voice: '声音',
  sing: '唱', song: '歌', music: '音乐', dance: '跳舞',
  play: '玩;播放', work: '工作', rest: '休息', sleep: '睡觉',
  wake: '醒来', live: '生活;居住', die: '死', drown: '淹没;溺死',
  breathe: '呼吸', breath: '呼吸', beat: '跳动;节拍', blood: '血',
  skin: '皮肤', bone: '骨', body: '身体', face: '脸',
  eye: '眼睛', hand: '手', arm: '手臂', finger: '手指',
  touch: '触摸', kiss: '吻;亲吻', hug: '拥抱', open: '打开',
  break: '打破;破碎', fix: '修理', build: '建造', destroy: '破坏',
  create: '创造', start: '开始', stop: '停止', end: '结束',
  begin: '开始', finish: '完成', whole: '全部;完整', half: '一半',
  part: '部分', everything: '一切', nothing: '什么也没有', something: '某事',
  everyone: '每个人', someone: '某人', people: '人们', person: '人',
  man: '男人', woman: '女人', child: '孩子', boy: '男孩',
  girl: '女孩', friend: '朋友', family: '家庭', mother: '妈妈',
  father: '爸爸', sister: '姐妹', brother: '兄弟', baby: '婴儿',
  angel: '天使', god: '上帝;神', heaven: '天堂', hell: '地狱',
  power: '力量', strong: '强壮的', weak: '弱的', peace: '和平',
  freedom: '自由', truth: '真相;真理', true: '真实的', real: '真的',
  secret: '秘密', magic: '魔法', wonderful: '精彩的', amazing: '惊人的',
  great: '伟大的', good: '好的', bad: '坏的', happy: '快乐的',
  sad: '悲伤的', angry: '生气的', crazy: '疯狂的', calm: '平静的',
  quiet: '安静的', loud: '响亮的', soft: '柔软的', hard: '硬的',
  easy: '容易的', difficult: '困难的', simple: '简单的', young: '年轻的',
  old: '老的', new: '新的', first: '第一', last: '最后的',
  fast: '快的', slow: '慢的', high: '高的', low: '低的',
  deep: '深的', big: '大的', small: '小的', huge: '巨大的',
  rich: '富有的', poor: '贫穷的', empty: '空的', full: '满的',
  lonely: '寂寞的', tired: '疲倦的', sick: '生病的', healthy: '健康的',
  alive: '活着的', dead: '死的', ugly: '丑陋的',
  smart: '聪明的', stupid: '愚蠢的', funny: '有趣的', safe: '安全的',
  dangerous: '危险的', brave: '勇敢的', afraid: '害怕的', kind: '善良的',
  perfect: '完美的', broken: '破碎的', far: '远的', near: '附近的',
  behind: '在后面', front: '前面', before: '之前', after: '之后',
  now: '现在', then: '那时', today: '今天', tomorrow: '明天',
  yesterday: '昨天', tonight: '今晚', morning: '早晨', afternoon: '下午',
  evening: '傍晚', week: '星期', month: '月', year: '年',
  sometimes: '有时', often: '经常', once: '一次', twice: '两次',
  still: '仍然', already: '已经', just: '只是', only: '只有',
  even: '甚至', also: '也', very: '非常', really: '真的'
}

// ============================================
// 翻译缓存
// ============================================
const translationCache: Map<string, string> = new Map()

// ============================================
// 使用 compromise 进行词形还原
// ============================================
function lemmatize(word: string): string {
  try {
    const doc = nlp(word)
    // 获取词的 lemma（原形）
    const terms = doc.json()
    if (terms && terms.length > 0 && terms[0].terms && terms[0].terms.length > 0) {
      return terms[0].terms[0].normal || word.toLowerCase()
    }
    return word.toLowerCase()
  } catch {
    return word.toLowerCase()
  }
}

// ============================================
// 翻译 API 调用
// ============================================
async function fetchTranslation(word: string): Promise<string> {
  const lowerWord = word.toLowerCase()

  if (translationCache.has(lowerWord)) {
    return translationCache.get(lowerWord)!
  }

  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${lowerWord}`)

    if (!response.ok) {
      const fallback = '暂无释义'
      translationCache.set(lowerWord, fallback)
      return fallback
    }

    const data = await response.json()

    if (Array.isArray(data) && data.length > 0 && data[0].meanings) {
      for (const meaning of data[0].meanings) {
        if (meaning.definitions && meaning.definitions.length > 0) {
          const def = meaning.definitions[0].definition
          if (def) {
            const result = def.length > 40 ? def.substring(0, 37) + '...' : def
            translationCache.set(lowerWord, result)
            return result
          }
        }
      }
    }

    const fallback = '暂无释义'
    translationCache.set(lowerWord, fallback)
    return fallback
  } catch (error) {
    const fallback = '暂无释义'
    translationCache.set(lowerWord, fallback)
    return fallback
  }
}

async function fetchTranslationsBatch(words: string[]): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  const batchSize = 3

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize)
    await Promise.all(batch.map(async (word) => {
      const translation = await fetchTranslation(word)
      results.set(word.toLowerCase(), translation)
    }))
  }

  return results
}

// ============================================
// 加载词汇表
// ============================================
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

// ============================================
// 难度判断
// ============================================
function isExpertMode(slider: number): boolean {
  return slider >= 5
}

function getDifficultyLevel(slider: number): string {
  if (slider <= 1) return 'beginner'
  if (slider <= 2) return 'intermediate'
  if (slider <= 3) return 'advanced'
  return 'expert'
}

// ============================================
// 主处理函数
// ============================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lyrics, level, difficultySlider = 3 } = body

    if (!lyrics || !level) {
      return NextResponse.json({ error: 'Lyrics and level are required', status: 400 })
    }

    const vocabulary = await loadVocabulary(level)

    if (vocabulary.length === 0) {
      return NextResponse.json({ words: [] })
    }

    const lines = lyrics.split('\n').filter((line: string) => line.trim())
    const matchedWords: MatchedWord[] = []
    const seenWords = new Set<string>()
    const wordsNeedingTranslation: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const words = line.match(/[a-zA-Z]+/g) || []

      for (const word of words) {
        const lowerWord = word.toLowerCase()

        // 1. 硬性黑名单过滤
        if (STOP_WORDS.has(lowerWord)) continue

        // 2. 长度过滤 - 必须 > 3
        if (word.length <= 3) continue

        // 3. 词形还原 - 使用 compromise
        const rootForm = lemmatize(word).toLowerCase()

        // 4. 专家模式：基础词表过滤
        if (isExpertMode(difficultySlider)) {
          if (BASIC_VOCABULARY.has(rootForm)) continue
        }

        // 5. 检查是否在目标词库中
        const isInVocabulary = vocabulary.some(
          (v) => v.toLowerCase() === rootForm
        )

        if (isInVocabulary && !seenWords.has(rootForm)) {
          seenWords.add(rootForm)
          const translation = chineseDict[rootForm] || null
          matchedWords.push({
            word: rootForm,
            originalWord: word,
            lineIndex: i,
            fullLine: line.trim(),
            level: level,
            importance: 1,
            difficulty_level: getDifficultyLevel(difficultySlider),
            translation: translation || ''
          })

          if (!translation) {
            wordsNeedingTranslation.push(rootForm)
          }
        }
      }
    }

    // 6. 批量获取翻译
    if (wordsNeedingTranslation.length > 0) {
      const fetchedTranslations = await fetchTranslationsBatch(wordsNeedingTranslation)
      matchedWords.forEach(word => {
        if (word.translation === '' && fetchedTranslations.has(word.word)) {
          word.translation = fetchedTranslations.get(word.word)!
        }
      })
    }

    // 7. 确保每个单词都有翻译
    const finalWords = matchedWords.map(w => ({
      ...w,
      translation: w.translation || '暂无释义'
    }))

    return NextResponse.json({ words: finalWords })
  } catch (error) {
    console.error('Error matching words:', error)
    return NextResponse.json({ error: 'Failed to match words', status: 500 })
  }
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Music, BookOpen, LogOut, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// 词汇量测试题 - 按难度分级
// 题目格式：单词、难度等级(1-5)、中文释义选项
interface Question {
  word: string
  difficulty: number // 1=入门, 2=基础, 3=中级, 4=高级, 5=专家
  correct: string
  options: string[]
  level: string // 对应词库等级
}

// 扩展测试题库 - 每个等级至少20题
const allQuestions: Question[] = [
  // 入门级 (difficulty: 1) - 高考/四级高频词
  { word: 'ability', difficulty: 1, level: 'cet4', correct: '能力;才能', options: ['能力;才能', '活动;行动', '部分;零件', '建筑物'] },
  { word: 'accept', difficulty: 1, level: 'cet4', correct: '接受;同意', options: ['接受;同意', '注意;观察', '拜访;参观', '地址'] },
  { word: 'appear', difficulty: 1, level: 'cet4', correct: '出现;显现', options: ['出现;显现', '表面;外观', '明显地;清楚地', '经过;通过'] },
  { word: 'avoid', difficulty: 1, level: 'cet4', correct: '避免;避开', options: ['避免;避开', '旅行;出行', '各种;若干', '投票;选举'] },
  { word: 'cause', difficulty: 1, level: 'cet4', correct: '原因;导致', options: ['原因;导致', '学习;课程', '注意;留意', '暂停;停止'] },
  { word: 'develop', difficulty: 1, level: 'cet4', correct: '发展;开发', options: ['发展;开发', '信封', '速度', '覆盖;遮盖'] },
  { word: 'difficult', difficulty: 1, level: 'cet4', correct: '困难的', options: ['困难的', '不同的', '数字的', '消化'] },
  { word: 'discover', difficulty: 1, level: 'cet4', correct: '发现;找到', options: ['发现;找到', '恢复;痊愈', '完全覆盖', '谈论;讲述'] },
  { word: 'decide', difficulty: 1, level: 'cet4', correct: '决定;下决心', options: ['决定;下决心', '划分;分开', '包含;容纳', '广告'] },
  { word: 'describe', difficulty: 1, level: 'cet4', correct: '描述;形容', options: ['描述;形容', '订阅', '规定;处方', '字母组合'] },
  { word: 'effect', difficulty: 1, level: 'cet4', correct: '效果;影响', options: ['效果;影响', '努力;尝试', '效率;能力', '努力地'] },
  { word: 'effort', difficulty: 1, level: 'cet4', correct: '努力;尝试', options: ['努力;尝试', '结果;效果', '提供;供给', '影响;作用'] },
  { word: 'exist', difficulty: 1, level: 'cet4', correct: '存在;生存', options: ['存在;生存', '出口', '经验;经历', '展览'] },
  { word: 'express', difficulty: 1, level: 'cet4', correct: '表达;表示', options: ['表达;表示', '优秀;杰出', '压缩;挤压', '经历;体验'] },
  { word: 'factor', difficulty: 1, level: 'cet4', correct: '因素;要素', options: ['因素;要素', '事实;实际', '工厂', '行为;行动'] },
  { word: 'fail', difficulty: 1, level: 'cet4', correct: '失败;未能', options: ['失败;未能', '下落;跌倒', '出售', '公平;公正'] },
  { word: 'force', difficulty: 1, level: 'cet4', correct: '力量;强迫', options: ['力量;强迫', '形式;形状', '发现;查明', 'Foreign=国外的'] },
  { word: 'further', difficulty: 1, level: 'cet4', correct: '更远;进一步', options: ['更远;进一步', '羽毛;羽状物', '父亲', '更糟;更差'] },
  { word: 'gain', difficulty: 1, level: 'cet4', correct: '获得;增加', options: ['获得;增加', '游戏;比赛', '总体;一般', '产生;制造'] },
  { word: 'generate', difficulty: 1, level: 'cet4', correct: '产生;生成', options: ['产生;生成', '一般;普通', '一代;产生', '慷慨的'] },

  // 基础级 (difficulty: 2) - CET-6
  { word: 'achieve', difficulty: 2, level: 'cet6', correct: '达到;实现', options: ['达到;实现', '建筑;建筑物', '通知;告知', '成功;成就'] },
  { word: 'benefit', difficulty: 2, level: 'cet6', correct: '利益;好处', options: ['利益;好处', '改善;改进', '商业;事务', '基础;根本'] },
  { word: 'consider', difficulty: 2, level: 'cet6', correct: '考虑;认为', options: ['考虑;认为', '包含;容纳', '继续;持续', '控制;管理'] },
  { word: 'contact', difficulty: 2, level: 'cet6', correct: '联系;接触', options: ['联系;接触', '主要内容', '周围文本', '正式协议'] },
  { word: 'continue', difficulty: 2, level: 'cet6', correct: '继续;持续', options: ['继续;持续', '包含;容纳', '上下文', '约束协议'] },
  { word: 'create', difficulty: 2, level: 'cet6', correct: '创造;创建', options: ['创造;创建', '被创造物', '创造性的', '生物;活物'] },
  { word: 'especially', difficulty: 2, level: 'cet6', correct: '尤其;特别', options: ['尤其;特别', '尤其特殊', '特殊性质', '说话行为'] },
  { word: 'expert', difficulty: 2, level: 'cet6', correct: '专家;能手', options: ['专家;能手', '除了;除...外', '期待;盼望', '经验;练习'] },
  { word: 'investigate', difficulty: 2, level: 'cet6', correct: '调查;研究', options: ['调查;研究', '投资;投入', 'Invent=发明', '教训;训诫'] },
  { word: 'justify', difficulty: 2, level: 'cet6', correct: '证明合理', options: ['证明合理', '司法;法律', '调整;使适应', '只是;仅仅'] },
  { word: 'maintain', difficulty: 2, level: 'cet6', correct: '维持;保养', options: ['维持;保养', '主要;主要地', '取得;获得', '属于;归于'] },
  { word: 'obtain', difficulty: 2, level: 'cet6', correct: '获得;得到', options: ['获得;得到', '再次;此外', '目的;目标', '主题;话题'] },
  { word: 'participate', difficulty: 2, level: 'cet6', correct: '参与;参加', options: ['参与;参加', '部分; participle=分词', '粒子;微粒', '特别;尤其'] },
  { word: 'perceive', difficulty: 2, level: 'cet6', correct: '感知;察觉', options: ['感知;察觉', '收到;接收', '欺骗;骗局', '构想;概念'] },
  { word: 'predict', difficulty: 2, level: 'cet6', correct: '预测;预言', options: ['预测;预言', '添加;增加', 'dictate=口述', '行为;行动'] },
  { word: 'reveal', difficulty: 2, level: 'cet6', correct: '揭示;透露', options: ['揭示;透露', '抢劫;盗窃', 'level=水平', '梦想;理想'] },
  { word: 'significant', difficulty: 2, level: 'cet6', correct: '重要的;显著的', options: ['重要的;显著的', '签名;署名', '设计;图案', 'ignite=点燃'] },
  { word: 'strategy', difficulty: 2, level: 'cet6', correct: '策略;战略', options: ['策略;战略', '策略家', 'strategize=制定策略', 'strategic=战略的'] },
  { word: 'survey', difficulty: 2, level: 'cet6', correct: '调查;测量', options: ['调查;测量', '保证;确保', '安全的;保险的', 'survival=生存'] },
  { word: 'transform', difficulty: 2, level: 'cet6', correct: '转变;改造', options: ['转变;改造', '透明;明显', '表单;表格', 'transport=运输'] },

  // 中等级 (difficulty: 3) - 考研
  { word: 'adequate', difficulty: 3, level: 'kaoyan', correct: '足够的;适当的', options: ['足够的;适当的', '先进的', '有能力的', '积极的'] },
  { word: 'approach', difficulty: 3, level: 'kaoyan', correct: '接近;方法', options: ['接近;方法', '完全;简直', '批准;赞成', '适当的'] },
  { word: 'appropriate', difficulty: 3, level: 'kaoyan', correct: '适当的;合适的', options: ['适当的;合适的', '有能力的', '主要的', '典型的'] },
  { word: 'circumstance', difficulty: 3, level: 'kaoyan', correct: '情况;环境', options: ['情况;环境', 'circus=马戏团', ' circuit=电路', 'circular=循环的'] },
  { word: 'communicate', difficulty: 3, level: 'kaoyan', correct: '交流;传达', options: ['交流;传达', 'commute=通勤', 'commit=承诺', 'compact=紧凑的'] },
  { word: 'comprehensive', difficulty: 3, level: 'kaoyan', correct: '全面的;综合的', options: ['全面的;综合的', 'comprehensive= compreend=理解', 'compress=压缩', 'compete=竞争'] },
  { word: 'conceive', difficulty: 3, level: 'kaoyan', correct: '构思;想象', options: ['构思;想象', '接受;承认', 'deceive=欺骗', 'perceive=感知'] },
  { word: 'conduct', difficulty: 3, level: 'kaoyan', correct: '实施;行为', options: ['实施;行为', '介绍;引导', '产品;产物', '拒绝;否认'] },
  { word: 'consequence', difficulty: 3, level: 'kaoyan', correct: '后果;结果', options: ['后果;结果', 'sequence=序列', 'subsequent=随后的', 'frequent=频繁的'] },
  { word: 'contemporary', difficulty: 3, level: 'kaoyan', correct: '当代的;同时代的', options: ['当代的;同时代的', 'temporary=暂时的', 'contempt=藐视', 'contend=竞争'] },
  { word: 'contradiction', difficulty: 3, level: 'kaoyan', correct: '矛盾;反驳', options: ['矛盾;反驳', 'attract=吸引', 'abstract=抽象的', 'contract=合同'] },
  { word: 'contribute', difficulty: 3, level: 'kaoyan', correct: '贡献;捐助', options: ['贡献;捐助', 'distribute=分配', 'tribute=贡品', 'attribute=属性'] },
  { word: 'convention', difficulty: 3, level: 'kaoyan', correct: '惯例;会议', options: ['惯例;会议', 'invention=发明', 'vention=vention', 'vention=vention'] },
  { word: 'convince', difficulty: 3, level: 'kaoyan', correct: '说服;使相信', options: ['说服;使相信', 'voice=声音', 'once=一次', 'device=设备'] },
  { word: 'correspond', difficulty: 3, level: 'kaoyan', correct: '对应;通信', options: ['对应;通信', 'respond=回应', 'corrupt=腐败的', 'despond=沮丧'] },
  { word: 'cumulative', difficulty: 3, level: 'kaoyan', correct: '累积的;渐增的', options: ['累积的;渐增的', 'cumulative= accuse=指控', 'cue=暗示', 'acute=急性的'] },
  { word: 'dimension', difficulty: 3, level: 'kaoyan', correct: '维度;尺寸', options: ['维度;尺寸', 'mention=提到', 'dismiss=解散', 'premise=前提'] },
  { word: 'discriminate', difficulty: 3, level: 'kaoyan', correct: '歧视;区分', options: ['歧视;区分', '初级的;开始的', 'eliminate=消除', 'intimate=亲密的'] },
  { word: 'dispose', difficulty: 3, level: 'kaoyan', correct: '处理;处置', options: ['处理;处置', 'expose=暴露', 'impose=强加', 'propose=提议'] },
  { word: 'distinguish', difficulty: 3, level: 'kaoyan', correct: '区分;辨别', options: ['区分;辨别', 'extinguish=熄灭', 'distinguish= distinguish', 'extinguish= extinguish'] },

  // 高级 (difficulty: 4) - IELTS/TOEFL
  { word: 'ambiguous', difficulty: 4, level: 'ielts', correct: '模糊不清的;歧义的', options: ['模糊不清的;歧义的', 'ambitious=有雄心的', 'ambulance=救护车', 'automatic=自动的'] },
  { word: 'arbitrary', difficulty: 4, level: 'ielts', correct: '任意的;武断的', options: ['任意的;武断的', 'artillery=炮兵', 'artisan=工匠', 'articulate=清晰表达的'] },
  { word: 'autonomous', difficulty: 4, level: 'ielts', correct: '自治的;自主的', options: ['自治的;自主的', 'automatic=自动的', 'autonomy=自治权', 'autograph=签名'] },
  { word: 'collaborate', difficulty: 4, level: 'ielts', correct: '合作;协作', options: ['合作;协作', 'elaborate=详尽的', 'collaborate= collaborate', 'elaborate= elaborate'] },
  { word: 'compile', difficulty: 4, level: 'ielts', correct: '编译;汇编', options: ['编译;汇编', 'impile=堆积', 'compile= compile', 'mobile=移动的'] },
  { word: 'complement', difficulty: 4, level: 'ielts', correct: '补充;补足', options: ['补充;补足', 'compliment=赞美', 'implement=实施', 'supplement=补充'] },
  { word: 'complicate', difficulty: 4, level: 'ielts', correct: '使复杂化', options: ['使复杂化', 'complicate= complicate', 'duplicate=复制', 'complicate= complicate'] },
  { word: 'conceive', difficulty: 4, level: 'ielts', correct: '构思;设想', options: ['构思;设想', 'deceive=欺骗', 'receive=接收', 'perceive=感知'] },
  { word: 'confidential', difficulty: 4, level: 'ielts', correct: '机密的;保密的', options: ['机密的;保密的', 'confident=自信的', 'presidential=总统的', 'residential=居住的'] },
  { word: 'consecutive', difficulty: 4, level: 'ielts', correct: '连续不断的', options: ['连续不断的', 'executive=执行的', 'legislative=立法的', 'initiative=主动权'] },
  { word: 'consensus', difficulty: 4, level: 'ielts', correct: '共识;一致意见', options: ['共识;一致意见', 'census=人口普查', 'sensus=感觉', 'consensus= consensus'] },
  { word: 'constitute', difficulty: 4, level: 'ielts', correct: '组成;构成', options: ['组成;构成', 'institute=机构', 'substitute=替代', 'prostitute=妓女'] },
  { word: 'contemplate', difficulty: 4, level: 'ielts', correct: '沉思;凝视', options: ['沉思;凝视', 'contemplate= contemplate', 'contemplate= contemplate', 'temple=寺庙'] },
  { word: 'controversial', difficulty: 4, level: 'ielts', correct: '有争议的', options: ['有争议的', 'controversy=争议', 'universal=普遍的', 'adversarial=对抗的'] },
  { word: 'correlate', difficulty: 4, level: 'ielts', correct: '相互关联', options: ['相互关联', 'relate=联系', 'correlate= correlate', 'isolate=孤立'] },
  { word: 'corroborate', difficulty: 4, level: 'ielts', correct: '证实;确证', options: ['证实;确证', 'cooperate=合作', 'corporate=公司的', 'corroborate= corroborate'] },
  { word: 'dedicate', difficulty: 4, level: 'ielts', correct: '奉献;致力于', options: ['奉献;致力于', 'indicate=表明', 'icate=icate', 'delicate=精致的'] },
  { word: 'demonstrate', difficulty: 4, level: 'ielts', correct: '示范;证明', options: ['示范;证明', 'monstrate=展示', 'remonstrate=抗议', 'demonstrate= demonstrate'] },
  { word: 'deviate', difficulty: 4, level: 'ielts', correct: '偏离;背离', options: ['偏离;背离', 'evaluate=评估', 'deviate= deviate', 'subordinate=下属'] },
  { word: 'differentiate', difficulty: 4, level: 'ielts', correct: '区分;辨别', options: ['区分;辨别', 'integra=te综合', 'differentiate= differentiate', 'integral=整体的'] },

  // 专家级 (difficulty: 5) - GRE
  { word: 'aberrant', difficulty: 5, level: 'gre', correct: '异常的;偏离的', options: ['异常的;偏离的', 'abundant=丰富的', 'aberrant= aberrant', 'emergent=紧急的'] },
  { word: 'abstruse', difficulty: 5, level: 'gre', correct: '深奥的;难懂的', options: ['深奥的;难懂的', 'obtruse=钝的', 'abstruse= abstruse', 'intruse=侵入'] },
  { word: 'acrimony', difficulty: 5, level: 'gre', correct: '刻薄;毒辣', options: ['刻薄;毒辣', 'acrimony= acrimony', 'harmony=和谐', 'ceremony=仪式'] },
  { word: 'ameliorate', difficulty: 5, level: 'gre', correct: '改善;改进', options: ['改善;改进', 'ameliorate= ameliorate', 'deteriorate=恶化', 'variolate=接种'] },
  { word: 'anachronism', difficulty: 5, level: 'gre', correct: '时代错误;过时事物', options: ['时代错误;过时事物', 'anachronism= anachronism', 'chronology=年代学', 'synchronize=同步'] },
  { word: 'antithesis', difficulty: 5, level: 'gre', correct: '对立;对照', options: ['对立;对照', 'antithesis= antithesis', 'synthesis=综合', 'hypothesis=假设'] },
  { word: 'apocryphal', difficulty: 5, level: 'gre', correct: '伪造的;可疑的', options: ['伪造的;可疑的', 'apocryphal= apocryphal', 'cryptic=神秘的', 'crypt=地窖'] },
  { word: 'archaic', difficulty: 5, level: 'gre', correct: '古老的;过时的', options: ['古老的;过时的', 'archaic= archaic', 'archaeologist=考古学家', 'archives=档案'] },
  { word: 'ascetic', difficulty: 5, level: 'gre', correct: '苦行的;禁欲的', options: ['苦行的;禁欲的', 'ascetic= ascetic', 'aesthetic=美学的', 'anesthetic=麻醉剂'] },
  { word: 'assiduous', difficulty: 5, level: 'gre', correct: '勤勉的;刻苦的', options: ['勤勉的;刻苦的', 'assiduous= assiduous', 'residuous=剩余的', 'dissidious=分裂的'] },
  { word: 'belligerent', difficulty: 5, level: 'gre', correct: '好战的;挑衅的', options: ['好战的;挑衅的', 'belligerent= belligerent', 'regerenate=再生', 'tangent=切线'] },
  { word: 'capricious', difficulty: 5, level: 'gre', correct: '反复无常的;多变的', options: ['反复无常的;多变的', 'capricious= capricious', 'precious=珍贵的', 'vicious=邪恶的'] },
  { word: 'castigate', difficulty: 5, level: 'gre', correct: '惩罚;苛责', options: ['惩罚;苛责', 'castigate= castigate', 'instigate=煽动', 'mitigate=减轻'] },
  { word: 'chicanery', difficulty: 5, level: 'gre', correct: '欺骗;诈骗', options: ['欺骗;诈骗', 'chicanery= chicanery', 'vantery=吹嘘', 'chivalry=骑士精神'] },
  { word: 'circumspect', difficulty: 5, level: 'gre', correct: '谨慎的;周全的', options: ['谨慎的;周全的', 'circumspect= circumspect', 'prospect=前景', 'suspect=怀疑'] },
  { word: 'cogent', difficulty: 5, level: 'gre', correct: '有说服力的', options: ['有说服力的', 'cogent= cogent', 'negent=否定', 'regent=摄政王'] },
  { word: 'commensurate', difficulty: 5, level: 'gre', correct: '相称的;相当的', options: ['相称的;相当的', 'commensurate= commensurate', 'momentary=瞬间的', 'commentary=评论'] },
  { word: 'compendium', difficulty: 5, level: 'gre', correct: '概要;摘要', options: ['概要;摘要', 'compendium= compendium', 'condemn=谴责', 'pendulum=摆'] },
  { word: 'complement', difficulty: 5, level: 'gre', correct: '补足;补充', options: ['补足;补充', 'compliment=赞美', 'implement=工具', 'supplement=补充'] },
  { word: 'conflagration', difficulty: 5, level: 'gre', correct: '大火;火灾', options: ['大火;火灾', 'conflagration= conflagration', 'migration=迁移', 'destination=目的地'] },
]

// 兴趣领域
const interestDomains = [
  { id: 'daily', label: '日常生活', description: '工作、学习、娱乐' },
  { id: 'love', label: '情感恋爱', description: '浪漫、友谊、家庭' },
  { id: 'finance', label: '财经商业', description: '投资、创业、金融' },
  { id: 'medical', label: '医疗健康', description: '健康、医药、健身' },
  { id: 'tech', label: '科技互联网', description: 'AI、编程、网络' },
  { id: 'art', label: '艺术娱乐', description: '电影、音乐、戏剧' },
  { id: 'sports', label: '体育运动', description: '足球、篮球、健身' },
  { id: 'travel', label: '旅行地理', description: '旅游、城市、文化' },
]

// 难度等级名称
const difficultyLabels: Record<number, string> = {
  1: '入门',
  2: '基础',
  3: '中级',
  4: '高级',
  5: '专家',
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<'test' | 'result' | 'interests' | 'complete'>('test')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<(string | null)[]>([])
  const [skipped, setSkipped] = useState<boolean[]>([])
  const [shuffledOptions, setShuffledOptions] = useState<string[][]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // 初始化：分层随机抽取20道题
  useEffect(() => {
    // 按难度分组
    const grouped: Record<number, Question[]> = {
      1: allQuestions.filter(q => q.difficulty === 1),
      2: allQuestions.filter(q => q.difficulty === 2),
      3: allQuestions.filter(q => q.difficulty === 3),
      4: allQuestions.filter(q => q.difficulty === 4),
      5: allQuestions.filter(q => q.difficulty === 5),
    }

    // 每级随机抽取4题，共20题
    const selected: Question[] = []
    const targetPerLevel = 4

    for (let d = 1; d <= 5; d++) {
      const pool = [...grouped[d] as Question[]]
      const shuffled = pool.sort(() => Math.random() - 0.5)
      const count = Math.min(targetPerLevel, shuffled.length)
      selected.push(...shuffled.slice(0, count))
    }

    // 打乱整体顺序
    const finalQuestions = selected.sort(() => Math.random() - 0.5)

    setQuestions(finalQuestions)
    setAnswers(new Array(finalQuestions.length).fill(null))
    setSkipped(new Array(finalQuestions.length).fill(false))

    // 打乱选项顺序
    const options = finalQuestions.map(q => [...q.options].sort(() => Math.random() - 0.5))
    setShuffledOptions(options)
  }, [])

  // 检查用户是否已登录
  useEffect(() => {
    // Skip server-side rendering for localStorage
    if (typeof window === 'undefined') return

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push('/login')
        return
      }
      setUser(session.user)

      // 检查是否已完成 onboarding
      const userLevel = localStorage.getItem('user_vocabulary_level')
      if (userLevel) {
        router.push('/search')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (typeof window === 'undefined') return
      if (!session) {
        router.push('/login')
      }
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = answer
    setAnswers(newAnswers)
  }

  const handleSkip = () => {
    const newSkipped = [...skipped]
    newSkipped[currentQuestion] = true
    setSkipped(newSkipped)

    // 自动进入下一题
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResult()
    }
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResult()
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const calculateResult = () => {
    // 计算得分
    let correct = 0
    let weightedScore = 0
    const maxWeightedScore = questions.reduce((sum, q) => sum + q.difficulty, 0)

    questions.forEach((q, i) => {
      if (answers[i] === q.correct && !skipped[i]) {
        correct++
        weightedScore += q.difficulty
      }
    })

    const accuracy = correct / questions.length
    const weightedAccuracy = weightedScore / maxWeightedScore

    // 计算预估词汇量 (基于正确率和难度)
    const baseVocabulary = 1500 // 高考基础词汇量
    const maxVocabulary = 20000 // GRE级别
    const estimatedVocabulary = Math.round(
      baseVocabulary + (maxVocabulary - baseVocabulary) * weightedAccuracy
    )

    // 计算推荐难度
    let recommendedLevel = 'cet4'
    let recommendedSlider = 2

    if (weightedAccuracy >= 0.8) {
      recommendedLevel = 'gre'
      recommendedSlider = 5
    } else if (weightedAccuracy >= 0.6) {
      recommendedLevel = 'kaoyan'
      recommendedSlider = 4
    } else if (weightedAccuracy >= 0.4) {
      recommendedLevel = 'cet6'
      recommendedSlider = 3
    } else if (weightedAccuracy >= 0.2) {
      recommendedLevel = 'cet4'
      recommendedSlider = 2
    } else {
      recommendedLevel = 'basic'
      recommendedSlider = 1
    }

    // 保存结果
    localStorage.setItem('test_result', JSON.stringify({
      correct,
      total: questions.length,
      accuracy,
      weightedAccuracy,
      estimatedVocabulary,
      recommendedLevel,
      recommendedSlider,
      answers: answers.map((a, i) => ({
        question: questions[i],
        answer: a,
        correct: a === questions[i].correct
      }))
    }))

    setStep('result')
  }

  const handleInterestToggle = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleComplete = async () => {
    setLoading(true)

    const testResult = JSON.parse(localStorage.getItem('test_result') || '{}')

    localStorage.setItem('user_vocabulary_level', testResult.recommendedLevel || 'cet4')
    localStorage.setItem('user_difficulty_slider', String(testResult.recommendedSlider || 3))
    localStorage.setItem('user_interests', JSON.stringify(selectedInterests))

    router.push('/search')
  }

  const handleRetry = () => {
    // 重新初始化测试
    const grouped: Record<number, Question[]> = {
      1: allQuestions.filter(q => q.difficulty === 1),
      2: allQuestions.filter(q => q.difficulty === 2),
      3: allQuestions.filter(q => q.difficulty === 3),
      4: allQuestions.filter(q => q.difficulty === 4),
      5: allQuestions.filter(q => q.difficulty === 5),
    }

    const selected: Question[] = []
    const targetPerLevel = 4

    for (let d = 1; d <= 5; d++) {
      const pool = [...grouped[d] as Question[]]
      const shuffled = pool.sort(() => Math.random() - 0.5)
      const count = Math.min(targetPerLevel, shuffled.length)
      selected.push(...shuffled.slice(0, count))
    }

    const finalQuestions = selected.sort(() => Math.random() - 0.5)

    setQuestions(finalQuestions)
    setAnswers(new Array(finalQuestions.length).fill(null))
    setSkipped(new Array(finalQuestions.length).fill(false))
    setCurrentQuestion(0)

    const options = finalQuestions.map(q => [...q.options].sort(() => Math.random() - 0.5))
    setShuffledOptions(options)

    setStep('test')
  }

  const progress = step === 'test'
    ? ((currentQuestion + 1) / questions.length) * 100
    : 100

  const [testResult, setTestResult] = useState<any>({})

  useEffect(() => {
    const result = localStorage.getItem('test_result')
    if (result) {
      setTestResult(JSON.parse(result))
    }
  }, [step])

  // Header component
  const Header = () => (
    <header className="bg-black/60 backdrop-blur-xl nav-glow sticky top-0 z-10">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
        <h1 className="font-headline text-xl font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-[#72fe8f]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>music_note</span>
          LyricVocab
        </h1>
        <nav className="flex items-center gap-4">
          <Link href="/search" className="text-[#adaaaa] hover:text-white transition-colors">搜索</Link>
          {user && (
            <div className="flex items-center gap-3">
              <Link href="/settings" className="text-[#adaaaa] hover:text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">settings</span>
                {user.email?.split('@')[0]}
              </Link>
              <button onClick={handleLogout} className="text-[#adaaaa] hover:text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-lg">logout</span>
                退出
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )

  // Test phase
  if (step === 'test' && questions.length > 0) {
    const question = questions[currentQuestion]
    const options = shuffledOptions[currentQuestion] || question.options
    const currentAnswer = answers[currentQuestion]
    const isSkipped = skipped[currentQuestion]

    const difficultyLabel = difficultyLabels[question.difficulty]
    const difficultyColor = question.difficulty <= 2 ? 'text-[#72fe8f]' : question.difficulty <= 3 ? 'text-yellow-400' : 'text-orange-400'

    return (
      <div className="min-h-screen bg-[#0e0e0e]">
        <Header />
        <div className="max-w-xl mx-auto px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#72fe8f]/20 rounded-full mb-4">
              <span className="material-symbols-outlined text-[#72fe8f] text-4xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>auto_awesome</span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-white mb-2">词汇量水平测试</h1>
            <p className="text-[#adaaaa]">请选择最准确的中文含义</p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-[#adaaaa] mb-2">
              <span>第 {currentQuestion + 1} 题 / 共 {questions.length} 题</span>
              <span className={difficultyColor}>{difficultyLabel}</span>
            </div>
            <div className="w-full h-1 bg-[#262626] rounded-full overflow-hidden">
              <div className="h-full bg-[#72fe8f] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Question card */}
          <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl mb-6">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-headline text-5xl font-extrabold text-white mb-2">{question.word}</CardTitle>
              <CardDescription className="text-[#adaaaa]">选择正确的中文释义</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.map((option, index) => (
                <Button
                  key={index}
                  variant={currentAnswer === option ? 'default' : 'outline'}
                  className={`w-full h-auto min-h-[3.5rem] text-left px-4 py-3 text-base justify-start whitespace-normal rounded-xl ${
                    currentAnswer === option
                      ? 'bg-gradient-to-br from-[#72fe8f] to-[#1cb853] hover:scale-105 active:scale-95 transition-all text-[#005f26] border-[#72fe8f]'
                      : 'border-[#484847]/30 text-[#adaaaa] hover:bg-[#262626] hover:border-[#484847]/60'
                  }`}
                  onClick={() => handleAnswer(option)}
                >
                  <span className="mr-3 font-bold opacity-60 font-headline">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentQuestion === 0}
              className="border-[#484847]/30 text-[#adaaaa] hover:bg-[#262626] hover:text-white rounded-xl"
            >
              <span className="material-symbols-outlined mr-2">arrow_back</span>
              上一题
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="border-[#484847]/30 text-[#484847] hover:bg-[#262626] hover:text-[#adaaaa] rounded-xl"
              >
                <span className="material-symbols-outlined mr-2">skip_next</span>
                跳过
              </Button>
              <Button
                onClick={handleNext}
                disabled={currentAnswer === null && !isSkipped}
                className="bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] font-bold hover:scale-105 active:scale-95 transition-all rounded-full"
              >
                {currentQuestion === questions.length - 1 ? '查看结果' : '下一题'}
                {currentQuestion < questions.length - 1 && <span className="material-symbols-outlined ml-2">arrow_forward</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Result phase
  if (step === 'result') {
    const levelLabels: Record<string, string> = {
      'basic': '入门级',
      'cet4': '大学英语四级 (CET-4)',
      'cet6': '大学英语六级 (CET-6)',
      'kaoyan': '考研英语',
      'gre': 'GRE/托福',
    }

    return (
      <div className="min-h-screen bg-[#0e0e0e]">
        <Header />
        <div className="max-w-xl mx-auto px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#72fe8f]/20 rounded-full mb-4">
              <span className="material-symbols-outlined text-[#72fe8f] text-5xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>emoji_events</span>
            </div>
            <h1 className="font-headline text-3xl font-bold text-white mb-2">测试完成!</h1>
            <p className="text-[#adaaaa]">以下是您的评估结果</p>
          </div>

          {/* Result cards */}
          <div className="space-y-4 mb-8">
            <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
              <CardContent className="p-6 text-center">
                <div className="font-headline text-5xl font-extrabold text-[#72fe8f] mb-2">
                  {testResult.estimatedVocabulary || 3500}
                </div>
                <div className="text-[#adaaaa]">预估词汇量 (词)</div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-[#72fe8f] text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>gps_fixed</span>
                    <span className="text-[#adaaaa] text-sm">正确率</span>
                  </div>
                  <div className="font-headline text-2xl font-bold text-white">
                    {testResult.correct}/{testResult.total}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-[#484847]/10 rounded-2xl">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-yellow-400 text-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>star</span>
                    <span className="text-[#adaaaa] text-sm">难度等级</span>
                  </div>
                  <div className="font-headline text-lg font-bold text-white">
                    {levelLabels[testResult.recommendedLevel] || 'CET-4'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#72fe8f]/10 border-[#72fe8f]/30 rounded-2xl">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-white font-headline font-medium mb-2">推荐设置</p>
                  <p className="text-[#adaaaa] text-sm">
                    建议选择: <span className="text-[#72fe8f] font-bold">{levelLabels[testResult.recommendedLevel] || 'CET-4'}</span>
                  </p>
                  <p className="text-[#adaaaa] text-sm">
                    建议难度: <span className="text-[#72fe8f] font-bold">
                      {testResult.recommendedSlider === 1 ? '入门' :
                       testResult.recommendedSlider === 2 ? '基础' :
                       testResult.recommendedSlider === 3 ? '中级' :
                       testResult.recommendedSlider === 4 ? '高级' : '专家'}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setStep('interests')}
              className="w-full h-14 text-lg bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] font-bold hover:scale-105 active:scale-95 transition-all rounded-full"
            >
              开始学习
              <span className="material-symbols-outlined ml-2">arrow_forward</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleRetry}
              className="w-full border-[#484847]/30 text-[#adaaaa] hover:bg-[#262626] hover:text-white rounded-xl"
            >
              重新测试
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Interests phase
  if (step === 'interests') {
    return (
      <div className="min-h-screen bg-[#0e0e0e]">
        <Header />
        <div className="max-w-xl mx-auto px-8 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#72fe8f]/20 rounded-full mb-4">
              <span className="material-symbols-outlined text-[#72fe8f] text-4xl" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>menu_book</span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-white mb-2">选择您的兴趣领域</h1>
            <p className="text-[#adaaaa]">根据您的选择推荐更相关的词汇</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
            {interestDomains.map((domain) => (
              <Card
                key={domain.id}
                className={`cursor-pointer transition-all hover:bg-[#262626] ${
                  selectedInterests.includes(domain.id)
                    ? 'bg-[#72fe8f]/10 border-[#72fe8f]'
                    : 'bg-[#1a1a1a] border-[#484847]/10'
                } rounded-2xl`}
                onClick={() => handleInterestToggle(domain.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Checkbox
                    checked={selectedInterests.includes(domain.id)}
                    onCheckedChange={() => handleInterestToggle(domain.id)}
                    className="border-[#484847]/30 data-[state=checked]:bg-[#72fe8f] data-[state=checked]:border-[#72fe8f]"
                  />
                  <div>
                    <p className="font-headline font-medium text-white">{domain.label}</p>
                    <p className="text-sm text-[#adaaaa]">{domain.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={handleComplete}
            disabled={loading}
            className="w-full h-14 text-lg bg-gradient-to-br from-[#72fe8f] to-[#1cb853] text-[#005f26] font-bold hover:scale-105 active:scale-95 transition-all rounded-full"
          >
            {loading ? '保存中...' : '开始学习'}
            <span className="material-symbols-outlined ml-2">arrow_forward</span>
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#72fe8f]" />
    </div>
  )
}

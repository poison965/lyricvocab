# 兴趣驱动型英语单词学习网站 - 产品需求文档 (Claude Code优化版)

## 📋 文档概述

本文件是为Claude Code准备的开发需求文档，请基于以下内容完整实现一个可运行的Web应用。所有需求必须100%实现，无需人工干预。

---

## 一、项目基础信息

### 1.1 项目名称

- **中文**：兴趣词场 / 歌词背单词
    
- **英文**：LyricVocab
    

### 1.2 核心一句话定位

> 让用户通过搜索自己喜欢的英文歌曲，系统自动提取歌词中符合其学习阶段（四级/六级/考研）的单词，形成带有歌词语境例句的个人单词本。

### 1.3 必须实现的核心功能闭环

text

搜索歌曲 → 选择难度 → 提取歌词单词 → 勾选加入单词本 → 在单词本中复习（带歌词例句）

### 1.4 目标用户

- 备考四六级的大学生
    
- 准备考研的英语学习者
    
- 喜欢英文歌想通过兴趣学英语的人群
    

---

## 二、技术栈强制要求

|类别|技术选型|说明|
|---|---|---|
|前端框架|Next.js 14 (App Router)|必须使用TypeScript|
|UI样式|Tailwind CSS + shadcn/ui|组件库需初始化|
|认证/数据库|Supabase|使用其Auth和PostgreSQL|
|部署平台|Vercel|项目必须可一键部署|
|外部API1|Spotify Web API|用于歌曲搜索（免费）|
|外部API2|LRCLIB API|用于获取歌词（免费开源）|
|发音|Web Speech API|浏览器原生TTS|
|NLP处理|compromise|轻量级词形还原库|

---

## 三、数据源准备要求

### 3.1 考纲词库（必须提供）

请在 `public/data/` 目录下创建以下三个JSON文件，每个文件包含对应级别的单词列表：

**cet4.json**（四级词汇，示例格式）

json

["abandon", "ability", "absent", "absolute", "absorb", "abstract", "abundant", "accept", ... 约4500词]

**cet6.json**（六级词汇，示例格式）

json

["abnormal", "abolish", "abortion", "abrupt", "absence", "absorption", "absurd", ... 约5500词]

**kaoyan.json**（考研词汇，示例格式）

json

["abide", "abound", "accommodate", "accompany", "accomplish", "accord", ... 约5500词]

**词库来源建议**：从公开的GitHub仓库或开源项目中获取，确保单词列表准确。

---

## 四、功能模块详细需求

### 模块1：用户账户系统

#### 1.1 注册/登录页面

- **路径**: `/login` 和 `/register`
    
- **功能**:
    
    - 支持邮箱密码注册登录
        
    - 支持GitHub一键登录
        
    - 登录后重定向到搜索页
        
    - 未登录用户可搜索查看，但无法保存单词
        

#### 1.2 中间件保护

- 创建 `middleware.ts` 保护 `/vocabulary` 路由
    
- 未登录访问自动跳转登录页
    

### 模块2：歌曲搜索

#### 2.1 搜索页面 (`/search`)

- **UI要求**:
    
    - 顶部大搜索框 + 搜索按钮
        
    - 下方展示搜索结果列表（卡片形式）
        
    - 每个卡片包含：专辑封面、歌名、歌手
        
- **交互流程**:
    
    1. 用户输入歌手或歌名
        
    2. 调用Spotify API搜索
        
    3. 展示最多10条结果
        
    4. 点击卡片进入歌曲详情页
        

#### 2.2 Spotify API集成要求

- 使用Client Credentials流程（无需用户登录）
    
- 在Vercel环境变量中配置：
    
    text
    
    SPOTIFY_CLIENT_ID=xxx
    SPOTIFY_CLIENT_SECRET=xxx
    
- API端点：`/api/spotify/search?q={query}`
    

#### 2.3 歌曲信息传递

- 用户点击歌曲卡片时，将歌曲信息（id, 歌名, 歌手, 封面）存入sessionStorage
    
- 跳转到 `/song/[id]` 页面
    

### 模块3：歌词获取与单词提取

#### 3.1 歌曲详情页 (`/song/[id]`)

- **页面布局**:
    
    - 左侧：专辑封面、歌名、歌手信息
        
    - 右侧上方：难度选择下拉框（四级/六级/考研）
        
    - 右侧中间："提取单词"按钮
        
    - 右侧下方：提取出的单词列表（可勾选）
        

#### 3.2 歌词获取 (`/api/lyrics`)

- 调用LRCLIB API获取歌词
    
- 优先获取带时间戳的歌词，如无则用纯文本歌词
    
- 歌词格式要求：保持原有的换行结构，用于后续提取例句
    

#### 3.3 单词匹配算法 (`lib/nlp/word-matcher.ts`)

**输入**:

- 完整歌词文本（string）
    
- 难度词库数组（string[]）
    

**处理步骤**:

1. 按`\n`分割歌词为行数组
    
2. 对每一行：
    
    - 使用compromise进行词形还原
        
    - 提取每个单词的原型（root form）
        
    - 检查原型是否在词库中
        
3. 匹配结果去重（同一首歌中同一个单词只保留一次，但保留首次出现的例句）
    

**输出格式**:

typescript

interface MatchedWord {
  word: string           // 单词原型（小写）
  originalWord: string   // 歌词中的原词（保留原大小写）
  lineIndex: number      // 所在行号
  fullLine: string       // 完整的歌词行（作为例句）
}

#### 3.4 单词展示要求

- 提取出的单词以卡片网格展示
    
- 每个卡片包含：
    
    - 复选框（用于选择加入单词本）
        
    - 单词本身
        
    - 该单词所在的歌词例句（高亮显示该单词）
        
    - "全选"按钮
        
    - "加入单词本"按钮
        

### 模块4：单词本功能

#### 4.1 单词本页面 (`/vocabulary`)

- 展示用户已保存的所有单词
    
- 每个单词卡片包含：
    
    - 单词
        
    - 中文释义（暂时可空缺或简单标注）
        
    - 来源歌曲名 + 歌手
        
    - 歌词例句
        
    - 发音按钮（点击播放）
        

#### 4.2 复习模式

- 简单卡片翻转效果
    
- 正面：单词
    
- 背面：释义 + 歌词例句
    

#### 4.3 状态管理

- 支持标记"已掌握"（可后续扩展）
    

### 模块5：发音功能

#### 5.1 实现方式

- 使用浏览器原生 `window.speechSynthesis`
    
- 创建自定义hook: `useSpeechSynthesis`
    
- 提供播放、暂停、停止控制
    

#### 5.2 触发位置

- 单词本每个卡片上的发音按钮
    
- 歌曲详情页单词卡片上的发音按钮（可选）
    

---

## 五、数据库设计（Supabase）

### 5.1 执行以下SQL创建表

sql

-- 扩展用户表（由Supabase Auth自动创建，无需手动）
-- 但我们需要创建用户单词本表
CREATE TABLE user_vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  translation TEXT,  -- 中文释义（可选）
  song_name TEXT NOT NULL,
  artist TEXT NOT NULL,
  lyric_context TEXT NOT NULL,  -- 单词所在的歌词行
  song_id TEXT,  -- Spotify歌曲ID，用于后续扩展
  status TEXT DEFAULT 'learning' CHECK (status IN ('learning', 'mastered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 同一用户不能重复添加同一首歌中的同一个单词
  UNIQUE(user_id, word, song_id)
);
-- 创建索引
CREATE INDEX idx_vocabulary_user_id ON user_vocabulary(user_id);
CREATE INDEX idx_vocabulary_status ON user_vocabulary(status);
CREATE INDEX idx_vocabulary_created_at ON user_vocabulary(created_at DESC);
-- 可选：创建歌词缓存表提高性能
CREATE TABLE lyrics_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id TEXT UNIQUE NOT NULL,
  song_name TEXT NOT NULL,
  artist TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

### 5.2 Row Level Security策略

sql

-- 启用RLS
ALTER TABLE user_vocabulary ENABLE ROW LEVEL SECURITY;
-- 用户只能看到自己的单词
CREATE POLICY "Users can view their own vocabulary" ON user_vocabulary
  FOR SELECT USING (auth.uid() = user_id);
-- 用户只能插入自己的单词
CREATE POLICY "Users can insert their own vocabulary" ON user_vocabulary
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 用户只能更新自己的单词
CREATE POLICY "Users can update their own vocabulary" ON user_vocabulary
  FOR UPDATE USING (auth.uid() = user_id);
-- 用户只能删除自己的单词
CREATE POLICY "Users can delete their own vocabulary" ON user_vocabulary
  FOR DELETE USING (auth.uid() = user_id);

---

## 六、API路由完整清单

请创建以下所有API路由：

|路径|方法|功能|必实现|
|---|---|---|---|
|`/api/spotify/search`|GET|搜索歌曲|✅|
|`/api/lyrics`|GET|获取歌词|✅|
|`/api/words/match`|POST|匹配单词|✅|
|`/api/words/translate`|GET|获取单词释义（可选）|⭕|

### 6.1 Spotify搜索接口详细要求

typescript

// GET /api/spotify/search?q=someone like you
// 返回格式
{
  tracks: [
    {
      id: string,
      name: string,
      artist: string,
      album: string,
      image: string,  // 专辑封面URL
      duration: number
    }
  ]
}

### 6.2 歌词获取接口详细要求

typescript

// GET /api/lyrics?artist=Taylor%20Swift&song=Love%20Story
// 返回格式
{
  lyrics: string,  // 纯文本歌词，每行用\n分隔
  source: 'exact' | 'search'  // 来源
}
// 失败时返回
{
  error: string,
  status: 404
}

### 6.3 单词匹配接口详细要求

typescript

// POST /api/words/match
// 请求体
{
  lyrics: string,
  level: 'cet4' | 'cet6' | 'kaoyan'
}
// 返回格式
{
  words: [
    {
      word: string,
      originalWord: string,
      lineIndex: number,
      fullLine: string,
      translation?: string
    }
  ]
}

---

## 七、页面路由结构完整清单

text

/                           # 重定向到 /search
├── /login                  # 登录页
├── /register               # 注册页
├── /search                 # 搜索页（首页）
├── /song/[id]              # 歌曲详情页
│   ├── 展示歌曲信息
│   ├── 难度选择下拉框
│   ├── 提取单词按钮
│   └── 单词列表（可勾选）
└── /vocabulary             # 我的单词本（需登录）
    ├── 单词卡片列表
    └── 复习模式切换

---

## 八、UI组件具体需求

### 8.1 必须使用的shadcn/ui组件

- Button
    
- Input
    
- Card
    
- Select
    
- Checkbox
    
- Tabs（用于单词本/复习切换）
    
- Dialog（用于确认操作）
    

### 8.2 自定义组件要求

**SongCard组件**

- 展示专辑图片、歌名、歌手
    
- 点击整个卡片跳转
    

**WordCard组件**

- 单词、例句、发音按钮
    
- 复选框（在歌曲详情页）
    
- 删除按钮（在单词本页面）
    

**LyricsView组件**

- 展示歌词全文
    
- 高亮已匹配的单词
    

### 8.3 颜色主题

- 主色：蓝色系（用于按钮、链接）
    
- 背景：浅色模式（白色/灰色）
    
- 卡片：白色背景，轻微阴影
    

---

## 九、需要处理的边缘情况

### 9.1 歌词相关

- 无歌词：提示"暂无歌词"
    
- 纯音乐：提示"纯音乐无歌词"
    
- 非英文歌：提示"仅支持英文歌曲"
    

### 9.2 单词匹配相关

- 无匹配单词：提示"未找到考纲词汇"
    
- 词形还原错误：保留原词进行匹配
    
- 重复单词：去重处理
    

### 9.3 用户操作相关

- 未登录点击加入单词本：跳转登录
    
- 单词已存在：提示"已添加过"
    
- 网络错误：友好提示重试
    

### 9.4 Spotify API限制

- 处理API限流
    
- 搜索结果为空时的处理
    
- 错误提示
    

---

## 十、项目初始化命令（Claude Code可直接执行）

bash

# 1. 创建Next.js项目
npx create-next-app@latest lyricvocab --typescript --tailwind --app --eslint
# 2. 进入项目目录
cd lyricvocab
# 3. 安装依赖
npm install @supabase/supabase-js @supabase/ssr
npm install compromise
npm install lucide-react
npm install class-variance-authority clsx tailwind-merge
# 4. 初始化shadcn/ui
npx shadcn-ui@latest init
# 选择: Yes for style, 使用默认颜色, 使用CSS variables
# 5. 添加shadcn组件
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add select
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add dialog

---

## 十一、环境变量配置要求

创建 `.env.local` 文件：

env

# Supabase配置
NEXT_PUBLIC_SUPABASE_URL=你的Supabase项目URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase匿名密钥
# Spotify配置（需在Spotify Developer Dashboard注册应用）
SPOTIFY_CLIENT_ID=你的Spotify客户端ID
SPOTIFY_CLIENT_SECRET=你的Spotify客户端密钥

---

## 十二、部署要求

项目必须能够一键部署到Vercel：

1. 所有API路由正常工作
    
2. 环境变量正确配置
    
3. Supabase CORS配置允许Vercel域名
    

---

## 十三、测试用例清单

开发完成后，请人工验证以下场景：

### 核心流程测试

- 新用户注册登录
    
- 搜索歌曲（如"Taylor Swift"）
    
- 选择难度并提取单词
    
- 勾选单词加入单词本
    
- 在单词本中查看已添加单词
    
- 点击发音按钮播放
    

### 边缘情况测试

- 搜索不存在的歌曲
    
- 歌曲无歌词
    
- 歌曲中没有匹配任何考纲单词
    
- 未登录时点击加入单词本
    
- 重复添加同一首歌的同一个单词
    

---

## 十四、项目完成标准

当以下条件全部满足时，项目才算完成：

1. ✅ 所有页面可访问，路由正确
    
2. ✅ Spotify API可正常搜索
    
3. ✅ LRCLIB可正常获取歌词
    
4. ✅ 单词匹配算法准确（测试至少3首不同歌曲）
    
5. ✅ 单词可成功保存到Supabase
    
6. ✅ 单词本页面正确展示保存的单词
    
7. ✅ 发音功能正常工作
    
8. ✅ 登录状态保持，权限控制正确
    
9. ✅ UI美观，移动端适配（响应式）
    
10. ✅ 无控制台报错
    

---

## 十五、注意事项

1. **不要过度设计**：只实现MVP要求的上述功能
    
2. **代码规范**：使用ESLint + Prettier
    
3. **提交规范**：每个功能模块完成后提交一次
    
4. **API密钥**：永远不要提交到代码仓库
    
5. **错误处理**：所有API调用必须有try-catch
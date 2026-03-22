# 部署到 Vercel 指南

## 完成的功能

1. **登录页面修复** - 修复了登录页面显示错误内容的问题
2. **词汇量测试** - 新用户首次登录时进行20道题词汇量测试
3. **兴趣领域选择** - 根据用户兴趣领域推荐相关单词
4. **智能单词提取** - 根据用户测试结果自动调整词汇过滤

## 部署步骤

### 1. 推送到 GitHub
确保代码已推送到 GitHub 仓库：
```bash
git add .
git commit -m "Add vocabulary test and interest selection"
git push origin main
```

### 2. Vercel 部署
1. 访问 [vercel.com](https://vercel.com) 并使用 GitHub 账号登录
2. 点击 "Add New..." -> "Project"
3. 选择你的 GitHub 仓库
4. 在 "Environment Variables" 中添加以下变量：

| 变量名 | 值（从 .env.local 获取） |
|--------|-------------------------|
| NEXT_PUBLIC_SUPABASE_URL | https://wxwrjmobzisptcwucajj.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | (你的 Supabase Anon Key) |
| SPOTIFY_CLIENT_ID | (你的 Spotify Client ID) |
| SPOTIFY_CLIENT_SECRET | (你的 Spotify Client Secret) |

5. 点击 "Deploy" 开始部署

### 3. Supabase 配置
确保在 Supabase 控制台中：
- 允许你的 Vercel 部署域名（如果使用了 Row Level Security）
- 检查 CORS 设置

## 部署后的使用

1. 访问 Vercel 提供的 URL
2. 访问 /register 注册新账号
3. 登录后会跳转到 /onboarding 进行词汇量测试
4. 测试完成后即可使用完整功能
5. 可以通过 /settings 修改词汇量等级和兴趣领域

## 常见问题

### Q: 歌曲搜索失败
A: 检查 Spotify API 凭据是否正确配置

### Q: 无法保存单词
A: 检查 Supabase 配置和认证状态

### Q: 歌词获取失败
A: lrclib.net 是免费服务，可能存在一些限制
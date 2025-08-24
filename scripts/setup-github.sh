#!/bin/bash

# GitHub仓库设置脚本
# 用于初始化Git仓库并推送到GitHub

set -e

echo "🚀 开始设置GitHub仓库..."

# 检查Git是否已安装
if ! command -v git &> /dev/null; then
    echo "❌ Git未安装，请先安装Git"
    exit 1
fi

# 检查是否已经是Git仓库
if [ ! -d ".git" ]; then
    echo "📁 初始化Git仓库..."
    git init
else
    echo "✅ Git仓库已存在"
fi

# 设置远程仓库
REPO_URL="https://github.com/Matthewyin/nssa_tools.git"
echo "🔗 设置远程仓库: $REPO_URL"

# 检查是否已有origin远程仓库
if git remote get-url origin &> /dev/null; then
    echo "⚠️ origin远程仓库已存在，更新URL..."
    git remote set-url origin $REPO_URL
else
    echo "➕ 添加origin远程仓库..."
    git remote add origin $REPO_URL
fi

# 检查当前分支
current_branch=$(git branch --show-current 2>/dev/null || echo "")
if [ -z "$current_branch" ]; then
    echo "🌿 创建main分支..."
    git checkout -b main
elif [ "$current_branch" != "main" ]; then
    echo "🌿 切换到main分支..."
    git checkout -b main 2>/dev/null || git checkout main
fi

# 添加所有文件
echo "📦 添加文件到Git..."
git add .

# 检查是否有更改需要提交
if git diff --staged --quiet; then
    echo "ℹ️ 没有新的更改需要提交"
else
    echo "💾 提交更改..."
    git commit -m "feat: NSSA工具集现代化重构完成

- 🏗️ 从HTML/JS应用升级到Nuxt 3全栈架构
- 🔥 集成Firebase Auth、Firestore、Functions
- ⚡ 实现服务端定时任务调度系统
- 🎨 统一的Apple风格现代化UI设计
- 🧪 完整的测试套件和监控系统
- 📱 响应式设计和PWA支持
- 🚀 GitHub Actions自动部署配置
- 🔒 完善的安全配置和错误处理

主要功能:
- 定时任务管理和调度
- AI驱动的网络拓扑生成
- 用户认证和数据持久化
- 系统健康监控和性能分析
- 数据迁移和管理工具"
fi

# 推送到GitHub
echo "🚀 推送到GitHub..."
echo ""
echo "⚠️ 注意：首次推送可能需要GitHub认证"
echo "如果需要，请按照提示进行身份验证"
echo ""

read -p "确认推送到GitHub? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 尝试推送
    if git push -u origin main; then
        echo "✅ 成功推送到GitHub!"
    else
        echo "❌ 推送失败，可能需要身份验证"
        echo ""
        echo "请尝试以下步骤："
        echo "1. 确保您有仓库的写入权限"
        echo "2. 配置GitHub认证（Personal Access Token或SSH密钥）"
        echo "3. 手动运行: git push -u origin main"
        exit 1
    fi
else
    echo "❌ 推送已取消"
    echo "您可以稍后手动推送: git push -u origin main"
    exit 0
fi

echo ""
echo "🎉 GitHub仓库设置完成！"
echo ""
echo "📊 仓库信息:"
echo "- 仓库URL: $REPO_URL"
echo "- 分支: main"
echo "- 最新提交: $(git log -1 --pretty=format:'%h - %s (%an, %ar)')"
echo ""
echo "🔗 有用的链接:"
echo "- GitHub仓库: https://github.com/Matthewyin/nssa_tools"
echo "- Actions页面: https://github.com/Matthewyin/nssa_tools/actions"
echo "- 部署指南: ./GITHUB_DEPLOYMENT.md"
echo ""
echo "📋 下一步:"
echo "1. 在GitHub仓库设置中配置Secrets（参考GITHUB_DEPLOYMENT.md）"
echo "2. 配置Firebase App Hosting"
echo "3. 推送代码触发自动部署"
echo ""
echo "✨ 设置完成！"

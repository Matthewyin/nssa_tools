#!/bin/bash

# NSSA工具集部署脚本
# 用于部署到Firebase App Hosting

set -e  # 遇到错误时退出

echo "🚀 开始部署NSSA工具集..."

# 检查必要的工具
echo "📋 检查部署环境..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI 未安装，正在安装..."
    npm install -g firebase-tools
fi

# 检查Firebase登录状态
echo "🔐 检查Firebase登录状态..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ 请先登录Firebase: firebase login"
    exit 1
fi

# 检查环境变量
echo "🔧 检查环境配置..."
if [ ! -f ".env" ]; then
    echo "❌ .env 文件不存在，请先配置环境变量"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm ci

# 运行测试（可选）
echo "🧪 运行测试..."
if [ "$SKIP_TESTS" != "true" ]; then
    echo "运行基础检查..."
    npm run typecheck || echo "⚠️ TypeScript检查有警告，继续部署"
fi

# 构建应用
echo "🏗️ 构建应用..."
npm run build

# 检查构建输出
if [ ! -d ".output" ]; then
    echo "❌ 构建失败，.output 目录不存在"
    exit 1
fi

echo "✅ 构建完成"

# 部署到Firebase App Hosting
echo "🚀 部署到Firebase App Hosting..."

# 设置Firebase项目
firebase use default

# 部署应用
if [ "$DRY_RUN" = "true" ]; then
    echo "🔍 干运行模式，跳过实际部署"
    echo "构建产物位于 .output/ 目录"
else
    # 部署到Firebase Hosting
    firebase deploy --only hosting
    
    # 如果有Functions，也部署Functions
    if [ -d "functions" ] && [ -f "functions/package.json" ]; then
        echo "🔧 部署Firebase Functions..."
        firebase deploy --only functions
    fi
fi

echo "🎉 部署完成！"

# 显示部署信息
echo ""
echo "📊 部署信息:"
echo "- 项目: $(firebase use)"
echo "- 构建时间: $(date)"
echo "- 版本: $(node -p "require('./package.json').version")"

if [ "$DRY_RUN" != "true" ]; then
    echo "- 访问地址: https://$(firebase use).web.app"
    echo ""
    echo "🔗 有用的链接:"
    echo "- Firebase控制台: https://console.firebase.google.com/project/$(firebase use)"
    echo "- 应用监控: https://console.firebase.google.com/project/$(firebase use)/hosting"
fi

echo ""
echo "✨ 部署成功完成！"

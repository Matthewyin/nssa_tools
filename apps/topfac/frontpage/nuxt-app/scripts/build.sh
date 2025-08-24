#!/bin/bash

# 前端项目构建脚本
# 用于生产环境的构建和部署

set -e

echo "🚀 开始构建前端项目..."

# 检查Node.js版本
echo "📋 检查环境..."
node_version=$(node -v)
echo "Node.js版本: $node_version"

# 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
rm -rf .nuxt
rm -rf .output
rm -rf dist

# 安装依赖
echo "📦 安装依赖..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi

# 设置生产环境
export NODE_ENV=production

# 运行类型检查
echo "🔍 运行类型检查..."
npm run typecheck || echo "⚠️  类型检查发现问题，但继续构建..."

# 运行ESLint检查
echo "📝 运行代码检查..."
npm run lint || echo "⚠️  代码检查发现问题，但继续构建..."

# 构建项目
echo "🔨 构建项目..."
npm run build

# 检查构建结果
if [ -d ".output" ]; then
    echo "✅ 构建成功！"
    echo "📊 构建统计："
    du -sh .output
    
    # 列出输出文件
    echo "📁 输出文件："
    find .output -name "*.js" -o -name "*.css" -o -name "*.html" | head -10
else
    echo "❌ 构建失败！"
    exit 1
fi

# 可选：分析构建包大小
if [ "$ANALYZE" = "true" ]; then
    echo "📈 分析构建包大小..."
    ANALYZE=true npm run build
fi

echo "🎉 前端构建完成！" 
#!/bin/bash

# 部署前检查脚本
# 确保所有必要的配置都已就绪

set -e

echo "🔍 开始部署前检查..."

# 检查必要文件
echo "📁 检查必要文件..."

required_files=(
    "package.json"
    "nuxt.config.ts"
    ".env"
    "firebase.json"
    ".firebaserc"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必要文件: $file"
        exit 1
    else
        echo "✅ $file"
    fi
done

# 检查环境变量
echo ""
echo "🔧 检查环境变量..."

# 从.env文件读取变量
if [ -f ".env" ]; then
    source .env
fi

required_env_vars=(
    "FIREBASE_API_KEY"
    "FIREBASE_AUTH_DOMAIN"
    "FIREBASE_PROJECT_ID"
    "FIREBASE_STORAGE_BUCKET"
    "FIREBASE_MESSAGING_SENDER_ID"
    "FIREBASE_APP_ID"
)

for var in "${required_env_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ 缺少环境变量: $var"
        exit 1
    else
        echo "✅ $var (已设置)"
    fi
done

# 检查Firebase项目配置
echo ""
echo "🔥 检查Firebase项目配置..."

if [ -f ".firebaserc" ]; then
    project_id=$(node -p "JSON.parse(require('fs').readFileSync('.firebaserc', 'utf8')).projects.default")
    echo "✅ Firebase项目ID: $project_id"
    
    # 检查项目ID是否与环境变量匹配
    if [ "$FIREBASE_PROJECT_ID" != "$project_id" ]; then
        echo "⚠️ 警告: .firebaserc中的项目ID ($project_id) 与环境变量中的项目ID ($FIREBASE_PROJECT_ID) 不匹配"
    fi
else
    echo "❌ .firebaserc 文件不存在"
    exit 1
fi

# 检查依赖
echo ""
echo "📦 检查依赖..."

if [ ! -d "node_modules" ]; then
    echo "⚠️ node_modules 不存在，需要运行 npm install"
    read -p "是否现在安装依赖? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm install
    else
        echo "❌ 请先安装依赖: npm install"
        exit 1
    fi
else
    echo "✅ node_modules 存在"
fi

# 检查构建
echo ""
echo "🏗️ 测试构建..."

echo "运行构建测试..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 构建测试通过"
else
    echo "❌ 构建测试失败"
    echo "请运行 'npm run build' 查看详细错误信息"
    exit 1
fi

# 检查Firebase CLI
echo ""
echo "🔧 检查Firebase CLI..."

if command -v firebase &> /dev/null; then
    firebase_version=$(firebase --version)
    echo "✅ Firebase CLI: $firebase_version"
    
    # 检查登录状态
    if firebase projects:list &> /dev/null; then
        echo "✅ Firebase已登录"
    else
        echo "❌ Firebase未登录，请运行: firebase login"
        exit 1
    fi
else
    echo "❌ Firebase CLI未安装，请运行: npm install -g firebase-tools"
    exit 1
fi

# 检查Git状态（可选）
echo ""
echo "📝 检查Git状态..."

if command -v git &> /dev/null && [ -d ".git" ]; then
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️ 有未提交的更改"
        git status --short
        read -p "是否继续部署? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "❌ 部署已取消"
            exit 1
        fi
    else
        echo "✅ Git工作目录干净"
    fi
    
    current_branch=$(git branch --show-current)
    echo "✅ 当前分支: $current_branch"
else
    echo "⚠️ 不是Git仓库或Git未安装"
fi

# 安全检查
echo ""
echo "🔒 安全检查..."

# 检查是否有敏感信息
if grep -r "password\|secret\|key" --include="*.js" --include="*.ts" --include="*.vue" . | grep -v node_modules | grep -v ".git" | grep -i "test\|demo\|example" > /dev/null; then
    echo "⚠️ 发现可能的测试密钥，请确保生产环境使用正确的密钥"
fi

echo "✅ 安全检查完成"

# 最终确认
echo ""
echo "🎯 部署前检查完成！"
echo ""
echo "📊 部署摘要:"
echo "- 项目: $project_id"
echo "- 环境: production"
echo "- 构建: 通过"
echo "- Firebase: 已配置"
echo ""

read -p "确认部署到生产环境? (y/n): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "✅ 检查通过，可以开始部署"
    exit 0
else
    echo "❌ 部署已取消"
    exit 1
fi

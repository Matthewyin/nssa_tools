#!/bin/bash

# Firebase App Hosting 手动部署脚本

echo "🚀 开始部署到Firebase App Hosting..."

# 检查Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI未安装，正在安装..."
    npm install -g firebase-tools@latest
fi

echo "✅ Firebase CLI版本: $(firebase --version)"

# 检查是否已登录
if ! firebase projects:list &> /dev/null; then
    echo "❌ 请先登录Firebase:"
    echo "   firebase login"
    exit 1
fi

# 设置项目
echo "📋 设置Firebase项目..."
firebase use n8n-project-460516

# 构建项目
echo "🔨 构建项目..."
npm run build

# 部署Functions
echo "⚡ 部署Firebase Functions..."
firebase deploy --only functions --project=n8n-project-460516

# 部署Firestore规则
echo "🗄️ 部署Firestore规则..."
firebase deploy --only firestore --project=n8n-project-460516

# 检查App Hosting是否可用
echo "🔍 检查App Hosting支持..."
if firebase apphosting --help &> /dev/null; then
    echo "✅ App Hosting支持可用"
    
    # 尝试部署App Hosting
    echo "🚀 部署App Hosting..."
    if firebase deploy --only apphosting --project=n8n-project-460516; then
        echo "✅ App Hosting部署成功！"
    else
        echo "❌ App Hosting部署失败"
        echo "💡 可能需要在Firebase Console中手动创建App Hosting应用"
        echo "   访问: https://console.firebase.google.com/project/n8n-project-460516/apphosting"
    fi
else
    echo "⚠️ App Hosting命令不可用"
    echo "💡 请检查Firebase CLI版本或在Firebase Console中手动配置"
    echo "   访问: https://console.firebase.google.com/project/n8n-project-460516/apphosting"
fi

echo "🎉 部署脚本执行完成！"
echo ""
echo "📋 部署信息:"
echo "   项目ID: n8n-project-460516"
echo "   App ID: 1:18068529376:web:42ce80ad28f316b97a3085"
echo "   Backend: nssa-tools"
echo ""
echo "🌐 可能的访问地址:"
echo "   - https://nssa-tools--n8n-project-460516.web.app"
echo "   - https://n8n-project-460516.web.app"
echo ""
echo "📊 查看部署状态:"
echo "   Firebase Console: https://console.firebase.google.com/project/n8n-project-460516"

#!/bin/bash

# 前端生产环境启动脚本
echo "🚀 启动前端生产环境..."

# 检查构建文件是否存在
BUILD_DIR="../../deploy/frontend"
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ 错误: 未找到构建目录 $BUILD_DIR"
    echo "请先运行构建脚本: ./build-prod.sh"
    exit 1
fi

# 检查服务器文件是否存在
SERVER_FILE="$BUILD_DIR/server/index.mjs"
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ 错误: 未找到服务器文件 $SERVER_FILE"
    echo "请先运行构建脚本: ./build-prod.sh"
    exit 1
fi

# 进入构建目录
cd "$BUILD_DIR"

# 设置环境变量
export NODE_ENV=production
export PORT=30000
export HOST=0.0.0.0

# 启动应用
echo "🌐 应用将在 http://localhost:30000 启动"
echo "🔗 后端API: http://localhost:30001/api"
echo ""
echo "按 Ctrl+C 停止应用"
echo ""

# 启动Node.js服务器
node server/index.mjs

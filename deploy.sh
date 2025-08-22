#!/bin/bash

# NSSA Tools 部署脚本
# 部署服务端定时任务系统到 Cloudflare Workers

set -e

echo "🚀 开始部署 NSSA Tools 服务端定时任务系统..."

# 检查 wrangler 是否已登录
echo "📋 检查 Cloudflare 认证状态..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ 未登录 Cloudflare，请先运行：wrangler login"
    exit 1
fi

echo "✅ Cloudflare 认证状态正常"

# 创建 KV 命名空间（如果不存在）
echo "📦 创建 KV 存储命名空间..."

# 创建任务存储 KV
echo "   创建 CRON_TASKS_KV..."
if ! wrangler kv namespace list | grep -q "CRON_TASKS_KV"; then
    TASKS_KV_ID=$(wrangler kv namespace create "CRON_TASKS_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    TASKS_KV_PREVIEW=$(wrangler kv namespace create "CRON_TASKS_KV" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    echo "   CRON_TASKS_KV ID: $TASKS_KV_ID"
    echo "   CRON_TASKS_KV Preview ID: $TASKS_KV_PREVIEW"
else
    echo "   ✅ CRON_TASKS_KV 已存在"
fi

# 创建日志存储 KV
echo "   创建 CRON_LOGS_KV..."
if ! wrangler kv namespace list | grep -q "CRON_LOGS_KV"; then
    LOGS_KV_ID=$(wrangler kv namespace create "CRON_LOGS_KV" --preview | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    LOGS_KV_PREVIEW=$(wrangler kv namespace create "CRON_LOGS_KV" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
    echo "   CRON_LOGS_KV ID: $LOGS_KV_ID"
    echo "   CRON_LOGS_KV Preview ID: $LOGS_KV_PREVIEW"
else
    echo "   ✅ CRON_LOGS_KV 已存在"
fi

# 创建 R2 存储桶（可选）
echo "📦 创建 R2 存储桶..."
if ! wrangler r2 bucket list | grep -q "nssa-tools-cron-logs"; then
    wrangler r2 bucket create "nssa-tools-cron-logs"
    echo "   ✅ R2 存储桶创建成功"
else
    echo "   ✅ R2 存储桶已存在"
fi

# 更新 wrangler.toml 配置
echo "⚙️  更新配置文件..."
if [ -f "wrangler.toml.backup" ]; then
    rm wrangler.toml.backup
fi
cp wrangler.toml wrangler.toml.backup

# 提示用户手动更新 KV ID
echo ""
echo "⚠️  请手动更新 wrangler.toml 文件中的 KV ID："
echo ""
echo "将以下行："
echo '  id = "YOUR_CRON_TASKS_KV_ID"'
echo "替换为实际的 KV ID（从上面的输出中复制）"
echo ""
echo "同样更新 CRON_LOGS_KV 的 ID"
echo ""
read -p "按回车键继续部署..."

# 部署应用
echo "🚀 部署到 Cloudflare Workers..."
wrangler deploy

echo ""
echo "✅ 部署完成！"
echo ""
echo "📋 部署信息："
echo "   - 应用已部署到：https://tools.nssa.io"
echo "   - 定时任务检查频率：每 5 分钟"
echo "   - KV 存储：已配置"
echo "   - R2 存储：已配置"
echo ""
echo "🔗 访问地址："
echo "   - 主应用：https://tools.nssa.io"
echo "   - 定时任务：https://tools.nssa.io/cron/"
echo ""
echo "🧪 测试建议："
echo "   1. 访问 /cron/ 页面创建测试任务"
echo "   2. 验证任务是否正常执行"
echo "   3. 检查跨设备同步功能"
echo "   4. 查看任务执行日志"
echo ""
echo "📊 监控命令："
echo "   wrangler tail -- 查看实时日志"
echo "   wrangler kv key list --prefix=task: -- 查看任务数据"
echo ""
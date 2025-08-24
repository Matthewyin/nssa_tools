#!/bin/bash

# Cloudflare D1 数据库设置脚本

set -e

echo "🗄️ 设置 Cloudflare D1 数据库..."

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 wrangler 是否已安装
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI 未安装${NC}"
    echo "请运行: npm install -g wrangler"
    exit 1
fi

# 检查是否已登录
echo -e "${BLUE}📋 检查 Cloudflare 登录状态...${NC}"
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️ 未登录 Cloudflare，正在启动登录流程...${NC}"
    wrangler login
fi

echo -e "${GREEN}✅ 已登录 Cloudflare${NC}"

# 创建 D1 数据库
echo -e "${BLUE}🗄️ 创建 D1 数据库...${NC}"
DB_OUTPUT=$(wrangler d1 create nssa-topfac-db)
echo "$DB_OUTPUT"

# 提取数据库 ID
DB_ID=$(echo "$DB_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)

if [ -z "$DB_ID" ]; then
    echo -e "${RED}❌ 无法获取数据库 ID${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 数据库创建成功，ID: $DB_ID${NC}"

# 更新 wrangler.toml
echo -e "${BLUE}📝 更新 wrangler.toml 配置...${NC}"
sed -i.bak "s/database_id = \"your-new-database-id\"/database_id = \"$DB_ID\"/" wrangler.toml

echo -e "${GREEN}✅ wrangler.toml 已更新${NC}"

# 创建数据库表
echo -e "${BLUE}🏗️ 创建数据库表...${NC}"

# 创建 SQL 文件
cat > schema.sql << 'EOF'
-- 项目表
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  current_version INTEGER DEFAULT 0,
  version_count INTEGER DEFAULT 0
);

-- 项目版本表
CREATE TABLE IF NOT EXISTS project_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  text_content TEXT,
  parsed_data TEXT,
  xml_content TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

-- 解析数据表
CREATE TABLE IF NOT EXISTS parsed_data (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version_id TEXT NOT NULL,
  topology_name TEXT,
  regions TEXT,
  components TEXT,
  connections TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (version_id) REFERENCES project_versions (id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_parsed_data_project_id ON parsed_data(project_id);
EOF

# 执行 SQL
wrangler d1 execute nssa-topfac-db --file=schema.sql

echo -e "${GREEN}✅ 数据库表创建成功${NC}"

# 清理临时文件
rm schema.sql

echo ""
echo -e "${GREEN}🎉 D1 数据库设置完成！${NC}"
echo "=================================================="
echo -e "${BLUE}📝 数据库信息:${NC}"
echo "  数据库名称: nssa-topfac-db"
echo "  数据库 ID: $DB_ID"
echo ""
echo -e "${BLUE}📝 下一步:${NC}"
echo "1. 运行 'wrangler dev' 测试本地开发"
echo "2. 运行 'wrangler deploy' 部署到生产环境"
echo "3. 在 Cloudflare Dashboard 中查看数据库"

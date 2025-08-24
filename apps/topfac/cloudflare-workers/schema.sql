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
  file_size INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
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

-- AI 配置表 (存储用户的 AI API Keys)
CREATE TABLE IF NOT EXISTS ai_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME
);

-- AI 转换历史表
CREATE TABLE IF NOT EXISTS ai_conversions (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  version_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT,
  input_length INTEGER,
  output_length INTEGER,
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (version_id) REFERENCES project_versions (id)
);

-- 组件模板表
CREATE TABLE IF NOT EXISTS component_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  template_data TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_versions_version ON project_versions(project_id, version);
CREATE INDEX IF NOT EXISTS idx_parsed_data_project_id ON parsed_data(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_configs_provider ON ai_configs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_configs_user_provider ON ai_configs(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_ai_conversions_project_id ON ai_conversions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversions_created_at ON ai_conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_component_templates_category ON component_templates(category);
CREATE INDEX IF NOT EXISTS idx_component_templates_active ON component_templates(is_active);

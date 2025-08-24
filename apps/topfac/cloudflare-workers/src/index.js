import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS 配置
app.use('*', cors({
  origin: ['https://topfac.nssa.io', 'https://localhost:3000', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// 数据库初始化
async function initDatabase(db) {
  try {
    // 使用单独的语句创建表，避免复杂的多行字符串
    await db.exec('CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, project_name TEXT NOT NULL, description TEXT, status TEXT DEFAULT \'active\', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, current_version INTEGER DEFAULT 0, version_count INTEGER DEFAULT 0)')

    await db.exec('CREATE TABLE IF NOT EXISTS project_versions (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, version INTEGER NOT NULL, text_content TEXT, parsed_data TEXT, xml_content TEXT, file_size INTEGER DEFAULT 0, status TEXT DEFAULT \'draft\', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)')

    await db.exec('CREATE TABLE IF NOT EXISTS parsed_data (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, version_id TEXT NOT NULL, topology_name TEXT, regions TEXT, components TEXT, connections TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)')

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization error:', error)
    // 不要抛出错误，让应用继续运行
  }
}

// 生成 UUID
function generateId() {
  return crypto.randomUUID()
}

// 健康检查
app.get('/health', async (c) => {
  try {
    const db = c.env.DB

    // 初始化数据库（如果需要）
    await initDatabase(db)

    // 简单的数据库连接测试
    const result = await db.prepare('SELECT 1 as test').first()

    return c.json({
      status: 'healthy',
      service: 'topfac-api',
      database: 'connected',
      database_type: 'cloudflare-d1',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      service: 'topfac-api',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    }, 500)
  }
})

// API 状态
app.get('/api/status', async (c) => {
  try {
    const db = c.env.DB

    // 确保数据库已初始化
    await initDatabase(db)

    // 获取项目统计
    const totalResult = await db.prepare('SELECT COUNT(*) as count FROM projects').first()
    const activeResult = await db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').bind('active').first()
    const archivedResult = await db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').bind('archived').first()
    const deletedResult = await db.prepare('SELECT COUNT(*) as count FROM projects WHERE status = ?').bind('deleted').first()

    return c.json({
      success: true,
      data: {
        service_info: {
          name: 'topfac-api',
          version: '2.0.0',
          port: 443,
          processing_mode: 'serverless'
        },
        database: {
          connected: true,
          type: 'cloudflare-d1',
          engine: 'sqlite'
        },
        project_statistics: {
          total: totalResult.count,
          active: activeResult.count,
          archived: archivedResult.count,
          deleted: deletedResult.count
        },
        text_parser: {
          status: 'ready',
          max_text_length: 50000
        }
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 获取项目列表
app.get('/api/projects', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit

    // 获取项目列表
    const projects = await db.prepare(`
      SELECT * FROM projects
      WHERE status != 'deleted'
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all()

    // 获取总数
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as count FROM projects WHERE status != 'deleted'
    `).first()

    return c.json({
      success: true,
      data: {
        projects: projects.results,
        pagination: {
          page,
          limit,
          total: totalResult.count,
          pages: Math.ceil(totalResult.count / limit)
        }
      }
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 创建项目
app.post('/api/projects', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const body = await c.req.json()
    const { project_name, description, text_content } = body

    if (!project_name) {
      return c.json({
        success: false,
        error: '项目名称不能为空'
      }, 400)
    }

    const projectId = generateId()
    const now = new Date().toISOString()

    // 插入项目
    await db.prepare(`
      INSERT INTO projects (id, project_name, description, status, created_at, current_version, version_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(projectId, project_name, description || '', 'active', now, 0, 0).run()

    // 获取创建的项目
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(projectId).first()

    return c.json({
      success: true,
      data: project
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 获取项目详情
app.get('/api/projects/:id', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const id = c.req.param('id')
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first()

    if (!project) {
      return c.json({
        success: false,
        error: '项目不存在'
      }, 404)
    }

    return c.json({
      success: true,
      data: project
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 获取项目版本列表
app.get('/api/projects/:project_id/versions', async (c) => {
  try {
    const { project_id } = c.req.param()
    const db = c.env.DB
    await initDatabase(db)

    // 获取项目版本列表
    const versions = await db.prepare(`
      SELECT * FROM project_versions
      WHERE project_id = ?
      ORDER BY version DESC
    `).bind(project_id).all()

    const versionList = versions.results || []

    // 为每个版本添加 _id 字段和解析数据
    const versionsWithId = versionList.map(version => {
      // 解析 parsed_data
      let parsedData = ''
      try {
        if (version.parsed_data) {
          parsedData = typeof version.parsed_data === 'string'
            ? version.parsed_data
            : JSON.stringify(version.parsed_data)
        }
      } catch (error) {
        console.warn('解析 parsed_data 失败:', error)
        parsedData = ''
      }

      return {
        id: version.id,
        project_id: version.project_id,
        version: version.version,
        text_content: version.text_content,
        xml_content: version.xml_content,
        status: version.status,
        created_at: version.created_at,
        parsed_data: parsedData,
        _id: version.id     // 前端期望的主要字段
      }
    })

    return c.json({
      success: true,
      data: {
        versions: versionsWithId,
        pagination: {
          page: 1,
          limit: versionsWithId.length,
          total: versionsWithId.length,
          pages: 1
        }
      }
    })
  } catch (error) {
    console.error('Get versions error:', error)
    return c.json({
      success: false,
      error: '获取版本列表失败'
    }, 500)
  }
})

// 创建新版本
app.post('/api/projects/:project_id/versions', async (c) => {
  try {
    const { project_id } = c.req.param()
    const { text_content, parsed_data, xml_content } = await c.req.json()

    const db = c.env.DB
    await initDatabase(db)

    // 获取当前最大版本号
    const maxVersion = await db.prepare(`
      SELECT MAX(version) as max_version FROM project_versions WHERE project_id = ?
    `).bind(project_id).first()

    const newVersion = (maxVersion?.max_version || 0) + 1
    const versionId = generateId()
    const now = new Date().toISOString()

    // 创建新版本
    await db.prepare(`
      INSERT INTO project_versions (id, project_id, version, text_content, parsed_data, xml_content, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      versionId,
      project_id,
      newVersion,
      text_content || '',
      parsed_data || '',
      xml_content || '',
      'active',
      now
    ).run()

    // 更新项目的版本计数和当前版本
    await db.prepare(`
      UPDATE projects
      SET current_version = ?, version_count = ?
      WHERE id = ?
    `).bind(newVersion, newVersion, project_id).run()

    return c.json({
      success: true,
      data: {
        version_id: versionId,
        version: newVersion
      }
    })
  } catch (error) {
    console.error('Create version error:', error)
    return c.json({
      success: false,
      error: '创建版本失败'
    }, 500)
  }
})

// 文本解析 (简化版本)
app.post('/api/parse', async (c) => {
  try {
    const body = await c.req.json()
    const { text_content, project_id } = body

    if (!text_content) {
      return c.json({
        success: false,
        error: '文本内容不能为空'
      }, 400)
    }

    // 简化的文本解析逻辑
    const lines = text_content.split('\n').filter(line => line.trim())
    const components = []
    const connections = []

    lines.forEach((line, index) => {
      if (line.includes('->') || line.includes('连接')) {
        const parts = line.split(/->|连接/).map(p => p.trim())
        if (parts.length >= 2) {
          connections.push({
            id: `conn_${index}`,
            source: parts[0],
            target: parts[1],
            type: 'connection'
          })

          // 添加组件
          parts.forEach(part => {
            if (!components.find(c => c.name === part)) {
              components.push({
                id: `comp_${components.length}`,
                name: part,
                type: 'device'
              })
            }
          })
        }
      }
    })

    const parsedData = {
      topology_name: '解析的拓扑',
      regions: [],
      components,
      connections
    }

    // 如果提供了项目ID，保存解析结果
    if (project_id) {
      const db = c.env.DB
      await initDatabase(db)

      const parsedId = generateId()
      await db.prepare(`
        INSERT INTO parsed_data (id, project_id, version_id, topology_name, regions, components, connections)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        parsedId,
        project_id,
        'temp', // 临时版本ID
        parsedData.topology_name,
        JSON.stringify(parsedData.regions),
        JSON.stringify(parsedData.components),
        JSON.stringify(parsedData.connections)
      ).run()
    }

    return c.json({
      success: true,
      data: parsedData
    })
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

// 删除项目（软删除，与 Python 后端一致）
app.delete('/api/projects/:id', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const projectId = c.req.param('id')

    console.log('开始删除项目:', { project_id: projectId })

    // 检查项目是否存在
    const project = await db.prepare(`
      SELECT * FROM projects WHERE id = ? AND status != 'deleted'
    `).bind(projectId).first()

    if (!project) {
      console.warn('项目不存在:', { project_id: projectId })
      return c.json({
        success: false,
        error: '项目不存在'
      }, 404)
    }

    // 软删除：更新状态为 'deleted'（与 Python 后端一致）
    const deleteResult = await db.prepare(`
      UPDATE projects SET status = 'deleted' WHERE id = ?
    `).bind(projectId).run()

    if (deleteResult.changes === 0) {
      console.warn('项目删除失败:', { project_id: projectId })
      return c.json({
        success: false,
        error: '项目删除失败'
      }, 500)
    }

    console.log('项目删除成功:', {
      project_id: projectId,
      project_name: project.project_name
    })

    return c.json({
      success: true,
      message: '项目删除成功'
    })

  } catch (error) {
    console.error('删除项目失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 硬删除项目（完全删除项目及其所有版本）
app.delete('/api/projects/:id/hard', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const projectId = c.req.param('id')

    console.log('开始硬删除项目:', { project_id: projectId })

    // 检查项目是否存在
    const project = await db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first()

    if (!project) {
      console.warn('项目不存在:', { project_id: projectId })
      return c.json({
        success: false,
        error: '项目不存在'
      }, 404)
    }

    // 删除所有版本
    const deleteVersionsResult = await db.prepare(`
      DELETE FROM project_versions WHERE project_id = ?
    `).bind(projectId).run()

    console.log('删除项目版本:', {
      project_id: projectId,
      deleted_versions: deleteVersionsResult.changes
    })

    // 删除项目
    const deleteProjectResult = await db.prepare(`
      DELETE FROM projects WHERE id = ?
    `).bind(projectId).run()

    if (deleteProjectResult.changes === 0) {
      console.warn('项目硬删除失败:', { project_id: projectId })
      return c.json({
        success: false,
        error: '项目删除失败'
      }, 500)
    }

    console.log('项目硬删除成功:', {
      project_id: projectId,
      project_name: project.project_name,
      deleted_versions: deleteVersionsResult.changes,
      deleted_projects: deleteProjectResult.changes
    })

    return c.json({
      success: true,
      message: '项目已完全删除',
      data: {
        project_id: projectId,
        deleted_versions: deleteVersionsResult.changes,
        deleted_projects: deleteProjectResult.changes
      }
    })

  } catch (error) {
    console.error('硬删除项目失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 恢复项目（将已删除的项目恢复为活跃状态）
app.patch('/api/projects/:id/restore', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const projectId = c.req.param('id')

    console.log('开始恢复项目:', { project_id: projectId })

    // 检查项目是否存在且为已删除状态
    const project = await db.prepare(`
      SELECT * FROM projects WHERE id = ? AND status = 'deleted'
    `).bind(projectId).first()

    if (!project) {
      console.warn('项目不存在或未被删除:', { project_id: projectId })
      return c.json({
        success: false,
        error: '项目不存在或未被删除'
      }, 404)
    }

    // 恢复项目：更新状态为 'active'
    const restoreResult = await db.prepare(`
      UPDATE projects SET status = 'active' WHERE id = ?
    `).bind(projectId).run()

    if (restoreResult.changes === 0) {
      console.warn('项目恢复失败:', { project_id: projectId })
      return c.json({
        success: false,
        error: '项目恢复失败'
      }, 500)
    }

    console.log('项目恢复成功:', {
      project_id: projectId,
      project_name: project.project_name
    })

    return c.json({
      success: true,
      message: '项目恢复成功'
    })

  } catch (error) {
    console.error('恢复项目失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 批量删除项目（软删除）
app.post('/api/projects/batch-delete', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const data = await c.req.json()
    const { project_ids, hard_delete = false } = data

    if (!project_ids || !Array.isArray(project_ids) || project_ids.length === 0) {
      return c.json({
        success: false,
        error: '项目ID列表不能为空'
      }, 400)
    }

    console.log('开始批量删除项目:', {
      project_ids,
      count: project_ids.length,
      hard_delete
    })

    const results = {
      success: [],
      failed: [],
      total: project_ids.length
    }

    // 逐个处理项目删除
    for (const projectId of project_ids) {
      try {
        // 检查项目是否存在
        const project = await db.prepare(`
          SELECT * FROM projects WHERE id = ?
        `).bind(projectId).first()

        if (!project) {
          results.failed.push({
            project_id: projectId,
            error: '项目不存在'
          })
          continue
        }

        if (hard_delete) {
          // 硬删除：删除所有版本
          const deleteVersionsResult = await db.prepare(`
            DELETE FROM project_versions WHERE project_id = ?
          `).bind(projectId).run()

          // 删除项目
          const deleteResult = await db.prepare(`
            DELETE FROM projects WHERE id = ?
          `).bind(projectId).run()

          // 硬删除总是成功的（幂等操作）
          results.success.push({
            project_id: projectId,
            project_name: project.project_name,
            type: 'hard_delete',
            deleted_versions: deleteVersionsResult.changes,
            deleted_projects: deleteResult.changes
          })
        } else {
          // 软删除：更新状态
          if (project.status === 'deleted') {
            // 项目已经被删除，跳过
            results.success.push({
              project_id: projectId,
              project_name: project.project_name,
              type: 'already_deleted'
            })
          } else {
            const deleteResult = await db.prepare(`
              UPDATE projects SET status = 'deleted' WHERE id = ?
            `).bind(projectId).run()

            if (deleteResult.changes > 0) {
              results.success.push({
                project_id: projectId,
                project_name: project.project_name,
                type: 'soft_delete'
              })
            } else {
              results.failed.push({
                project_id: projectId,
                error: '软删除失败'
              })
            }
          }
        }

      } catch (error) {
        results.failed.push({
          project_id: projectId,
          error: error.message
        })
      }
    }

    console.log('批量删除项目完成:', {
      total: results.total,
      success: results.success.length,
      failed: results.failed.length
    })

    return c.json({
      success: true,
      message: `批量删除完成：成功 ${results.success.length} 个，失败 ${results.failed.length} 个`,
      data: results
    })

  } catch (error) {
    console.error('批量删除项目失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 404 处理 - 仅用于 API 路由
app.notFound((c) => {
  const path = new URL(c.req.url).pathname
  if (path.startsWith('/api/')) {
    return c.json({
      success: false,
      error: 'API 端点不存在'
    }, 404)
  }

  // 对于非 API 路由，尝试静态文件处理
  return handleStaticFiles(c)
})

// 静态文件处理函数
async function handleStaticFiles(c) {
  const url = new URL(c.req.url)
  const path = url.pathname

  try {
    // 尝试获取静态文件
    const assetResponse = await c.env.ASSETS.fetch(c.req.raw)
    if (assetResponse.status === 200) {
      return assetResponse
    }

    // 对于 SPA 路由，返回 index.html
    if (!path.includes('.')) {
      const indexResponse = await c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)))
      if (indexResponse.status === 200) {
        return indexResponse
      }
    }

    return new Response('Not Found', { status: 404 })
  } catch (error) {
    console.error('Static file error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// ==================== AI 智能转换接口 ====================

// AI 服务配置
const AI_PROVIDERS = {
  gemini: {
    name: 'Google Gemini',
    description: 'Google的多模态大语言模型，支持文本生成和理解',
    default_model: 'gemini-2.5-flash',    available_models: ['gemini-2.5-flash', 'gemini-2.5-pro'],

    api_key_format: 'AIzaSy开头，约39字符',
    features: ['natural_language_conversion', 'connection_test', 'format_validation']
  },
  deepseek: {
    name: 'DeepSeek',
    description: '深度求索的大语言模型，专注于代码和推理任务',
    default_model: 'deepseek-chat',
    available_models: ['deepseek-chat', 'deepseek-reasoner'],
    api_key_format: 'sk-开头，30-50字符',
    features: ['natural_language_conversion', 'connection_test', 'format_validation']
  }
}

// AI 提示词模板 - 与 prompt.txt 完全一致
const AI_PROMPT_TEMPLATE = `### **【角色设定】**

你是一位顶级的网络架构师和拓扑分析专家AI。你的思考严谨、逻辑清晰，严格遵循规则。你的核心任务是：精确解析用户用自然语言描述的网络设备连接需求，并根据严格的4级层次结构规则，生成标准化的连接清单。

### **【核心任务】**

将任何自然语言描述的网络拓扑，转换为无编号的、逐行的标准化4级层次结构连接清单。

**标准格式（每个元素都必须用【】包围）：**
【环境】【数据中心】的【网络区域】【设备类型/应用系统】连接【环境】【数据中心】的【网络区域】【设备类型/应用系统】

**重要：每个层级元素都必须严格用【】包围，不允许有任何例外！**

### **【第一原则：上下文继承与覆盖】**

1. **继承：** 你必须具备强大的上下文记忆能力。一旦在文本中确定了【环境】、【数据中心】或【网络区域】，你必须将它们进行区分，要分析是连接前，还是连接后。如果是连接前，那么作为后续所有节点的**默认属性**，直到在文本中明确出现新的同级属性为止。如果是连接后，需要根据给出的实际文本进行判断。

2. **覆盖（关键规则）：** 当一个更高层级的属性（如【环境】或【数据中心】）被更新时，其所有**下级属性**的上下文都应被**立即清空**，并视为【未知】，直到在文本中被重新赋值。

### **【第二原则：指代消解】**

当文本中出现"该设备"、"此服务器"、"它"等指代性词语时，你必须**默认指代本句话中最后一个被提及的、符合逻辑的设备/应用系统**。如果本句话没有，则指代上一句话中最后一个被提及的设备/应用系统。

### **【第三原则：规则化解析流程】**

你必须遵循以下分步流程来处理用户输入：

1. **预处理：** 将所有中文标点符号（如 \`，\`、\`。\`、\`、\`）替换为对应的半角符号（\`,\`、\`.\`、\`和\`）。
2. **切分语句：** 以 \`,\` 和 \`.\` 作为分隔符，将长文本切分为独立的短语或句子进行分析。
3. **识别节点与连接：** 在每个短语中，识别出源节点、目标节点和连接词。
4. **构建节点：** 对每个识别出的节点，应用【4级层次结构定义】和【智能识别与推断规则】来填充其四个属性。
5. **生成连接：** 根据【连接关系处理规则】，将构建好的源节点和目标节点组合成标准格式的连接字符串。
6. **最终审查：** 应用【质量检查清单】确保所有输出都符合规范，并删除任何重复的连接。

### **【4级层次结构定义】**

1. **【环境】** - 业务环境类型。
   - **生产网：** \`生产\`、\`灾备\`
   - **开发测试网：** \`开发\`、\`测试\`、\`预生产\`、\`演示\`、\`UAT\`、\`SIT\`
   - **协同工作网：** \`协同\`、\`信创OA\`、\`需求统筹工具\`、\`技术统筹工具\`、\`知识库\`
   - **运维管理终端接入网：** \`运维\`、\`ECC\`
   - **运营管理终端接入网：** \`运营管理\`、\`IOCC\`、\`BOCC\`、\`运营主控\`、\`西五环东楼\`
   - **VPDN终端接入网：** \`VPDN\`、\`VPDN终端\`
   - **管理终端接入网：** \`管理端\`、\`省中心\`、\`地市中心\`
   - **辅助运营网：** \`辅助运营\`、\`辅助\`、\`ioc vdi\`、\`ioc\`
   - **办公网：** \`办公\`、\`科技\`、\`骏彩\`、\`运营\`、\`中心办公\`、\`翌景办公\`、\`亦庄办公\`、\`中体方城\`、\`西五环办公\`、\`公司\` 、\`中心\`(如\`公司1\`应识别为\`公司1办公网\`，\`\`中心\`\`->\`中心办公网\`)
   - **其他：** 如有其他未列出的环境类型，直接使用其原文，并用星号包裹（如 \`【*研发网*】\`），以待人工确认。

2. **【数据中心】** - 物理位置或云平台。
   - \`亦庄\`、\`西五环\`、\`翌景\`、\`公有云\`、\`阿里公有云\`、\`腾讯公有云\`
   - **别名推断：** \`生产A数据中心\` -> \`亦庄\`； \`生产B数据中心\` -> \`西五环\`

3. **【网络区域】** - 网络功能区域。
   - \`核心区\`、\`外联接入区\`、\`内联接入区\`、\`外联DMZ区\`、\`内联DMZ区\`、\`互联网接入A区\`、\`互联网接入A区DMZ\`、\`互联网接入B区\`、\`互联网接入B区DMZ\`、\`互联网接入区\`、\`互联网DMZ区\`、\`汇聚区\`、\`管理区\`、\`存储区\`、\`阿里云区\`、\`腾讯云区\` 、\`生产一区\`
   - **别名推断：** \`核心\`->\`核心区\`；\`外联\`->\`外联接入区\`；\`内联\`->\`内联接入区\`；\`外联接入\`->\`外联接入区\`；\`内联接入\`->\`内联接入区\`；\`边界\`->\`接入\`

4. **【设备类型/应用系统】** - 网络设备或应用系统。
   - **设备标准化：**
     - \`路由器\`、\`核心路由器\`、\`边界路由器\` -> \`路由器\`
     - \`防火墙\`、\`边界防火墙\`、\`安全网关\` -> \`接入防火墙\`
     - \`F5\`、\`LTM\`、\`深信服\` -> \`服务器负载均衡器\`
     - \`GTM\` -> \`GTM-DNS服务器\`

### **【智能识别与推断规则】**

1. **上下文推断：** 严格遵循【第一原则】。
2. **未知术语处理：** 当遇到词典中不存在的术语（如 \`研发网\`），首先尝试根据其在句子中的位置推断其层级。然后，直接使用该术语原文，并用星号包裹（如 \`【*研发网*】\`）。
3. **设备实例化：** \`两台交换机\` 必须解析为 \`交换机1\`, \`交换机2\`。\`核心路由器1-3\` 必须解析为 \`核心路由器1\`, \`核心路由器2\`, \`核心路由器3\`。
4. **实体名称特殊处理：** \`公司X\` 应被视为一个独立的【环境】实体，即 \`公司1办公网\`。

### **【连接关系处理规则】**

- **显式连接词：** \`连接\`、\`访问\`、\`对接\`、\`链路\`、\`互访\`、\`接\`、\`到\`。
- **隐含关系关键词：** \`同步\`、\`通信\`、\`交换数据\`、\`互通\`、\`提供服务\`、\`依赖于\`。
- **多重连接 (\`A连接B和C\`)：** 必须拆分为两条独立的连接：\`A连接B\` 和 \`A连接C\`。
- **交叉连接 (\`A和B都连接C\`)：** 必须拆分为两条独立的连接：\`A连接C\` 和 \`B连接C\`。
- **链式连接 (\`A通过B连接C\`)：** 必须拆分为两条独立的连接：\`A连接B\` 和 \`B连接C\`。

### **【质量检查与输出约束】**

1. **逻辑检查：** 避免出现节点自连接（A连接A）。
2. **去重：** 最终输出中不允许有任何完全重复的连接行。
3. **格式检查：** 每一行输出都必须严格符合\`【环境】【数据中心】的【网络区域】【设备类型/应用系统】连接...\`格式。**每个元素都必须用【】包围，绝对不允许出现没有【】的元素！**
4. **完整性检查：** 每个节点都必须包含完整的4级层次。如果无法通过任何规则补全，则明确标记为 \`【未知环境】\`、\`【未知数据中心】\` 或 \`【未知区域】\`。
5. **绝对禁止项：** 不要在任何输出行前添加 \`1.\` \`a\` \`i\` 等任何形式的列表符号。

**现在，请严格以上述所有规则为唯一准则，开始执行任务。**

**输入文本:**
{{user_input}}

**格式要求提醒：**
- 每一行都必须以"-"开头
- 每个元素都必须严格用【】包围
- 格式：【环境】【数据中心】的【网络区域】【设备类型/应用系统】连接【环境】【数据中心】的【网络区域】【设备类型/应用系统】
- 示例：【生产网】【亦庄】的【外联接入区】【路由器】连接【公司1办公网】【亦庄】的【核心区】【核心交换机】

**你的输出:**`

// AI 服务函数
async function callGeminiAPI(apiKey, prompt, modelName = 'gemini-2.5-flash') {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

  const response = await fetch(`${url}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 20480
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API调用失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API返回空结果')
  }

  return data.candidates[0].content.parts[0].text.trim()
}

async function callDeepSeekAPI(apiKey, prompt, modelName = 'deepseek-chat') {
  const url = 'https://api.deepseek.com/v1/chat/completions'

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API调用失败: ${response.status}`)
  }

  const data = await response.json()
  if (!data.choices || data.choices.length === 0) {
    throw new Error('DeepSeek API返回空结果')
  }

  return data.choices[0].message.content.trim()
}

async function testAIConnection(provider, apiKey, modelName) {
  const testPrompt = '测试连接：请回复"连接成功"'

  try {
    let result
    if (provider === 'gemini') {
      result = await callGeminiAPI(apiKey, testPrompt, modelName)
    } else if (provider === 'deepseek') {
      result = await callDeepSeekAPI(apiKey, testPrompt, modelName)
    } else {
      throw new Error(`不支持的提供商: ${provider}`)
    }

    return {
      success: true,
      provider: provider,
      model: modelName || AI_PROVIDERS[provider].default_model,
      response_text: result,
      message: '连接测试成功'
    }
  } catch (error) {
    return {
      success: false,
      provider: provider,
      error: error.message,
      message: '连接测试失败'
    }
  }
}

async function convertTextWithAI(provider, apiKey, naturalInput, modelName) {
  const prompt = AI_PROMPT_TEMPLATE.replace('{{user_input}}', naturalInput)

  try {
    let result
    if (provider === 'gemini') {
      result = await callGeminiAPI(apiKey, prompt, modelName)
    } else if (provider === 'deepseek') {
      result = await callDeepSeekAPI(apiKey, prompt, modelName)
    } else {
      throw new Error(`不支持的提供商: ${provider}`)
    }

    return {
      success: true,
      data: {
        converted_text: result,
        input_text: naturalInput,
        model: modelName || AI_PROVIDERS[provider].default_model
      },
      message: '转换成功'
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: '转换失败'
    }
  }
}

// 数据验证函数
function validateAIConvertRequest(data) {
  const errors = []

  // 验证 provider
  if (!data.provider) {
    errors.push('AI服务提供商不能为空')
  } else if (!['gemini', 'deepseek'].includes(data.provider)) {
    errors.push('不支持的AI服务提供商')
  }

  // 验证 api_key
  if (!data.api_key) {
    errors.push('API Key不能为空')
  } else if (data.api_key.length < 10 || data.api_key.length > 200) {
    errors.push('API Key长度必须在10-200字符之间')
  }

  // 验证 natural_input
  if (!data.natural_input) {
    errors.push('自然语言输入不能为空')
  } else if (data.natural_input.length < 5 || data.natural_input.length > 10000) {
    errors.push('自然语言输入长度必须在5-10000字符之间')
  }

  // 验证 model_name (可选)
  if (data.model_name && data.model_name.length > 100) {
    errors.push('模型名称长度不能超过100字符')
  }

  // API Key 格式验证
  if (data.provider && data.api_key) {
    if (data.provider === 'gemini') {
      if (!data.api_key.startsWith('AIzaSy') || data.api_key.length < 30 || data.api_key.length > 50) {
        errors.push('Gemini API Key格式不正确')
      }
    } else if (data.provider === 'deepseek') {
      if (!data.api_key.startsWith('sk-') || data.api_key.length < 30 || data.api_key.length > 50) {
        errors.push('DeepSeek API Key格式不正确')
      }
    }
  }

  return errors
}

function validateAITestRequest(data) {
  const errors = []

  // 验证 provider
  if (!data.provider) {
    errors.push('AI服务提供商不能为空')
  } else if (!['gemini', 'deepseek'].includes(data.provider)) {
    errors.push('不支持的AI服务提供商')
  }

  // 验证 api_key
  if (!data.api_key) {
    errors.push('API Key不能为空')
  } else if (data.api_key.length < 10 || data.api_key.length > 200) {
    errors.push('API Key长度必须在10-200字符之间')
  }

  // 验证 model_name (可选)
  if (data.model_name && data.model_name.length > 100) {
    errors.push('模型名称长度不能超过100字符')
  }

  // API Key 格式验证
  if (data.provider && data.api_key) {
    if (data.provider === 'gemini') {
      if (!data.api_key.startsWith('AIzaSy') || data.api_key.length < 30 || data.api_key.length > 50) {
        errors.push('Gemini API Key格式不正确')
      }
    } else if (data.provider === 'deepseek') {
      if (!data.api_key.startsWith('sk-') || data.api_key.length < 30 || data.api_key.length > 50) {
        errors.push('DeepSeek API Key格式不正确')
      }
    }
  }

  return errors
}

// AI智能文本转换
app.post('/api/ai/convert-text', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const data = await c.req.json()
    if (!data) {
      return c.json({
        success: false,
        error: '请求数据不能为空'
      }, 400)
    }

    // 验证输入数据
    const validationErrors = validateAIConvertRequest(data)
    if (validationErrors.length > 0) {
      console.warn('AI转换请求验证失败:', validationErrors)
      return c.json({
        success: false,
        error: '输入数据验证失败',
        details: validationErrors
      }, 400)
    }

    const { provider, api_key, natural_input, model_name } = data

    // 生成会话ID用于关联输入和输出日志
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    console.log('开始AI文本转换:', {
      provider,
      input_length: natural_input.length,
      has_model_name: !!model_name,
      session_id: sessionId
    })

    // 执行AI转换
    const startTime = Date.now()
    const result = await convertTextWithAI(provider, api_key, natural_input, model_name)
    const processingTime = Date.now() - startTime

    if (result.success) {
      console.log('AI文本转换成功:', {
        provider,
        model: result.data?.model || model_name,
        processing_time: processingTime,
        output_length: result.data?.converted_text?.length || 0,
        session_id: sessionId
      })

      return c.json({
        success: true,
        data: {
          converted_text: result.data.converted_text,
          provider: provider,
          model: result.data.model || model_name,
          processing_time: processingTime,
          input_length: natural_input.length,
          output_length: result.data.converted_text?.length || 0,
          session_id: sessionId
        }
      })
    } else {
      console.warn('AI文本转换失败:', {
        provider,
        error: result.message || result.error,
        session_id: sessionId
      })

      return c.json({
        success: false,
        error: result.message || result.error || 'AI转换失败',
        provider: provider,
        session_id: sessionId
      }, 400)
    }

  } catch (error) {
    console.error('AI文本转换异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 测试AI服务连接
app.post('/api/ai/test-connection', async (c) => {
  try {
    const data = await c.req.json()
    if (!data) {
      return c.json({
        success: false,
        error: '请求数据不能为空'
      }, 400)
    }

    // 验证输入数据
    const validationErrors = validateAITestRequest(data)
    if (validationErrors.length > 0) {
      console.warn('AI连接测试请求验证失败:', validationErrors)
      return c.json({
        success: false,
        error: '输入数据验证失败',
        details: validationErrors
      }, 400)
    }

    const { provider, api_key, model_name } = data

    console.log('开始AI连接测试:', {
      provider,
      has_model_name: !!model_name
    })

    // 执行连接测试
    const result = await testAIConnection(provider, api_key, model_name)

    if (result.success) {
      console.log('AI连接测试成功:', {
        provider,
        model: result.model
      })
      return c.json(result)
    } else {
      console.warn('AI连接测试失败:', {
        provider,
        error: result.error
      })
      return c.json(result, 400)
    }

  } catch (error) {
    console.error('AI连接测试异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 获取支持的AI服务提供商列表
app.get('/api/ai/providers', async (c) => {
  try {
    // 转换为与 Python 后端一致的格式
    const providersArray = Object.entries(AI_PROVIDERS).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description,
      default_model: config.default_model,
      available_models: config.available_models,
      api_key_format: config.api_key_format,
      features: config.features
    }))

    return c.json({
      success: true,
      data: providersArray,
      count: providersArray.length
    })

  } catch (error) {
    console.error('获取AI提供商列表异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 获取指定AI服务提供商的可用模型列表
app.get('/api/ai/providers/:provider/models', async (c) => {
  try {
    const provider = c.req.param('provider')

    const providerInfo = AI_PROVIDERS[provider]
    if (!providerInfo) {
      return c.json({
        success: false,
        error: `不支持的AI服务提供商: ${provider}`
      }, 400)
    }

    return c.json({
      success: true,
      data: {
        provider: provider,
        models: providerInfo.available_models,
        default_model: providerInfo.default_model,
        provider_info: {
          name: providerInfo.name,
          description: providerInfo.description,
          api_key_format: providerInfo.api_key_format,
          features: providerInfo.features
        }
      }
    })

  } catch (error) {
    console.error('获取AI模型列表异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// ==================== 拓扑生成核心功能 ====================

// 文本解析器类
class TextParser {
  constructor() {
    // 标准格式正则表达式（不区分大小写）
    // 标准格式: - 【环境】【数据中心】的【区域】【设备】连接【环境】【数据中心】的【区域】【设备】
    // 示例: - 【生产网】【亦庄】的【外联接入区】【路由器】连接【公司1办公网】【亦庄】的【核心区】【核心交换机】
    // 使用简化的正则表达式（测试中证明有效）
    this.topologyPattern = /【([^】]+)】【([^】]+)】的【([^】]+)】【([^】]+)】连接【([^】]+)】【([^】]+)】的【([^】]+)】【([^】]+)】/gi;

    // 设备类型映射
    this.deviceTypeMapping = {
      '防火墙': 'firewall',
      '负载均衡器': 'load_balancer',
      '服务器': 'server',
      '核心路由器': 'router',
      '汇聚交换机': 'switch',
      '接入交换机': 'switch',
      '核心交换机': 'switch'
    };

    // 区域类型映射
    this.areaTypeMapping = {
      '核心网络区': 'core',
      '核心区': 'core',
      '汇聚网络区': 'aggregation',
      '汇聚区': 'aggregation',
      '接入网络区': 'access',
      '接入区': 'access',
      'DMZ区': 'dmz',
      '管理区': 'management'
    };
  }

  // 验证文本格式
  validateTextFormat(textContent) {
    if (!textContent || typeof textContent !== 'string') {
      return {
        is_valid: false,
        errors: ['文本内容不能为空']
      };
    }

    const errors = [];
    const lines = textContent.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      errors.push('文本内容不能为空');
    }

    // 检查是否有有效的连接行
    let validConnections = 0;
    for (const line of lines) {
      if (this.topologyPattern.test(line)) {
        validConnections++;
      }
    }

    if (validConnections === 0) {
      errors.push('未找到有效的连接格式');
    }

    return {
      is_valid: errors.length === 0,
      errors: errors,
      valid_connections: validConnections
    };
  }

  // 提取文本中所有【】括号内的内容
  extractBracketContents(text) {
    const brackets = [];
    const regex = /【([^】]+)】/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      brackets.push(match[1]);
    }
    return brackets;
  }

  // 解析拓扑文本 - 新的分步解析法
  parseTopologyText(textContent) {
    const components = new Map();
    const connections = [];
    const regions = new Set();
    const environments = new Set();
    const datacenters = new Set();

    // 用于构建层级结构的映射
    const hierarchyMap = new Map(); // key: env-dc-area, value: {env, dc, area}

    const lines = textContent.split('\n');
    console.log('开始解析文本，总行数:', lines.length)

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.includes('连接')) {
        continue;
      }

      // 新的解析方法：提取所有【】内容
      const brackets = this.extractBracketContents(trimmedLine);
      console.log('提取的括号内容:', brackets);

      if (brackets.length >= 8) {
        // 标准格式：【环境】【数据中心】的【区域】【设备】连接【环境】【数据中心】的【区域】【设备】
        const env1 = brackets[0];
        const dc1 = brackets[1];
        const region1 = brackets[2];
        const device1 = brackets[3];
        const env2 = brackets[4];
        const dc2 = brackets[5];
        const region2 = brackets[6];
        const device2 = brackets[7];

        console.log('解析连接:', {
          source: `${env1}-${dc1}-${region1}-${device1}`,
          target: `${env2}-${dc2}-${region2}-${device2}`
        });

        // 处理源设备和目标设备
        const sourceEnv = env1;
        const sourceDc = dc1;
        const sourceRegion = region1;
        const sourceDevice = device1;

        // 处理目标设备
        const targetEnv = env2;
        const targetDc = dc2;
        const targetRegion = region2;
        const targetDevice = device2;

        // 添加到集合
        environments.add(sourceEnv);
        environments.add(targetEnv);
        datacenters.add(sourceDc);
        datacenters.add(targetDc);
        regions.add(`${sourceDc}-${sourceRegion}`);
        regions.add(`${targetDc}-${targetRegion}`);

        // 构建层级结构映射
        const sourceKey = `${sourceEnv}-${sourceDc}-${sourceRegion}`;
        const targetKey = `${targetEnv}-${targetDc}-${targetRegion}`;

        hierarchyMap.set(sourceKey, {
          environment: sourceEnv,
          datacenter: sourceDc,
          area: sourceRegion
        });

        hierarchyMap.set(targetKey, {
          environment: targetEnv,
          datacenter: targetDc,
          area: targetRegion
        });

        // 创建组件ID
        const sourceId = `${sourceEnv}-${sourceDc}-${sourceRegion}-${sourceDevice}`;
        const targetId = `${targetEnv}-${targetDc}-${targetRegion}-${targetDevice}`;

        // 添加组件
        if (!components.has(sourceId)) {
          components.set(sourceId, {
            id: sourceId,
            name: sourceDevice,
            type: this.getDeviceType(sourceDevice),
            environment: sourceEnv,
            datacenter: sourceDc,
            region: sourceRegion,
            area_type: this.getAreaType(sourceRegion)
          });
        }

        if (!components.has(targetId)) {
          components.set(targetId, {
            id: targetId,
            name: targetDevice,
            type: this.getDeviceType(targetDevice),
            environment: targetEnv,
            datacenter: targetDc,
            region: targetRegion,
            area_type: this.getAreaType(targetRegion)
          });
        }

        // 添加连接
        connections.push({
          id: `conn_${connections.length + 1}`,
          source: sourceId,
          target: targetId,
          source_name: sourceDevice,
          target_name: targetDevice,
          connection_type: 'network'
        });
      }
    }

    return {
      topology_name: '网络拓扑',
      components: Array.from(components.values()),
      connections: connections,
      regions: Array.from(regions).map(r => {
        const [datacenter, region] = r.split('-');
        return {
          id: r,
          name: region,
          datacenter: datacenter,
          area_type: this.getAreaType(region)
        };
      }),
      environments: this.buildEnvironmentHierarchy(hierarchyMap),
      datacenters: Array.from(datacenters),
      metadata: {
        parsed_at: new Date().toISOString(),
        component_count: components.size,
        connection_count: connections.length,
        region_count: regions.size,
        environment_count: environments.size,
        datacenter_count: datacenters.size,
        area_count: regions.size
      }
    };
  }

  // 构建环境层级结构
  buildEnvironmentHierarchy(hierarchyMap) {
    const envMap = new Map();

    // 遍历层级映射，构建环境->数据中心->区域的层级结构
    for (const [key, value] of hierarchyMap) {
      const { environment, datacenter, area } = value;

      // 获取或创建环境
      if (!envMap.has(environment)) {
        envMap.set(environment, {
          environment_name: environment,
          datacenters: new Map()
        });
      }

      const envObj = envMap.get(environment);

      // 获取或创建数据中心
      if (!envObj.datacenters.has(datacenter)) {
        envObj.datacenters.set(datacenter, {
          datacenter_name: datacenter,
          areas: new Map()
        });
      }

      const dcObj = envObj.datacenters.get(datacenter);

      // 添加区域
      if (!dcObj.areas.has(area)) {
        dcObj.areas.set(area, {
          area_name: area,
          area_type: this.getAreaType(area)
        });
      }
    }

    // 转换为数组格式
    const environments = [];
    for (const [envName, envObj] of envMap) {
      const datacenters = [];
      for (const [dcName, dcObj] of envObj.datacenters) {
        const areas = Array.from(dcObj.areas.values());
        datacenters.push({
          ...dcObj,
          areas: areas
        });
      }
      environments.push({
        ...envObj,
        datacenters: datacenters
      });
    }

    return environments;
  }

  // 获取设备类型
  getDeviceType(deviceName) {
    for (const [keyword, type] of Object.entries(this.deviceTypeMapping)) {
      if (deviceName.includes(keyword)) {
        return type;
      }
    }
    return 'unknown';
  }

  // 获取区域类型
  getAreaType(regionName) {
    for (const [keyword, type] of Object.entries(this.areaTypeMapping)) {
      if (regionName.includes(keyword)) {
        return type;
      }
    }
    return 'unknown';
  }
}

// DrawIO XML 生成器类
class DrawIOService {
  constructor() {
    // 节点样式配置
    this.nodeStyles = {
      router: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#2196F3',
        strokeWidth: '2',
        fontColor: '#1976D2',
        fontSize: '12',
        fontStyle: '1'
      },
      switch: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#4CAF50',
        strokeWidth: '2',
        fontColor: '#388E3C',
        fontSize: '12',
        fontStyle: '1'
      },
      firewall: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#F44336',
        strokeWidth: '2',
        fontColor: '#D32F2F',
        fontSize: '12',
        fontStyle: '1'
      },
      server: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#FF9800',
        strokeWidth: '2',
        fontColor: '#F57C00',
        fontSize: '12',
        fontStyle: '1'
      },
      load_balancer: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#9C27B0',
        strokeWidth: '2',
        fontColor: '#7B1FA2',
        fontSize: '12',
        fontStyle: '1'
      },
      unknown: {
        shape: 'rect',
        fillColor: 'none',
        strokeColor: '#607D8B',
        strokeWidth: '2',
        fontColor: '#455A64',
        fontSize: '12',
        fontStyle: '1'
      }
    };
  }

  // 生成 DrawIO XML
  generateXML(parsedData) {
    console.log('开始生成XML，输入数据:', {
      components_count: parsedData.components?.length || 0,
      connections_count: parsedData.connections?.length || 0,
      environments_count: parsedData.environments?.length || 0,
      data_keys: Object.keys(parsedData)
    });

    const components = parsedData.components || [];
    const connections = parsedData.connections || [];
    const environments = parsedData.environments || [];

    if (components.length === 0) {
      console.log('警告：没有组件数据，生成空白XML');
      return this.generateEmptyXML();
    }

    // 生成XML内容
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="TopFac-Generator" version="24.7.17" etag="topology-${Date.now()}">
  <diagram name="网络拓扑" id="topology-diagram">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1654" pageHeight="2339" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>`;

    let cellId = 2;
    const componentIds = new Map();

    // 生成层级结构：环境 → 数据中心 → 区域 → 设备
    if (environments.length > 0) {
      const result = this.generateHierarchicalStructure(environments, components, cellId, componentIds);
      xml += result.xml;
      cellId = result.nextCellId;
    } else {
      // 降级到简单布局
      const result = this.generateSimpleLayout(components, cellId, componentIds);
      xml += result.xml;
      cellId = result.nextCellId;
    }

    // 添加连接
    console.log('开始处理连接，连接数量:', connections.length);
    for (const connection of connections) {
      // 修复连接字段访问
      const sourceId = componentIds.get(connection.source_id || connection.source);
      const targetId = componentIds.get(connection.target_id || connection.target);

      console.log('处理连接:', {
        source: connection.source_id || connection.source,
        target: connection.target_id || connection.target,
        sourceId,
        targetId
      });

      if (sourceId && targetId) {
        xml += `
        <mxCell id="${cellId}" value="" style="endArrow=classic;html=1;rounded=0;" edge="1" parent="1" source="${sourceId}" target="${targetId}">
          <mxGeometry width="50" height="50" relative="1" as="geometry">
            <mxPoint x="390" y="340" as="sourcePoint"/>
            <mxPoint x="440" y="290" as="targetPoint"/>
          </mxGeometry>
        </mxCell>`;
        cellId++;
      }
    }

    xml += `
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

    console.log('XML生成完成，总长度:', xml.length);
    return xml;
  }

  // 生成空白XML
  generateEmptyXML() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="TopFac-Generator" version="24.7.17" etag="topology-${Date.now()}">
  <diagram name="网络拓扑" id="topology-diagram">
    <mxGraphModel dx="1422" dy="794" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
  }

  // 计算布局
  calculateLayout(components, connections) {
    const positions = new Map();
    const gridSize = 150;
    let x = 100, y = 100;
    let maxX = 0;

    console.log('计算布局，组件数量:', components.length);

    // 简单的网格布局
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const componentId = component.component_id || component.id || `comp_${i}`;

      positions.set(componentId, { x, y });
      console.log('设置组件位置:', { componentId, x, y });

      x += gridSize;
      maxX = Math.max(maxX, x);

      // 每行最多5个组件
      if ((i + 1) % 5 === 0) {
        x = 100;
        y += gridSize;
      }
    }

    console.log('布局计算完成，位置映射数量:', positions.size);
    return { positions, width: maxX, height: y + 100 };
  }

  // 生成层级结构：环境 → 数据中心 → 区域 → 设备
  generateHierarchicalStructure(environments, components, startCellId, componentIds) {
    let xml = '';
    let cellId = startCellId;
    let currentX = 30;
    let currentY = 30;

    console.log('生成层级结构，环境数量:', environments.length);

    for (const env of environments) {
      // 先计算所有数据中心的实际需要大小
      let totalDcWidth = 0;
      let maxDcHeight = 0;
      const dcSizes = [];

      for (const dc of env.datacenters) {
        // 计算区域的实际大小
        let totalAreaWidth = 0;
        let maxAreaHeight = 0;

        for (const area of dc.areas) {
          const areaComponents = components.filter(comp =>
            comp.environment === env.environment_name &&
            comp.datacenter === dc.datacenter_name &&
            comp.region === area.area_name
          );

          const devicesPerRow = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(areaComponents.length))));
          const rows = Math.ceil(areaComponents.length / devicesPerRow);

          const areaWidth = Math.max(80, devicesPerRow * 65 + 15);
          const areaHeight = Math.max(60, rows * 35 + 35);

          totalAreaWidth += areaWidth + 8;
          maxAreaHeight = Math.max(maxAreaHeight, areaHeight);
        }

        const dcWidth = Math.max(120, totalAreaWidth + 20);
        const dcHeight = Math.max(80, maxAreaHeight + 45);

        dcSizes.push({ width: dcWidth, height: dcHeight });
        totalDcWidth += dcWidth + 15;
        maxDcHeight = Math.max(maxDcHeight, dcHeight);
      }

      const envWidth = Math.max(200, totalDcWidth + 30);
      const envHeight = Math.max(120, maxDcHeight + 55);

      // 环境容器
      xml += `
        <mxCell id="${cellId}" value="${env.environment_name}" style="swimlane;whiteSpace=wrap;html=1;fillColor=#e1d5e7;strokeColor=#9673a6;fontStyle=1;fontSize=14;" vertex="1" parent="1">
          <mxGeometry x="${currentX}" y="${currentY}" width="${envWidth}" height="${envHeight}" as="geometry"/>
        </mxCell>`;

      const envCellId = cellId++;
      let dcX = 15;
      let dcY = 30;

      for (let i = 0; i < env.datacenters.length; i++) {
        const dc = env.datacenters[i];
        const dcSize = dcSizes[i];

        // 数据中心容器
        xml += `
        <mxCell id="${cellId}" value="${dc.datacenter_name}" style="swimlane;whiteSpace=wrap;html=1;fillColor=#d5e8d4;strokeColor=#82b366;fontStyle=1;fontSize=12;" vertex="1" parent="${envCellId}">
          <mxGeometry x="${dcX}" y="${dcY}" width="${dcSize.width}" height="${dcSize.height}" as="geometry"/>
        </mxCell>`;

        const dcCellId = cellId++;
        let areaX = 8;
        let areaY = 25;

        for (const area of dc.areas) {
          const areaComponents = components.filter(comp =>
            comp.environment === env.environment_name &&
            comp.datacenter === dc.datacenter_name &&
            comp.region === area.area_name
          );

          const devicesPerRow = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(areaComponents.length))));
          const rows = Math.ceil(areaComponents.length / devicesPerRow);

          const areaWidth = Math.max(80, devicesPerRow * 65 + 15);
          const areaHeight = Math.max(60, rows * 35 + 35);

          // 区域容器
          xml += `
        <mxCell id="${cellId}" value="${area.area_name}" style="swimlane;whiteSpace=wrap;html=1;fillColor=#fff2cc;strokeColor=#d6b656;fontStyle=1;fontSize=10;" vertex="1" parent="${dcCellId}">
          <mxGeometry x="${areaX}" y="${areaY}" width="${areaWidth}" height="${areaHeight}" as="geometry"/>
        </mxCell>`;

          const areaCellId = cellId++;

          // 在区域内添加设备
          let deviceX = 8;
          let deviceY = 25;
          let deviceIndex = 0;

          for (const component of areaComponents) {
            const componentId = component.id;
            const componentName = component.name || '未知设备';
            const componentType = component.type || 'unknown';

            const style = this.nodeStyles[componentType] || this.nodeStyles.unknown;
            const styleString = Object.entries(style)
              .map(([key, value]) => `${key}=${value}`)
              .join(';');

            xml += `
        <mxCell id="${cellId}" value="${componentName}" style="${styleString}" vertex="1" parent="${areaCellId}">
          <mxGeometry x="${deviceX}" y="${deviceY}" width="55" height="25" as="geometry"/>
        </mxCell>`;

            componentIds.set(componentId, cellId);
            cellId++;

            deviceIndex++;
            if (deviceIndex % devicesPerRow === 0) {
              deviceX = 8;
              deviceY += 30;
            } else {
              deviceX += 60;
            }
          }

          areaX += areaWidth + 8;
          if (areaX + areaWidth > dcSize.width - 15) {
            areaX = 8;
            areaY += areaHeight + 8;
          }
        }

        dcX += dcSize.width + 15;
        if (dcX + dcSize.width > envWidth - 30) {
          dcX = 15;
          dcY += dcSize.height + 15;
        }
      }

      currentX += envWidth + 30;
      if (currentX > 1200) {
        currentX = 30;
        currentY += envHeight + 30;
      }
    }

    return { xml, nextCellId: cellId };
  }

  // 简单布局（降级方案）
  generateSimpleLayout(components, startCellId, componentIds) {
    let xml = '';
    let cellId = startCellId;
    let x = 100, y = 100;
    const gridSize = 150;

    for (const component of components) {
      const componentId = component.id;
      const componentName = component.name || '未知设备';
      const componentType = component.type || 'unknown';

      const style = this.nodeStyles[componentType] || this.nodeStyles.unknown;
      const styleString = Object.entries(style)
        .map(([key, value]) => `${key}=${value}`)
        .join(';');

      xml += `
        <mxCell id="${cellId}" value="${componentName}" style="${styleString}" vertex="1" parent="1">
          <mxGeometry x="${x}" y="${y}" width="120" height="60" as="geometry"/>
        </mxCell>`;

      componentIds.set(componentId, cellId);
      cellId++;

      x += gridSize;
      if ((cellId - startCellId) % 5 === 0) {
        x = 100;
        y += gridSize;
      }
    }

    return { xml, nextCellId: cellId };
  }
}

// ==================== 拓扑生成 API 接口 ====================

// 生成拓扑XML
app.post('/api/generate', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const data = await c.req.json()
    if (!data || !data.parsed_data) {
      return c.json({
        success: false,
        error: '请求数据不能为空，需要 parsed_data 字段'
      }, 400)
    }

    console.log('开始生成拓扑XML:', {
      component_count: data.parsed_data.components?.length || 0,
      connection_count: data.parsed_data.connections?.length || 0
    })

    // 生成XML
    const drawioService = new DrawIOService()
    const xmlContent = drawioService.generateXML(data.parsed_data)

    console.log('拓扑XML生成成功:', {
      xml_length: xmlContent.length
    })

    return c.json({
      success: true,
      data: {
        xml_content: xmlContent,
        xml_length: xmlContent.length
      },
      message: 'XML生成成功'
    })

  } catch (error) {
    console.error('生成拓扑XML异常:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 处理完整工作流（简化版）
app.post('/api/projects/:id/process-workflow', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const projectId = c.req.param('id')
    const data = await c.req.json()

    if (!data || !data.text_content) {
      return c.json({
        success: false,
        error: '缺少text_content参数'
      }, 400)
    }

    // 检查项目是否存在
    const project = await db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first()

    if (!project) {
      return c.json({
        success: false,
        error: '项目不存在'
      }, 404)
    }

    const textContent = data.text_content
    console.log('开始处理工作流:', {
      project_id: projectId,
      text_length: textContent.length
    })

    // 1. 文本解析
    const parser = new TextParser()

    // 验证文本格式
    const validationResult = parser.validateTextFormat(textContent)
    if (!validationResult.is_valid) {
      return c.json({
        success: false,
        error: `文本格式验证失败: ${validationResult.errors.join(', ')}`
      }, 400)
    }

    // 解析文本
    const parsedData = parser.parseTopologyText(textContent)

    // 2. 生成XML
    const drawioService = new DrawIOService()
    const xmlContent = drawioService.generateXML(parsedData)

    // 3. 创建新版本
    const versionId = `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    // 获取当前最大版本号
    const maxVersionResult = await db.prepare(`
      SELECT MAX(version) as max_version FROM project_versions WHERE project_id = ?
    `).bind(projectId).first()

    const nextVersion = (maxVersionResult?.max_version || 0) + 1

    // 插入新版本
    await db.prepare(`
      INSERT INTO project_versions (id, project_id, version, text_content, parsed_data, xml_content, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'generated', ?)
    `).bind(versionId, projectId, nextVersion, textContent, JSON.stringify(parsedData), xmlContent, now).run()

    // 更新项目的当前版本
    await db.prepare(`
      UPDATE projects SET current_version = ? WHERE id = ?
    `).bind(nextVersion, projectId).run()

    console.log('工作流处理成功:', {
      project_id: projectId,
      version_id: versionId,
      version: nextVersion
    })

    return c.json({
      success: true,
      data: {
        _id: versionId,          // 前端期望的主要字段
        id: versionId,           // 兼容性
        version_id: versionId,   // 兼容性
        version: nextVersion,
        version_number: nextVersion,  // 前端可能期望这个字段名
        project_id: projectId,   // 添加项目ID
        status: 'generated',     // 添加状态
        xml_content: xmlContent, // 添加 XML 内容
        xml_length: xmlContent.length,
        parsed_data: parsedData, // 添加解析数据
        message: '拓扑图生成成功'
      }
    })

  } catch (error) {
    console.error('工作流处理失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 完整的项目工作流处理（与 Python 后端一致）
app.post('/api/projects/:id/process', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const projectId = c.req.param('id')
    const data = await c.req.json()

    // 支持两种参数名：topology_text 和 text_content
    const textContent = data?.topology_text || data?.text_content

    if (!data || !textContent) {
      return c.json({
        success: false,
        error: '文本内容不能为空'
      }, 400)
    }

    console.log('开始处理项目工作流:', {
      project_id: projectId,
      text_length: textContent.length
    })

    // 步骤1: 创建新版本
    console.log('步骤1: 创建新版本')

    // 获取当前最大版本号
    const maxVersionResult = await db.prepare(`
      SELECT MAX(version) as max_version FROM project_versions WHERE project_id = ?
    `).bind(projectId).first()

    const nextVersion = (maxVersionResult?.max_version || 0) + 1
    const versionId = `version_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const now = new Date().toISOString()

    // 插入新版本记录
    await db.prepare(`
      INSERT INTO project_versions (id, project_id, version, text_content, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).bind(versionId, projectId, nextVersion, textContent, now).run()

    console.log('版本创建成功:', {
      project_id: projectId,
      version_id: versionId,
      version: nextVersion
    })

    // 初始化步骤状态
    const stepsStatus = [
      { step_name: 'validation', status: 'pending', started_at: null, completed_at: null },
      { step_name: 'local_parsing', status: 'pending', started_at: null, completed_at: null },
      { step_name: 'data_processing', status: 'pending', started_at: null, completed_at: null },
      { step_name: 'xml_generation', status: 'pending', started_at: null, completed_at: null }
    ]

    // 步骤1: 验证格式
    console.log('步骤1: 验证格式')
    stepsStatus[0].status = 'processing'
    stepsStatus[0].started_at = new Date().toISOString()

    // 文本预处理：保持原始格式
    const processedText = textContent.trim()
    console.log('文本预处理完成: 保持原始格式')

    // 验证文本格式
    const parser = new TextParser()
    const validationResult = parser.validateTextFormat(processedText)

    if (!validationResult.is_valid) {
      console.warn('文本格式验证失败:', validationResult.errors)
      return c.json({
        success: false,
        error: '文本格式不正确',
        validation_result: validationResult
      }, 400)
    }

    // 验证完成
    stepsStatus[0].status = 'completed'
    stepsStatus[0].completed_at = new Date().toISOString()

    // 步骤2: 本地解析
    console.log('步骤2: 本地解析')
    stepsStatus[1].status = 'processing'
    stepsStatus[1].started_at = new Date().toISOString()

    // 解析文本
    const parsedData = parser.parseTopologyText(processedText)
    const componentCount = parsedData.components?.length || 0
    const connectionCount = parsedData.connections?.length || 0
    const regionCount = parsedData.regions?.length || 0

    console.log('本地文本解析完成:', {
      project_id: projectId,
      components: componentCount,
      connections: connectionCount,
      regions: regionCount
    })

    // 本地解析完成
    stepsStatus[1].status = 'completed'
    stepsStatus[1].completed_at = new Date().toISOString()

    // 步骤3: 数据处理
    console.log('步骤3: 数据处理')
    stepsStatus[2].status = 'processing'
    stepsStatus[2].started_at = new Date().toISOString()

    // 保存解析数据
    await db.prepare(`
      UPDATE project_versions
      SET parsed_data = ?, status = 'parsed'
      WHERE id = ?
    `).bind(JSON.stringify(parsedData), versionId).run()

    console.log('解析数据保存成功:', {
      project_id: projectId,
      version_id: versionId
    })

    // 数据处理完成
    stepsStatus[2].status = 'completed'
    stepsStatus[2].completed_at = new Date().toISOString()

    // 步骤4: XML生成
    console.log('步骤4: XML生成')
    stepsStatus[3].status = 'processing'
    stepsStatus[3].started_at = new Date().toISOString()

    // 生成XML
    const drawioService = new DrawIOService()
    const xmlContent = drawioService.generateXML(parsedData)

    console.log('XML生成完成:', {
      project_id: projectId,
      version_id: versionId,
      xml_length: xmlContent.length
    })

    // 保存XML内容
    await db.prepare(`
      UPDATE project_versions
      SET xml_content = ?, status = 'generated'
      WHERE id = ?
    `).bind(xmlContent, versionId).run()

    console.log('XML内容保存成功:', {
      project_id: projectId,
      version_id: versionId
    })

    // XML生成完成
    stepsStatus[3].status = 'completed'
    stepsStatus[3].completed_at = new Date().toISOString()

    // 更新项目的当前版本
    await db.prepare(`
      UPDATE projects SET current_version = ? WHERE id = ?
    `).bind(nextVersion, projectId).run()

    console.log('项目工作流处理完成:', {
      project_id: projectId,
      version_id: versionId,
      version: nextVersion,
      steps_completed: stepsStatus.filter(s => s.status === 'completed').length
    })

    return c.json({
      success: true,
      data: {
        _id: versionId,          // 前端期望的主要字段
        id: versionId,           // 兼容性
        version_id: versionId,   // 兼容性
        version: nextVersion,
        version_number: nextVersion,  // 前端可能期望这个字段名
        steps_status: stepsStatus,
        parsed_data: parsedData,
        xml_content: xmlContent,  // 添加 XML 内容
        xml_length: xmlContent.length,
        project_id: projectId,   // 添加项目ID
        status: 'generated',     // 添加状态
        message: '项目工作流处理完成'
      }
    })

  } catch (error) {
    console.error('项目工作流处理失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// ==================== 文件下载功能 ====================

// 通过版本ID下载（前端可能直接调用这个）
app.get('/api/projects/:project_id/versions/:version_id/download', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const projectId = c.req.param('project_id')
    const versionId = c.req.param('version_id')

    console.log('通过项目和版本ID下载:', { project_id: projectId, version_id: versionId })

    // 获取版本信息
    const version = await db.prepare(`
      SELECT pv.*, p.project_name
      FROM project_versions pv
      LEFT JOIN projects p ON pv.project_id = p.id
      WHERE pv.id = ? AND pv.project_id = ?
    `).bind(versionId, projectId).first()

    if (!version) {
      console.warn('版本不存在:', { project_id: projectId, version_id: versionId })
      return c.json({
        success: false,
        error: '版本不存在'
      }, 404)
    }

    if (!version.xml_content) {
      console.warn('版本尚未生成拓扑图:', { version_id: versionId })
      return c.json({
        success: false,
        error: '该版本尚未生成拓扑图'
      }, 404)
    }

    // 创建文件名
    const projectName = version.project_name || 'topology'
    const filename = `${projectName}_v${version.version}.drawio`
    const xmlContent = version.xml_content

    console.log('通过项目和版本ID下载成功:', {
      project_id: projectId,
      version_id: versionId,
      filename: filename,
      xml_length: xmlContent.length
    })

    // 返回文件下载响应
    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': xmlContent.length.toString()
      }
    })

  } catch (error) {
    console.error('通过项目和版本ID下载失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 下载项目最新版本的拓扑文件
app.get('/api/projects/:id/download', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const projectId = c.req.param('id')

    console.log('开始下载项目拓扑文件:', { project_id: projectId })

    // 检查项目是否存在
    const project = await db.prepare(`
      SELECT * FROM projects WHERE id = ?
    `).bind(projectId).first()

    if (!project) {
      console.warn('项目不存在:', { project_id: projectId })
      return c.json({
        success: false,
        error: '项目不存在'
      }, 404)
    }

    // 获取最新版本的XML内容
    const latestVersion = await db.prepare(`
      SELECT * FROM project_versions
      WHERE project_id = ? AND xml_content IS NOT NULL
      ORDER BY version DESC
      LIMIT 1
    `).bind(projectId).first()

    if (!latestVersion || !latestVersion.xml_content) {
      console.warn('项目尚未生成拓扑图:', { project_id: projectId })
      return c.json({
        success: false,
        error: '项目尚未生成拓扑图'
      }, 404)
    }

    // 创建文件名
    const filename = `${project.project_name}_topology.drawio`
    const xmlContent = latestVersion.xml_content

    console.log('项目拓扑文件下载成功:', {
      project_id: projectId,
      filename: filename,
      xml_length: xmlContent.length
    })

    // 返回文件下载响应
    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': xmlContent.length.toString()
      }
    })

  } catch (error) {
    console.error('下载项目拓扑文件失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 按版本ID下载拓扑文件
app.get('/api/download/:version_id', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const versionId = c.req.param('version_id')

    console.log('开始下载版本拓扑文件:', { version_id: versionId })

    // 获取版本信息
    const version = await db.prepare(`
      SELECT pv.*, p.project_name
      FROM project_versions pv
      LEFT JOIN projects p ON pv.project_id = p.id
      WHERE pv.id = ?
    `).bind(versionId).first()

    if (!version) {
      console.warn('版本不存在:', { version_id: versionId })
      return c.json({
        success: false,
        error: '版本不存在'
      }, 404)
    }

    if (!version.xml_content) {
      console.warn('版本尚未生成拓扑图:', { version_id: versionId })
      return c.json({
        success: false,
        error: '该版本尚未生成拓扑图'
      }, 404)
    }

    // 创建文件名
    const projectName = version.project_name || 'topology'
    const filename = `${projectName}_v${version.version}.drawio`
    const xmlContent = version.xml_content

    console.log('版本拓扑文件下载成功:', {
      version_id: versionId,
      filename: filename,
      xml_length: xmlContent.length
    })

    // 返回文件下载响应
    return new Response(xmlContent, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': xmlContent.length.toString()
      }
    })

  } catch (error) {
    console.error('下载版本拓扑文件失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// ==================== 版本管理功能 ====================

// 获取版本详情
app.get('/api/versions/:version_id', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const versionId = c.req.param('version_id')

    console.log('获取版本详情:', { version_id: versionId })

    // 获取版本信息，包含项目信息
    const version = await db.prepare(`
      SELECT
        pv.*,
        p.project_name,
        p.description as project_description,
        p.status as project_status
      FROM project_versions pv
      LEFT JOIN projects p ON pv.project_id = p.id
      WHERE pv.id = ?
    `).bind(versionId).first()

    if (!version) {
      console.warn('版本不存在:', { version_id: versionId })
      return c.json({
        success: false,
        error: '版本不存在'
      }, 404)
    }

    // 解析 parsed_data 字段
    let parsedData = null
    if (version.parsed_data) {
      try {
        parsedData = JSON.parse(version.parsed_data)
      } catch (e) {
        console.warn('解析 parsed_data 失败:', e)
      }
    }

    // 构建返回数据
    const versionData = {
      _id: version.id,         // 前端期望的主要字段
      id: version.id,          // 兼容性
      project_id: version.project_id,
      version: version.version,
      text_content: version.text_content,
      parsed_data: parsedData,
      xml_content: version.xml_content,
      status: version.status,
      created_at: version.created_at,
      project_name: version.project_name,
      project_description: version.project_description,
      project_status: version.project_status
    }

    console.log('版本详情获取成功:', {
      version_id: versionId,
      version: version.version,
      status: version.status
    })

    return c.json({
      success: true,
      data: versionData
    })

  } catch (error) {
    console.error('获取版本详情失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 获取项目版本列表
app.get('/api/projects/:id/versions', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const projectId = c.req.param('id')
    const page = parseInt(c.req.query('page') || '1')
    const limit = parseInt(c.req.query('limit') || '10')
    const offset = (page - 1) * limit

    console.log('获取项目版本列表:', {
      project_id: projectId,
      page,
      limit
    })

    // 获取版本列表
    const versions = await db.prepare(`
      SELECT * FROM project_versions
      WHERE project_id = ?
      ORDER BY version DESC
      LIMIT ? OFFSET ?
    `).bind(projectId, limit, offset).all()

    // 获取总数
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total FROM project_versions WHERE project_id = ?
    `).bind(projectId).first()

    const total = totalResult?.total || 0
    const totalPages = Math.ceil(total / limit)

    // 解析每个版本的 parsed_data
    const versionsWithParsedData = versions.results.map(version => {
      let parsedData = null
      if (version.parsed_data) {
        try {
          // 如果已经是对象，直接使用；如果是字符串，解析它
          parsedData = typeof version.parsed_data === 'string'
            ? JSON.parse(version.parsed_data)
            : version.parsed_data
        } catch (e) {
          console.warn('解析版本 parsed_data 失败:', e)
        }
      }

      // 创建新对象，确保 _id 字段正确设置
      const versionData = {
        id: version.id,
        project_id: version.project_id,
        version: version.version,
        text_content: version.text_content,
        xml_content: version.xml_content,
        status: version.status,
        created_at: version.created_at,
        parsed_data: parsedData,
        _id: version.id     // 前端期望的主要字段
      }
      return versionData
    })

    console.log('项目版本列表获取成功:', {
      project_id: projectId,
      count: versionsWithParsedData.length,
      total
    })

    return c.json({
      success: true,
      data: {
        versions: versionsWithParsedData,
        pagination: {
          page,
          limit,
          total,
          pages: totalPages  // 修复字段名，前端期望 'pages' 而不是 'total_pages'
        }
      }
    })

  } catch (error) {
    console.error('获取项目版本列表失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 删除版本
app.delete('/api/versions/:version_id', async (c) => {
  try {
    const db = c.env.DB
    await initDatabase(db)

    const versionId = c.req.param('version_id')

    console.log('开始删除版本:', { version_id: versionId })

    // 检查版本是否存在
    const version = await db.prepare(`
      SELECT * FROM project_versions WHERE id = ?
    `).bind(versionId).first()

    if (!version) {
      console.warn('版本不存在:', { version_id: versionId })
      return c.json({
        success: false,
        error: '版本不存在'
      }, 404)
    }

    // 检查是否是项目的唯一版本
    const versionCount = await db.prepare(`
      SELECT COUNT(*) as count FROM project_versions WHERE project_id = ?
    `).bind(version.project_id).first()

    if (versionCount.count <= 1) {
      console.warn('无法删除项目的唯一版本:', {
        version_id: versionId,
        project_id: version.project_id
      })
      return c.json({
        success: false,
        error: '无法删除项目的唯一版本'
      }, 400)
    }

    // 删除版本
    const deleteResult = await db.prepare(`
      DELETE FROM project_versions WHERE id = ?
    `).bind(versionId).run()

    if (deleteResult.changes === 0) {
      console.warn('版本删除失败:', { version_id: versionId })
      return c.json({
        success: false,
        error: '版本删除失败'
      }, 500)
    }

    console.log('版本删除成功:', {
      version_id: versionId,
      project_id: version.project_id,
      version: version.version
    })

    return c.json({
      success: true,
      message: '版本删除成功'
    })

  } catch (error) {
    console.error('删除版本失败:', error)
    return c.json({
      success: false,
      error: `服务器内部错误: ${error.message}`
    }, 500)
  }
})

// 静态文件处理 - 放在最后，作为 fallback
app.get('*', handleStaticFiles)

// 错误处理
app.onError((err, c) => {
  console.error('API Error:', err)
  return c.json({
    success: false,
    error: '服务器内部错误'
  }, 500)
})

export default app

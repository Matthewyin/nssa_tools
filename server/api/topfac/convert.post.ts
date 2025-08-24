export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text, provider = 'gemini', apiKey } = body

    if (!text || !apiKey) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要参数'
      })
    }

    // AI转换提示词
    const prompt = `你是一个网络拓扑分析专家。请将以下自然语言描述转换为标准化的网络拓扑结构描述。

输入文本：
${text}

请按照以下格式输出：

环境: [环境名称]
数据中心: [数据中心名称]
网络区域: [区域名称]
设备:
  - [设备名称] (类型: [设备类型])
  - [设备名称] (类型: [设备类型])
连接:
  - [设备1] <-> [设备2]
  - [设备1] <-> [设备3]

要求：
1. 识别出所有的网络设备（路由器、交换机、服务器等）
2. 明确设备之间的连接关系
3. 按照层次结构组织（环境 > 数据中心 > 网络区域 > 设备）
4. 使用标准的网络设备类型名称
5. 连接关系用 <-> 表示双向连接

请直接输出转换结果，不要包含其他解释文字。`

    let result = ''

    if (provider === 'gemini') {
      // 调用 Gemini API
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw createError({
          statusCode: response.status,
          statusMessage: `Gemini API错误: ${errorData.error?.message || '未知错误'}`
        })
      }

      const data = await response.json()
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    } else if (provider === 'deepseek') {
      // 调用 DeepSeek API
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2048
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw createError({
          statusCode: response.status,
          statusMessage: `DeepSeek API错误: ${errorData.error?.message || '未知错误'}`
        })
      }

      const data = await response.json()
      result = data.choices?.[0]?.message?.content || ''
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: '不支持的AI提供商'
      })
    }

    if (!result) {
      throw createError({
        statusCode: 500,
        statusMessage: 'AI转换失败，未获得有效响应'
      })
    }

    return {
      success: true,
      result: result.trim()
    }

  } catch (error: any) {
    console.error('AI转换错误:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'AI转换服务异常'
    })
  }
})

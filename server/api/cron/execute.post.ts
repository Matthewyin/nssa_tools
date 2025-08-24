export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { taskId, url, method = 'POST', headers = {}, requestBody } = body

    if (!taskId || !url) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必要参数: taskId 和 url'
      })
    }

    console.log(`[CRON] 执行任务 ${taskId}: ${method} ${url}`)

    // 构建请求选项
    const requestOptions: RequestInit = {
      method,
      headers: {
        'User-Agent': 'NSSA-Tools-Cron/2.0',
        'Content-Type': 'application/json',
        ...headers
      }
    }

    // 添加请求体（如果不是GET请求）
    if (method !== 'GET' && requestBody) {
      requestOptions.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
    }

    // 设置超时
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
    requestOptions.signal = controller.signal

    const startTime = Date.now()
    
    try {
      // 执行HTTP请求
      const response = await fetch(url, requestOptions)
      clearTimeout(timeoutId)
      
      const endTime = Date.now()
      const duration = endTime - startTime

      // 读取响应内容（限制大小）
      let responseText = ''
      try {
        const text = await response.text()
        responseText = text.length > 1000 ? text.substring(0, 1000) + '...' : text
      } catch (err) {
        responseText = '无法读取响应内容'
      }

      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        duration,
        responseText,
        timestamp: new Date().toISOString()
      }

      console.log(`[CRON] 任务 ${taskId} 执行完成:`, {
        status: response.status,
        duration: `${duration}ms`,
        success: response.ok
      })

      return {
        success: true,
        execution: result
      }

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      const errorMessage = fetchError.name === 'AbortError' 
        ? '请求超时' 
        : fetchError.message || '网络请求失败'

      console.error(`[CRON] 任务 ${taskId} 执行失败:`, errorMessage)

      return {
        success: false,
        execution: {
          success: false,
          status: 0,
          statusText: errorMessage,
          duration: Date.now() - startTime,
          responseText: '',
          timestamp: new Date().toISOString()
        }
      }
    }

  } catch (error: any) {
    console.error('[CRON] 任务执行API错误:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: error.message || '任务执行服务异常'
    })
  }
})

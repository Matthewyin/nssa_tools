/**
 * 统一错误处理 Composable
 * 提供统一的错误处理、错误状态管理、用户通知和友好的错误提示功能
 * 合并了原 utils/error-handler.ts 的所有功能
 */

import { ref, readonly } from 'vue'

// 错误类型枚举（来自 utils/error-handler.ts）
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_KEY_ERROR = 'API_KEY_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误严重级别（来自 utils/error-handler.ts）
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 通知类型（来自 utils/error-handler.ts）
export enum NotificationType {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// 错误信息接口（来自 utils/error-handler.ts）
export interface ErrorInfo {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: string
  code?: string
  timestamp: string
  context?: Record<string, any>
}

// 通知接口（来自 utils/error-handler.ts）
export interface NotificationInfo {
  type: NotificationType
  title: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

// 原有的简单错误类型定义（保持向后兼容）
interface AppError {
  id: string
  type: 'api' | 'validation' | 'network' | 'unknown'
  message: string
  details?: any
  timestamp: Date
  action?: string
}

// 全局错误状态
const errors = ref<AppError[]>([])
const isGlobalLoading = ref(false)

// 通知回调函数（用于 ErrorHandler 类功能）
let notificationCallback: ((notification: NotificationInfo) => void) | null = null

// 错误消息映射
const errorMessages = {
  // 网络错误
  'ERR_NETWORK': '网络连接失败，请检查网络设置',
  'ERR_TIMEOUT': '请求超时，请稍后重试',
  'ERR_CONNECTION_REFUSED': '无法连接到服务器，请稍后重试',
  
  // API错误
  '400': '请求参数错误',
  '401': '未授权访问，请重新登录',
  '403': '权限不足，无法访问该资源',
  '404': '请求的资源不存在',
  '500': '服务器内部错误，请稍后重试',
  '502': '网关错误，请稍后重试',
  '503': '服务暂时不可用，请稍后重试',
  
  // 默认错误
  'default': '操作失败，请稍后重试'
}

export const useErrorHandlerComposable = () => {
  /**
   * 添加错误
   */
  const addError = (error: Partial<AppError>) => {
    const newError: AppError = {
      id: Date.now().toString(),
      type: error.type || 'unknown',
      message: error.message || '未知错误',
      details: error.details,
      timestamp: new Date(),
      action: error.action,
      ...error
    }
    
    errors.value.push(newError)
    
    // 自动清除错误（5秒后）
    setTimeout(() => {
      removeError(newError.id)
    }, 5000)
    
    return newError.id
  }

  /**
   * 移除错误
   */
  const removeError = (errorId: string) => {
    const index = errors.value.findIndex(error => error.id === errorId)
    if (index > -1) {
      errors.value.splice(index, 1)
    }
  }

  /**
   * 清除所有错误
   */
  const clearErrors = () => {
    errors.value = []
  }

  /**
   * 处理API错误
   */
  const handleApiError = (error: any, action?: string) => {
    console.error('API错误:', error)
    
    let message = errorMessages.default
    let type: AppError['type'] = 'api'
    
    if (error.response) {
      // 服务器响应错误
      const status = error.response.status.toString()
      message = errorMessages[status as keyof typeof errorMessages] || `服务器错误 (${status})`
    } else if (error.request) {
      // 网络错误
      type = 'network'
      if (error.code) {
        message = errorMessages[error.code as keyof typeof errorMessages] || errorMessages.default
      } else {
        message = '网络请求失败，请检查网络连接'
      }
    } else {
      // 其他错误
      message = error.message || errorMessages.default
    }
    
    return addError({
      type,
      message,
      details: error,
      action
    })
  }

  /**
   * 处理验证错误
   */
  const handleValidationError = (message: string, details?: any) => {
    return addError({
      type: 'validation',
      message,
      details
    })
  }

  /**
   * 设置全局加载状态
   */
  const setGlobalLoading = (loading: boolean) => {
    isGlobalLoading.value = loading
  }

  /**
   * 包装异步操作，自动处理加载状态和错误
   */
  const withErrorHandling = async <T>(
    operation: () => Promise<T>,
    options?: {
      loadingMessage?: string
      successMessage?: string
      errorAction?: string
      showGlobalLoading?: boolean
    }
  ): Promise<T | null> => {
    try {
      if (options?.showGlobalLoading !== false) {
        setGlobalLoading(true)
      }
      
      const result = await operation()
      
      if (options?.successMessage) {
        // 可以在这里添加成功提示
        console.log(options.successMessage)
      }
      
      return result
    } catch (error) {
      handleApiError(error, options?.errorAction)
      return null
    } finally {
      if (options?.showGlobalLoading !== false) {
        setGlobalLoading(false)
      }
    }
  }

  /**
   * 重试操作
   */
  const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) {
          handleApiError(error, `重试${maxRetries}次后仍然失败`)
          return null
        }

        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
    return null
  }

  // ===== 以下是来自 utils/error-handler.ts 的 ErrorHandler 类功能 =====

  /**
   * 设置通知回调函数
   * @param callback 通知回调
   */
  const setNotificationCallback = (callback: (notification: NotificationInfo) => void): void => {
    notificationCallback = callback
  }

  /**
   * 解析错误对象（来自 utils/error-handler.ts）
   * @param error 错误对象
   * @param context 上下文信息
   * @returns 错误信息
   */
  const parseError = (error: any, context?: Record<string, any>): ErrorInfo => {
    let type = ErrorType.UNKNOWN_ERROR
    let severity = ErrorSeverity.MEDIUM
    let message = '发生未知错误'
    let details = ''
    let code = ''

    if (error?.response) {
      // HTTP错误
      const status = error.response.status
      const data = error.response.data

      if (status === 401 || status === 403) {
        type = ErrorType.API_KEY_ERROR
        severity = ErrorSeverity.HIGH
        message = 'API密钥无效或权限不足'
        details = data?.error || '请检查API密钥是否正确'
      } else if (status === 429) {
        type = ErrorType.RATE_LIMIT_ERROR
        severity = ErrorSeverity.MEDIUM
        message = 'API调用频率超限'
        details = '请稍后再试或检查API配额'
      } else if (status >= 500) {
        type = ErrorType.AI_SERVICE_ERROR
        severity = ErrorSeverity.HIGH
        message = 'AI服务暂时不可用'
        details = '服务器内部错误，请稍后重试'
      } else if (status >= 400) {
        type = ErrorType.VALIDATION_ERROR
        severity = ErrorSeverity.MEDIUM
        message = '请求参数错误'
        details = data?.error || '请检查输入参数'
      }

      code = status.toString()
    } else if (error?.code) {
      // 网络错误
      if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
        type = ErrorType.NETWORK_ERROR
        severity = ErrorSeverity.HIGH
        message = '网络连接失败'
        details = '请检查网络连接或稍后重试'
      } else if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED') {
        type = ErrorType.TIMEOUT_ERROR
        severity = ErrorSeverity.MEDIUM
        message = '请求超时'
        details = '网络响应较慢，请稍后重试'
      }

      code = error.code
    } else if (error?.message) {
      // 自定义错误
      message = error.message
      details = error.details || ''

      if (error.message.includes('API Key')) {
        type = ErrorType.API_KEY_ERROR
        severity = ErrorSeverity.HIGH
      } else if (error.message.includes('格式') || error.message.includes('验证')) {
        type = ErrorType.VALIDATION_ERROR
        severity = ErrorSeverity.MEDIUM
      }
    }

    return {
      type,
      severity,
      message,
      details,
      code,
      timestamp: new Date().toISOString(),
      context
    }
  }

  /**
   * 记录错误日志
   * @param errorInfo 错误信息
   */
  const logError = (errorInfo: ErrorInfo): void => {
    const logLevel = getLogLevel(errorInfo.severity)
    const logMessage = `[${errorInfo.type}] ${errorInfo.message}`

    if (logLevel === 'error') {
      console.error(logMessage, errorInfo)
    } else if (logLevel === 'warn') {
      console.warn(logMessage, errorInfo)
    } else {
      console.log(logMessage, errorInfo)
    }
  }

  /**
   * 获取日志级别
   * @param severity 错误严重级别
   * @returns 日志级别
   */
  const getLogLevel = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error'
      case ErrorSeverity.MEDIUM:
        return 'warn'
      case ErrorSeverity.LOW:
        return 'log'
      default:
        return 'log'
    }
  }

  /**
   * 获取错误标题
   * @param type 错误类型
   * @returns 错误标题
   */
  const getErrorTitle = (type: ErrorType): string => {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return '网络错误'
      case ErrorType.API_KEY_ERROR:
        return 'API密钥错误'
      case ErrorType.VALIDATION_ERROR:
        return '输入错误'
      case ErrorType.AI_SERVICE_ERROR:
        return 'AI服务错误'
      case ErrorType.RATE_LIMIT_ERROR:
        return '频率限制'
      case ErrorType.TIMEOUT_ERROR:
        return '请求超时'
      default:
        return '系统错误'
    }
  }

  /**
   * 获取通知持续时间
   * @param severity 错误严重级别
   * @returns 持续时间（毫秒）
   */
  const getNotificationDuration = (severity: ErrorSeverity): number => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 3000
      case ErrorSeverity.MEDIUM:
        return 5000
      case ErrorSeverity.HIGH:
        return 8000
      case ErrorSeverity.CRITICAL:
        return 0 // 持久显示
      default:
        return 5000
    }
  }

  /**
   * 判断是否可以重试
   * @param type 错误类型
   * @returns 是否可以重试
   */
  const canRetry = (type: ErrorType): boolean => {
    return [
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR,
      ErrorType.AI_SERVICE_ERROR
    ].includes(type)
  }

  /**
   * 显示错误通知
   * @param errorInfo 错误信息
   */
  const showErrorNotification = (errorInfo: ErrorInfo): void => {
    if (!notificationCallback) return

    const notification: NotificationInfo = {
      type: NotificationType.ERROR,
      title: getErrorTitle(errorInfo.type),
      message: errorInfo.message,
      duration: getNotificationDuration(errorInfo.severity),
      persistent: errorInfo.severity === ErrorSeverity.CRITICAL
    }

    // 添加重试操作（如果适用）
    if (canRetry(errorInfo.type)) {
      notification.actions = [
        {
          label: '重试',
          action: () => {
            // 这里可以触发重试逻辑
            console.log('用户选择重试')
          }
        }
      ]
    }

    notificationCallback(notification)
  }

  /**
   * 处理错误（来自 utils/error-handler.ts 的主要方法）
   * @param error 错误对象
   * @param context 上下文信息
   */
  const handleError = (error: any, context?: Record<string, any>): ErrorInfo => {
    const errorInfo = parseError(error, context)

    // 记录错误日志
    logError(errorInfo)

    // 显示用户通知
    showErrorNotification(errorInfo)

    return errorInfo
  }

  /**
   * 显示成功通知
   * @param message 消息内容
   * @param title 标题
   */
  const showSuccess = (message: string, title: string = '操作成功'): void => {
    if (!notificationCallback) return

    notificationCallback({
      type: NotificationType.SUCCESS,
      title,
      message,
      duration: 3000
    })
  }

  /**
   * 显示信息通知
   * @param message 消息内容
   * @param title 标题
   */
  const showInfo = (message: string, title: string = '提示'): void => {
    if (!notificationCallback) return

    notificationCallback({
      type: NotificationType.INFO,
      title,
      message,
      duration: 4000
    })
  }

  /**
   * 显示警告通知
   * @param message 消息内容
   * @param title 标题
   */
  const showWarning = (message: string, title: string = '警告'): void => {
    if (!notificationCallback) return

    notificationCallback({
      type: NotificationType.WARNING,
      title,
      message,
      duration: 5000
    })
  }

  return {
    // 状态
    errors: readonly(errors),
    isGlobalLoading: readonly(isGlobalLoading),

    // 原有方法（保持向后兼容）
    addError,
    removeError,
    clearErrors,
    handleApiError,
    handleValidationError,
    setGlobalLoading,
    withErrorHandling,
    retryOperation,

    // 新增方法（来自 utils/error-handler.ts）
    setNotificationCallback,
    parseError,
    logError,
    getLogLevel,
    getErrorTitle,
    getNotificationDuration,
    canRetry,
    showErrorNotification,
    handleError,
    showSuccess,
    showInfo,
    showWarning
  }
}

// ===== 便捷函数（保持与 utils/error-handler.ts 完全兼容） =====

/**
 * ErrorHandler 类兼容包装器
 * 提供与原 utils/error-handler.ts 中 ErrorHandler 类相同的接口
 */
class ErrorHandlerCompat {
  private static instance: ErrorHandlerCompat | null = null
  private handler = useErrorHandlerComposable()

  private constructor() {}

  static getInstance(): ErrorHandlerCompat {
    if (!ErrorHandlerCompat.instance) {
      ErrorHandlerCompat.instance = new ErrorHandlerCompat()
    }
    return ErrorHandlerCompat.instance
  }

  setNotificationCallback(callback: (notification: NotificationInfo) => void): void {
    this.handler.setNotificationCallback(callback)
  }

  handleError(error: any, context?: Record<string, any>): ErrorInfo {
    return this.handler.handleError(error, context)
  }

  showSuccess(message: string, title: string = '操作成功'): void {
    this.handler.showSuccess(message, title)
  }

  showInfo(message: string, title: string = '提示'): void {
    this.handler.showInfo(message, title)
  }

  showWarning(message: string, title: string = '警告'): void {
    this.handler.showWarning(message, title)
  }
}

/**
 * 统一的错误处理器导出
 * 这个函数同时支持 composable 模式和 ErrorHandler 类模式
 */
export function useErrorHandler() {
  const composable = useErrorHandlerComposable()
  const compat = ErrorHandlerCompat.getInstance()

  // 返回一个混合对象，同时支持两种使用方式
  return {
    // Composable 方式的属性和方法
    ...composable,

    // ErrorHandler 类方式的方法（用于 AI 组件）
    setNotificationCallback: compat.setNotificationCallback.bind(compat),
    getInstance: () => compat
  }
}

/**
 * 处理错误的便捷函数
 * @param error 错误对象
 * @param context 上下文信息
 */
export function handleError(error: any, context?: Record<string, any>): ErrorInfo {
  return useErrorHandler().handleError(error, context)
}

/**
 * 显示成功通知的便捷函数
 * @param message 消息内容
 * @param title 标题
 */
export function showSuccess(message: string, title?: string): void {
  useErrorHandler().showSuccess(message, title)
}

/**
 * 显示信息通知的便捷函数
 * @param message 消息内容
 * @param title 标题
 */
export function showInfo(message: string, title?: string): void {
  useErrorHandler().showInfo(message, title)
}

/**
 * 显示警告通知的便捷函数
 * @param message 消息内容
 * @param title 标题
 */
export function showWarning(message: string, title?: string): void {
  useErrorHandler().showWarning(message, title)
}
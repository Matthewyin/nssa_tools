/**
 * 认证状态管理
 */
import { defineStore } from 'pinia'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getAuth
} from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const loading = ref(true)
  const error = ref('')

  // 计算属性
  const isAuthenticated = computed(() => !!user.value)
  const getUserInfo = computed(() => user.value)

  // 初始化认证状态监听
  const initAuth = () => {
    const auth = getAuth()
    
    onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        user.value = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL
        }
      } else {
        user.value = null
      }
      loading.value = false
    })
  }

  // 登录
  const login = async (email, password) => {
    loading.value = true
    error.value = ''

    try {
      const auth = getAuth()
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      return {
        success: true,
        user: userCredential.user
      }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    loading.value = true
    error.value = ''

    try {
      const auth = getAuth()
      await signOut(auth)
      
      return {
        success: true
      }
    } catch (err) {
      error.value = getErrorMessage(err.code)
      return {
        success: false,
        error: error.value
      }
    } finally {
      loading.value = false
    }
  }

  // 获取用户的ID Token
  const getIdToken = async () => {
    if (!user.value) return null
    
    try {
      const auth = getAuth()
      return await auth.currentUser.getIdToken()
    } catch (err) {
      console.error('获取ID Token失败:', err)
      return null
    }
  }

  // 错误消息映射
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/user-not-found': '用户不存在',
      'auth/wrong-password': '密码错误',
      'auth/invalid-email': '邮箱格式无效',
      'auth/user-disabled': '用户账号已被禁用',
      'auth/too-many-requests': '请求过于频繁，请稍后再试',
      'auth/network-request-failed': '网络连接失败',
      'auth/invalid-credential': '登录凭据无效'
    }
    
    return errorMessages[errorCode] || '登录失败，请重试'
  }

  // 清除错误
  const clearError = () => {
    error.value = ''
  }

  return {
    // 状态
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    
    // 计算属性
    isAuthenticated,
    getUserInfo,
    
    // 方法
    initAuth,
    login,
    logout,
    getIdToken,
    clearError
  }
})

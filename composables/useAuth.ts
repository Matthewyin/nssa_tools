import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth'

export const useAuth = () => {
  const { $firebase } = useNuxtApp()
  const user = ref<User | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  // 检查是否为演示模式
  const isDemo = $firebase?.isDemo || false

  // 登录
  const login = async (email: string, password: string) => {
    try {
      error.value = null
      loading.value = true

      if (isDemo) {
        // 演示模式：模拟登录
        if (email === 'demo@example.com' && password === 'demo123') {
          const mockUser = {
            uid: 'demo-user-123',
            email: 'demo@example.com',
            displayName: '演示用户',
            photoURL: null,
            emailVerified: true
          } as User

          user.value = mockUser
          return { success: true, user: mockUser }
        } else {
          throw new Error('演示模式请使用: demo@example.com / demo123')
        }
      }

      if (!$firebase.auth) {
        throw new Error('Firebase Auth未初始化')
      }

      const userCredential = await signInWithEmailAndPassword($firebase.auth, email, password)
      user.value = userCredential.user

      return { success: true, user: userCredential.user }
    } catch (err: any) {
      error.value = getAuthErrorMessage(err.code || err.message)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      if (isDemo) {
        // 演示模式：直接清除用户
        user.value = null
        return { success: true }
      }

      if (!$firebase.auth) {
        throw new Error('Firebase Auth未初始化')
      }

      await signOut($firebase.auth)
      user.value = null
      return { success: true }
    } catch (err: any) {
      error.value = getAuthErrorMessage(err.code || err.message)
      return { success: false, error: error.value }
    }
  }

  // 监听认证状态变化
  const initAuth = () => {
    return new Promise<void>((resolve) => {
      if (isDemo) {
        // 演示模式：直接完成初始化
        loading.value = false
        resolve()
        return
      }

      if (!$firebase.auth) {
        loading.value = false
        resolve()
        return
      }

      const unsubscribe = onAuthStateChanged($firebase.auth, (firebaseUser) => {
        user.value = firebaseUser
        loading.value = false
        resolve()
      })

      // 在组件卸载时取消监听
      onUnmounted(() => {
        unsubscribe()
      })
    })
  }

  // 获取认证错误信息
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return '无效的电子邮箱格式'
      case 'auth/user-disabled':
        return '该用户账号已被禁用'
      case 'auth/user-not-found':
        return '用户不存在'
      case 'auth/wrong-password':
        return '密码错误'
      case 'auth/email-already-in-use':
        return '该邮箱已被注册'
      case 'auth/weak-password':
        return '密码强度太弱，至少需要6位字符'
      case 'auth/too-many-requests':
        return '请求过于频繁，请稍后再试'
      case 'auth/network-request-failed':
        return '网络连接失败，请检查网络'
      default:
        return `认证错误: ${errorCode}`
    }
  }

  // 检查是否已登录
  const isAuthenticated = computed(() => !!user.value)

  // 获取用户信息
  const getUserInfo = computed(() => {
    if (!user.value) return null
    
    return {
      uid: user.value.uid,
      email: user.value.email,
      displayName: user.value.displayName,
      photoURL: user.value.photoURL,
      emailVerified: user.value.emailVerified
    }
  })

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    isAuthenticated,
    getUserInfo,
    login,
    logout,
    initAuth
  }
}

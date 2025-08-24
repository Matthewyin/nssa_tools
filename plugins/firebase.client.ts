import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // 检查是否有有效的Firebase配置
  const hasValidConfig = config.public.firebaseApiKey &&
                        config.public.firebaseApiKey !== 'demo-api-key' &&
                        config.public.firebaseApiKey !== 'temp-key-for-development' &&
                        config.public.firebaseProjectId &&
                        config.public.firebaseProjectId !== 'demo-project' &&
                        config.public.firebaseApiKey.startsWith('AIza')

  if (!hasValidConfig) {
    console.warn('Firebase配置无效，使用模拟模式')

    // 返回模拟的Firebase对象
    return {
      provide: {
        firebase: {
          app: null,
          auth: null,
          db: null,
          isDemo: true
        }
      }
    }
  }

  try {
    // Firebase 配置
    const firebaseConfig = {
      apiKey: config.public.firebaseApiKey,
      authDomain: config.public.firebaseAuthDomain,
      projectId: config.public.firebaseProjectId,
      storageBucket: config.public.firebaseStorageBucket,
      messagingSenderId: config.public.firebaseMessagingSenderId,
      appId: config.public.firebaseAppId
    }

    // 初始化 Firebase
    const app = initializeApp(firebaseConfig)

    // 初始化 Auth
    const auth = getAuth(app)

    // 初始化 Firestore
    const db = getFirestore(app)

    // 开发环境连接模拟器
    if (process.dev) {
      try {
        // 连接 Auth 模拟器
        if (!auth.config.emulator) {
          connectAuthEmulator(auth, 'http://localhost:9099')
        }

        // 连接 Firestore 模拟器
        if (!db._delegate._databaseId.projectId.includes('demo-')) {
          connectFirestoreEmulator(db, 'localhost', 8080)
        }
      } catch (error) {
        console.warn('Firebase 模拟器连接失败:', error)
      }
    }

    // 提供给应用使用
    return {
      provide: {
        firebase: {
          app,
          auth,
          db,
          isDemo: false
        }
      }
    }
  } catch (error) {
    console.error('Firebase初始化失败:', error)

    // 返回模拟的Firebase对象
    return {
      provide: {
        firebase: {
          app: null,
          auth: null,
          db: null,
          isDemo: true
        }
      }
    }
  }
})

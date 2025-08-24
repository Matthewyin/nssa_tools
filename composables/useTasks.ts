import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore'
import dayjs from 'dayjs'

export interface Task {
  id?: string
  name: string
  description?: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  scheduleType: 'simple' | 'advanced'
  // 简单调度
  interval?: number
  unit?: 'minutes' | 'hours' | 'days'
  // 高级调度
  days?: string[]
  time?: string
  // 状态
  isActive: boolean
  nextRun?: number
  lastRun?: number
  runCount?: number
  failureCount?: number
  lastError?: string
  // 元数据
  userId: string
  createdAt: number
  updatedAt: number
}

export const useTasks = () => {
  const { $firebase } = useNuxtApp()
  const { user } = useAuth()

  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  let unsubscribe: Unsubscribe | null = null
  const isDemo = $firebase?.isDemo || false

  // 计算下次运行时间
  const calculateNextRun = (task: Task): number => {
    const now = dayjs()
    
    if (task.scheduleType === 'advanced') {
      if (!task.days || task.days.length === 0 || !task.time) {
        return now.add(1, 'hour').valueOf()
      }
      
      const [hour, minute] = task.time.split(':').map(Number)
      const sortedDays = task.days.map(Number).sort()
      
      // 寻找下一个执行时间
      for (let i = 0; i < 7; i++) {
        const potentialRun = now.add(i, 'day').hour(hour).minute(minute).second(0).millisecond(0)
        if (sortedDays.includes(potentialRun.day()) && potentialRun.isAfter(now)) {
          return potentialRun.valueOf()
        }
      }
      
      // 如果本周没有找到，找下周的第一个
      const nextWeekDay = sortedDays[0]
      return now.add(1, 'week').day(nextWeekDay).hour(hour).minute(minute).second(0).millisecond(0).valueOf()
    } else {
      // 简单调度
      const interval = task.interval || 5
      const unit = task.unit || 'minutes'
      return now.add(interval, unit).valueOf()
    }
  }

  // 获取任务列表
  const fetchTasks = async () => {
    if (!user.value) return

    try {
      loading.value = true
      error.value = null

      if (isDemo) {
        // 演示模式：从localStorage获取任务
        const stored = localStorage.getItem('demo_tasks')
        tasks.value = stored ? JSON.parse(stored) : []
        return
      }

      if (!$firebase.db) {
        throw new Error('Firestore未初始化')
      }

      const tasksRef = collection($firebase.db, 'tasks')
      const q = query(
        tasksRef,
        where('userId', '==', user.value.uid),
        orderBy('createdAt', 'desc')
      )

      const querySnapshot = await getDocs(q)
      tasks.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task))

    } catch (err: any) {
      error.value = err.message
      console.error('获取任务失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 实时监听任务变化
  const subscribeToTasks = () => {
    if (!user.value) return
    
    const tasksRef = collection($firebase.db, 'tasks')
    const q = query(
      tasksRef,
      where('userId', '==', user.value.uid),
      orderBy('createdAt', 'desc')
    )
    
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      tasks.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Task))
    }, (err) => {
      error.value = err.message
      console.error('任务监听失败:', err)
    })
  }

  // 创建任务
  const createTask = async (taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'nextRun'>) => {
    if (!user.value) throw new Error('用户未登录')
    
    try {
      loading.value = true
      error.value = null
      
      const now = Date.now()
      const newTask: Omit<Task, 'id'> = {
        ...taskData,
        userId: user.value.uid,
        createdAt: now,
        updatedAt: now,
        runCount: 0,
        failureCount: 0
      }
      
      // 计算下次运行时间
      newTask.nextRun = calculateNextRun(newTask as Task)
      
      const tasksRef = collection($firebase.db, 'tasks')
      const docRef = await addDoc(tasksRef, newTask)
      
      return { success: true, id: docRef.id }
    } catch (err: any) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 更新任务
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user.value) throw new Error('用户未登录')
    
    try {
      loading.value = true
      error.value = null
      
      const taskRef = doc($firebase.db, 'tasks', taskId)
      const updateData = {
        ...updates,
        updatedAt: Date.now()
      }
      
      // 如果更新了调度相关字段，重新计算下次运行时间
      if (updates.scheduleType || updates.interval || updates.unit || updates.days || updates.time) {
        const currentTask = tasks.value.find(t => t.id === taskId)
        if (currentTask) {
          const updatedTask = { ...currentTask, ...updates } as Task
          updateData.nextRun = calculateNextRun(updatedTask)
        }
      }
      
      await updateDoc(taskRef, updateData)
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 删除任务
  const deleteTask = async (taskId: string) => {
    if (!user.value) throw new Error('用户未登录')
    
    try {
      loading.value = true
      error.value = null
      
      const taskRef = doc($firebase.db, 'tasks', taskId)
      await deleteDoc(taskRef)
      
      return { success: true }
    } catch (err: any) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // 切换任务状态
  const toggleTaskStatus = async (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return { success: false, error: '任务不存在' }
    
    return await updateTask(taskId, { 
      isActive: !task.isActive,
      nextRun: !task.isActive ? calculateNextRun(task) : undefined
    })
  }

  // 手动执行任务
  const executeTask = async (task: Task) => {
    try {
      if (isDemo) {
        // 演示模式：模拟执行
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 更新本地任务统计
        const storedTasks = JSON.parse(localStorage.getItem('demo_tasks') || '[]')
        const taskIndex = storedTasks.findIndex((t: Task) => t.id === task.id)
        if (taskIndex !== -1) {
          storedTasks[taskIndex].lastRun = Date.now()
          storedTasks[taskIndex].runCount = (storedTasks[taskIndex].runCount || 0) + 1
          storedTasks[taskIndex].lastError = undefined
          localStorage.setItem('demo_tasks', JSON.stringify(storedTasks))

          // 更新本地状态
          const localTaskIndex = tasks.value.findIndex(t => t.id === task.id)
          if (localTaskIndex !== -1) {
            tasks.value[localTaskIndex] = { ...storedTasks[taskIndex] }
          }
        }

        return { success: true, message: '任务执行成功（演示模式）' }
      }

      // 真实模式：调用服务端API执行任务
      const response = await $fetch('/api/cron/execute', {
        method: 'POST',
        body: {
          taskId: task.id,
          url: task.url,
          method: task.method,
          headers: task.headers || {},
          requestBody: task.body
        }
      })

      if (response.success) {
        // 更新任务统计
        await updateTask(task.id!, {
          lastRun: Date.now(),
          runCount: (task.runCount || 0) + 1,
          lastError: undefined
        })

        return { success: true, message: '任务执行成功' }
      } else {
        // 更新错误信息
        await updateTask(task.id!, {
          lastRun: Date.now(),
          failureCount: (task.failureCount || 0) + 1,
          lastError: response.execution?.statusText || '执行失败'
        })

        return { success: false, error: response.execution?.statusText || '执行失败' }
      }
    } catch (err: any) {
      // 更新错误信息
      await updateTask(task.id!, {
        lastRun: Date.now(),
        failureCount: (task.failureCount || 0) + 1,
        lastError: err.message
      })

      return { success: false, error: err.message }
    }
  }

  // 清理监听器
  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    tasks: readonly(tasks),
    loading: readonly(loading),
    error: readonly(error),
    fetchTasks,
    subscribeToTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    executeTask,
    calculateNextRun,
    cleanup
  }
}

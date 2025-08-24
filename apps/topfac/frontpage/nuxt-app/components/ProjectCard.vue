<template>
  <v-card
    class="project-card"
    :class="{ 'selected': selected }"
    elevation="2"
    hover
    @click="$emit('view', project)"
  >
    <!-- 项目状态指示器 -->
    <div class="status-indicator" :class="statusClass" />

    <!-- 选择复选框 -->
    <div class="selection-checkbox">
      <v-checkbox
        :model-value="selected"
        hide-details
        @click.stop
        @update:model-value="$emit('toggle-select', project.id)"
      />
    </div>

    <!-- 卡片头部 -->
    <v-card-title class="d-flex align-start">
      <div class="flex-grow-1">
        <h3 class="text-h6 font-weight-bold text-grey-darken-2 mb-1">
          {{ project.project_name }}
          <v-chip
            v-if="project.status === 'deleted'"
            size="x-small"
            color="error"
            variant="outlined"
            class="ml-2"
          >
            已删除
          </v-chip>
        </h3>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          {{ formatDate(project.updated_at) }}
        </p>
      </div>
      
      <!-- 操作菜单 
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn
            icon="mdi-dots-vertical"
            variant="text"
            size="small"
            v-bind="props"
            @click.stop
          />
        </template>
        
        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-content-copy"
            title="复制"
            @click="$emit('duplicate', project)"
          />
          <v-divider />
          <v-list-item
            prepend-icon="mdi-delete"
            title="删除"
            class="text-error"
            @click="$emit('delete', project)"
          />
        </v-list>
      </v-menu>
      -->
    </v-card-title>
  

    <!-- 项目描述 -->
    <v-card-text class="pt-0">
      <p class="text-body-2 text-grey-darken-1 mb-3">
        {{ project.description || '暂无描述' }}
      </p>
      
      <!-- 项目统计信息 -->
      <div class="d-flex align-center flex-wrap gap-2 mb-3">
        <v-chip
          size="small"
          variant="outlined"
          color="primary"
          class="version-chip"
        >
          <v-icon start size="16">mdi-layers-outline</v-icon>
          {{ project.version_count || 0 }} 个版本
        </v-chip>

        <v-chip
          v-if="project.latest_version"
          size="small"
          variant="outlined"
          :color="versionStatusColor"
          class="status-chip"
        >
          <v-icon start size="16">{{ versionStatusIcon }}</v-icon>
          {{ versionStatusText }}
        </v-chip>
      </div>

      <!-- 最新版本信息 - 优化布局 -->
      <div v-if="project.latest_version" class="latest-version-info">
        <div class="version-info-row">
          <div class="d-flex align-center text-caption text-grey-darken-1">
            <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
            <span class="version-text">当前版本：v{{ project.latest_version.version }}</span>
            <span class="mx-2 text-grey-lighten-1">•</span>
            <span class="date-text">{{ formatDate(project.latest_version.created_at) }}</span>
          </div>
        </div>

        <div v-if="project.latest_version.has_xml" class="version-status-row">
          <div class="d-flex align-center text-caption text-success mt-1">
            <v-icon size="14" class="mr-1">mdi-check-circle</v-icon>
            <span>已生成拓扑图</span>
          </div>
        </div>
      </div>
    </v-card-text>
    
    <!-- 卡片操作 -->
    <v-card-actions class="pt-0">
      <v-btn
        variant="outlined"
        size="small"
        prepend-icon="mdi-pencil"
        @click.stop="$emit('view', project)"
      >
        编辑
      </v-btn>
      <v-btn
        variant="outlined"
        size="small"
        prepend-icon="mdi-content-copy"
        @click.stop="$emit('duplicate', project)"
      >
        复制
      </v-btn>
      <v-btn
        variant="outlined"
        size="small"
        prepend-icon="mdi-delete"
        @click.stop="$emit('delete', project)"
      >
        删除
      </v-btn>
      

      <v-spacer />
      
      <!-- 项目状态标签 -->
      <v-chip
        :color="statusColor"
        variant="flat"
        size="small"
        class="text-caption"
      >
        {{ statusText }}
      </v-chip>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// 定义 props
interface Project {
  id: string
  project_name: string
  description?: string
  status: string
  created_at: string
  updated_at: string
  current_version: number
  version_count: number
  latest_version?: {
    version: number
    created_at: string
    status: string
    has_xml: boolean
  }
}

interface Props {
  project: Project
  selected?: boolean
}

const props = defineProps<Props>()

// 定义 emits
const emit = defineEmits<{
  view: [project: Project]
  edit: [project: Project]
  delete: [project: Project]
  duplicate: [project: Project]
  'toggle-select': [projectId: string]
}>()

// 计算属性
const statusColor = computed(() => {
  switch (props.project.status) {
    case 'active':
      return 'success'
    case 'archived':
      return 'warning'
    case 'deleted':
      return 'error'
    default:
      return 'grey'
  }
})

const statusText = computed(() => {
  switch (props.project.status) {
    case 'active':
      return '活跃'
    case 'archived':
      return '已归档'
    case 'deleted':
      return '已删除'
    default:
      return '未知'
  }
})

const statusClass = computed(() => {
  return `status-${props.project.status}`
})

const versionStatusColor = computed(() => {
  if (!props.project.latest_version) return 'grey'
  
  switch (props.project.latest_version.status) {
    case 'draft':
      return 'grey'
    case 'parsed':
      return 'info'
    case 'generated':
      return 'success'
    case 'published':
      return 'primary'
    default:
      return 'grey'
  }
})

const versionStatusIcon = computed(() => {
  if (!props.project.latest_version) return 'mdi-help'
  
  switch (props.project.latest_version.status) {
    case 'draft':
      return 'mdi-file-document-outline'
    case 'parsed':
      return 'mdi-cog'
    case 'generated':
      return 'mdi-check-circle'
    case 'published':
      return 'mdi-publish'
    default:
      return 'mdi-help'
  }
})

const versionStatusText = computed(() => {
  if (!props.project.latest_version) return '无版本'
  
  switch (props.project.latest_version.status) {
    case 'draft':
      return '草稿'
    case 'parsed':
      return '已解析'
    case 'generated':
      return '已生成'
    case 'published':
      return '已发布'
    default:
      return '未知状态'
  }
})

// 工具函数
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) {
    return '今天'
  } else if (diffDays === 2) {
    return '昨天'
  } else if (diffDays <= 7) {
    return `${diffDays - 1} 天前`
  } else if (diffDays <= 30) {
    return `${Math.floor(diffDays / 7)} 周前`
  } else if (diffDays <= 365) {
    return `${Math.floor(diffDays / 30)} 个月前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>

<style scoped>
.project-card {
  position: relative;
  border-radius: 12px !important;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.project-card.selected {
  border: 2px solid #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.selection-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 2px;
}

.status-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  border-radius: 12px 0 0 12px;
}

.status-active {
  background: linear-gradient(135deg, #4CAF50, #66BB6A);
}

.status-archived {
  background: linear-gradient(135deg, #FF9800, #FFB74D);
}

.status-deleted {
  background: linear-gradient(135deg, #F44336, #EF5350);
}

.latest-version-info {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  padding: 10px;
  margin-top: 8px;
}

.version-info-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}

.version-info-row .d-flex {
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.version-text {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.date-text {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.75rem;
}

.version-status-row {
  margin-top: 4px;
}

.version-chip,
.status-chip {
  height: 24px !important;
  font-size: 0.75rem !important;
}

.gap-2 {
  gap: 8px;
}

.v-card-title {
  padding: 16px 16px 8px 20px !important;
}

.v-card-text {
  padding: 0 16px 8px 20px !important;
}

.v-card-actions {
  padding: 8px 16px 16px 20px !important;
}

.v-chip {
  border-radius: 6px !important;
}

.v-btn {
  border-radius: 6px !important;
}
</style>

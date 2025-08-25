/**
 * 数据迁移脚本
 * 从Cloudflare Workers迁移数据到Firebase Firestore
 */

const admin = require('firebase-admin');

// 初始化Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

const db = admin.firestore();

/**
 * 迁移Cron任务数据
 */
async function migrateCronTasks() {
  console.log('开始迁移Cron任务数据...');
  
  // 这里应该从Cloudflare KV读取数据
  // 由于我们没有实际的Cloudflare数据，这里创建一些示例数据
  const sampleTasks = [
    {
      userId: 'demo-user-1',
      name: '示例任务1',
      description: '这是一个示例任务',
      url: 'https://example.com/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"message": "Hello World"}',
      cronExpression: '0 */5 * * * *',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastExecuted: null
    },
    {
      userId: 'demo-user-1',
      name: '示例任务2',
      description: '另一个示例任务',
      url: 'https://example.com/api/test',
      method: 'GET',
      headers: {},
      body: '',
      cronExpression: '0 0 */1 * * *',
      status: 'paused',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastExecuted: new Date()
    }
  ];

  for (const task of sampleTasks) {
    try {
      await db.collection('cronTasks').add(task);
      console.log(`✓ 迁移任务: ${task.name}`);
    } catch (error) {
      console.error(`✗ 迁移任务失败: ${task.name}`, error);
    }
  }

  console.log('Cron任务数据迁移完成');
}

/**
 * 迁移Topfac项目数据
 */
async function migrateTopfacProjects() {
  console.log('开始迁移Topfac项目数据...');
  
  // 示例项目数据
  const sampleProjects = [
    {
      userId: 'demo-user-1',
      projectName: '示例网络拓扑',
      description: '这是一个示例网络拓扑项目',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      currentVersion: 1,
      versionCount: 1
    },
    {
      userId: 'demo-user-1',
      projectName: '企业网络架构',
      description: '企业级网络架构设计',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      currentVersion: 2,
      versionCount: 2
    }
  ];

  for (const project of sampleProjects) {
    try {
      const projectRef = await db.collection('topfacProjects').add(project);
      console.log(`✓ 迁移项目: ${project.projectName}`);
      
      // 创建示例版本
      await db.collection('topfacVersions').add({
        projectId: projectRef.id,
        version: 1,
        textContent: '这是示例的网络描述文本',
        parsedData: {
          topology_name: project.projectName,
          regions: [],
          components: [],
          connections: []
        },
        xmlContent: '',
        status: 'published',
        createdAt: new Date()
      });
      
    } catch (error) {
      console.error(`✗ 迁移项目失败: ${project.projectName}`, error);
    }
  }

  console.log('Topfac项目数据迁移完成');
}

/**
 * 创建示例用户
 */
async function createSampleUsers() {
  console.log('创建示例用户...');
  
  const sampleUsers = [
    {
      email: 'demo@example.com',
      name: '演示用户',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const user of sampleUsers) {
    try {
      await db.collection('users').doc('demo-user-1').set(user);
      console.log(`✓ 创建用户: ${user.email}`);
    } catch (error) {
      console.error(`✗ 创建用户失败: ${user.email}`, error);
    }
  }

  console.log('示例用户创建完成');
}

/**
 * 主迁移函数
 */
async function main() {
  try {
    console.log('开始数据迁移...');
    
    await createSampleUsers();
    await migrateCronTasks();
    await migrateTopfacProjects();
    
    console.log('✅ 数据迁移完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
    process.exit(1);
  }
}

// 运行迁移
if (require.main === module) {
  main();
}

module.exports = {
  migrateCronTasks,
  migrateTopfacProjects,
  createSampleUsers
};

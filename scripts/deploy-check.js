#!/usr/bin/env node

/**
 * 部署前检查脚本
 * 验证Firebase配置和环境变量
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 开始部署前检查...\n');

// 检查必要的文件
const requiredFiles = [
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json',
  'apphosting.yaml',
  '.firebaserc'
];

console.log('📁 检查必要文件:');
let filesOk = true;
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - 文件不存在`);
    filesOk = false;
  }
}

if (!filesOk) {
  console.log('\n❌ 缺少必要的配置文件，请检查项目结构');
  process.exit(1);
}

// 检查Firebase配置
console.log('\n🔧 检查Firebase配置:');
try {
  const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
  const projectId = firebaserc.projects.default;
  
  if (projectId === 'n8n-project-460516') {
    console.log(`  ✅ 项目ID: ${projectId}`);
  } else {
    console.log(`  ⚠️  项目ID: ${projectId} (应该是 n8n-project-460516)`);
  }
  
  // 检查hosting target
  if (firebaserc.targets && firebaserc.targets[projectId] && firebaserc.targets[projectId].hosting) {
    console.log(`  ✅ Hosting target配置正确`);
  } else {
    console.log(`  ❌ Hosting target配置缺失`);
  }
} catch (error) {
  console.log(`  ❌ 读取.firebaserc失败: ${error.message}`);
}

// 检查package.json脚本
console.log('\n📦 检查package.json脚本:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['build', 'dev'];
  
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`  ❌ 缺少脚本: ${script}`);
    }
  }
} catch (error) {
  console.log(`  ❌ 读取package.json失败: ${error.message}`);
}

// 检查Functions配置
console.log('\n⚡ 检查Functions配置:');
if (fs.existsSync('functions/package.json')) {
  try {
    const functionsPackage = JSON.parse(fs.readFileSync('functions/package.json', 'utf8'));
    console.log(`  ✅ Functions package.json存在`);
    console.log(`  ✅ Node.js版本: ${functionsPackage.engines?.node || '未指定'}`);
    
    // 检查必要依赖
    const requiredDeps = ['firebase-admin', 'firebase-functions'];
    for (const dep of requiredDeps) {
      if (functionsPackage.dependencies && functionsPackage.dependencies[dep]) {
        console.log(`  ✅ ${dep}: ${functionsPackage.dependencies[dep]}`);
      } else {
        console.log(`  ❌ 缺少依赖: ${dep}`);
      }
    }
  } catch (error) {
    console.log(`  ❌ 读取functions/package.json失败: ${error.message}`);
  }
} else {
  console.log(`  ❌ functions/package.json不存在`);
}

// 检查环境变量配置
console.log('\n🔐 环境变量配置检查:');
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

console.log('  📋 需要在GitHub Secrets中配置的变量:');
for (const envVar of requiredEnvVars) {
  console.log(`    - ${envVar}`);
}

console.log('  📋 需要在GitHub Secrets中配置的服务账号:');
console.log('    - FIREBASE_SERVICE_ACCOUNT_N8N_PROJECT_460516');

// 检查Nuxt配置
console.log('\n⚙️  检查Nuxt配置:');
try {
  const nuxtConfigContent = fs.readFileSync('nuxt.config.ts', 'utf8');
  
  if (nuxtConfigContent.includes("preset: 'firebase'")) {
    console.log(`  ✅ Firebase预设已配置`);
  } else {
    console.log(`  ❌ Firebase预设未配置`);
  }
  
  if (nuxtConfigContent.includes('runtimeConfig')) {
    console.log(`  ✅ 运行时配置已设置`);
  } else {
    console.log(`  ❌ 运行时配置缺失`);
  }
} catch (error) {
  console.log(`  ❌ 读取nuxt.config.ts失败: ${error.message}`);
}

console.log('\n📋 部署步骤提醒:');
console.log('1. 确保在Firebase Console中创建了项目 "n8n-project-460516"');
console.log('2. 启用以下Firebase服务:');
console.log('   - Authentication (Email/Password)');
console.log('   - Firestore Database');
console.log('   - Functions');
console.log('   - App Hosting');
console.log('3. 在GitHub仓库设置中配置所有必要的Secrets');
console.log('4. 推送代码到main分支触发自动部署');

console.log('\n✅ 部署前检查完成！');
console.log('\n🚀 准备部署到Firebase App Hosting...');
console.log('   项目ID: n8n-project-460516');
console.log('   App ID: 1:18068529376:web:42ce80ad28f316b97a3085');
console.log('   Backend: nssa-tools');
console.log('   部署方式: Firebase App Hosting (不是Hosting)');

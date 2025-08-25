#!/usr/bin/env node

/**
 * 验证Firebase服务账号JSON格式
 */

import fs from 'fs';

const jsonFile = 'n8n-project-460516-firebase-adminsdk-fbsvc-366ac094f1.json';

console.log('🔍 验证Firebase服务账号JSON格式...\n');

try {
  // 读取文件
  const content = fs.readFileSync(jsonFile, 'utf8');
  console.log('✅ 文件读取成功');
  
  // 解析JSON
  const parsed = JSON.parse(content);
  console.log('✅ JSON格式有效');
  
  // 检查必要字段
  const requiredFields = [
    'type',
    'project_id', 
    'private_key_id',
    'private_key',
    'client_email',
    'client_id'
  ];
  
  console.log('\n📋 检查必要字段:');
  for (const field of requiredFields) {
    if (parsed[field]) {
      console.log(`  ✅ ${field}: ${field === 'private_key' ? '[已隐藏]' : parsed[field]}`);
    } else {
      console.log(`  ❌ ${field}: 缺失`);
    }
  }
  
  // 检查项目ID
  if (parsed.project_id === 'n8n-project-460516') {
    console.log('\n✅ 项目ID正确');
  } else {
    console.log(`\n❌ 项目ID不匹配: ${parsed.project_id}`);
  }
  
  // 输出格式化的JSON（用于GitHub Secret）
  console.log('\n📋 用于GitHub Secret的JSON格式:');
  console.log('---开始---');
  console.log(JSON.stringify(parsed, null, 2));
  console.log('---结束---');
  
  console.log('\n✅ JSON验证完成！');
  
} catch (error) {
  console.error('❌ JSON验证失败:', error.message);
  
  if (error instanceof SyntaxError) {
    console.log('\n💡 可能的解决方案:');
    console.log('1. 检查JSON文件是否有语法错误');
    console.log('2. 确保所有引号都是英文双引号');
    console.log('3. 检查是否有多余的逗号或缺少逗号');
    console.log('4. 确保private_key中的\\n换行符正确');
  }
  
  process.exit(1);
}

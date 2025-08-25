/**
 * Firebase Functions for NSSA Tools
 * 主入口文件，导出所有Cloud Functions
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// 初始化Firebase Admin
initializeApp();

// 导出Cron相关Functions
const cronFunctions = require('./cron');
const topfacFunctions = require('./topfac');
const authFunctions = require('./auth');

// 导出所有Functions
module.exports = {
  // Cron任务相关
  ...cronFunctions,
  
  // Topfac相关
  ...topfacFunctions,
  
  // 认证相关
  ...authFunctions
};

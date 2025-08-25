/**
 * Firebase Functions for NSSA Tools
 * 主入口文件，导出所有Cloud Functions
 */

const { initializeApp } = require('firebase-admin/app');

// 初始化Firebase Admin
initializeApp();

// 导出所有Functions
const cronFunctions = require('./src/cron');
const topfacFunctions = require('./src/topfac');
const authFunctions = require('./src/auth');

// 导出Cron相关Functions
exports.createCronTask = cronFunctions.createCronTask;
exports.updateCronTask = cronFunctions.updateCronTask;
exports.deleteCronTask = cronFunctions.deleteCronTask;
exports.triggerCronTask = cronFunctions.triggerCronTask;
exports.cronScheduler = cronFunctions.cronScheduler;

// 导出Topfac相关Functions
exports.createTopfacProject = topfacFunctions.createTopfacProject;
exports.updateTopfacProject = topfacFunctions.updateTopfacProject;
exports.createProjectVersion = topfacFunctions.createProjectVersion;
exports.convertWithAI = topfacFunctions.convertWithAI;

// 导出认证相关Functions
exports.createUserDocument = authFunctions.createUserDocument;
exports.getUserProfile = authFunctions.getUserProfile;
exports.updateUserProfile = authFunctions.updateUserProfile;

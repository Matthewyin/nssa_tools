/**
 * 统一的用户数据存储管理工具
 * 确保所有模块（MLG、五子棋、Cron）使用一致的用户数据隔离机制
 */
(function() {
  'use strict';

  // 统一的存储键值前缀
  const STORAGE_PREFIXES = {
    MLG: 'mlg_data_v2',
    GOMOKU: 'gomoku_data_v2', 
    CRON: 'webhook_tasks_v2',
    THEME: 'theme_v2'
  };

  // 旧版本键值映射（用于数据迁移）
  const LEGACY_KEYS = {
    MLG: ['cat_'],
    GOMOKU: ['gomoku_wins_v1'],
    CRON: ['webhook_tasks_', 'webhook_tasks_v2_'],
    THEME: ['mlg_theme', 'theme_']
  };

  /**
   * 获取当前用户信息
   * @returns {Object|null} 用户对象，包含 uid 和 email
   */
  function getCurrentUser() {
    // 尝试从 Firebase Auth 获取用户信息
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      const user = firebase.auth().currentUser;
      return {
        uid: user.uid,
        email: user.email?.toLowerCase() || '',
        displayName: user.displayName || ''
      };
    }
    
    // 尝试从全局变量获取（兼容性）
    if (typeof currentUser !== 'undefined' && currentUser) {
      return {
        uid: currentUser.uid,
        email: currentUser.email?.toLowerCase() || '',
        displayName: currentUser.displayName || ''
      };
    }
    
    return null;
  }

  /**
   * 生成统一的存储键值
   * @param {string} module - 模块名称 (MLG, GOMOKU, CRON, THEME)
   * @param {string} [suffix] - 可选的后缀
   * @returns {string} 存储键值
   */
  function getStorageKey(module, suffix = '') {
    const user = getCurrentUser();
    if (!user || !user.email) {
      // 未登录用户使用 guest 标识
      const key = `${STORAGE_PREFIXES[module]}_guest`;
      return suffix ? `${key}_${suffix}` : key;
    }
    
    // 使用邮箱作为用户标识（更稳定）
    const key = `${STORAGE_PREFIXES[module]}_${user.email}`;
    return suffix ? `${key}_${suffix}` : key;
  }

  /**
   * 获取旧版本的存储键值列表
   * @param {string} module - 模块名称
   * @returns {Array<string>} 可能的旧键值列表
   */
  function getLegacyKeys(module) {
    const user = getCurrentUser();
    const legacyPrefixes = LEGACY_KEYS[module] || [];
    const keys = [];
    
    // 添加固定的旧键值
    if (module === 'GOMOKU') {
      keys.push('gomoku_wins_v1');
    }
    if (module === 'THEME') {
      keys.push('mlg_theme');
    }
    
    if (user) {
      // 基于 UID 的旧键值
      legacyPrefixes.forEach(prefix => {
        if (user.uid) {
          keys.push(`${prefix}${user.uid}`);
        }
        if (user.email) {
          keys.push(`${prefix}${user.email}`);
        }
      });
    }
    
    return keys;
  }

  /**
   * 数据迁移：从旧键值迁移到新键值
   * @param {string} module - 模块名称
   * @returns {boolean} 是否进行了迁移
   */
  function migrateData(module) {
    const newKey = getStorageKey(module);
    
    // 如果新键值已存在数据，跳过迁移
    if (localStorage.getItem(newKey)) {
      return false;
    }
    
    const legacyKeys = getLegacyKeys(module);
    let bestData = null;
    let bestKey = null;
    let bestScore = -1;
    
    // 寻找最佳的迁移数据源
    legacyKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (!data) return;
        
        // 计算数据质量分数
        let score = 0;
        if (module === 'MLG') {
          const parsed = JSON.parse(data);
          score = (parsed.level || 0) + (parsed.stats?.gamesPlayed || 0);
        } else if (module === 'GOMOKU') {
          const parsed = JSON.parse(data);
          score = (parsed.blackWins || 0) + (parsed.whiteWins || 0);
        } else if (module === 'CRON') {
          const parsed = JSON.parse(data);
          score = Array.isArray(parsed) ? parsed.length : 0;
        } else {
          score = data.length; // 简单按数据长度评分
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestData = data;
          bestKey = key;
        }
      } catch (e) {
        console.warn(`迁移数据时解析失败: ${key}`, e);
      }
    });
    
    // 执行迁移
    if (bestData && bestKey) {
      try {
        localStorage.setItem(newKey, bestData);
        console.log(`数据迁移成功: ${bestKey} -> ${newKey}`);
        return true;
      } catch (e) {
        console.error(`数据迁移失败: ${bestKey} -> ${newKey}`, e);
      }
    }
    
    return false;
  }

  /**
   * 获取用户数据
   * @param {string} module - 模块名称
   * @param {Object} [defaultValue] - 默认值
   * @returns {any} 用户数据
   */
  function getUserData(module, defaultValue = null) {
    // 先尝试迁移旧数据
    migrateData(module);
    
    const key = getStorageKey(module);
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`读取用户数据失败: ${key}`, e);
      return defaultValue;
    }
  }

  /**
   * 保存用户数据
   * @param {string} module - 模块名称
   * @param {any} data - 要保存的数据
   * @returns {boolean} 是否保存成功
   */
  function setUserData(module, data) {
    const key = getStorageKey(module);
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`保存用户数据失败: ${key}`, e);
      return false;
    }
  }

  /**
   * 删除用户数据
   * @param {string} module - 模块名称
   * @returns {boolean} 是否删除成功
   */
  function removeUserData(module) {
    const key = getStorageKey(module);
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`删除用户数据失败: ${key}`, e);
      return false;
    }
  }

  /**
   * 清理所有旧版本数据
   * @param {string} module - 模块名称
   */
  function cleanupLegacyData(module) {
    const legacyKeys = getLegacyKeys(module);
    legacyKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`清理旧数据: ${key}`);
      } catch (e) {
        console.warn(`清理旧数据失败: ${key}`, e);
      }
    });
  }

  /**
   * 获取用户存储使用情况
   * @returns {Object} 存储使用情况统计
   */
  function getStorageUsage() {
    const user = getCurrentUser();
    const usage = {
      user: user ? user.email : 'guest',
      modules: {},
      total: 0
    };
    
    Object.keys(STORAGE_PREFIXES).forEach(module => {
      const key = getStorageKey(module);
      const data = localStorage.getItem(key);
      const size = data ? new Blob([data]).size : 0;
      usage.modules[module] = {
        key,
        size,
        sizeKB: Math.round(size / 1024 * 100) / 100,
        hasData: !!data
      };
      usage.total += size;
    });
    
    usage.totalKB = Math.round(usage.total / 1024 * 100) / 100;
    usage.totalMB = Math.round(usage.total / 1024 / 1024 * 100) / 100;
    
    return usage;
  }

  // 导出到全局
  window.UserStorage = {
    getStorageKey,
    getUserData,
    setUserData,
    removeUserData,
    migrateData,
    cleanupLegacyData,
    getStorageUsage,
    getCurrentUser,
    
    // 模块常量
    MODULES: {
      MLG: 'MLG',
      GOMOKU: 'GOMOKU', 
      CRON: 'CRON',
      THEME: 'THEME'
    }
  };

  console.log('UserStorage 统一数据管理工具已加载');
})();

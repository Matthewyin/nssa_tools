/**
 * Topfac拓扑生成相关的Firebase Functions
 */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const axios = require('axios');

const db = getFirestore();

/**
 * 创建Topfac项目
 */
exports.createTopfacProject = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { projectName, description } = request.data;
  
  if (!projectName) {
    throw new HttpsError('invalid-argument', '项目名称不能为空');
  }

  try {
    const projectRef = await db.collection('topfacProjects').add({
      userId: request.auth.uid,
      projectName,
      description: description || '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      currentVersion: 0,
      versionCount: 0
    });

    return {
      success: true,
      projectId: projectRef.id,
      message: '项目创建成功'
    };
  } catch (error) {
    console.error('创建项目失败:', error);
    throw new HttpsError('internal', '创建项目失败');
  }
});

/**
 * 更新Topfac项目
 */
exports.updateTopfacProject = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { projectId, ...updateData } = request.data;
  
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少项目ID');
  }

  try {
    const projectRef = db.collection('topfacProjects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      throw new HttpsError('not-found', '项目不存在');
    }

    // 验证用户权限
    if (projectDoc.data().userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', '无权限操作此项目');
    }

    await projectRef.update({
      ...updateData,
      updatedAt: new Date()
    });

    return {
      success: true,
      message: '项目更新成功'
    };
  } catch (error) {
    console.error('更新项目失败:', error);
    throw new HttpsError('internal', '更新项目失败');
  }
});

/**
 * 创建项目版本
 */
exports.createProjectVersion = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { projectId, textContent, parsedData, xmlContent } = request.data;
  
  if (!projectId) {
    throw new HttpsError('invalid-argument', '缺少项目ID');
  }

  try {
    const projectRef = db.collection('topfacProjects').doc(projectId);
    const projectDoc = await projectRef.get();

    if (!projectDoc.exists) {
      throw new HttpsError('not-found', '项目不存在');
    }

    const projectData = projectDoc.data();

    // 验证用户权限
    if (projectData.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', '无权限操作此项目');
    }

    const newVersion = (projectData.currentVersion || 0) + 1;

    // 创建新版本
    const versionRef = await db.collection('topfacVersions').add({
      projectId,
      version: newVersion,
      textContent: textContent || '',
      parsedData: parsedData || null,
      xmlContent: xmlContent || '',
      status: 'draft',
      createdAt: new Date()
    });

    // 更新项目信息
    await projectRef.update({
      currentVersion: newVersion,
      versionCount: newVersion,
      updatedAt: new Date()
    });

    return {
      success: true,
      versionId: versionRef.id,
      version: newVersion,
      message: '版本创建成功'
    };
  } catch (error) {
    console.error('创建版本失败:', error);
    throw new HttpsError('internal', '创建版本失败');
  }
});

/**
 * AI转换文本为拓扑结构
 */
exports.convertWithAI = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '用户未认证');
  }

  const { textContent, provider = 'gemini', model = 'gemini-pro', apiKey } = request.data;
  
  if (!textContent || !apiKey) {
    throw new HttpsError('invalid-argument', '缺少必要参数');
  }

  try {
    const startTime = new Date();
    
    // 根据不同的AI提供商调用相应的API
    let result;
    if (provider === 'gemini') {
      result = await callGeminiAPI(textContent, model, apiKey);
    } else if (provider === 'deepseek') {
      result = await callDeepSeekAPI(textContent, model, apiKey);
    } else {
      throw new HttpsError('invalid-argument', '不支持的AI提供商');
    }

    const endTime = new Date();
    const processingTime = endTime.getTime() - startTime.getTime();

    // 记录AI转换历史
    await db.collection('aiConversions').add({
      userId: request.auth.uid,
      provider,
      model,
      inputText: textContent,
      outputText: result.outputText,
      inputLength: textContent.length,
      outputLength: result.outputText.length,
      processingTime,
      status: 'success',
      createdAt: startTime
    });

    return {
      success: true,
      outputText: result.outputText,
      processingTime,
      message: 'AI转换成功'
    };
  } catch (error) {
    console.error('AI转换失败:', error);
    
    // 记录失败的转换
    await db.collection('aiConversions').add({
      userId: request.auth.uid,
      provider,
      model,
      inputText: textContent,
      inputLength: textContent.length,
      status: 'failed',
      errorMessage: error.message,
      createdAt: new Date()
    });

    throw new HttpsError('internal', `AI转换失败: ${error.message}`);
  }
});

/**
 * 调用Gemini API
 */
async function callGeminiAPI(textContent, model, apiKey) {
  const prompt = `请将以下网络描述转换为标准化的拓扑结构数据：

${textContent}

请按照以下JSON格式返回：
{
  "topology_name": "拓扑名称",
  "regions": [
    {
      "name": "区域名称",
      "description": "区域描述"
    }
  ],
  "components": [
    {
      "name": "设备名称",
      "type": "设备类型",
      "region": "所属区域",
      "description": "设备描述"
    }
  ],
  "connections": [
    {
      "from": "源设备",
      "to": "目标设备",
      "type": "连接类型",
      "description": "连接描述"
    }
  ]
}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    },
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  const outputText = response.data.candidates[0].content.parts[0].text;
  return { outputText };
}

/**
 * 调用DeepSeek API
 */
async function callDeepSeekAPI(textContent, model, apiKey) {
  const prompt = `请将以下网络描述转换为标准化的拓扑结构数据：

${textContent}

请按照以下JSON格式返回：
{
  "topology_name": "拓扑名称",
  "regions": [...],
  "components": [...],
  "connections": [...]
}`;

  const response = await axios.post(
    'https://api.deepseek.com/v1/chat/completions',
    {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const outputText = response.data.choices[0].message.content;
  return { outputText };
}

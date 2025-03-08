const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { userId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 验证管理员权限
    const adminResult = await db.collection('users').where({
      _openid: openid,
      role: 'admin',
      status: 'active'
    }).get();

    if (!adminResult.data.length) {
      return {
        success: false,
        message: '无权限操作'
      };
    }

    // 获取用户信息
    const userResult = await db.collection('users').doc(userId).get();
    const user = userResult.data;

    if (!user) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    // 获取用户关联的公司信息
    const companyResult = await db.collection('companies')
      .where({
        userId: userId
      })
      .get();

    // 合并用户和公司信息
    const userInfo = {
      ...user,
      company: companyResult.data[0] || null
    };

    return {
      success: true,
      data: userInfo
    };
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return {
      success: false,
      message: '获取用户详情失败'
    };
  }
}; 
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

    // 删除用户
    await db.collection('users').doc(userId).remove();

    // 删除关联的公司信息
    const companyResult = await db.collection('companies').where({
      userId: userId
    }).get();

    if (companyResult.data.length) {
      await db.collection('companies').doc(companyResult.data[0]._id).remove();
    }

    return {
      success: true,
      message: '删除用户成功'
    };
  } catch (error) {
    console.error('删除用户失败:', error);
    return {
      success: false,
      message: '删除用户失败'
    };
  }
}; 
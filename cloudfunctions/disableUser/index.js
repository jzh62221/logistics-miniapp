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

    if (user.status !== 'active') {
      return {
        success: false,
        message: '用户已经是禁用状态'
      };
    }

    // 更新用户状态
    await db.collection('users').doc(userId).update({
      data: {
        status: 'disabled',
        updateTime: db.serverDate()
      }
    });

    // 更新公司状态
    const companyResult = await db.collection('companies').where({
      userId: userId
    }).get();

    if (companyResult.data.length) {
      await db.collection('companies').doc(companyResult.data[0]._id).update({
        data: {
          status: 'disabled',
          updateTime: db.serverDate()
        }
      });
    }

    return {
      success: true,
      message: '禁用用户成功'
    };
  } catch (error) {
    console.error('禁用用户失败:', error);
    return {
      success: false,
      message: '禁用用户失败'
    };
  }
}; 
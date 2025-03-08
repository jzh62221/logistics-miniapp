const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { userId, reason } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 验证管理员权限
    const admin = await db.collection('users')
      .where({
        _openid: OPENID,
        role: 'admin'
      })
      .get();

    if (!admin.data.length) {
      return {
        code: -1,
        message: '无权限操作'
      };
    }

    // 获取用户信息
    const user = await db.collection('users')
      .doc(userId)
      .get();

    if (!user.data) {
      return {
        code: -1,
        message: '用户不存在'
      };
    }

    if (user.data.status !== 'pending') {
      return {
        code: -1,
        message: '用户状态不正确'
      };
    }

    // 更新用户状态
    await db.collection('users')
      .doc(userId)
      .update({
        data: {
          status: 'rejected',
          rejectTime: db.serverDate(),
          rejectReason: reason,
          rejectedBy: admin.data[0]._id
        }
      });

    // 更新公司状态
    const companyResult = await db.collection('companies').where({
      userId: userId
    }).get();

    if (companyResult.data.length) {
      await db.collection('companies').doc(companyResult.data[0]._id).update({
        data: {
          status: 'rejected',
          rejectReason: reason,
          updateTime: db.serverDate()
        }
      });
    }

    return {
      code: 0,
      message: '拒绝成功'
    };
  } catch (error) {
    console.error('拒绝用户失败:', error);
    return {
      code: -1,
      message: '拒绝用户失败'
    };
  }
}; 
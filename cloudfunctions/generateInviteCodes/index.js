const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 生成随机邀请码
function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.main = async (event, context) => {
  const { count = 1, expireDate } = event;
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

    // 生成邀请码
    const inviteCodes = [];
    for (let i = 0; i < count; i++) {
      const code = generateCode();
      inviteCodes.push({
        code,
        status: 'unused',
        createTime: db.serverDate(),
        expireDate: new Date(expireDate),
        createBy: openid
      });
    }

    // 批量插入邀请码
    await db.collection('inviteCodes').add({
      data: inviteCodes
    });

    return {
      success: true,
      message: '生成成功'
    };
  } catch (error) {
    console.error('生成邀请码失败:', error);
    return {
      success: false,
      message: '生成邀请码失败'
    };
  }
}; 
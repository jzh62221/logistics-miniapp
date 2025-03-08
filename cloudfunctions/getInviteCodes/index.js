const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10 } = event;
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

    // 获取总数
    const total = await db.collection('inviteCodes').count();

    // 获取邀请码列表
    const inviteCodes = await db.collection('inviteCodes')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .orderBy('createTime', 'desc')
      .get();

    // 获取使用邀请码的用户信息
    const usedCodes = inviteCodes.data.filter(code => code.status === 'used');
    const userIds = usedCodes.map(code => code.userId);
    
    let users = [];
    if (userIds.length) {
      const userResult = await db.collection('users')
        .where({
          _id: _.in(userIds)
        })
        .get();
      users = userResult.data;
    }

    // 合并邀请码和用户信息
    const inviteCodeList = inviteCodes.data.map(code => {
      if (code.status === 'used') {
        const user = users.find(u => u._id === code.userId);
        return {
          ...code,
          userName: user ? user.name : '未知用户'
        };
      }
      return code;
    });

    return {
      success: true,
      data: {
        inviteCodes: inviteCodeList,
        total: total.total
      }
    };
  } catch (error) {
    console.error('获取邀请码列表失败:', error);
    return {
      success: false,
      message: '获取邀请码列表失败'
    };
  }
}; 
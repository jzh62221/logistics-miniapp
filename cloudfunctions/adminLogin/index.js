const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 密码加密函数
function encryptPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

exports.main = async (event, context) => {
  const { phone, password } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 查找管理员
    const adminResult = await db.collection('users').where({
      phone: phone,
      password: encryptPassword(password),
      role: 'admin'
    }).get();

    if (!adminResult.data.length) {
      return {
        success: false,
        message: '手机号或密码错误'
      };
    }

    const admin = adminResult.data[0];

    // 检查管理员状态
    if (admin.status !== 'active') {
      return {
        success: false,
        message: '账号已被禁用'
      };
    }

    // 更新管理员openid
    await db.collection('users').doc(admin._id).update({
      data: {
        _openid: openid,
        updateTime: db.serverDate()
      }
    });

    // 返回管理员信息（不包含密码）
    const { password: _, ...adminInfo } = admin;
    return {
      success: true,
      data: adminInfo
    };
  } catch (error) {
    console.error('管理员登录失败:', error);
    return {
      success: false,
      message: '登录失败'
    };
  }
}; 
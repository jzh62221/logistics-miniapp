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
  const { loginType, loginValue, password } = event;

  try {
    // 构建查询条件
    const query = {
      password: encryptPassword(password)
    };

    // 根据登录类型添加不同的查询条件
    if (loginType === 'username') {
      query.username = loginValue;
    } else {
      query.phone = loginValue;
    }

    // 查找用户
    const userResult = await db.collection('users').where(query).get();

    if (!userResult.data.length) {
      return {
        code: -1,
        message: '用户名或密码错误'
      };
    }

    const user = userResult.data[0];

    // 检查用户状态
    if (user.status !== 'active') {
      return {
        code: -1,
        message: '账号待审核或已被禁用'
      };
    }

    // 更新最后登录时间
    await db.collection('users').doc(user._id).update({
      data: {
        lastLoginTime: db.serverDate()
      }
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = user;
    return {
      code: 0,
      message: '登录成功',
      data: userInfo
    };
  } catch (error) {
    console.error('登录失败:', error);
    return {
      code: -1,
      message: '登录失败'
    };
  }
}; 
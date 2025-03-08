const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { phone, password } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 查询司机信息
    const driver = await db.collection('users')
      .where({
        phone,
        password,
        role: 'driver'
      })
      .get();

    if (!driver.data.length) {
      return {
        code: -1,
        message: '手机号或密码错误'
      };
    }

    // 检查账号状态
    if (driver.data[0].status !== 'active') {
      return {
        code: -1,
        message: '账号已被禁用'
      };
    }

    // 更新登录信息
    await db.collection('users')
      .doc(driver.data[0]._id)
      .update({
        data: {
          lastLoginTime: db.serverDate(),
          _openid: OPENID
        }
      });

    // 返回用户信息（不包含密码）
    const userInfo = { ...driver.data[0] };
    delete userInfo.password;

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
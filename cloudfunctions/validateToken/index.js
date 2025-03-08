const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { token } = event;
  
  try {
    // 验证token
    const verifyResult = await cloud.openapi.security.msgSecCheck({
      content: token,
      scene: 2,
      openid: context.OPENID
    });

    if (!verifyResult.valid) {
      return {
        valid: false,
        message: 'token无效'
      };
    }

    // 从token中获取用户ID
    const userId = verifyResult.userId;

    // 查询用户信息
    const userResult = await db.collection('users').doc(userId).get();

    if (!userResult.data) {
      return {
        valid: false,
        message: '用户不存在'
      };
    }

    const user = userResult.data;

    return {
      valid: true,
      userInfo: {
        _id: user._id,
        phone: user.phone,
        name: user.name
      },
      role: user.role,
      companyInfo: user.companyInfo
    };
  } catch (err) {
    console.error(err);
    return {
      valid: false,
      message: '验证失败'
    };
  }
}; 
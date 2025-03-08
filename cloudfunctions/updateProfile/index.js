const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  const { nickname, companyName, contactName, address } = event;
  const { OPENID } = cloud.getWXContext();

  try {
    // 查找用户
    const userResult = await db.collection('users').where({
      _openid: OPENID
    }).get();

    if (userResult.data.length === 0) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const user = userResult.data[0];

    // 更新用户信息
    await db.collection('users').doc(user._id).update({
      data: {
        nickName: nickname,
        updateTime: db.serverDate()
      }
    });

    // 更新公司信息
    const companyResult = await db.collection('companies').where({
      userId: user._id
    }).get();

    if (companyResult.data.length > 0) {
      await db.collection('companies').doc(companyResult.data[0]._id).update({
        data: {
          name: companyName,
          contactName,
          address,
          updateTime: db.serverDate()
        }
      });
    }

    return {
      success: true,
      message: '更新成功'
    };
  } catch (error) {
    console.error('更新失败:', error);
    return {
      success: false,
      message: '更新失败，请重试'
    };
  }
}; 
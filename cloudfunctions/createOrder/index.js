const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 生成订单号
function generateOrderNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}${month}${day}${random}`;
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { startLocation, endLocation, cargoInfo, price, unit, remark } = event;

  try {
    // 获取用户信息
    const { data: user, err: userErr } = await db.collection('users')
      .where({ _openid: OPENID })
      .get();

    if (userErr) {
      return {
        code: -1,
        message: '获取用户信息失败',
        error: userErr
      };
    }

    if (!user.length) {
      return {
        code: -1,
        message: '用户不存在'
      };
    }

    // 创建订单
    const orderData = {
      orderNo: generateOrderNo(),
      userId: user[0]._id,
      startLocation,
      endLocation,
      cargoInfo,
      price: Number(price),
      unit,
      remark,
      status: 'pending',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };

    const { data: order, err: orderErr } = await db.collection('orders')
      .add({
        data: orderData
      });

    if (orderErr) {
      return {
        code: -1,
        message: '创建订单失败',
        error: orderErr
      };
    }

    return {
      code: 0,
      message: '创建成功',
      data: order
    };
  } catch (error) {
    console.error('创建订单失败:', error);
    return {
      code: -1,
      message: '创建订单失败',
      error
    };
  }
}; 
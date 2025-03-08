const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { orderId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get();

    if (!userResult.data.length) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const user = userResult.data[0];

    // 获取订单信息
    const orderResult = await db.collection('orders').doc(orderId).get();
    const order = orderResult.data;

    if (!order) {
      return {
        success: false,
        message: '订单不存在'
      };
    }

    // 验证订单是否属于当前用户
    if (order.userId !== user._id) {
      return {
        success: false,
        message: '无权操作此订单'
      };
    }

    // 验证订单状态
    if (order.status !== 'pending') {
      return {
        success: false,
        message: '订单状态不允许取消'
      };
    }

    // 更新订单状态
    await db.collection('orders').doc(orderId).update({
      data: {
        status: 'cancelled',
        cancelTime: db.serverDate(),
        updateTime: db.serverDate()
      }
    });

    return {
      success: true,
      message: '订单取消成功'
    };
  } catch (error) {
    console.error('取消订单失败:', error);
    return {
      success: false,
      message: '取消订单失败'
    };
  }
}; 
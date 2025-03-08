const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { orderId } = event
  const { OPENID } = cloud.getWXContext()

  try {
    // 获取订单信息
    const order = await db.collection('orders')
      .doc(orderId)
      .get()

    if (!order.data) {
      return {
        code: -1,
        message: '订单不存在'
      }
    }

    if (order.data.status !== 'pending') {
      return {
        code: -1,
        message: '订单状态不正确'
      }
    }

    // 获取司机信息
    const driver = await db.collection('users')
      .where({
        _openid: OPENID,
        role: 'driver'
      })
      .get()

    if (!driver.data.length) {
      return {
        code: -1,
        message: '司机信息不存在'
      }
    }

    // 更新订单状态
    await db.collection('orders')
      .doc(orderId)
      .update({
        data: {
          status: 'accepted',
          driverId: driver.data[0]._id,
          acceptTime: db.serverDate()
        }
      })

    return {
      code: 0,
      message: '接单成功'
    }
  } catch (error) {
    console.error('接单失败:', error)
    return {
      code: -1,
      message: '接单失败'
    }
  }
} 
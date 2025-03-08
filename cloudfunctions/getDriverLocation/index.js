const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { orderId } = event

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

    if (order.data.status !== 'accepted') {
      return {
        code: -1,
        message: '订单状态不正确'
      }
    }

    // 获取司机最新位置
    const location = await db.collection('driverLocations')
      .where({
        driverId: order.data.driverId,
        orderId: orderId
      })
      .orderBy('updateTime', 'desc')
      .limit(1)
      .get()

    if (!location.data.length) {
      return {
        code: -1,
        message: '未获取到司机位置'
      }
    }

    return {
      code: 0,
      message: 'success',
      data: location.data[0]
    }
  } catch (error) {
    console.error('获取司机位置失败:', error)
    return {
      code: -1,
      message: '获取司机位置失败'
    }
  }
} 
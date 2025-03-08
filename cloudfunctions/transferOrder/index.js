const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { orderId, fromDriverId, toDriverId, reason } = event

  try {
    // 开启事务
    const transaction = await db.startTransaction()

    // 1. 检查订单状态
    const order = await transaction.collection('orders')
      .doc(orderId)
      .get()

    if (!order.data || order.data.status !== 'accepted') {
      await transaction.rollback()
      return {
        code: -1,
        message: '订单状态不正确'
      }
    }

    if (order.data.driverId !== fromDriverId) {
      await transaction.rollback()
      return {
        code: -1,
        message: '无权操作此订单'
      }
    }

    // 2. 检查目标司机状态
    const toDriver = await transaction.collection('users')
      .doc(toDriverId)
      .get()

    if (!toDriver.data || toDriver.data.role !== 'driver' || toDriver.data.status !== 'active') {
      await transaction.rollback()
      return {
        code: -1,
        message: '目标司机状态不正确'
      }
    }

    // 3. 更新订单信息
    await transaction.collection('orders')
      .doc(orderId)
      .update({
        data: {
          driverId: toDriverId,
          transferTime: db.serverDate(),
          transferReason: reason
        }
      })

    // 4. 发送通知
    await transaction.collection('notifications').add({
      data: {
        type: 'order_transferred',
        userId: toDriverId,
        orderId,
        title: '新订单转单',
        content: `您有一个新的转单订单，订单号：${order.data.orderNo}`,
        isRead: false,
        createTime: db.serverDate()
      }
    })

    // 提交事务
    await transaction.commit()

    return {
      code: 0,
      message: '转单成功'
    }
  } catch (error) {
    console.error('转单失败：', error)
    return {
      code: -1,
      message: '转单失败'
    }
  }
} 
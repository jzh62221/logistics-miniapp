const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 通知类型
const NOTIFICATION_TYPES = {
  ORDER_CREATED: 'order_created', // 新订单通知
  ORDER_ACCEPTED: 'order_accepted', // 订单被接单通知
  ORDER_COMPLETED: 'order_completed', // 订单完成通知
  ORDER_CANCELLED: 'order_cancelled', // 订单取消通知
  ORDER_TRANSFERRED: 'order_transferred', // 订单转单通知
  AUDIT_PASSED: 'audit_passed', // 审核通过通知
  AUDIT_REJECTED: 'audit_rejected' // 审核拒绝通知
}

exports.main = async (event, context) => {
  const { type, userId, orderId, title, content } = event

  try {
    // 创建通知记录
    const result = await db.collection('notifications').add({
      data: {
        type,
        userId,
        orderId,
        title,
        content,
        isRead: false,
        createTime: db.serverDate()
      }
    })

    return {
      code: 0,
      message: '发送成功',
      data: result._id
    }
  } catch (error) {
    console.error('发送通知失败：', error)
    return {
      code: -1,
      message: '发送失败'
    }
  }
} 
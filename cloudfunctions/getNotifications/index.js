const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { userId, page = 1, pageSize = 20 } = event

  try {
    // 获取通知列表
    const result = await db.collection('notifications')
      .where({
        userId
      })
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取未读数量
    const unreadCount = await db.collection('notifications')
      .where({
        userId,
        isRead: false
      })
      .count()

    return {
      code: 0,
      message: '获取成功',
      data: {
        list: result.data,
        total: result.data.length,
        unreadCount: unreadCount.total
      }
    }
  } catch (error) {
    console.error('获取通知列表失败：', error)
    return {
      code: -1,
      message: '获取失败'
    }
  }
} 
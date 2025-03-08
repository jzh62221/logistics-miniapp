const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 订单状态映射
const STATUS_MAP = {
  pending: '待接单',
  accepted: '运输中',
  completed: '已完成'
}

exports.main = async (event, context) => {
  const { status, page = 1, pageSize = 10 } = event
  const { OPENID } = cloud.getWXContext()

  try {
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

    // 构建查询条件
    const query = {
      driverId: driver.data[0]._id
    }
    if (status) {
      query.status = status
    }

    // 获取订单列表
    const orders = await db.collection('orders')
      .where(query)
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取总数
    const total = await db.collection('orders')
      .where(query)
      .count()

    // 处理订单数据
    const ordersData = orders.data.map(order => ({
      ...order,
      statusText: STATUS_MAP[order.status] || order.status,
      createTime: order.createTime ? new Date(order.createTime).toLocaleString() : ''
    }))

    return {
      code: 0,
      message: 'success',
      data: {
        list: ordersData,
        total: total.total,
        page,
        pageSize
      }
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return {
      code: -1,
      message: '获取订单列表失败'
    }
  }
} 
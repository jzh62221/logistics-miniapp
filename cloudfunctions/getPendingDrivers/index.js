const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { skip = 0, limit = 10 } = event
  const wxContext = cloud.getWXContext()

  try {
    // 验证管理员权限
    const adminUser = await db.collection('users').where({
      _openid: wxContext.OPENID,
      role: 'admin',
      status: 'active'
    }).get()

    if (!adminUser.data.length) {
      return {
        code: 403,
        message: '无权限访问'
      }
    }

    // 获取待审核司机列表
    const { data: drivers, total } = await db.collection('drivers')
      .where({
        status: 'pending'
      })
      .skip(skip)
      .limit(limit)
      .orderBy('createTime', 'desc')
      .get()

    return {
      code: 0,
      data: {
        data: drivers,
        total
      }
    }
  } catch (error) {
    console.error('获取待审核司机列表失败:', error)
    return {
      code: 500,
      message: '获取待审核司机列表失败'
    }
  }
} 
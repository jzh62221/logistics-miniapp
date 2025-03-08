const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { id, action } = event
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
        message: '无权限操作'
      }
    }

    // 获取待审核司机信息
    const driver = await db.collection('drivers').doc(id).get()
    if (!driver.data) {
      return {
        code: 404,
        message: '司机不存在'
      }
    }

    if (driver.data.status !== 'pending') {
      return {
        code: 400,
        message: '该司机状态不是待审核'
      }
    }

    // 更新司机状态
    await db.collection('drivers').doc(id).update({
      data: {
        status: action === 'approve' ? 'active' : 'rejected',
        auditTime: db.serverDate(),
        auditorId: adminUser.data[0]._id
      }
    })

    return {
      code: 0,
      message: action === 'approve' ? '审核通过' : '已拒绝'
    }
  } catch (error) {
    console.error('审核司机失败:', error)
    return {
      code: 500,
      message: '审核司机失败'
    }
  }
} 
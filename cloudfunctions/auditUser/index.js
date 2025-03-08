const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { userId, action } = event
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

    // 获取待审核用户信息
    const user = await db.collection('users').doc(userId).get()
    if (!user.data) {
      return {
        code: 404,
        message: '用户不存在'
      }
    }

    if (user.data.status !== 'pending') {
      return {
        code: 400,
        message: '该用户状态不是待审核'
      }
    }

    // 开启事务
    const transaction = await db.startTransaction()

    try {
      // 更新用户状态
      await transaction.collection('users').doc(userId).update({
        data: {
          status: action === 'approve' ? 'active' : 'rejected',
          auditTime: db.serverDate(),
          auditorId: adminUser.data[0]._id
        }
      })

      // 如果审核通过，更新公司状态
      if (action === 'approve' && user.data.companyId) {
        await transaction.collection('companies').doc(user.data.companyId).update({
          data: {
            status: 'active',
            auditTime: db.serverDate(),
            auditorId: adminUser.data[0]._id
          }
        })
      }

      // 提交事务
      await transaction.commit()

      return {
        code: 0,
        message: action === 'approve' ? '审核通过' : '已拒绝'
      }
    } catch (error) {
      // 回滚事务
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error('审核用户失败:', error)
    return {
      code: 500,
      message: '审核用户失败'
    }
  }
} 
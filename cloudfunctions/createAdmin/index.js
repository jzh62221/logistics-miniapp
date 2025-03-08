const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const crypto = require('crypto')

// 密码加密函数
function encryptPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

exports.main = async (event, context) => {
  const { username, password, name } = event

  try {
    // 检查用户名是否已存在
    const existUser = await db.collection('users')
      .where({
        username,
        role: 'admin'
      })
      .get()

    if (existUser.data.length > 0) {
      return {
        code: -1,
        message: '用户名已存在'
      }
    }

    // 创建管理员账户
    const result = await db.collection('users').add({
      data: {
        username,
        password: encryptPassword(password),
        name,
        role: 'admin',
        status: 'active',
        createTime: db.serverDate(),
        lastLoginTime: null,
        token: null
      }
    })

    return {
      code: 0,
      message: '创建成功',
      data: {
        id: result._id
      }
    }
  } catch (error) {
    console.error('创建管理员失败：', error)
    return {
      code: -1,
      message: '创建失败'
    }
  }
} 
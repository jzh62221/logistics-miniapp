const cloud = require('wx-server-sdk')
cloud.init()

const db = cloud.database()
const _ = db.command

// 密码加密函数
function encryptPassword(password) {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(password).digest('hex')
}

exports.main = async (event, context) => {
  const { phone, password, name, idCard, plateNumber, inviteCode, licenseImage } = event
  const wxContext = cloud.getWXContext()

  try {
    // 验证邀请码
    const inviteCodeResult = await db.collection('invite_codes').where({
      code: inviteCode,
      status: 'unused'
    }).get()

    if (!inviteCodeResult.data.length) {
      return {
        code: 400,
        message: '无效的邀请码'
      }
    }

    // 检查手机号是否已注册
    const driverResult = await db.collection('drivers').where({
      phone
    }).get()

    if (driverResult.data.length) {
      return {
        code: 400,
        message: '该手机号已注册'
      }
    }

    // 检查身份证号是否已注册
    const idCardResult = await db.collection('drivers').where({
      idCard
    }).get()

    if (idCardResult.data.length) {
      return {
        code: 400,
        message: '该身份证号已注册'
      }
    }

    // 检查车牌号是否已注册
    const plateResult = await db.collection('drivers').where({
      plateNumber
    }).get()

    if (plateResult.data.length) {
      return {
        code: 400,
        message: '该车牌号已注册'
      }
    }

    // 创建司机记录
    const driverData = {
      _openid: wxContext.OPENID,
      phone,
      password: encryptPassword(password),
      name,
      idCard,
      plateNumber,
      licenseImage,
      status: 'pending',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const driverAddResult = await db.collection('drivers').add({
      data: driverData
    })

    // 更新邀请码状态
    await db.collection('invite_codes').doc(inviteCodeResult.data[0]._id).update({
      data: {
        status: 'used',
        usedBy: phone,
        usedTime: db.serverDate()
      }
    })

    // 返回司机信息（不包含密码）
    const { password: _, ...driverInfo } = driverData
    return {
      code: 0,
      data: driverInfo
    }
  } catch (error) {
    console.error('司机注册失败:', error)
    return {
      code: 500,
      message: '注册失败'
    }
  }
} 
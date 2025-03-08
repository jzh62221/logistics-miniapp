const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

// 密码加密函数
function encryptPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

exports.main = async (event, context) => {
  const { phone, password, companyName, contactName, address, inviteCode } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 验证邀请码
    const inviteCodeResult = await db.collection('invite_codes').where({
      code: inviteCode,
      status: 'unused'
    }).get();

    if (!inviteCodeResult.data.length) {
      return {
        success: false,
        message: '无效的邀请码'
      };
    }

    // 检查手机号是否已注册
    const userResult = await db.collection('users').where({
      phone: phone
    }).get();

    if (userResult.data.length) {
      return {
        success: false,
        message: '该手机号已注册'
      };
    }

    // 创建用户记录
    const userData = {
      _openid: openid,
      phone,
      password: encryptPassword(password),
      role: 'user',
      status: 'pending',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };

    const userAddResult = await db.collection('users').add({
      data: userData
    });

    // 创建公司记录
    const companyData = {
      userId: userAddResult._id,
      name: companyName,
      contactName,
      address,
      status: 'pending',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    };

    await db.collection('companies').add({
      data: companyData
    });

    // 更新邀请码状态
    await db.collection('invite_codes').doc(inviteCodeResult.data[0]._id).update({
      data: {
        status: 'used',
        usedBy: phone,
        usedTime: db.serverDate()
      }
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...userInfo } = userData;
    return {
      success: true,
      data: userInfo
    };
  } catch (error) {
    console.error('注册失败:', error);
    return {
      success: false,
      message: '注册失败'
    };
  }
}; 
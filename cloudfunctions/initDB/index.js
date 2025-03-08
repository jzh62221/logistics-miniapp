const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 创建用户表
    await db.createCollection('users');
    await db.collection('users').createIndex({
      keys: {
        phone: 1
      },
      unique: true
    });

    // 创建公司表
    await db.createCollection('companies');
    await db.collection('companies').createIndex({
      keys: {
        userId: 1
      },
      unique: true
    });

    // 创建订单表
    await db.createCollection('orders');
    await db.collection('orders').createIndex({
      keys: {
        orderNo: 1
      },
      unique: true
    });

    // 创建司机表
    await db.createCollection('drivers');
    await db.collection('drivers').createIndex({
      keys: {
        phone: 1
      },
      unique: true
    });

    // 创建短信验证码表
    await db.createCollection('sms_codes');
    await db.collection('sms_codes').createIndex({
      keys: {
        phone: 1,
        createTime: -1
      }
    });

    return {
      success: true,
      message: '数据库初始化成功'
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: '数据库初始化失败'
    };
  }
}; 
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    // 测试数据库连接
    const collections = ['users', 'companies', 'orders', 'drivers', 'sms_codes'];
    const dbStatus = {};
    
    for (const collection of collections) {
      try {
        await db.collection(collection).count();
        dbStatus[collection] = '正常';
      } catch (err) {
        dbStatus[collection] = '异常';
      }
    }

    // 测试短信服务
    const phone = '13800138000'; // 测试手机号
    const code = '123456';
    
    const smsResult = await cloud.callFunction({
      name: 'smsService',
      data: {
        action: 'send',
        phone,
        code
      }
    });

    return {
      success: true,
      message: '测试完成',
      data: {
        database: dbStatus,
        sms: smsResult.result
      }
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: '测试失败',
      error: err
    };
  }
}; 
const cloud = require('wx-server-sdk');

// 初始化云开发环境
cloud.init({
  env: 'cloudbase-7g2amcg192929a12'
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    console.log('开始初始化...');

    // 创建数据库集合
    const collections = ['users', 'companies', 'orders', 'drivers', 'invite_codes'];
    console.log('准备创建集合:', collections);

    for (const collection of collections) {
      try {
        await db.createCollection(collection);
        console.log(`集合 ${collection} 创建成功`);
      } catch (err) {
        console.log(`集合 ${collection} 可能已存在:`, err);
      }
    }

    console.log('开始创建索引...');

    // 创建索引
    try {
      await db.collection('users').createIndex({
        keys: { phone: 1 },
        unique: true
      });
      console.log('users 索引创建成功');
    } catch (err) {
      console.log('users 索引创建失败:', err);
    }

    try {
      await db.collection('companies').createIndex({
        keys: { userId: 1 },
        unique: true
      });
      console.log('companies 索引创建成功');
    } catch (err) {
      console.log('companies 索引创建失败:', err);
    }

    try {
      await db.collection('orders').createIndex({
        keys: { orderNo: 1 },
        unique: true
      });
      console.log('orders 索引创建成功');
    } catch (err) {
      console.log('orders 索引创建失败:', err);
    }

    try {
      await db.collection('drivers').createIndex({
        keys: { phone: 1 },
        unique: true
      });
      console.log('drivers 索引创建成功');
    } catch (err) {
      console.log('drivers 索引创建失败:', err);
    }

    try {
      await db.collection('invite_codes').createIndex({
        keys: { code: 1 },
        unique: true
      });
      console.log('invite_codes 索引创建成功');
    } catch (err) {
      console.log('invite_codes 索引创建失败:', err);
    }

    console.log('开始创建管理员账号...');

    // 创建管理员账号
    const adminResult = await db.collection('users').where({
      role: 'admin'
    }).get();

    if (adminResult.data.length === 0) {
      await db.collection('users').add({
        data: {
          phone: '13800138000',
          name: '系统管理员',
          role: 'admin',
          status: 'approved',
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });
      console.log('管理员账号创建成功');
    } else {
      console.log('管理员账号已存在');
    }

    console.log('开始生成邀请码...');

    // 生成测试邀请码
    const inviteResult = await db.collection('invite_codes').where({
      status: 'unused'
    }).get();

    if (inviteResult.data.length === 0) {
      const codes = [];
      for (let i = 0; i < 5; i++) {
        const code = generateRandomCode();
        codes.push({
          code,
          status: 'unused',
          createTime: db.serverDate()
        });
      }

      await db.collection('invite_codes').add({
        data: codes
      });
      console.log('邀请码生成成功:', codes);
    } else {
      console.log('已有可用邀请码');
    }

    return {
      success: true,
      message: '初始化成功',
      data: {
        collections: collections,
        adminPhone: '13800138000',
        inviteCodes: inviteResult.data
      }
    };
  } catch (err) {
    console.error('初始化失败:', err);
    return {
      success: false,
      message: '初始化失败',
      error: {
        message: err.message,
        stack: err.stack
      }
    };
  }
};

// 生成随机邀请码
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
} 
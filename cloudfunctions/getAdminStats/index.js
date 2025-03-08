const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    // 获取总用户数
    const totalUsers = await db.collection('users')
      .where({
        role: 'user'
      })
      .count();

    // 获取待审核用户数
    const pendingAudits = await db.collection('users')
      .where({
        role: 'user',
        status: 'pending'
      })
      .count();

    // 获取总订单数
    const totalOrders = await db.collection('orders')
      .count();

    // 获取活跃司机数
    const activeDrivers = await db.collection('users')
      .where({
        role: 'driver',
        status: 'active'
      })
      .count();

    return {
      code: 0,
      message: 'success',
      data: {
        totalUsers: totalUsers.total,
        pendingAudits: pendingAudits.total,
        totalOrders: totalOrders.total,
        activeDrivers: activeDrivers.total
      }
    };
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return {
      code: -1,
      message: '获取统计数据失败'
    };
  }
}; 
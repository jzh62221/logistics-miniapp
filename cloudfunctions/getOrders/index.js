const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { status, page = 1, pageSize = 10 } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 获取用户信息
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get();

    if (!userResult.data.length) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const user = userResult.data[0];

    // 构建查询条件
    let query = db.collection('orders').where({
      userId: user._id
    });

    // 如果指定了状态，添加状态筛选
    if (status) {
      query = query.where({
        status: status
      });
    }

    // 获取总数
    const countResult = await query.count();
    const total = countResult.total;

    // 获取订单列表
    const orders = await query
      .orderBy('createTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    return {
      success: true,
      data: {
        orders: orders.data,
        total,
        page,
        pageSize
      }
    };
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return {
      success: false,
      message: '获取订单列表失败'
    };
  }
}; 
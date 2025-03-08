const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 验证管理员权限
    const adminResult = await db.collection('users').where({
      _openid: openid,
      role: 'admin',
      status: 'active'
    }).get();

    if (!adminResult.data.length) {
      return {
        success: false,
        message: '无权限操作'
      };
    }

    // 获取最近的活动记录
    const activities = await db.collection('activities')
      .where({
        type: _.in(['user_register', 'user_audit', 'user_status_change'])
      })
      .orderBy('createTime', 'desc')
      .limit(10)
      .get();

    // 格式化时间
    const formattedActivities = activities.data.map(activity => ({
      ...activity,
      createTime: formatTime(activity.createTime)
    }));

    return {
      success: true,
      data: formattedActivities
    };
  } catch (error) {
    console.error('获取活动记录失败:', error);
    return {
      success: false,
      message: '获取活动记录失败'
    };
  }
};

// 格式化时间
function formatTime(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
} 
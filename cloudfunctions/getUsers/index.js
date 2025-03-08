const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { page = 1, pageSize = 10, searchKey = '' } = event;
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

    // 构建查询条件
    const query = {
      role: 'user'
    };

    // 添加搜索条件
    if (searchKey) {
      query.phone = db.RegExp({
        regexp: searchKey,
        options: 'i'
      });
    }

    // 获取总数
    const total = await db.collection('users').where(query).count();

    // 获取用户列表
    const users = await db.collection('users')
      .where(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .orderBy('createTime', 'desc')
      .get();

    // 获取用户关联的公司信息
    const userIds = users.data.map(user => user._id);
    const companyResult = await db.collection('companies')
      .where({
        userId: _.in(userIds)
      })
      .get();

    // 合并用户和公司信息
    const userList = users.data.map(user => {
      const company = companyResult.data.find(c => c.userId === user._id);
      return {
        ...user,
        company: company || null
      };
    });

    return {
      success: true,
      data: {
        users: userList,
        total: total.total
      }
    };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return {
      success: false,
      message: '获取用户列表失败'
    };
  }
}; 
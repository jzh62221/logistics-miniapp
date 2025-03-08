const cloud = require('wx-server-sdk');
cloud.init();

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { skip = 0, limit = 10 } = event;
  const wxContext = cloud.getWXContext();

  try {
    // 验证管理员权限
    const adminUser = await db.collection('users').where({
      _openid: wxContext.OPENID,
      role: 'admin',
      status: 'active'
    }).get();

    if (!adminUser.data.length) {
      return {
        code: 403,
        message: '无权限访问'
      };
    }

    // 获取待审核用户列表
    const { data: users, total } = await db.collection('users')
      .where({
        status: 'pending'
      })
      .skip(skip)
      .limit(limit)
      .orderBy('createTime', 'desc')
      .get();

    // 获取用户关联的公司信息
    const companyIds = users.map(user => user.companyId).filter(Boolean);
    const companies = await db.collection('companies')
      .where({
        _id: _.in(companyIds)
      })
      .get();

    const companyMap = {};
    companies.data.forEach(company => {
      companyMap[company._id] = company;
    });

    // 合并用户和公司信息
    const userList = users.map(user => ({
      ...user,
      company: user.companyId ? companyMap[user.companyId] : null
    }));

    return {
      code: 0,
      data: {
        users: userList,
        total
      }
    };
  } catch (error) {
    console.error('获取待审核用户列表失败:', error);
    return {
      code: 500,
      message: '获取待审核用户列表失败'
    };
  }
}; 
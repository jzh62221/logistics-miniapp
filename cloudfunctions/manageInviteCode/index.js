const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { action, code, count = 1 } = event;
  
  try {
    switch (action) {
      case 'generate':
        return await generateInviteCodes(count);
      case 'list':
        return await listInviteCodes();
      case 'delete':
        return await deleteInviteCode(code);
      default:
        return {
          success: false,
          message: '无效的操作'
        };
    }
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: '操作失败'
    };
  }
};

// 生成邀请码
async function generateInviteCodes(count) {
  const codes = [];
  for (let i = 0; i < count; i++) {
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

  return {
    success: true,
    message: '生成成功',
    data: codes
  };
}

// 列出邀请码
async function listInviteCodes() {
  const result = await db.collection('invite_codes')
    .orderBy('createTime', 'desc')
    .get();

  return {
    success: true,
    data: result.data
  };
}

// 删除邀请码
async function deleteInviteCode(code) {
  await db.collection('invite_codes')
    .where({ code })
    .remove();

  return {
    success: true,
    message: '删除成功'
  };
}

// 生成随机邀请码
function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
} 
const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { inviteCodeId } = event;
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

    // 获取邀请码信息
    const inviteCodeResult = await db.collection('inviteCodes').doc(inviteCodeId).get();
    const inviteCode = inviteCodeResult.data;

    if (!inviteCode) {
      return {
        success: false,
        message: '邀请码不存在'
      };
    }

    // 检查邀请码状态
    if (inviteCode.status === 'used') {
      return {
        success: false,
        message: '已使用的邀请码不能删除'
      };
    }

    // 删除邀请码
    await db.collection('inviteCodes').doc(inviteCodeId).remove();

    return {
      success: true,
      message: '删除成功'
    };
  } catch (error) {
    console.error('删除邀请码失败:', error);
    return {
      success: false,
 
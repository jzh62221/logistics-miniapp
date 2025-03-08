const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    loading: false
  },

  // 输入绑定
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  // 登录处理
  async handleLogin() {
    const { phone, password } = this.data;

    // 表单验证
    if (!phone || !password) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'login',
        data: { phone, password }
      });

      if (res && res.result && res.result.code === 0) {
        // 同步到 globalData 和本地存储
        app.globalData.token = res.result.token;
        app.globalData.userInfo = res.result.data || {};
        app.globalData.role = res.result.data.role || null;
        
        wx.setStorageSync('token', res.result.token);
        wx.setStorageSync('userInfo', res.result.data || {});
        wx.setStorageSync('role', res.result.data.role || null);

        wx.showToast({ title: '登录成功', icon: 'success' });

        // 根据角色跳转到对应页面
        setTimeout(() => {
          const role = res.result.data.role;
          let url = '';
          switch (role) {
            case 'admin':
              url = '/pages/admin/index';
              break;
            case 'user':
              url = '/pages/user/index';
              break;
            case 'driver':
              url = '/pages/driver/index';
              break;
            default:
              url = '/pages/user/index'; // 默认跳用户首页，避免不存在页面
          }
          wx.reLaunch({ url });
        }, 1500);
      } else {
        wx.showToast({
          title: res.result.message || '手机号或密码错误',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error.errMsg.includes('network') ? '网络错误，请检查网络' : '登录失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({ url: '/pages/register/index' });
  }
});
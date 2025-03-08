App({
  globalData: {
    userInfo: {}, // 改成空对象，避免属性访问报错
    token: null,
    role: null, // 'client', 'driver', 'admin'
    companyInfo: {} // 改成空对象
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloudbase-7g2amcg192929a12',
        traceUser: true,
      });
    }
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.validateToken();
    } else {
      // 未登录时跳转到登录页
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  validateToken() {
    wx.cloud.callFunction({
      name: 'validateToken',
      data: { token: this.globalData.token }
    }).then(res => {
      if (res && res.result && res.result.valid) {
        this.globalData.userInfo = res.result.userInfo || {};
        this.globalData.role = res.result.role || null;
        this.globalData.companyInfo = res.result.companyInfo || {};
        wx.setStorageSync('userInfo', res.result.userInfo || {});
        wx.setStorageSync('role', res.result.role || null);
        wx.setStorageSync('companyInfo', res.result.companyInfo || {});
        // 验证成功后可以跳转到主页
        wx.switchTab({ url: '/pages/index/index' });
      } else {
        this.clearLoginInfo();
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
        wx.navigateTo({ url: '/pages/login/login' });
      }
    }).catch(err => {
      console.error('Token validation failed:', err);
      this.clearLoginInfo();
      wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      wx.navigateTo({ url: '/pages/login/login' });
    });
  },

  clearLoginInfo() {
    this.globalData.token = null;
    this.globalData.userInfo = {};
    this.globalData.role = null;
    this.globalData.companyInfo = {};
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('role');
    wx.removeStorageSync('companyInfo');
  },

  login(phone, code) {
    return new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'login',
        data: { phone, code }
      }).then(res => {
        if (res && res.result && res.result.success) {
          this.globalData.token = res.result.token;
          this.globalData.userInfo = res.result.userInfo || {};
          this.globalData.role = res.result.role || null;
          this.globalData.companyInfo = res.result.companyInfo || {};
          
          wx.setStorageSync('token', res.result.token);
          wx.setStorageSync('userInfo', res.result.userInfo || {});
          wx.setStorageSync('role', res.result.role || null);
          wx.setStorageSync('companyInfo', res.result.companyInfo || {});
          
          wx.showToast({ title: '登录成功', icon: 'success' });
          resolve(res.result);
        } else {
          wx.showToast({ title: res.result.message || '登录失败', icon: 'none' });
          reject(res.result);
        }
      }).catch(err => {
        console.error('Login failed:', err);
        wx.showToast({ title: '网络错误，请重试', icon: 'none' });
        reject(err);
      });
    });
  }
});
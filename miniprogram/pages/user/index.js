// pages/user/index.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.getUserInfo();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
    } else {
      // 未登录，跳转到登录页
      wx.navigateTo({
        url: '/pages/login/index'
      });
    }
  },

  goToOrders() {
    wx.navigateTo({
      url: '/pages/order/list/index'
    });
  },

  goToProfile() {
    wx.navigateTo({
      url: '/pages/user/profile/index'
    });
  },

  contactService() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail() {
        wx.showToast({
          title: '拨打电话失败',
          icon: 'none'
        });
      }
    });
  },

  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/index'
    });
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          
          // 跳转到登录页
          wx.reLaunch({
            url: '/pages/login/index'
          });
        }
      }
    });
  }
})
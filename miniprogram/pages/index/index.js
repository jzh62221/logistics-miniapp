// pages/index/index.js
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    isLogin: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
    this.checkLoginStatus()
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
    this.checkLoginStatus()
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

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.setData({
        isLogin: true
      })
    } else {
      this.setData({
        isLogin: false
      })
    }
  },

  // 获取用户信息
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '/pages/register/index'
    })
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/index'
    })
  },

  // 跳转到订单页面
  goToOrder() {
    wx.navigateTo({
      url: '/pages/order/index'
    })
  }
})
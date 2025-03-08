Page({
  data: {
    fromAddress: '',
    toAddress: '',
    cargoInfo: '',
    freight: ''
  },

  handleSubmit() {
    const { fromAddress, toAddress, cargoInfo, freight } = this.data;
    
    if (!fromAddress || !toAddress || !cargoInfo || !freight) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '创建中...'
    });

    wx.cloud.callFunction({
      name: 'createOrder',
      data: {
        fromAddress,
        toAddress,
        cargoInfo,
        freight
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        });
        // 清空表单
        this.setData({
          fromAddress: '',
          toAddress: '',
          cargoInfo: '',
          freight: ''
        });
        // 返回订单列表页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: res.result.message || '创建失败',
          icon: 'none'
        });
      }
    }).catch(error => {
      console.error('创建订单失败:', error);
      wx.showToast({
        title: '创建失败，请重试',
        icon: 'none'
      });
    }).finally(() => {
      wx.hideLoading();
    });
  }
}); 
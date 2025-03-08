const app = getApp();

Page({
  data: {
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    contactName: '',
    address: '',
    inviteCode: ''
  },

  handlePhoneInput(e) {
    this.setData({
      phone: e.detail.value
    });
  },

  handlePasswordInput(e) {
    this.setData({
      password: e.detail.value
    });
  },

  handleConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  handleCompanyNameInput(e) {
    this.setData({
      companyName: e.detail.value
    });
  },

  handleContactNameInput(e) {
    this.setData({
      contactName: e.detail.value
    });
  },

  handleAddressInput(e) {
    this.setData({
      address: e.detail.value
    });
  },

  async chooseImage() {
    try {
      const res = await wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });

      wx.showLoading({
        title: '上传中...'
      });

      const cloudPath = `license/${Date.now()}-${Math.random().toString(36).substr(2)}.${res.tempFilePaths[0].match(/\.[^.]+?$/)[0]}`;
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath: res.tempFilePaths[0]
      });

      this.setData({
        licenseImage: uploadRes.fileID
      });

      wx.hideLoading();
    } catch (error) {
      console.error('上传图片失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '上传失败，请重试',
        icon: 'none'
      });
    }
  },

  checkFormValid() {
    const { phone, password, confirmPassword, companyName, contactName, address, inviteCode } = this.data;

    if (!phone || !password || !confirmPassword || !companyName || !contactName || !address || !inviteCode) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return false;
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return false;
    }

    if (password.length < 6) {
      wx.showToast({
        title: '密码长度不能少于6位',
        icon: 'none'
      });
      return false;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  async handleRegister() {
    if (!this.checkFormValid()) return;

    wx.showLoading({
      title: '注册中...'
    });

    try {
      const result = await wx.cloud.callFunction({
        name: 'register',
        data: {
          phone: this.data.phone,
          password: this.data.password,
          companyName: this.data.companyName,
          contactName: this.data.contactName,
          address: this.data.address,
          inviteCode: this.data.inviteCode
        }
      });

      if (result.result.success) {
        wx.showToast({
          title: '注册成功',
          icon: 'success'
        });

        // 保存用户信息
        wx.setStorageSync('userInfo', result.result.data);

        // 返回上一页或首页
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            wx.navigateBack();
          } else {
            wx.switchTab({
              url: '/pages/index/index'
            });
          }
        }, 1500);
      } else {
        wx.showToast({
          title: result.result.message || '注册失败',
          icon: 'none'
        });
      }
    } catch (error) {
      console.error('注册失败:', error);
      wx.showToast({
        title: '注册失败，请重试',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  goToLogin() {
    wx.navigateBack();
  }
}); 
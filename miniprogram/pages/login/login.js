const app = getApp().globalData
//云数据库初始化
const db = wx.cloud.database({});
const getCustomerInfo = db.collection('customerInfo');
Page({
  data: {
    show: false, //是否显示加载中。。false不显示
    motto: '登录',
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName') // 如需尝试获取用户信息可改为false
  },
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },
  // 获取用户OPENID，unionid
  onLogin(){
    var that = this
    that.setData({show: true})
    wx.cloud.callFunction({    //添加livingHistory表记录
      name: 'login',
      success: res => {
        // 存储openid，unionid，userinfo等用户信息
        that.data.userInfo.openid = res.result.openid
        that.data.userInfo.unionid = res.result.unionid
        app.userInfo = that.data.userInfo
        app.isLogin = true
        this.getCustomer(app.userInfo.openid)
        wx.setStorage({
          key: 'userInfo',
          data: that.data.userInfo,
        })
        console.log('☀ login.js ▌ success userInfo:',that.data.userInfo)
        
      },
      fail: err => {
        wx.showToast({
          title: '登录失败~',
        })
        console.log('☀ login.js ▌ fail userInfo :',that.userInfo)
      }
    })
  },
  getCustomer(openid){
    getCustomerInfo.where({
      openid: openid
    })
    .get({
      success: res => {
        console.log('☀ index.js ▌ getCustomerInfoFun 查询用户信息 : ', res.data[0])
        if(res.data.length){
          app.customer = res.data[0]
          wx.setStorage({
            data: res.data[0],
            key: 'customer',
          })
        }
        wx.navigateBack() // 返回     
      },
      fail: err => {
        console.log('☀ index.js ▌ getCustomerInfoFun 查询用户数据失败   ☞  ',err)
      }

    })
  },
  // 弹出获取用户信息同意框
  getUserProfile(e) {
    var　that = this 
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        that.onLogin()
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  getUserInfo(e) {
    // 不推荐使用getUserInfo获取用户信息，预计自2021年4月13日起，getUserInfo将不再弹出弹窗，并直接返回匿名的用户个人信息
    this.setData({
      userInfo: e.detail.userInfo
    })
  },
  onUnload(){
    var pages = getCurrentPages();
    var beforePage = pages[pages.length - 2];
    beforePage.onLoad()
  }
})

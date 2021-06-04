//app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'onelittlestep-gf44s',
        traceUser: true,
      })
    }
    let that = this
    // 全屏
    wx.getSystemInfo({
      success:function(res){
        let clientHeight = res.windowHeight
        let clientWidth = res.windowWidth
        let ratio = 750 / clientWidth
        let rpxHeight = ratio * clientHeight
        that.globalData.rpxHeight = rpxHeight
      }
     })
  },
  globalData : {
    sendVerifyCode: "https://mall.onelittlestep.net/zms/zms_tools_io/io_sendVerifyCode" , // 获取验证码
    verifyCode: "https://mall.onelittlestep.net/zms/zms_tools_io/io_verifyCode",  // 手机验证
    customer : {
      baby:[]
    }, // 用户信息
    userInfo: {}, // 用户微信信息
    openid: "", // openid
    unionid: "", // unionid微信开放平台
    // isLogin: false, // 是否登录
    rpxHeight: 0, // 屏幕高度
  }
})

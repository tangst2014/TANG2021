const app = getApp().globalData
import util from "../../utils/util.js";
//云数据库初始化
const db = wx.cloud.database({});
const getCustomerInfo = db.collection('customerInfo');
Page({
  data: {
    motto: '登记',
    customer: 
    {  
      openid: '',
      customerName: '',
      // 宝宝信息
      baby:
      [
        // 宝宝信息结构  
       // {   
          // babyName:'',
          // babySex:'',
          // babyBirthday:'',
          // babyRegion:'' 
       // }
      ] 
    },
    show: false,
    isAddCustomeInfo: false,   // 是否填写信息，有用户信息不填写，
    noGetOfficial: false , // 关注公众号是否加载失败

    // 滑动模块
    issubmitForm: false,
    rpxHeight:app.rpxHeight?app.rpxHeight:500, 
    background: ['demo-text-1', 'demo-text-2', 'demo-text-3'],
    swiper:{
      'name': false,
      'age': false,
      'region': false,
      'phone': false,
      'welcome': false,
      'btn':false
    },
    btnSwiper: '下一页',
    indicatorDots: true,
    vertical: false,
    autoplay: false,
    interval: 2000,
    currentTab: 0,
    duration: 500,
    // 选择器
    year: [],
    month: ['01','02','03','04','05','06','07','08','09','10','11','12'],
    region: ['广东省', '广州市', '海珠区'],
    customItem: '全部'

  },
  onLoad: function() {
 
    let that = this 
   
    // 初始化年选择器内容
    let timestamp = Date.parse(new Date());
    let date = new Date(timestamp);
    //获取年份  
    let Y =date.getFullYear();
    console.log(Y)
    if(!Y){
      // 没有值，默认
      Y = 2088
    }
    for(let i = 2000;i<=Y;i++){
      that.data.year.push(i)
    }
    that.setData({year:that.data.year})
    console.log(that.data.year)
    if(app.editCount<1){
      wx.showToast({
        title: '请勿恶意提交',
      })
      app.editCount = 3
    }
    console.log('☀ index.js ▌ onLoad app.customer : ', app.customer)
    // 1，查询本地用户信息
    if(app.customer.baby.length){
       // 计算年龄
       let age = 0
       for(var i=0;i<app.customer.baby.length;i++){
         age = this.getAge(app.customer.baby[i].babyBirthday)
         app.customer.baby[i].age = age
       }
       that.setData({
         customer: app.customer,
         hasSubmit: true,
         motto: '修改',
       })
       // 后台重新刷新本地缓存
      this.getCustomerDataNoOpenid()
    }else{
      // 2，没有本地信息
      // 查询数据库，有openid,直接查询；没有openid,先获取opendi
      // 
      if(app.userInfo == undefined||JSON.stringify(app.userInfo) == "{}"){
        // app.userInfo.openid为空或undefined
        that.getCustomerDataNoOpenid()
      }else{
        // 登陆过
        that.getCustomerData(app.userInfo)
      }
      
    }

  },


  // 获取用户信息
  getCustomerData(openid){
    var that = this
    getCustomerInfo.where({
      openid: openid
    })
    .get({
      success: res => {
        console.log('☀ index.js ▌ getCustomerData 查询用户信息 : ', res.data)
        that.data.isGetCustomer = true // 成功查询过
        if(res.data.length){
          app.customer = res.data[0]
          // 计算年龄
          let age = 0
          for(var i=0;i<app.customer.baby.length;i++){
            age = this.getAge(app.customer.baby[i].babyBirthday)
            app.customer.baby[i].age = age
          }
          that.setData({
            customer:app.customer,
            hasSubmit: true,
            motto: '修改'
          })
          wx.setStorage({
            data: res.data[0],
            key: 'customer',
          })
        }else{
          // 没有查询到数据
          app.customer = {
            baby:[]
          } // 用户信息
          that.setData({
            customer:app.customer,
            hasSubmit: false,
            motto: '登记'
          })
          wx.setStorage({
            data: app.customer,
            key: 'customer',
          })
        }
      },
      fail: err => {
        console.log('☀ index.js onload ▌ getCustomerInfoFun 查询用户数据失败   ☞  ',err)
      }

    })
  },
  // 获取用户OPENID，unionid
  getCustomerDataNoOpenid(){
    var that = this
    wx.cloud.callFunction({    //添加livingHistory表记录
      name: 'login',
      success: res => {
        // 存储openid，unionid，userinfo等用户信息
        console.log(res.result) 
        app.userInfo.openid = res.result.openid
        app.userInfo.unionid = res.result.unionid
        this.getCustomerData(app.userInfo.openid)
      },
      fail: err => {
        console.log('☀ login.js ▌ fail userInfo :', err)
      }
    })
  },
 
  // 弹出获取用户信息同意框
  onAddCustomeInfo(e) {
    var　that = this 
    that.setData({show:true})
    setTimeout(function () {
      that.setData({
        show: false
      })
    }, 2000)
  
    //app.userInfo.userInfo包括头像，微信名等信息
    if(app.userInfo.userInfo == undefined||JSON.stringify(app.userInfo.userInfo) == "{}"){
      // 获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
      wx.getUserProfile({
        desc: '用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
        success: (res) => {
          console.log('getUserProfile', res.userInfo)
          app.userInfo.userInfo = res.userInfo
          wx.setStorage({
            key: 'userInfo',
            data: app.userInfo,
          })
          that.setData({
            userInfo: res.userInfo,
            hasUserInfo: true,
          })
          wx.navigateTo({
            url: '/pages/forms/forms',
          })
        },
        fail:(err) => {
          that.setData({show:false})
        }
      })
    }else{
      wx.navigateTo({
        url: '/pages/forms/forms',
      })
    }
    
  },
  // 根据出生日期计算年龄周岁
  getAge(strBirthday){
      let yearAge = 0
      let mouthAge = 0
      let strBirthdayArr = strBirthday.split("-");
      let birthYear = strBirthdayArr[0];
      let birthMonth = strBirthdayArr[1];
      let birthDay = strBirthdayArr[2];
      let d = new Date();
      let nowYear = d.getFullYear();
      let nowMonth = d.getMonth() + 1;
      let nowDay = d.getDate();
      if (nowYear == birthYear) {
        // yearAge = 0; //同年 则为0岁
        let monthDiff = nowMonth - birthMonth; //月之差 
        if (monthDiff < 0) {
          return yearAge = -1; //返回-1 表示出生日期输入错误 晚于今天
        } else {
          mouthAge = monthDiff;
        }
      } else {
        let ageDiff = nowYear - birthYear; //年之差
        if (ageDiff > 0) {
          if (nowMonth == birthMonth) {
            let dayDiff = nowDay - birthDay; //日之差 
            if (dayDiff < 0) {
              yearAge = ageDiff - 1 ;
            } else {
              yearAge = ageDiff;
            }
          } else {
            let monthDiff = nowMonth - birthMonth; //月之差 
            if (monthDiff < 0) {
              yearAge = ageDiff - 1;
            } else {
              mouthAge = monthDiff;
              yearAge = ageDiff;
            }
          }
        } else {
          return yearAge = -1; //返回-1 表示出生日期输入错误 晚于今天
        }
      }
      let age = {}
      age.yearAge= yearAge
      age.mouthAge = mouthAge
      return age; //返回周岁年龄+月份
  },
  // 跳转到公众号
  addwxGroup(e){
    let index = e.currentTarget.dataset.index
    if(this.data.customer.baby[index].age.yearAge<2){
      wx.navigateTo({
        url: '/pages/wxGroupOne/wxGroupOne',
      })
    }else if(this.data.customer.baby[index].age.yearAge<4){
      wx.navigateTo({
        url: '/pages/wxGroupTwo/wxGroupTwo',
      })
    }else if(this.data.customer.baby[index].age.yearAge<6){
      wx.navigateTo({
        url: '/pages/wxGroupThree/wxGroupThree',
      })
    }else if(this.data.customer.baby[index].age.yearAge<8){
      wx.navigateTo({
        url: '/pages/wxGroupFive/wxGroupFive',
      })
    }else{
      wx.navigateTo({
        url: '/pages/wxGroupFive/wxGroupFive',
      })
    }
  },
  // 公众号加载成功
  officialLoad(detail ){
    console.log('☀ index.js ▌ officialLoad detail',detail.detail)
    this.setData({
      noGetOfficial: false
    })
  },
  // 公众号加载失败
  officialError(detail){
    console.log('☀ index.js ▌ officialError detail',detail.detail)
    this.setData({
      noGetOfficial: true
    })
  },
  // 跳转公众号文章
  onOfficialArticle(){
    wx.navigateTo({
      url: '/pages/wxGroupFour/wxGroupFour',
    })
  },
  changeIndicatorDots() {
    this.setData({
      indicatorDots: !this.data.indicatorDots
    })
  },
  // 点击下一页
  onSwiper(){
    if(!this.data.swiper.name){
      this.setData({
        'swiper.name':true,
        currentTab:1
      })
    }else if(!this.data.swiper.age){
      this.setData({
        'swiper.age':true,
        currentTab:2
      })
    }else if(!this.data.swiper.region){
      this.setData({
        'swiper.region':true,
        currentTab:3
      })
    }else if(!this.data.swiper.phone){
      this.setData({
        'swiper.phone':true,
        currentTab:4
      })
    }else if(!this.data.swiper.welcome){
      this.setData({
        'swiper.welcome':true,
        currentTab:5
      })
    }
   
  },
  // picl选择器事件
  // 年
  bindPickerYearChange: function(e) {
    console.log( e.detail.value)
    let yindex =  e.detail.value
    this.setData({
      yindex,
    })
  },
  // 月
  bindPickerMonthChange: function(e) {
    let mindex =  e.detail.value
    console.log(mindex)
    this.setData({
      mindex,
      // month: this.data.month[mindex]
    })
  },
  // 区域
  bindRegionChange: function (e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      region: e.detail.value
    })
  },
  // 点击名字页
  submitName(event){
    let that = this
    const {detail} = event;
    console.log('submitPhone',detail.value)
    that.data.customer.customerName = detail.value.customerName
    // 下一页
    that.onSwiper()

  },
  // 点击宝宝页1
  submitBabyInfo(event){
    let that = this
    let baby = {}
    const {detail} = event;
    console.log('submitBabyInfo',detail.value)
    baby.babyName = detail.value.babyName
    baby.babySex = detail.value.babySex
    baby.babyBirthday = that.data.year[detail.value.babyYear] + '-' + that.data.month[detail.value.babyMonth]
    that.data.customer.baby.push(baby)
    // 下一页
    that.onSwiper()
  },
   // 点击省份页
  submitRegion(event){
    let that = this
    const {detail} = event;
    console.log('submitRegion',detail.value)
    that.data.customer.customerRegion = detail.value.customerRegion
    // 下一页
    that.onSwiper()

  },
  // 点击手机页
  submitPhone(event){
    let that = this
    const {detail} = event;
    console.log('submitPhone',detail.value)
    that.data.customer.customerPhone = detail.value.customerPhone
    that.setData({
      issubmitForm:true
    })
    // 下一页
    console.log('that.data.customer',that.data.customer)
    that.onSwiper()

  }
   
  
 
})

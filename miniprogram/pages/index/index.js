const app = getApp().globalData
import util from "../../utils/util.js";
import wxRequest from "../../utils/wxRequest.js";
//云数据库初始化
const db = wx.cloud.database({});
const getCustomerInfo = db.collection('customerInfo');
Page({
  data: {
    //顾客信息
    customer: 
    {  
      // userInfo: {}, // 微信等信息
      // openid: '',
      // unionid:'', // unionid微信开放平台
      // customerName: '',
      // customerPhone: '',
      // customerRegion: '',
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

    isAdd: true, // 判断是添加信息还是修改，true为添加信息,false为修改
    gender: [
      {name: '男', value: '1', checked:'false'},
      {name: '女', value: '0', checked:'false'}
    ],
    selectIndex:5,
    tempBaby: {}, // 临时存储1个宝宝信息
    show: false, // 遮罩层
    toastShow: false, // 提示框
    toastSuccessShow: false, // 成功提示
    toastFailShow: false, // 失败提示
    noGetOfficial: false , // 关注公众号是否加载失败

    // 滑动模块
    rpxHeight:app.rpxHeight?app.rpxHeight:500, 
    background: ['demo-text-1', 'demo-text-2', 'demo-text-3'],
    swiper:{
      'name': false,
      'baby': false,
      'region': false,
      'phone': false,
      'welcome': false,
      'btn':false
    },
    addbabyText: '添加',
    btnSwiper: '下一页',
    btnSubmit: '提交',
    indicatorDots: true,
    vertical: false,
    autoplay: false,
    interval: 2000,
    currentTab: 0,
    duration: 500,
    // 选择器
    year: [],
    month: ['01','02','03','04','05','06','07','08','09','10','11','12'],
    region: ['贵州省', '贵阳市', '南明区'],
    customItem: '全部',
    // 手机页
    verifyCodeText: "获取验证码",
    verifyCodeBtnDisable: false, // 是否点击获取验证码，避免重复获取
    isSendVerifyCode: true, //提交按钮是否有效，手机输入11位，同时验证码输入4位，提交按钮才有效
    isPhoneRight: false,  //手机输入11位
    isVerifyCodeRight: false ,  //验证码输入4位
    issubmitFormLoading: false, // 是否显示提交中。。
    issubmitFormed: false, // 注册成功

  },
  onLoad: function() {
    let that = this 

    // 初始化openid,之前获取openid一直失败，这加入try，catch看看原因,好像加入try，catch才能获取，待查

    if(!app.openid){
      console.log("onload 没有openid，getOpenid")
      that.getOpenid()
    }
   
    
    // 初始化年选择器内容
    let timestamp = Date.parse(new Date());
    let date = new Date(timestamp);

    //获取年份  
    let Y =date.getFullYear();
    if(!Y){
      // 没有值，默认
      Y = 2088
    }
    for(let i = 2000;i<=Y;i++){
      that.data.year.push(i)
    }
    that.setData({year:that.data.year})

    // 修改次数提醒
    if(app.editCount<1){
      wx.showToast({
        title: '请勿恶意提交',
        icon: 'error',
      })
      app.editCount = 3
    }
    
    // 用户信息
    console.log('☀ index.js ▌ onLoad app.customer : ', app.customer)
    if(app.customer.baby.length){
       // 1，查询本地用户信息
       // 计算年龄
       let age = 0
       for(var i=0;i<app.customer.baby.length;i++){
         age = this.getAge(app.customer.baby[i].babyBirthday)
         app.customer.baby[i].age = age
       }
       console.log('app.customer',app.customer)
       that.setData({
         customer: app.customer,
         isAdd: false
       })
       //测试
       that.setData(
        {
          'swiper.name': true,
          'swiper.baby': true,
          'swiper.region': true,
          'swiper.phone': true,
          'swiper.welcome': true,
          'swiper.btn':true,
          addbabyText: '继续添加',
          btnSwiper: '保存'
         }
       )

       // 后台重新刷新本地缓存
       this.getCustomerDataNoOpenid()
    }else{
      // 2，没有本地信息
      // 查询数据库，有openid,直接查询；没有openid,先获取opendi
      // 
      if(!app.openid){
        // app.openid为空或undefined
        that.getCustomerDataNoOpenid()
      }else{
        // 登陆过
        that.getCustomerData(app.openid)
      }
    }
  },
  getOpenid(){
    try{
      wx.cloud.callFunction({    //添加livingHistory表记录
        name: 'login',
        success: res => {
          // 存储用户id信息
          console.log('☀ index.js onLoad ▌ 获取OPENID :', res.result)
          app.openid = res.result.openid
          app.unionid = res.result.unionid
          wx.setStorage({
            data: app.openid,
            key: 'openid',
          })
          wx.setStorage({
            data: app.unionid,
            key: 'unionid',
          })
         
        },
        fail: err => {
          console.log('☀ index.js onLoad ▌ 获取OPENID失败 :', err)
        }
      })
    }catch(err){
      console.log('☀ index.js onLoad ▌ 获取OPENID失败 :', err)
    }
  },
  // 获取用户信息
  getCustomerData(openid){
    var that = this
    if(openid ==''){
      console.log('☀ login.js ▌ openid 为空，不能获取用户信息')
      return
    }
    getCustomerInfo.where({
      _openid: app.openid
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
            isAdd: false
          })
          wx.setStorage({
            data: res.data[0],
            key: 'customer',
          })
          //测试
          that.setData({
              'swiper.name': true,
              'swiper.baby': true,
              'swiper.region': true,
              'swiper.phone': true,
              'swiper.welcome': true,
              'swiper.btn':true,
              addbabyText: '继续添加',
              btnSwiper: '保存'
            })
        }else{
          // 没有查询到数据
          app.customer = {
            baby:[]
          } // 用户信息
          that.setData({
            customer:app.customer,
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
        // 存储用户id信息
        app.openid = res.result.openid
        app.unionid = res.result.unionid
        wx.setStorage({
          data: app.openid,
          key: 'openid',
        })
        wx.setStorage({
          data: app.unionid,
          key: 'unionid',
        })
        that.getCustomerData(app.openid)
      },
      fail: err => {
        console.log('☀ login.js ▌ fail :', err)
      }
    })
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
  // 分页，点点点
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
      return
    }else if(!this.data.swiper.baby){
      this.setData({
        'swiper.baby':true,
        currentTab:2
      })
      return
    }else if(!this.data.swiper.region){
      this.setData({
        'swiper.region':true,
        //  currentTab:3 
      })
      return
    }else if(!this.data.swiper.phone){
      this.setData({
        'swiper.phone':true,
        currentTab:4
      })
      return
    }else if(!this.data.swiper.welcome){
      this.setData({
        'swiper.welcome':true,
        currentTab:5
      })
      return
    }
  },
  // picl选择器事件
  // 年
  bindPickerYearChange: function(e) {
    let yindex =  e.detail.value
    this.setData({
      'tempBaby.babyYear':  this.data.year[yindex]
    })
  },
  // 月
  bindPickerMonthChange: function(e) {
    let mindex =  e.detail.value
    this.setData({
      'tempBaby.babyMonth': this.data.month[mindex]
    })
  },
  // 区域
  bindRegionChange: function (e) {
    this.setData({
      region: e.detail.value
    })
  },
  getUserProfile(e) {

    var　that = this 
    // 获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        app.userInfo = res.userInfo
        // 跳转下一页
        that.onSwiper()
        wx.setStorage({
          data:  res.userInfo,
          key: 'userInfo',
        })
      }
    })
  },
  // 戳我进群
  // 先验证本地是否有用户微信信息，openid是否获取到
  onAddStep(){
    // 弹出获取用户信息同意框
    if(app.userInfo == undefined||JSON.stringify(app.userInfo) == "{}"){
      // 本地没有微信等信息
      this.getUserProfile()
    }else{
      // 有，直接跳转下一页
      if(!this.data.swiper.name){
        this.onSwiper()
      }
    }
  },
  // 点击名字页
  submitName(event){
    let that = this
    //测试
    if(that.data.btnSwiper=="保存"){
      wx.showToast({
        title: '已保存',
      })
    }
    
    const {detail} = event;

    //中英文姓名验证(考虑到少数名族和外国人名字很长)：
    if (!(/^[\u4E00-\u9FA5A-Za-z]+$/.test(detail.value.customerName))) {
        wx.showToast({
          title: '姓名只能是汉字或英文~',
          duration: 2000,
          icon: 'none'
        });
        return
    }
    if(detail.value.customerName.length>20){
      wx.showToast({
        title: '姓名太长了~',
        duration: 2000,
        icon: 'none'
      });
      return
    }
    that.data.customer.customerName = detail.value.customerName
    // 下一页
    
    that.onSwiper()

  },

  
  // 点击宝宝页
  submitBabyInfo(event){
    let that = this
    let baby = {}
    const {detail} = event;
     //中英文姓名验证(考虑到少数名族和外国人名字很长)：
     if (!(/^[\u4E00-\u9FA5A-Za-z]+$/.test(detail.value.babyName))) {
      wx.showToast({
        title: '姓名只能是汉字或英~',
        duration: 2000,
        icon: true
      });
      return
    }
    if(detail.value.babyName.length>20){
      wx.showToast({
        title: '姓名太长了~',
        duration: 2000,
        icon: 'none'
      });
      return
    }
    if (!(/^.{4}$/.test(detail.value.babyYear))) {
      wx.showToast({
        title: '请输入年份~',
        duration: 2000,
        icon: 'none'
      });
      return
    }
    if (!(/^.{2}$/.test(detail.value.babyMonth))) {
      wx.showToast({
        title: '请输入月份~',
        duration: 2000,
        icon: 'none'
      });
      return
    }
    if (!detail.value.babySex) {
      wx.showToast({
        title: '请选择性别~',
        duration: 2000,
        icon: 'none'
      });
      return
    }
    baby.babyName = detail.value.babyName
    baby.babySex = detail.value.babySex
    baby.babyBirthday = detail.value.babyYear + '-' + detail.value.babyMonth
    if(that.data.customer.baby.length>4){
      wx.showToast({
        title: '超过5，不能再添加~',
        duration: 2000,
        icon: 'error',
      });
      return
    }
   
    // 添加
    this.addBaby(baby)

  },

  // 添加宝宝信息
  addBaby(baby){
    let that = this
     // 确认框
     wx.showModal({
      title: '添加宝宝',
      content: '继续添加宝宝~',
      success: function (res) {
        if (res.confirm) {
          that.data.customer.baby.push(baby)
          that.setData({
            selectIndex:5,
            ['customer.baby'] : that.data.customer.baby,
            addbabyText: '继续添加',
            tempBaby:{},
          })
          // this.data.swiper.region是生活在。。。这页的跳转，若为真，则已经添加该页，在该页上继续添加宝宝时不应该再次跳转
          if(!that.data.swiper.region){
            that.onSwiper()
          }
          
        } 
      }
    })
  },

  // 点击省份页
  submitRegion(event){
    let that = this
    //测试
    if(that.data.btnSwiper=="保存"){
      wx.showToast({
        title: '已保存',
      })
    }
    const {detail} = event;
    that.data.customer.customerRegion = detail.value.customerRegion
    // 下一页
    that.onSwiper()
  },

  // 手机号
  // isPhoneRight: false,  //手机输入11位
  // isVerifyCodeRight: false ,//验证码输入4位
  customerPhoneInput:function(e){
      var customerPhone = e.detail.value

      if(e.detail.value.length==11){
        this.setData({
          'customer.customerPhone': customerPhone,
           isPhoneRight: true
        })
      }else{
        this.setData({
           isPhoneRight: false
        })
      }
      if(this.data.isVerifyCodeRight && this.data.isPhoneRight){
        this.setData({
          isSendVerifyCode : false // 手机号11位，验证码4位，提交有效
        })
      }else{
        this.setData({
          isSendVerifyCode : true // 手机号11位，验证码4位，提交有效
        })
      }
      
  },
  // 验证码，输入4位验证码，提交按钮才有效
  verifyCodePhoneInput:function(e){
    // 最大长度4

    if(e.detail.value.length==4){
      this.setData({
        isVerifyCodeRight: true
      })
    }else{
      this.setData({
        isVerifyCodeRight: false
      })
    }
    if(this.data.isVerifyCodeRight && this.data.isPhoneRight){
      this.setData({
        isSendVerifyCode : false // 手机号11位，验证码4位，提交有效
      })
    }else{
      this.setData({
        isSendVerifyCode : true // 手机号11位，验证码4位，提交有效
      })
    }
  },
  // 验证码倒计时
  goGetCode:function(){
    var that = this;
    var time = 60;
    that.setData({
      verifyCodeText: '60秒后重发',
      verifyCodeBtnDisable: true
    })
    var Interval = setInterval(function() {
      time--;
      if (time>0){
        that.setData({
          verifyCodeText: time + '秒后重发'
        })
      }else{
        clearInterval(Interval);
        that.setData({
          verifyCodeText: '重新获取',
          verifyCodeBtnDisable: false 
        })
      }
    },1000)

  },
  // 手机页，对手机验证码进行验证
  submitPhone(event){
    var that = this
    that.goGetCode() // 验证码倒计时,点击获取得时候就开始计时
    var customerPhone = event.currentTarget.dataset.phone
    console.log(event.currentTarget.dataset.phone)
    //正则验证
    if (!(/^((13[0-9])|(14[0-9])|(15[0-9])|(17[0-9])|(18[0-9]))\d{8}$/.test(customerPhone))) {
        wx.showToast({
        title: '手机号码有误',
        duration: 2000,
        icon:'none'
        });
        return
    }
    //获取验证码
    var url = app.sendVerifyCode
    var args = {
      phone: customerPhone
    }
    var verifyCode = wxRequest.getRequest(url, args)
    verifyCode.then((res) => {
      console.log('index.js | submitPhone sendVerifyCode: ', res.data)
      //rst: "1", msg: "已发送验证码，有效期60秒"
      if (res.statusCode == 200 && res.data.rst == "1") {
         
      }
    })
  },
  
  // 点击手机页，提交
  submitForm(event){
      var that = this
      const {detail} = event;
      that.setData({
        isSendVerifyCode : true, // 提交变灰色
        issubmitFormLoading:true  // 加载中
      })
      //保存手机号
      that.data.customer.customerPhone = detail.value.customerPhone 
      //验证：
      var url = app.verifyCode
      var args = {
        phone: that.data.customer.customerPhone,
        verifyCode: detail.value.Verification
      }
      var verifyCode = wxRequest.getRequest(url, args)
      verifyCode.then((res) => {
        
        console.log('index.js | submitForm verifyCode: ', res.data)
        // rst: "1", msg: "验证通过"
        //rst: "0", msg: "验证失败"}
        if (res.statusCode == 200 && res.data.rst == "1") {
            console.log('手机验证通过',res.data.msg)
            that.data.customer.openid =  app.openid
            that.data.customer.unionid =  app.unionid
            that.data.customer.userInfo =  app.userInfo
            console.log('☀ index.js ▌ submit 提交到数据库的信息 :',that.data.customer)
            that.addCustomerInfo()
            wx.setStorage({
              data:  that.data.customer,
              key: 'customer',
            })
           
        }else{
          wx.showToast({
            title: '手机验证失败！',
            icon: 'error'
          })
          that.setData({
            isSendVerifyCode : false, // 提交变灰色
            issubmitFormLoading:false  // 加载中
          })
          return
        }
      })
  },
  // 表单提交
  addCustomerInfo(){
    var that = this
    that.setData({show:true})
    if(that.data.isAdd){
      // 添加信息
      that.addFormData()
    }else{
      // 修改信息
      that.editFormData()
    }
  },
  // 提交到数据库
  addFormData(){
    var that = this
    if(app.openid){
      // openid已经获取
      that.hasOpenidAdd()
    }else{
      // openi没有获取
      that.hasNoOpenidAdd()
    }
  },
  // 有open时添加
  hasOpenidAdd(){
    var that = this
    //openid有值
    let time = util.formatTime(new Date)  // 获取当前最新时间,
    wx.cloud.callFunction({    //添加livingHistory表记录
      name: 'addCustomerInfo',
      data: {
        table: 'customerInfo',
        openid: app.openid,
        unionid: app.unionid,
        userInfo: app.userInfo,
        customerName :  that.data.customer.customerName,
        customerPhone : that.data.customer.customerPhone,
        customerRegion :  that.data.customer.customerRegion,
        baby: that.data.customer.baby,
        time: time
      },
      success: res => {
        console.log('注册成功add: ',res)
        that.setData({
          issubmitFormed: true, //注册成功
          issubmitFormLoading:false , //加载中取消
          toastSuccessShow:true
        })
       
        that.onSwiper()  
        app.customer = this.data.customer
        wx.setStorage({
          data: that.data.customer,
          key: 'customer',
        })
      },
      fail: err => {
        console.log('注册失败err： ',err)
        that.setData({
          toastFailShow:true
        }) 
      }
    })
  },
  // 没有open时添加
  hasNoOpenidAdd(){
    var that = this
    wx.cloud.callFunction({    //添加livingHistory表记录
      name: 'login',
      success: res => {
        // 存储用户id信息
        app.openid = res.result.openid
        app.unionid = res.result.unionid
        that.hasOpenidAdd()  // 提交数据
        wx.setStorage({
          data: app.openid,
          key: 'openid',
        })
        wx.setStorage({
          data: app.unionid,
          key: 'unionid',
        })
       
      },
      fail: err => {
        console.log('☀ index.js ▌ 提交时获取OPENID失败 :', err)
      }
    })
  },
  editFormData(){
    var that = this
    app.editCount--
    if(app.editCount<1){
      that.setData({show:false})
      wx.showToast({
        icon: 'error',
        title: '请勿恶意提交',
      })
      return   
    }
    wx.cloud.callFunction({    //添加livingHistory表记录
      name: 'editCustomerInfo',
      data: {
        _id: that.data.customer._id,
        customerName :  that.data.customer.customerName,
        customerPhone : that.data.customer.customerPhone,
        customerAddress :  that.data.customer.customerRegion,
        baby: that.data.customer.baby,
      },
      success: res => {
        console.log('修改成功： ',res)
        that.setData({
          issubmitFormed: true, //修改成功
          issubmitFormLoading:false , //加载中取消
          toastSuccessShow:true
        })
        that.onSwiper()

        app.customer = this.data.customer
        wx.setStorage({
          data: that.data.customer,
          key: 'customer',
        })
      },
      fail: err => {
        console.log('修改失败： ',err)
        that.setData({
          toastFailShow:true
        })
      }
    })
  },
})

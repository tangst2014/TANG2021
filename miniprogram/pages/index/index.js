// 本地缓存userinfo,customer，userinfo为登录信息；customer为用户信息（包括userinfo）
// 1，addCustomerInfo添加到数据库时候会缓存；2，getCustomerInfoFun从数据库读取数据的时候会缓存
// 用户信息包括openid（用于查询）、微信名称等信息，用户手机、名字及宝宝信息，宝宝信息（必填）
// 采用LinUI库，form 表单验证也采用LinUI表单验证，需要初始化wx.lin.initValidateForm(this)
// 跳转到登录页；1，没有userInfo即跳转，包括了用户删除又重登录，第一次登录的情况，信息查询放到登录页
const app = getApp().globalData
import util from "../../utils/util.js";
//云数据库初始化
const db = wx.cloud.database({});
const getCustomerInfo = db.collection('customerInfo');
Page({
  data: {
    isLogin:false, // 未登录
    customer: 
    {  
      //顾客信息
      userInfo: {}, // 微信等信息
      openid: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
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
    isShowBabyInfo: false, // 是否添加宝宝信息
    isAddBaby: true, // 防止添加宝宝数量的时候重复触发函数
    // 表单验证
    telphoneRules:{
      required: true,
      message: '请填写正确手机号码',
      pattern: '^[1][3-9]{1}[0-9]{9}$',
      trigger: 'blur',
    },
    nameRules:[
      {type: 'string',required: true,message: '必选项不能为空',trigger: 'blur'},
      { min: 1, max: 5, message: '名字长度在1-10个字符之间', trigger: 'change' }
    ],
    regionRules:[
      {type: 'string',required: true,message: '必选项不能为空',trigger: 'blur'},
      { min: 1, max: 5, message: '宝宝区域长度在1-5个字符之间', trigger: 'change' }
    ],
    addressRules:[
      {type: 'string',required: true,message: '必选项不能为空',trigger: 'blur'},
      { min: 1, max: 30, message: '地址长度在1-50个字符之间', trigger: 'change' }
    ],
    tempBaby: {}, // 临时存储1个宝宝信息
    tempIndex: '', // 临时存储序号
    isAddorEdit: true, // 判断是添加信息还是修改，true为添加信息,false为修改
    toastShow: false, // 提示框
    toastSuccessShow: false, // 成功提示
    toastFailShow: false, // 失败提示
    maskShow: false, // 遮罩层
    hasSubmit: false, //输入框禁用
    hasUserInfo: false ,   // 是否获取用户信息
    noGetOfficial: false , // 关注公众号是否加载失败
    isLoading: false // 加载动画

  },
  onLoad: function() {
    // 使用linUI的 form 组件时需要在 onLoad 中调用 wx.lin.initValidateForm(this)进行初始化。
    wx.lin.initValidateForm(this)

    let that = this 
  
    // 1，查询本地用户信息（有本地信息，则一定登录过，不需要验证登录）
    console.log('app.customer:',app.customer)
    if(app.userInfo == undefined||JSON.stringify(app.userInfo) == "{}"){
      wx.navigateTo({
        url: '/pages/login/login',
      })
      return
    }

    if(app.customer.baby.length){
       // 有本地信息,计算年龄
       let age = 0
       for(var i=0;i<app.customer.baby.length;i++){
         age = this.getAge(app.customer.baby[i].babyBirthday)
         app.customer.baby[i].age = age
       }
       that.setData({
         customer: app.customer,
         isLogin:true,
         hasSubmit: true
       })
    }else{
      that.setData({
        hasSubmit: false,
      })
      that.getCustomer()
    }

  },
  onShow(options){
    this.setData({isLogin: app.isLogin})
    console.log('☀ index.js ▌ onShow ☞  option',options)
  },
  
  // 点击日历
  bindDateChange: function(e) {
    this.setData({
      'tempBaby.babyBirthday': e.detail.value
    })
  },
  // 获取用户信息
  getCustomer(){
    var that = this
    getCustomerInfo.where({
      openid: app.userInfo.openid
    })
    .get({
      success: res => {
        console.log('☀ index.js ▌ getCustomer 查询用户信息 : ', res.data[0])
        if(res.data.length){
          app.customer = res.data[0]
          that.setData({
            customer:app.customer,
            hasSubmit: true,
          })
          wx.setStorage({
            data: res.data[0],
            key: 'customer',
          })
        }else{
          that.setData({
            hasSubmit: false,
          })
        }
      },
      fail: err => {
        console.log('☀ index.js ▌ getCustomerInfoFun 查询用户数据失败   ☞  ',err)
      }

    })
  },
  // 添加宝宝信息
  // maskShow控制遮罩层显示与隐藏，true为显示，同时设置了locked状态为true，即点击背景的时候不关闭
  // isShowBabyInfo为添加宝宝信息弹出层，true为显示
  // isAddorEdit判断是添加信息还是修改，true为添加信息,false为修改
  addBabyInfo(e){
    this.data.isAddorEdit = true
    this.setData({
      isShowBabyInfo: true,
      maskShow: true,
      tempBaby:{}
    })
  },
   // 点击宝宝名字，修改相关信息
   // isAddorEdit判断是添加信息还是修改，true为添加信息,false为修改
   onEditBabyInfo(e){
    this.data.isAddorEdit = false
    this.data.tempIndex = e.currentTarget.dataset.index
    let tempBaby = this.data.customer.baby[this.data.tempIndex]
    this.setData({
      isShowBabyInfo:true,
      maskShow:true,
      tempBaby
    })
  },
   // 删除宝宝信息,如果数据库已经有数据，会禁用删除
   deleteBabyInfo(e){
    if(this.data.hasSubmit){
      return
    }
    // 没有宝宝信息，不做删除
    let index = e.currentTarget.dataset.index
    if(!this.data.customer.baby.length){
      return
    }
    this.data.customer.baby.splice(index, 1)
    this.setData({
     ['customer.baby']:this.data.customer.baby,
   })

  },
  // 宝宝信息保存
  saveBabyInfo(event){
    const {detail} = event;
    // 若表单验证不正确，则返回
    if(!detail.isValidate){  
      return
    }
    if( this.data.isAddorEdit){
      // 添加宝宝信息
      // 如果宝宝保存超过5个，则返回
      if(this.data.customer.baby.length>4){
        this.setData({
          isShowBabyInfo:false,
          maskShow:false
        })
        return
      }
      let {babyName,babySex,babyBirthday,babyRegion} = detail.values
      this.data.customer.baby.push({babyName,babySex,babyBirthday,babyRegion})
    }else{
      // 修改宝宝信息
      this.data.customer.baby[this.data.tempIndex] = detail.values

    }
    this.setData({
      isShowBabyInfo:false,
      maskShow:false,   
      ['customer.baby']:this.data.customer.baby
    })
  
    console.log('☀ index.js ▌ saveBabyInfo ☞  宝宝的信息 baby:',this.data.customer.baby)
  },
 
  // 返回主界面
  onBabyInfoBack(){
    this.setData({
      isShowBabyInfo:false,
      maskShow:false 
    })
  },

  // 表单提交
  submit(event){
    // 已经弹窗获取用户信息，不在弹出
    const {detail} = event;
    var that = this;
    // 当isValidate为false时，表单数据校验不正确提示
    if(!detail.isValidate){
      that.setData({
        toastFailShow:true
      })
      return
    }
    // 没有填写宝宝信息提示
    if(!that.data.customer.baby.length){
      that.setData({
        toastShow:true
      })
      return
    }
    // 确认框
    wx.showModal({
      title: '确认提交',
      content: '提交之后不能再修改！',
      success: function (res) {
        if (res.confirm) {
          that.data.customer.customerName =  detail.values.customerName
          that.data.customer.customerPhone = detail.values.customerPhone
          that.data.customer.customerAddress =  detail.values.customerAddress
          that.data.customer.openid =  app.userInfo.openid
          that.data.customer.userInfo =  app.userInfo.userInfo
          console.log('☀ index.js ▌ submit 提交到数据库的信息 customer :',that.data.customer,that.data.userInfo)
          that.addCustomerInfo()
        } else {
          return
        }
      }
    })
  },
  addCustomerInfo(){
    var that = this
    let time = util.formatTime(new Date)  // 获取当前最新时间,
    wx.cloud.callFunction({    //添加livingHistory表记录
      name: 'addCustomerInfo',
      data: {
        table: 'customerInfo',
        openid: that.data.customer.openid,
        userInfo: that.data.customer.userInfo,
        customerName :  that.data.customer.customerName,
        customerPhone : that.data.customer.customerPhone,
        customerAddress :  that.data.customer.customerAddress,
        baby: that.data.customer.baby,
        time: time
      },
      success: res => {
        that.setData({
          hasSubmit: true,
          toastSuccessShow:true
        })
        wx.setStorage({
          data: that.data.customer,
          key: 'customer',
        })
      },
      fail: err => {
        that.setData({
          toastFailShow:true
        }) 
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
  }

})

//index.js
const app = getApp()
//云数据库初始化
import util from "../../utils/util.js";
const db = wx.cloud.database({});
const getCustomerInfo = db.collection('customerInfo');
Page({
  data: {
    customer: 
    {  // 顾客信息
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        baby:[
          // {   宝宝信息结构
          //   babyName:'',
          //   babySex:'',
          //   babyBirthday:'',
          //   babyRegion:'' 
          // }
        ] 
    },
    isShowBabyInfo: false, // 是否添加宝宝信息
    isAddBaby: true, // 防止添加宝宝数量的时候重复触发函数
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




  },
  onLoad: function() {
    console.log(' onLoad')
    var that = this 
    wx.lin.initValidateForm(this)  // 使用linUI的 form 组件时需要在 onLoad 中调用 wx.lin.initValidateForm(this)进行初始化。
    // 读取本地存储
    var customer = wx.getStorageSync('customerInfo')
    let age = ''
    if(customer){
      // 计算年龄
      for(var i=0;i<customer.baby.length;i++){
        age = this.getAge(customer.baby[i].babyBirthday)
        customer.baby[i].age = age
      }
      that.setData({
        customer: customer,
        hasSubmit:true
      })
    }      

    // db.collection('erweima').get({   //图片
    //   success: res => {
    //     console.log(' ☀ index.js ▌ onLoad get erweima   ☞  res.data:',res.data)
    //     that.setData({
    //       erweima1:res.data[0].url,
    //       erweima2:res.data[1].url,
    //     })
    //     wx.setStorage({
    //       key: 'erweima',
    //       data: res.data,
    //     })
    //   },
    // })
   // this.getCustomerInfoFun() // 测试
    // var xisu = wx.getStorageSync('xisu')
  },
  // 访问云数据库   
  getCustomerInfoFun(){
    var that = this;
    //1、引用数据库   
    //2、开始查询数据了  news对应的是集合的名称
    getCustomerInfo.where({
      _id:'28ee4e3e60b0d26b1d8d380021eb5fe9'
    })
    .get({
      //如果查询成功的话    
      success: res => {
        console.log(' ☀ index.js ▌ getCustomerInfoFun getCustomerInfo   ☞  res.data:',res.data)
        //这一步很重要，给ne赋值，没有这一步的话，前台就不会显示值
        let age = ''
        if(res.data.length){
          for(var i=0;i<res.data[0].baby.length;i++){
            age = this.getAge(res.data[0].baby[i].babyBirthday)
            res.data[0].baby[i].age = age
          }
          that.setData({
            customer: res.data[0],
            hasSubmit:true
          })
        }      
       

      }
    })
  },
  // 点击日历
  bindDateChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      'tempBaby.babyBirthday': e.detail.value
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
    console.log(' ☀ index.js ▌ onBabyName ☞ 当前为修改信息:',tempBaby)
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
  
    console.log(' ☀ index.js ▌ saveBabyInfo ☞  宝宝的信息:',this.data.customer.baby)
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
    this.data.customer.customerName =  detail.values.customerName
    this.data.customer.customerPhone = detail.values.customerPhone
    this.data.customer.customerAddress =  detail.values.customerAddress
    console.log('~ index.js submit customer 提交到数据库的信息:',this.data.customer)
    that.setData({
      hasSubmit: true,
      toastSuccessShow:true
    })
    this.addCustomerInfo()

  },
  addCustomerInfo(){
    var that = this
    console.log('addCustomerInfo调用[云函数')
    let time = util.formatTime(new Date)  // 获取当前最新时间,
    wx.cloud.callFunction({    //添加livingHistory表记录
      name: 'addCustomerInfo',
      data: {
        table: 'customerInfo',
        customerName :  that.data.customer.customerName,
        customerPhone : that.data.customer.customerPhone,
        customerAddress :  that.data.customer.customerAddress,
        baby: that.data.customer.baby,
        time: time
      },
      success: res => {
        wx.setStorage({
          data: that.data.customer,
          key: 'customerInfo',
        })
          console.log('addCustomerInfo调用[云函数]成功 ', res)
      },
      fail: err => {
        that.setData({
          toastFailShow:true
        })
        console.log('addCustomerInfo云函数调用失败', err)
      }
    })
  },
  // 根据出生日期计算年龄周岁
  getAge(strBirthday){
      let returnAge = ''
      let mouthAge = ''
      let strBirthdayArr = strBirthday.split("-");
      let birthYear = strBirthdayArr[0];
      let birthMonth = strBirthdayArr[1];
      let birthDay = strBirthdayArr[2];
      let d = new Date();
      let nowYear = d.getFullYear();
      let nowMonth = d.getMonth() + 1;
      let nowDay = d.getDate();
      if (nowYear == birthYear) {
        // returnAge = 0; //同年 则为0岁
        let monthDiff = nowMonth - birthMonth; //月之差 
        if (monthDiff < 0) {
        } else {
          mouthAge = monthDiff + '个月';
        }
      } else {
        let ageDiff = nowYear - birthYear; //年之差
        if (ageDiff > 0) {
          if (nowMonth == birthMonth) {
            let dayDiff = nowDay - birthDay; //日之差 
            if (dayDiff < 0) {
              returnAge = ageDiff - 1 + '岁';
            } else {
              returnAge = ageDiff + '岁';
            }
          } else {
            let monthDiff = nowMonth - birthMonth; //月之差 
            if (monthDiff < 0) {
              returnAge = ageDiff - 1 + '岁';
            } else {
              mouthAge = monthDiff + '个月';
              returnAge = ageDiff + '岁';
            }
          }
        } else {
          returnAge = -1; //返回-1 表示出生日期输入错误 晚于今天
        }
      }
      return returnAge + mouthAge; //返回周岁年龄+月份
  },
  // 跳转到公众号
  addwxGroup(){
    wx.navigateTo({
      url: '/pages/addwxGroup/addwxGroup',
    })
  }

})

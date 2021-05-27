//index.js
const app = getApp()
//云数据库初始化
const db = wx.cloud.database({});
const cont = db.collection('qingming');
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
          //   babyBirthday:'',
          //   babyRegion:'' 
          // }
        ] // 顾客宝宝信息
    },
    isAddBabyInfo: false, // 是否添加宝宝信息
    isAddBaby: true, // 防止添加宝宝数量的时候重复触发函数
    isShowCalender: false, // 日历显示与隐藏
    telphoneRules:{
      required: true,
      message: '请填写正确手机号码',
      pattern: '^[1][3-9]{1}[0-9]{9}$',
      trigger: 'blur',
    },
    notNullRules:{
      type: 'string',
      required: true,
      message: '必选项不能为空',
      trigger: 'blur',
    },
    toastShow: false, // 提示框
    toastSuccessShow: false, // 成功提示
    toastFailShow: false, // 失败提示
    maskShow: false // 遮罩层

  },
  onLoad: function() {
    wx.lin.initValidateForm(this)  // 初始化lin-ui
    // var chuancheng = wx.getStorageSync('chuancheng')
    // var xisu = wx.getStorageSync('xisu')
    // if (!chuancheng||!xisu) {
    //   this.getYunData()
    // }else{
    //   this.setData({
    //     chuancheng: chuancheng,
    //     xisu:xisu
    //   })
    // }
  },
  // 访问云数据库   
  getYunData(){
    var _this = this;
    //1、引用数据库   
    const db = wx.cloud.database({
      //这个是环境ID不是环境名称     
      env: 'cloud1-0g8w5gv8761fca59'
    })
    //2、开始查询数据了  news对应的是集合的名称
    //传承   
    db.collection('qingming')
    .where({
      type:'chuancheng'
    })
    .get({
      //如果查询成功的话    
      success: res => {
        console.log('~ inherit.js 32lines qingming:',res.data)
        //这一步很重要，给ne赋值，没有这一步的话，前台就不会显示值      
        this.setData({
          chuancheng: res.data
        })
        wx.setStorage({
          data: res.data,
          key: 'chuancheng',
        })
      }
    })
    // 习俗
    db.collection('qingming')
    .where({
      type:'xisu'
    })
    .get({
      //如果查询成功的话    
      success: res => {
        console.log('~ inherit.js 32lines qingming:',res.data)
        //这一步很重要，给ne赋值，没有这一步的话，前台就不会显示值      
        this.setData({
          xisu: res.data
        })
        wx.setStorage({
          data: res.data,
          key: 'xisu',
        })
      }
    })
  },


  // 点击出生输入框，显示日历
  showCalender(){
    this.setData({
      isShowCalender : true
    })
  },
  // 点击日历填入数据
  selectCalender(event){
    console.log('~ index.js submit detail:',event.detail)
    this.setData({
      birthday:event.detail
    })
  },
  // 添加宝宝信息
  // maskShow控制遮罩层显示与隐藏，true为显示，同时设置了locked状态为true，即点击背景的时候不关闭
  // isAddBabyInfo为添加宝宝信息弹出层，true为显示
  addBabyInfo(e){
    this.setData({
      isAddBabyInfo:true,
      maskShow:true   
    })
    
    console.log('~ index.js addBabyInfo detail:')
  },
  // 宝宝信息保存
  saveBabyInfo(event){
    const {detail} = event;
    // 若表单验证不正确，则返回
    if(!detail.isValidate){  
      return
    }
    // 如果宝宝保存超过5个，则返回
    if(this.data.customer.baby.length>5){
      return
    }
    console.log('~ index.js saveBabyInfo detail:',detail)
    let {babyName,babyBirthday,babyRegion} = detail.values
    this.data.customer.baby.push({babyName,babyBirthday,babyRegion})
    this.setData({
      isAddBabyInfo:false,
      maskShow:false,   
      ['customer.baby']:this.data.customer.baby
    })
  
    console.log('~ index.js saveBabyInfo this.data.customer.baby:',this.data.customer.baby)
  },
  // 返回主界面
  onBabyInfoBack(){
    this.setData({
      isAddBabyInfo:false,
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
    console.log('~ index.js submit customer:',this.data.customer)
    that.setData({
      toastSuccessShow:true
    })
    /*
      detail 返回三个参数
      1、values: 各表单项的value值
      2、errors: 各表单项验证后的返回的错误信息数组
      3、isValidate: 表单是否验证通过的boolean值
      具体格式示例：
      detail = {
         values: {
             studentName: "",
             studentAge: "",
             studentAddress: ""
         },
         errors: {
             studentName: [],
             studentAge: [],
             studentAddress: []
         },
         isValidate: true
      }
    */

   
  },



})

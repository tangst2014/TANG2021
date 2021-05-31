// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection(event.table).add({
    data: {
      openid: event.openid,
      userInfo: event.userInfo,
      customerName: event.customerName,
      customerPhone: event.customerPhone,
      customerAddress: event.customerAddress,
      baby: event.baby,
      time: event.time,
    },
    success: function (res) {
      console.log('liveroom', event)
      wx.showToast({
        title: "添加成功",
        duration: 2000
      })
    },
    fail: function (res) {
      wx.showToast({
        title: "添加失败",
        duration: 2000
      })
    }
  })
}
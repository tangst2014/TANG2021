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
      _openid: event.openid,
      unionid: event.unionid,
      userInfo: event.userInfo,
      customerName: event.customerName,
      customerPhone: event.customerPhone,
      customerRegion: event.customerRegion,
      baby: event.baby,
      time: event.time,
    },
    success: function (res) {
      console.log('liveroom', event)
      return  true
    },
    fail: function (res) {
      return false
    }
    
  })
}
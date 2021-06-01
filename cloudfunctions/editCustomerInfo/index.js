// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command
// 云函数入口函数
exports.main = async (event, context) => {
  return await db.collection('customerInfo').doc(event._id).update({
    data: {
      customerName: event.customerName,
      customerPhone: event.customerPhone,
      customerAddress: event.customerAddress,
      baby: event.baby,
    },
    success: function (res) {
      console.log(res.data)
      console.log(event.lists)
    }
  })
}
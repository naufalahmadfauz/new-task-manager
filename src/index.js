require('./db/mongoose')
const express = require('express')
const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')
const port = process.env.PORT
const app = express()
//app.use itu middleware,jadi data yang datang ke express diproses dulu lewat middleware
//terus ditentukan apakah akan lanjut ke route handler atau enggak
//app.use dieksekusi berurutan,jadi kalau misalnya di awal udah gak next,midleware yang lain gak bakal di eksekusi



//Memparse incoming json menjadi object

app.use(express.json())
//app.use juga meng overide pengaturan express,seperti menggunakan router costum
//user router dan task router sudah ada route nya,jadi di app.use ini sebenarnya seperti
//app.use(app.get('/userrouteataubebas',middleware,handler))
//app.use(app.post('/userrouteataubebas',middleware,handler))
//dan sebagainya
app.use(userRouter)
app.use(taskRouter)

app.listen(port, () => {
    console.log('server is up on port ', port)
})
// const Task = require('./models/task')
// const User = require('./models/user')
// const main = async ()=>{
//     /*
//     * jadi disini kita menggunakan relationship one to many
//     * satu user bisa punya banyak task,tapi satu task gak bisa
//     * punya banyak user
//     * satu task hanya 1 user
//     *
//     *
//     * cara kerjanya task.populate
//     * field owner di Task itu _id dari pembuat si task
//     * kemudian,field owner itu mencari model mana yang akan di minta untuk populate
//     * yaitu model User
//     * dengan populate,kita mengisi field owner
//     * dengan semua data user yang _id di User nya sama dengan
//     * _id di field owner
//     *
//     * dibelakang layar,task.populate akan mencari field _id di User yang valuenya
//     * sama dengan field owner di Task
//     *
//     *
//     * cara kerja user.populate
//     * isi field virtual tasks,dengan memilih model Task
//     * terus populate field virtual tasks dengan semua task di model Task
//     * yang value _id di owner sama dengan value _id di User
//     * _id ini datang dari document user yang sudah disaring
//     * */
//
//
//     const task = await Task.findById("5f868e7891efda273029a091")
//     await task.populate('owner').execPopulate()
//     console.log(task.owner)
//
//     const user = await User.findById("5f868dadc43af528e0f0bf4b")
//     await user.populate('tasks').execPopulate()
//     console.log(user.tasks)
//
// }
// main()
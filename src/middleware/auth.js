const jwt = require('jsonwebtoken')
//fungsi jwt
//membuat payload bisa diverifikasi oleh secret key
const User = require('../models/user')
const auth = async (req,res,next)=>{
    try{
        //value token didapat dari req.header authorization,terus dibuang bearer nya jadi
        //cuman json token nya aja
        const token = req.header('Authorization').replace('Bearer ','')
        //decoded valuenya dari hasil verify token dengan secret key
        const decoded = jwt.verify(token,process.env.JWT_SECRET)

        //karena middleware punya akses ke req dan res,kita langsung cari user
        //spesifik di model User,dengan id dari decoded._id
        //kemudian tokens.token itu,di dalam array tokens,cari tiap objek token yang valuenya sama dengan
        //token di sini
        //tokens[{token:"a"},{token:"b"}] nah cari yang tokens.token nya itu sama dengan token di fungsi ini
        //mencari tokens di databse yang sama dengan token yang di kasih dari klien
        //agar server tahu kalau user itu masih login
        //jadi walaupun id ketemu tapi gak ada token,berarti user belum login
        //dan gak boleh melihat user
        //intinya nanti pas user logout,user gak bisa pakai token yang sama
        //dan harus generate token baru degnan login
        const user = await User.findOne({_id:decoded._id,'tokens.token':token})

        if (!user){
            throw new Error()
        }
        req.token = token
        //tambahkan req.user dengan value  user,jadi nanti pas di handler datanya adalah
        //req.user middleware
        //req.user itu isi nya user,user isinya data individual user yang saat ini sedang aktif,jadi 1 orang
        // bukan collection banyak
        req.user = user
        next()
    }catch (e) {
        res.status(401).send({error:'Please login'})
    }
}

module.exports = auth
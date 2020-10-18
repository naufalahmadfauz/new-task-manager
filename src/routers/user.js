const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const sharp = require('sharp')
const {sendWelcomeEmail,sendCancelationEmail} = require('../emails/account')
const multer = require('multer')



const upload = multer({
    //limits itu batasan file
    //disini kita membatasi file yang diupload
    //sebesar 1 mb
    limits:{
        fileSize: 1000024
    },
    //file filter memfilter file yang di upload
    fileFilter(req,file,cb){
        //kalau nama file ujungnya docx atau doc,maka isi callback dengan error
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)){return cb(new Error("please upload a picture file"))}
        //kalau tidak,resolve dengan true supaya lanjut
        cb(undefined,true)

    }
})


/*
* Error handling router
* untuk menhandle error dari middleware,kita bisa menambah router handler baru,setelah router handle yang pertama
* dengan argumen(error,req,res,next)
* contoh,auth itu middleware,jadi data sebelum masuk ke router handler yang utama,data akan dicek  dulu di auth
* kalau di auth kita throw new error,maka error itu akan ditangkap oleh error handler router,yang setelah router
* handler utama
*
* kalau ada fungsi setelah middleware/error handler,wajib meng next() di akhir kode
*
* */



router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        sendWelcomeEmail(user.email,user.name)
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        //generateAuthToken akan menggenerate token baru dengan
        //payload isinya _id dari user
        //terus generateAuthToken akan menyimpan user tadi ke database dengan user.save()
        const token = await user.generateAuthToken()

        res.send({user, token})
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        //pertama,set isi dari req.user.tokens dari hasil
        //memfilter req.user.tokens,peraturannya
        //kalau misalnya token yang ada di database tidak sama dengan
        //token yang dikirim oleh klien/req,maka token tersebut
        //masukkan ke databse. kalau sama,maka jangan dimasukkan
        //kemudian nanti req.user.tokens akan berisi tokens
        //yang sama,kecuali tanpa token yang dikirim oleh klien/req
        //kemudian simpan ke databse dengan req.user.save()
        //karena req.user sudah menjadi instance dan memiliki
        //akses ke metode save()
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        //pertama,set isi dari req.user.tokens dari hasil
        //memfilter req.user.tokens,peraturannya
        //kalau misalnya token yang ada di database tidak sama dengan
        //token yang dikirim oleh klien/req,maka token tersebut
        //masukkan ke databse. kalau sama,maka jangan dimasukkan
        //kemudian nanti req.user.tokens akan berisi tokens
        //yang sama,kecuali tanpa token yang dikirim oleh klien/req
        //kemudian simpan ke databse dengan req.user.save()
        //karena req.user sudah menjadi instance dan memiliki
        //akses ke metode save()
        req.user.tokens = []
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    //pass middleware sebelum handler
    //User atau Task itu nama modelnya,atau kita nyari data dari collection itu
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    //variabel updates menampung key dari req.body,hasilnya array
    const updates = Object.keys(req.body)
    //allowed updates berarti operasi apa saja yang diperbolehkan
    const allowedUpdates = ['name', 'email', 'password', 'age']
    //cara kerja isvalidoperation:
    //gunakan operator every di updates,kita punya akses ke individual item di updates,terus ketentuan nya
    // kalau update itu ada di dalam allowed updates,maka akan mengembalikan true,kalau update gak ada di allowed
    // updates,maka akan mengembalikan false. kalau ada satu saja yang false,maka is falid operation hasilnya false.
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({error: 'Operation is invalid!'})
    }

    try {

        //ambil user yang akan di update,simpan ke var user
        //setelah pake auth,req.user sudah ada data individual,jadi gak perlu
        //manual findbyid lagi

        //loop updates yang di isi oleh user,kemudian ubah isi data di user sesuai dengan data yang di provide oleh user
        //user[update] berarti seperti user.name atau user.email,tapi dinamis sesuai yang di provide user
        updates.forEach((update) => req.user[update] = req.body[update])

        await req.user.save()

        //findbyid membypass mongoose dan melakukan operasi langsung ke database
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

        res.send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/users/:id/avatar',async (req,res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user||!user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)

    }catch (e) {
        res.status(404).send()
    }
})

router.post('/' +
    'users/me/avatar',auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error,req,res,next) => {
    res.status(400).send({error:error.message})
})

router.delete('/users/me/avatar',auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

//ganti route delete users menjadi /users/me,tambahkan auth,ganti cara meremove document
//yaitu dengan menggunakan instance method dari document remove()
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancelationEmail(req.user.email,req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router
const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const User = require('../models/user')
const auth = require('../middleware/auth')
router.post('/tasks',auth, async (req, res) => {

    let task = new Task({
        ...req.body,
        owner:req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/tasks/:id',auth, async (req, res) => {
    const id = req.params.id
    try {
        /*
        * tambahkan auth
        *ubah cara mencari menjadi findone,dengan kriteria _id task = id params
        * dan owner sama dengan req.user._id
        * */
        const task = await Task.findOne({_id:id,owner:req.user._id})
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/tasks',auth, async (req, res) => {
    const match = {}
    const sort = {}
    if (req.query.completed) {
        match.completed = req.query.completed==='true'
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1]==='desc'? -1 :1
    }

    try {
         /*
        * tambahkan auth
        *ubah cara mencari menjadi find,dengan kriteria owner =req.user._id
        *
        * cara kerja sort
        * pertama kita tambah di options sort,ini menerima object
        * karena sulit mendapatkan datanya,makanya kita pecah ke bagian bagian
        * pertama bikin object sort
        *
        * terus kalau misalnya client ngasih query sortBy
        * pisahkan querySortbynya dengan split,hasilnya berupa array dan disimpan ke
        * variabel parts
        * nah parts[0] itu minta sort berdasarkan apa,mau kapan dibuat,diedit,dll.
        * kalau parts[1] itu asc atau desc
        *
        * kemudian,ubah isi sort dengan parts[0],jadi sort berdasarkannya
        * tergantung yang di minta klien
        * dan asc atau desc nya juga terserah klien
        * kalau misalnya klien minta sort by createdAt:asc
        * maka object sort hasilnya
        *
        * sort:{createdAt:1}
        * kalau user minnta asc,maka value createdAt nya 1,kalau desc -1
        * -1 desc 1 asc
        *
        *
        *
        *
        *
        * dengan populate,kita mengisi virtual field Tasks di model user
        * terus pilih field mana yang akan di populate dengan path
        * terus match,match itu seperti filter,apakah completed nya
        * mau yang true atau false,
        * nanti yang dikembalikan adalah data yang sesuai dengan filter
        * kemudian res.send req.user.tasks,karena data tasks tadi ada
        * di model user dan sudah menjadi dokumen
        *
        *
        *
        * limit = jumlah data per halaman yang ditampilkan
        * skip = tampilkan data dimulai dari yang keberapa untuk page selanjutnya
        * kalau skip lebih besar dari limit,maka akan ada data yang tidak muncul
        * kalau limit lebih besar dari skip,maka data yang sama akan ditampilkan
        * di page yang beda
        * contoh
        * ambil data 2 dari 4
        * dengan skip 0,berarti kita menampilkan data dari angka setelah 0,yaitu 1-2
        * dengan skip 1 berarti kita menampilkan data dari angka setelah 1,yaitu 2,3
        * dan seterusnya
        *
        * */
        // const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path:'tasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate()

        res.status(200).send(req.user.tasks)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.patch('/tasks/:id',auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
    if (!isValidOperation) {
        return res.status(400).send({error: 'Invalid operation!'})
    }
    try {
        /*
        * tambahkan auth
        *ubah cara mencari menjadi findone,dengan kriteria owner =req.user._id,_id task = req.params.id
        * pindahkan updates kebawah supaya ketika tidak ktemu tasknya,langsung di return dan berhenti
        * */
        const task = await Task.findOne({_id:req.params.id,owner:req.user._id})
        if (!task) {
            return res.status(404).send()
        }
        updates.forEach((update)=>{
            task[update] = req.body[update]
        })
        await task.save()
        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id',auth, async (req, res) => {
    try {
        /*
        * tambahkan auth
        * ubah cara mencari menjadi findoneanddelete,dengan kriteria owner =req.user._id,_id task = req.params.id
        *
        * */
        const task = await Task.findOneAndDelete({_id:req.params.id,owner:req.user._id})
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send(e)
    }

})

module.exports = router
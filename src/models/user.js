const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const Task = require('./task')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true

    },
    email: {
        trim: true,
        lowercase: true,
        type: String,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Must be an email')
            }
        },
        unique: true
    },
    age: {
        default: 0,
        type: Number,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be positive number')
            }
        },
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Error! password should not contain "password" or less than 6 character')
            }
        },
        trim: true
    },
    tokens: [
        {
            token: {
                type: String, required: true
            }
        }
    ],
    avatar:{
        type:Buffer
    }
},{
    timestamps:true
})
/*
* cara kerja virtual tasks
* virtual tasks gak disimpan ke db mongoose
* foreignfield berarti field apa yang akan membuat relationship
* * ref itu berarti kita mau milih model yang mana,kita pilih model task

* jadi localfield = field yang ada di dokumen user,yaitu _id
* foreignField = Field yang ada di ref,yaitu owner
* */

/*
* Mongoose will populate documents from the model in ref whose foreignField matches this document's localField
*
* */
userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

//cara kerja toJSON
//ketika kita res.send,object itu di stringify
//methods toJSON akan dipanggil ketika object akan di stringify
//jadi sebelum di stringify,data dirubah menjadi object js biasa yang awalnya document mongoose
// terus di set data di object tadi dan di return
//yang di stringift adalah data yang direturn dari toJSON yang di modifikasi
userSchema.methods.toJSON = function(){
    //ambil documentnya
    const user = this

    //convert document mongoose menjadi object js biasa
    const userObject = user.toObject()


    //delete oassword dan tokens
    //operase delete ini hanya bisa di apply ke object js biasa,bukan mongoose document
    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar
    //return object biasa tadi
    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this

    const token = await jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)
    //kenapa id sebagai payload?> supaya ada pembeda bahwa token ini miliksiapa
    //ubah user.tokens dengan menggabungkan user.tokens yang ada,terus ditambah token yang baru
    //jadi kalau asalnya tokens:[{'a'}],menjadi tokens:[{'a','b'}]

    user.tokens = user.tokens.concat({token})
    //simpan ke database
    await user.save()
    return token
}

//bikin method baru untuk userschema
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if (!user) {
        throw new Error('Unable to login!')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('Unable to login!')
    }
    return user
}
//perbedaan statics dan methods
//statics digunakan untuk metode model,jadi data yang masih banyak atau untuk collection
//jadi kalau pake statics itu seperti User.prototype.namaMethod
//methods untuk document,atau yang sudah spesifik,tidak kayak Model

//hash password sebelum di save
userSchema.pre('save', async function (next) {
    //middleware= fungsi yang dijalankan sebelum suatu operasi dieksekusi
    //contoh,sebelum data di save,di pass dulu ke middleware,punya akses
    //ke dokumen yang akan di save lewat this
    //terus kita bisa ubah data tersebut sebelum di save
    //kalau kode nya sudah beres,tambahkan next() supaya proses save lanjut
    //this=Document yang akan di simpan
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})


//delete user tasks when user is removed
userSchema.pre('remove',async function(next){
    const user = this
    await Task.deleteMany({owner:user._id})
    next()
})
const User = mongoose.model('User', userSchema)

module.exports = User
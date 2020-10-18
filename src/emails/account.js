const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email,name) =>{
    sgMail.send({
        to:email,
        from:'naufalahmadfauz@gmail.com',
        subject:'Terimakasih telah bergabung dengan masak masak!',
        text:`Selamat datang,${name} di aplikasi Masak Masak!`,
    })
}

const sendCancelationEmail = (email,name) =>{
    sgMail.send({
        to:email,
        from:'naufalahmadfauz@gmail.com',
        subject:'Terimakasih telah menggunakan aplikasi masak masak!',
        text:`Terimakasih,${name} Beritahu kami untuk menjadi aplikasi yang lebih baik!`,
    })
}

module.exports = {sendWelcomeEmail,sendCancelationEmail}


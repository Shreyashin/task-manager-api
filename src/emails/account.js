
const sgMail = require('@sendGrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)
const sendWelcomeEmail = (email, name)=>{
    sgMail.send({
        to: email,
        from: 'shreyashindurkar28@gmail.com',
        subject: 'Thanks for joining in!!',
        text: `Welcome to the app ${name}. Let me know how you get along with the app.`
    })
}

const sendCancellationEmail = (email, name)=>{
    sgMail.send({
        to: email,
        from: 'shreyashindurkar28@gmail.com',
        subject: 'This is the Cancellation Email...',
        text: `${name} is no more a part of the Subscription.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
}
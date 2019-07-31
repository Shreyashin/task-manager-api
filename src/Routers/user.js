const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const sharp = require('sharp')
const multer = require('multer')
const {sendWelcomeEmail, sendCancellationEmail } = require('../emails/account')
const router = new express.Router()



router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthTokens()
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthTokens()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})
router.post('/users/logout', auth, async (req, res)=>{
    try{
        req.user.tokens = req.user.tokens.filter((token)=>{
            return token.token !== req.token
        })
        await req.user.save()
        res.send()
    }catch(e){
        res.status(500).send()
    }
})
router.post('/users/logoutAll', auth,async (req, res)=>{
    try{
       req.user.tokens = []
       await req.user.save()
       res.send()
    }catch(e){
        res.status(500).send()
    }
})
router.get('/users/me', auth, async (req, res) => {
    // try {
    //     const users = await User.find({})
    //     res.send(users)
    // } catch (e) {
    //     res.status(500).send(e)
    // }
    res.send(req.user)
})

// Update Operation
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdate = ['name', 'email', 'password', 'age']
    const IsValidOperations = updates.every((update) => {
        return allowedUpdate.includes(update)
    })

    if (!IsValidOperations) {
        return res.status(400).send({ error: "Invalid Operations" })
    }

    try {
            updates.forEach((update) => {
            req.user[update] = req.body[update]
        })
        await req.user.save()

        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// Delete Operation
router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove()
        sendCancellationEmail(req.user.email, req.user.name)
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})
 
const upload = multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/.(jpg|jpeg|png)$/)){
           return cb(new Error('Image must be .png or .jpg or.jpeg ONLY!!'))
        }
        cb(undefined, true)
    }
})
//Seeting up the Profile Pic
router.post('/users/me/avatar', auth, upload.single('avatar'), async(req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
},(error, req, res, next)=>{
    res.status(400).send({error: error.message})
})

//Deleting Avatar
router.delete('/users/me/avatar', auth, async(req, res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async(req, res)=>{
    try{
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    }catch(e){
        res.status(404).send(e)
    }
})


module.exports = router
const noLayout = '../views/layouts/nothing.ejs'
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const {Cost, AllCost, checkDate, sendNotification, url} = require('../middleware/calc')

app.use(bodyParser.json())

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../model/User')
const jwtSecret = process.env.JWT_SECRET
const nodemailer = require('nodemailer')
const mongoose = require('mongoose')
const generateToken = require('../middleware/token')

const {authMiddleware} = require('../middleware/authentication.js')
const {allDash} = require('./main')
const Property = require('../model/Property')
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const File = require('../model/File')


//generate Page
const generate = async (req, res) => {

    let success = ""
    res.render('generate',  {layout: noLayout, success})
} 

const loginPage = async (req, res) => {

    const token = req.cookies.token;
    if (token) {
        return res.redirect('/')
    }
    
    let error = ""
    if(req.query.error){
        error = req.query.error
    }
    res.render('admin/login', {layout: noLayout, error})
}

const logout = async (req, res) => {
    res.clearCookie('token');
    res.redirect('/login');
}
//admin registers a user
const postRegister = async (req,res) => {

    try {
        
        const {username, email} = req.body
        const password = generateToken(6)
        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({username, password: hashedPassword, email})
        // const token =  await jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
        // res.cookie('token', token, {httpOnly: true})

        
        res.redirect('/?success2=Renter\'s account created, generate token below for the renter to login')

    }  catch (error) {

        return res.redirect('/?error2=Error registering User. Make sure username and email are unique')
    }
}

//generate a token url 
const generateTokenPost = async (req, res) => {
    
    const {username} = req.body
    if (!username) {
        return res.redirect('/?error=No username inputted')
    }

    //generate token
    const token  = generateToken(24)
    //nd
    
    const user = await User.findOne({username: username})

    if(!user) {
        return res.redirect('/?error=Username not Found')
    }

    user.resetToken = token
    await user.save()
    

    const tokenUrl = `${url}/resetpassword?token=${token}`
    const email = user.email

    //send tokenUrl to user email
    const text= `Here's a link to reset your password- <a href="${tokenUrl}"> ${tokenUrl} </a>`
    const title = `Reset Password`
    await sendNotification(email, user.username, text, title)
    //end 


    //remove token from user after sometime

    //end

    const success = "Token generated and sent to renter's email"
    res.redirect('/?success=Token generated and sent to renter\'s email')

}

//login through token url DONT WORRY AGAIN ABOUT THIS NOT USEFUL
const loginToken = async (req, res) => {

    const {token} = req.query
    const user = await User.findOne({token: token})

    if(!user) {
        res.redirect('/login?error=Username not found')
    }
    const token_ = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
    res.cookie('token', token_, {httpOnly: true})

    user.token = undefined
    await user.save()

    res.redirect('/?resetyourpassword=true')
}

//login through login page: usenrame and password
const postLogin = async (req, res) => {
    // const {username, password} = req.body
    const username = req.body.username
    const password = req.body.password

    const user = await User.findOne({username})

    let error = ""
    if(!user) {
        error = "Invalid credentials"
        return res.render('admin/login', {layout: noLayout, error})
    }
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if(!isPasswordValid) {
        error = "Invalid credentials"
        return res.render('admin/login', {layout: noLayout, error})
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_LIFETIME})
    res.cookie('token', token, {httpOnly: true})

    res.redirect('/')
}


/////////////////REST PASSWORD | FORGET PASSWORD /////////////////////////

const resetPasswordPage = async (req, res) => {
    const {token} = req.query

    let error = ""
    if (req.query.error){
        error = req.query.error
    }
    res.render('admin/reset_password', {layout: noLayout, token, error})
}

const forgotPasswordPage = async (req, res) => {
    let success = ""
    if (req.query.success){
        success = req.query.success
    }

    let error = ""
    if (req.query.error){
        error = req.query.error
    }

    let email = ""
    if (req.query.email){
        email = req.query.email
    }
    res.render('admin/forgot_password', {layout: noLayout, success, error, email})
}

// post 
const forgotPassword = async (req, res) => {
    const {email} = req.body
    const user = await User.findOne({email})

    if(!user) {
        return res.redirect(`/forgotpassword?error=No user found with the email ${email}`)
    }

    //generate a unique reset token
    const resetToken = generateToken(24)

    // could create a expiration time

    user.resetToken = resetToken
    await user.save()

    try{
        //send the reset email
        const resetUrl =`${url}/resetpassword?token=${resetToken}`
        const text= `Here's a link to reset your password- <a href="${resetUrl}"> ${resetUrl} </a>`
        const title = `Reset Password`
        const {transport} = await sendNotification(email, user.username, text, title)

    } catch {
        return res.redirect(`/forgotpassword?error=There was an error in sending the mail, contact admin or try again`)
    }
    


    res.redirect('/forgotpassword?success=Reset link has been sent to your email')

}

// post
const resetPassword = async (req, res) => {

    const { newPassword} = req.body
    const {token} = req.query

    if( !token) {
        return res.redirect(`/resetpassword?error=No token found`)
    }
    
    const user = await User.findOne({resetToken: token})
    if (!user) {
        return res.redirect(`/resetpassword?token=${token}&error=No user found with the token ${token} Or Token has expired`)
    }

    //validate the expiration time here

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    user.password = hashedPassword
    user.resetToken = undefined
    await user.save()
    
    res.redirect('/login')

}

const userPage = async (req, res) => {
    
    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)
    const user = await User.findById(req.params.id)

    if(!user) {
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `Can not find any user with the id ${req.params.id}`})
    }

    //check if is the owner of userpGE
    if(currentUser.username != user.username) {
        return res.render("error", {layout: noLayout, name: "Unauthorized",statusCode: 401, message: `You are not allowed to view this page`})
    }
    res.render('userPage', {stripePublickey: stripePublickey, noticeLast3, user, currentUser})
}
const editUserPage = async (req, res) => {
    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)
    const user = await User.findById(req.params.id)

    if(!user) {
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `Can not find any user with the id ${req.params.id}`})
    }

    //check if is the owner of userpGE
    if(currentUser.username != user.username) {
        return res.render("error", {layout: noLayout, name: "Unauthorized",statusCode: 401, message: `You are not allowed to view this page`})
    }
    let error = ""
    if(req.query.error) {
        error = req.query.error
    }
    res.render('editUserPage', {stripePublickey: stripePublickey, noticeLast3, error, user, currentUser})
}

const postEditUserPage= async (req,res)=>{
    try{

        //for all dashboard
        const {noticeLast3, currentUser} = await allDash(req,res)
        const user_ = await User.findById(req.params.id)

        //check if is the owner of userpGE
        if(currentUser.username != user_.username) {
            return res.render("error", {layout: noLayout, name: "Unauthorized",statusCode: 401, message: `You are not allowed to view this page`})
        }

        const user = await User.findOneAndUpdate({_id: req.params.id}, {...req.body},{new: true, runValidators:true})
        res.redirect(`/user-page/${req.params.id}`)
    } catch {
        return res.redirect(`/edit-userpage/${req.params.id}?error=Make sure all fields are field in correctly and are unique`)
    }
}

const deleteUser = async (req, res) => {

    const user = await User.findById(req.params.id)
    if(!user) {
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `No User with the id ${req.params.id}`})
    }
    await User.deleteOne({_id: req.params.id})

    // delete all rents the user has
    const rent = await Property.deleteMany({owner: user.username})

    //delete files elated to user
    const files = await File.deleteMany({renter: user.username})

    res.redirect('/')

}
module.exports = {
    loginPage,
    generate,
    postRegister,
    generateTokenPost,
    loginToken,
    postLogin,
    resetPasswordPage,
    forgotPasswordPage,
    forgotPassword,
    resetPassword,
    logout,
    userPage,
    editUserPage,
    postEditUserPage,
    deleteUser
}
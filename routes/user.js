const express = require('express')
const router = express.Router()
const {authMiddleware, authAdmin} = require('../middleware/authentication.js')


const {loginPage, generate, postRegister,
    generateTokenPost, postLogin,
    loginToken, resetPasswordPage,forgotPasswordPage,
    forgotPassword, resetPassword, logout
} = require('../controllers/user')

router.get('/login', loginPage)
router.get('/generate', generate)
router.post('/register', postRegister)
router.post('/generateToken', generateTokenPost)
// router.get('/loginToken',authMiddleware,authAdmin, loginToken)
router.post('/login',postLogin)
router.get('/forgotpassword', forgotPasswordPage)
router.post('/forgotpassword', forgotPassword)
router.get('/resetpassword', resetPasswordPage)
router.post('/resetpassword', resetPassword)
router.get('/logout', authMiddleware, logout)

module.exports = router

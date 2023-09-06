const express = require('express')
const router = express.Router()
const {authMiddleware, authAdmin} = require('../middleware/authentication.js')


const {loginPage, generate, postRegister,
    generateTokenPost, postLogin,
    loginToken, resetPasswordPage,forgotPasswordPage,
    forgotPassword, resetPassword, logout, userPage, editUserPage,postEditUserPage, deleteUser
} = require('../controllers/user')

router.get('/login', loginPage)
router.get('/generate',authMiddleware, authAdmin,  generate)
router.post('/register',authMiddleware, authAdmin,  postRegister)
router.post('/generateToken',authMiddleware, authAdmin,  generateTokenPost)
// router.get('/loginToken',authMiddleware,authAdmin, loginToken)
router.post('/login',postLogin)
router.get('/forgotpassword', forgotPasswordPage)
router.post('/forgotpassword', forgotPassword)
router.get('/resetpassword', resetPasswordPage)
router.post('/resetpassword', resetPassword)
router.get('/logout', authMiddleware, logout)
//user page
router.get('/user-page/:id',authMiddleware, userPage)
router.get('/edit-userpage/:id',authMiddleware, editUserPage)
router.patch('/edit-userpage/:id',authMiddleware, postEditUserPage)


router.delete('/deleteUser/:id',authMiddleware, authAdmin, deleteUser)
module.exports = router

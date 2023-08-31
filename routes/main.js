const express = require('express')
const router = express.Router()

const {dashboard, purchase, changeNotice, addRent, postAddRent, addProp, postAddProp, editRent,
    postEditRent,
    deleteRent,
    editProp,
    postEditProp,
    deleteProp, rentsearch} = require('../controllers/main')

const {authAdmin} = require('../middleware/authentication')

router.get('/', dashboard)

router.post('/purchase', purchase)
router.post('/changeNotice', changeNotice)

router.get('/add-rent', authAdmin, addRent)
router.post('/add-rent',authAdmin,  postAddRent)
router.get('/edit-rent/:id',authAdmin, editRent)
router.patch('/edit-rent/:id',authAdmin, postEditRent)
router.delete('/delete-rent/:id', authAdmin, deleteRent)

router.get('/add-property',authAdmin,  addProp)
router.post('/add-property',authAdmin,  postAddProp)
router.get('/edit-property/:id', authAdmin, editProp)
router.patch('/edit-property/:id',authAdmin,  postEditProp)
router.delete('/delete-property/:id',authAdmin,  deleteProp)

router.post('/', rentsearch)


module.exports = router
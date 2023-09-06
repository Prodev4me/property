const express = require('express')
const router = express.Router()
const multer = require('multer');
const mongoose = require('mongoose');
const File = require('../model/File')
const User = require('../model/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {      
      cb(null, '../uploads/'); // Destination folder for uploaded files
    },
    filename: async function (req, file, cb) { 
      const user = await User.findById(req.params.id)
      cb(null,  user.username+  Date.now()  + '-' + file.originalname); // File naming convention
    },
  });
   
const upload = multer({ 
    storage: storage
});


// const upload = multer({ dest: 'uploads/' });

const {dashboard, purchase, changeNotice, addRent, postAddRent, addProp, postAddProp, editRent,
    postEditRent,
    deleteRent,
    editProp,
    postEditProp,leaseUpload,downloadLease,leaseUpload_Renter, approveForm,disapproveForm,
    deleteProp, rentsearch, deletepage, leasePage,leaseUploadPage, PostapproveForm, downloadRenterLease} = require('../controllers/main')

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
router.get('/delete/:id',authAdmin, deletepage)
router.get('/lease-agreement-form', leasePage)
router.get('/download-lease/:id', downloadLease)
router.get('/upload-lease/:id', leaseUploadPage)
router.post('/upload-lease/:id', authAdmin, upload.single('file'), leaseUpload)
router.post('/upload-lease-renter/:id', upload.single('file'), leaseUpload_Renter)

router.get('/approve/:id', authAdmin, approveForm)
router.post('/approve/:id', authAdmin, PostapproveForm)

router.post('/disapprove/:id', disapproveForm)
router.get('/download-renter-lease/:id', downloadRenterLease)
module.exports = router
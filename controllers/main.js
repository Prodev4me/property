
const noLayout = '../views/layouts/nothing.ejs'
const User = require('../model/User')
const Property = require('../model/Property')// for all rents
const {Cost, AllCost, checkDate, sendNotification, url} = require('../middleware/calc')
const Notice = require('../model/notifications')
const moment = require('moment')
const Prop = require('../model/Prop') //for all properties

const File = require('../model/File')
const multer = require('multer');
const mongoose = require('mongoose');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');


const stripeSecretkey = process.env.STRIPE_SECRET_KEY
const stripePublickey = process.env.STRIPE_PUBLIC_KEY

const stripe = require('stripe')(stripeSecretkey)

const allDash = async (req,res) => {

    const currentUser = await User.findById(req.userId)

    const noticeLast3 = await Notice.find({owner: currentUser.username, read: false}).sort('-createdAt').limit(3)

    return {noticeLast3: noticeLast3, currentUser: currentUser}
}

const changeToInt = async (value, req, res) => {
    value = await Number(value)
    if (isNaN(value) ){
        value = -1234567890987654345678
    }

    return value
}   

const dashboard = async (req, res) => {

    const currentUser = await User.findById(req.userId)

    //////////////ADMIN DASHBOARD/////////////////////////
    if(currentUser.admin == true) {
        //for all dashboards
        const {noticeLast3} = await allDash(req,res)
        // const noticeLast3 = await Notice.find({owner: currentUser.username, read: false}).sort('-createdAt').limit(3)

        //find all properties
        let properties = await Property.find({}).sort('-createdAt')

        //calculate total cost for each status for all renter
        const pendCost = await AllCost('Pending')
        const dueCost = await AllCost('Due')
        const paidCost = await AllCost('Paid')

         
        //get all notifications relating to current user
        const notice = await Notice.find({owner: currentUser.username, read: false}).sort('-createdAt').limit(10)

        //Number of properties owned
        let rent = []
        const Properties = await Property.find({}).select('name')
        await Properties.forEach(async prop => {
            await rent.push(prop.name)
        });
        rent = [...new Set(rent)]
        const noProperties = rent.length

        //find all prop 
        const prop = await Prop.find({})
        
        //query success/error
        const success = req.query.success
        const success2 = req.query.success2
        const error = req.query.error
        const error2 = req.query.error2

        //SEARCH
        //change properties if there is a search query
        let search = ""
        if (req.query.search){
            search = req.query.search
            let searchValue = await changeToInt(search)
            properties =  await Property.find({
                $or: [
                    {name: {$regex: search, $options: 'i'}},
                    {status: {$regex: search, $options: 'i'}},
                    {deadline: {$regex: search, $options: 'i'}},
                    {owner: {$regex: search, $options: 'i'}},
                    {cost: searchValue},
                ]
            }).sort('-createdAt')
        }

        const users = await User.find({})
        //ownedProperty, due rent, and pending rents of all users
        await users.forEach(async user => {
            
            //could use aggregation to filter out repeated names
            //Number of properties owned by the user
            let rent = []
            const Properties = await Property.find({owner: user.username}).select('name')
            await Properties.forEach(async prop => {
                await rent.push(prop.name)
            });
            rent = [...new Set(rent)]
            const noProperties = rent.length

            const properties__ch2 =await Property.find({owner: user.username, status: "Pending"}).count()
            const properties__ch3 =await Property.find({owner: user.username, status: "Due"}).count()
            const properties__ch4 =await Property.find({owner: user.username, status: "Paid"}).count()

            user.ownedProperty = noProperties
            user.pendingRent = properties__ch2
            user.dueRent = properties__ch3
            user.paidRent = properties__ch4
            await user.save()
        });        

        res.render('adminDashboard', {currentUser,users, stripePublickey: stripePublickey, noticeLast3, properties, notice, noProperties, pendCost, dueCost, paidCost, prop, success, error, error2, success2, search})

    } else {
         //find property relating to the current user
        let properties = await Property.find({owner: currentUser.username}).sort('-createdAt')

        //calculate total cost for each status
        const pendCost = await Cost('Pending', currentUser.username)
        const dueCost = await Cost('Due', currentUser.username)
        const paidCost = await Cost('Paid', currentUser.username)

        //Number of properties owned
        let rent = []
        const Properties = await Property.find({owner: currentUser.username}).select('name')
        await Properties.forEach(async prop => {
            await rent.push(prop.name)
        });
        rent = [...new Set(rent)]
        const noProperties = rent.length

        //find Prop conataining rent
        const prop = await Prop.find({name: {$in: rent}})

        //get all notifications relating to current user
        const notice = await Notice.find({owner: currentUser.username, read: false}).sort('-createdAt').limit(10)

        //for all dashboards
        const {noticeLast3} = await allDash(req,res)
        // const noticeLast3 = await Notice.find({owner: currentUser.username, read: false}).sort('-createdAt').limit(3)

        //SEARCH
        //change properties if there is a search query
        let search = ""
        if (req.query.search){
            search = req.query.search
            let searchValue = await changeToInt(search)
            //dont search for owner, dont allow another user to see another person's rent
            // let properties_ = await Property.find({owner: currentUser.username})
            properties =  await Property.find({
                $or: [
                    {name: {$regex: search, $options: 'i'}},
                    {status: {$regex: search, $options: 'i'}},
                    {deadline: {$regex: search, $options: 'i'}},
                    {owner: {$regex: search, $options: 'i'}},
                    {cost: searchValue},
                ]
            }).sort('-createdAt')

            //remove docs that isnt part of current user's rent
            properties = properties.filter(obj => (obj.owner == currentUser.username))
        }

        let errorPayment = ""
        if(req.query.errorPayment) {
            errorPayment =req.query.errorPayment
        }
        res.render('dashboard', {errorPayment, currentUser, properties, pendCost, dueCost, paidCost, noProperties, stripePublickey: stripePublickey, notice, noticeLast3, prop, search})
    }

   
    
}

const rentsearch = async (req, res) => {

    let search = req.body.search
    res.redirect(`/?search=${search}`)
}
const addRent = async (req, res) => {
    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)

    const AlUser = await User.find({})
    const AllProp = await Prop.find({})

    let error =""
    if(req.query.error){
        error = req.query.error
    }
    res.render('add-rent',{noticeLast3, currentUser, stripePublickey: stripePublickey, AllProp, AlUser,error})
}

const postAddRent = async (req, res) => {

    try {
        const {name, owner, deadline} = req.body

        const prop = await Prop.findOne({name})
        //make sure property exist
        if(!prop) {
            return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `Can not find any property with the name ${name}`})
        }
        const owner_ = await User.findOne({username: owner})
        //make sure user / owner exist
        if(!owner_) {
            return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `Can not find any user with the username ${owner}`})
        }
        //check if deadline date is correctly inputted
        let checkdate = await checkDate(deadline, req,res)
        if (checkdate == false){
            return res.redirect('/add-rent?error=Error, check deadline date input')
        }
        const cost = prop.cost
        const property = await Property.create({name, owner, deadline, cost: cost, status: "Pending"})

        //send notifications
        const user = await User.findOne({username: property.owner})
        const text = `A new rent- ${property.name} Rent, which cost $${property.cost} has just been added, the deadline for payment is ${property.deadline} `
        const title = 'New Rent Added'
        await sendNotification(user.email, property.owner, text, title)
        res.redirect('/')
    } catch {
        return res.redirect('/add-rent?error=Error, check if fields are inputted correctly')
    }
    

}

const editRent = async (req, res) => {
    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)

    //find rent with id
    const property = await Property.findById(req.params.id)
    if(!property){
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message:  `No Rent with the id ${req.params.id}`})
    }

    const AlUser = await User.find({})
    const AllProp = await Prop.find({})

    let error =""
    if(req.query.error){
        error = req.query.error
    }

   res.render('edit-rent',{noticeLast3, currentUser, stripePublickey: stripePublickey, AllProp, AlUser, property, error})
}

const postEditRent = async (req, res) => {

    try{
        const {name, owner, cost, status, deadline} = req.body

        const prop = await Prop.findOne({name})
        //make sure property exist
        if(!prop) {
            return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `Can not find any property with the name ${name}`})
        }
        const owner_ = await User.findOne({username: owner})
        //make sure user / owner exist
        if(!owner_) {
            return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `Can not find any user with the username ${owner}`})
        }
        //check if deadline date is correctly inputted
        let checkdate = await checkDate(deadline, req,res)
        if (checkdate == false){
            return res.redirect(`/edit-rent/${req.params.id}?error=Error, check deadline date input`)
        }
    
        const oldProperty = await Property.findById(req.params.id)
        const property = await Property.findOneAndUpdate({_id: req.params.id}, {name, owner, deadline, cost: cost, status: status}, {new: true, runValidators:true})
    
        //send notifications
        const user = await User.findOne({username: property.owner})
        const text = `The rent- ${oldProperty.name} Rent was editted, login to your account to check for any changes: <a href="${url}"> ${url}/</a>`
        const title = 'Changes in Rent details'

        //if a owner changed
        if(oldProperty.owner != property.owner){
            //send to previous owner that it has been removed
            const user_ = await User.findOne({username: oldProperty.owner})
            const text_ = `The rent- ${oldProperty.name} Rent has been removed, login to your account to check for any changes: <a href="${url}"> ${url}/</a>`
            await sendNotification(user_.email, oldProperty.owner, text_, title)
            //send to new owner that rent has been added
            const text = `The rent- ${property.name} Rent has been added, login to your account to check for any changes: <a href="${url}"> ${url}/</a>`
            await sendNotification(user.email, property.owner, text, title)
        } else {        
            await sendNotification(user.email, property.owner, text, title)
        }
    
        res.redirect('/')
    } catch (error) {
        return res.redirect(`/edit-rent/${req.params.id}?error=Error, check if fields are inputted correctly`)
    }
    
}
const deleteRent = async (req, res) => {

    const property = await Property.findOne({ _id: req.params.id } )
    if(!property) {
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `Can not find any property with the id}`})
    }
    await Property.deleteOne( { _id: req.params.id } ); 

    //send notifications
    const user = await User.findOne({username: property.owner})
    const text = `The rent- ${property.name} Rent has been removed, login to your account to check for any changes: <a href="${url}"> ${url}/</a>`
    const title = `${property.name} rent Has been Removed`
    await sendNotification(user.email, property.owner, text, title)

    res.redirect('/')

}

const addProp = async (req, res) => {
    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)
    let error =""
    if(req.query.error){
        error = req.query.error
    }
    res.render('add-property',{noticeLast3, currentUser, stripePublickey: stripePublickey, error})
}

const postAddProp = async (req, res) => {

    try{
        const prop = await Prop.create({...req.body})

        res.redirect('/')
    } catch {
        res.redirect('/add-property?error=Make sure all fields are filled in correctly and the Name is unique.')
    }

    

}
const editProp = async (req, res) => {
    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)

    //find property by ID
    const prop = await Prop.findById(req.params.id)
    if(!prop){
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `No Property with the id ${req.params.id}`})
    }
    
    let error =""
    if(req.query.error){
        error = req.query.error
    }

    res.render('edit-property',{noticeLast3, currentUser, stripePublickey: stripePublickey, prop,error})
}   
const postEditProp = async (req, res) => {

    try {
            //old prop
            const propOld = await Prop.findOne({_id: req.params.id})
            const prop = await Prop.findOneAndUpdate({_id: req.params.id}, {...req.body},{new: true, runValidators:true})

        
            //get all property/Rent with the property and update them
            const property = await Property.find({name: propOld.name, status: {$in: ['Pending', 'Due']}})
            await property.forEach(async proper => {
                proper.name = prop.name
                proper.cost = prop.cost
                await proper.save()
                
                //send notifications: Alert all owners of the property of the change /only for pending and due
                const user = await User.findOne({username: proper.owner})
                const text = `The rent- ${propOld.name} Rent was editted, login to your account to check for any changes: <a href="${url}"> ${url}/</a>`
                const title = 'Changes in Property details'
                await sendNotification(user.email, proper.owner, text, title)
            });

            res.redirect('/')
    } catch {
        return res.redirect(`/edit-property/${req.params.id}?error=Make sure all fields are filled in correctly and the Name is unique.`)
    }
    
}
const deleteProp = async (req, res) => {
    const prop = await Prop.findOne({ _id: req.params.id } )
    if(!prop) {
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `No Property with the id ${req.params.id}`})
    }
    await Prop.deleteOne( { _id: req.params.id } ); 

    //delete rents associated with it
    const property_ = await Property.find({name: prop.name})
    const property = await Property.deleteMany({name: prop.name})
    await property_.forEach(async proper => {
        //send notifications: Alert all owners of the property of the change
        const user = await User.findOne({username: proper.owner})
        const text = `The rent- ${proper.name} Rent has been removed, login to your account to check for any changes: <a href="${url}"> ${url}/</a>`
        const title = `${proper.name} rent Has been Removed`
        await sendNotification(user.email, proper.owner, text, title)
    });

    res.redirect('/')

}

const changeNotice = async (req, res) => {
    //change read to true
    const notice = await Notice.find({read: false})
    notice.forEach(async not => {
        not.read = true
        await not.save()
    });
}

const purchase = async (req,res) => {
  
    const prop_id = req.body.prop_id
    const property = await Property.findById(prop_id)
    if(!property) {
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: 'The property you are trying to purchase is not found'})
    }
    const total_ = property.cost
    const total =  total_.toFixed(2) * 100 //cents
    const payment = await stripe.charges.create({
        amount: total,
        source: req.body.stripeTokenId,
        description: `Payment for ${property.name} Rent`,
        currency: 'usd'
    })
    console.log('charge succesful')
    
    //check if all went well prev before changing to Paid

    if(payment) {
        //change the property to paid
        property.status = "Paid"
        //update property dateOfPayment
        const currentTime = moment().format("YYYY-MM-DD"); //find the date when paid, moment date
        property.dateOfPayment = currentTime
        await property.save()

        //create notification that payment has been made
        const text = `You have just paid ${total} for ${property.name} Rent`
        const title = `Payment for ${property.name} Rent`
        const notice = await Notice.create({owner: property.owner, message: text, title: title})


    } else {
        return res.status(500).json({message: "Error in payment"})
    }
    
    res.status(200).json({message: "Done"})//DONT CHANGE WHILE CHANGING OTHER ERROR RESPONSE
    
            
}


const deletepage = async (req, res) => {

    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)

    const property = await Property.findById(req.params.id)
    const pro = await Prop.findById(req.params.id)
    const user = await User.findById(req.params.id)
    if(!property && !pro && !user) {
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `Can not find any with the id ${req.params.id}`})
    }

    res.render('deletePage', {noticeLast3, currentUser, stripePublickey: stripePublickey, property, pro, user})
}

const leasePage = async (req, res) => {
    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)

    const file = await File.findOne({renter: currentUser.username}) 

    res.render('lease', {noticeLast3, currentUser, stripePublickey: stripePublickey, file, currentUser})
}

const downloadLease = async (req, res) => {

    const user = await User.findById(req.params.id)
    if(!user){
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `No user with the id ${req.params.id}`})
    }
    const file = await File.findOne({renter: user.username}) 

    if (!file) {
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `File Not Found`})
    }
    if(!file.path){
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `File Not Found}`})
    }
    res.download(file.path); // Serve the document as a downloadable file

}

const leaseUploadPage = async(req, res)=>{
    //for all dashboard
    const {noticeLast3, currentUser} = await allDash(req,res)

    //find property by ID
    const user = await User.findById(req.params.id)
    if(!user){
        return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `No user with the id ${req.params.id}`})
    }
    const file_ = await File.findOne({renter: user.username})
    let originalName = "No File Uploaded"
    if (file_){
        originalName = file_.originalname
    }
    let error =""
    if(req.query.error){
        error = req.query.error
    }

    res.render('leaseUpload', {noticeLast3, currentUser, stripePublickey: stripePublickey, error, user, originalName})
}
const deleteFile = async (filename) => {

    //delete uploaded file
    const filePath = `uploads/${filename}`; // Replace with your file path

    // Use the fs.unlink method to delete the file
    fs.unlink(filePath, (err) => {
        if (err) {
        console.error(err);
        console.log('Error deleting the file')
        }
    })
}

const leaseUpload = async (req, res)=> {

    try{
        const user = await User.findById(req.params.id)
        if(!user){
            return res.render("error", {layout: noLayout, name: "Not Found",statusCode: 404, message: `No user with the id ${req.params.id}`})
        }

        if(!req.file){
            return res.redirect(`/upload-lease/${req.params.id}?error=No file found`)
        }

        if(req.file.mimetype !== 'application/pdf'){
            await deleteFile(req.file.filename)
            return res.redirect(`/upload-lease/${req.params.id}?error=Make sure file is a PDF`)
        }
        if(req.file.size > 5 * 1024 * 1024){
            await deleteFile(req.file.filename)
            return res.redirect(`/upload-lease/${req.params.id}?error=Make sure file is no more than 5MB`)
        }

        // Access the uploaded file details
        const { originalname, filename, path } = req.file;

        // Save the file details to the database
        const file_ = await File.findOne({renter: user.username})
        if(file_){
            const filename_ = file_.filename
            await deleteFile(filename_)
            const newFile_ = await File.findOneAndUpdate({renter: user.username}, {renter: user.username, originalname, filename, path },{new: true, runValidators:true} )
        } else {
            const file = new File({ renter: user.username, originalname, filename, path });
            await file.save();
        }
        
        res.redirect('/')
    } catch(error) {
        if(req.file.filename){
            await deleteFile(req.file.filename)
        }
        return res.redirect(`/upload-lease/${req.params.id}?error=An error was found`)
    }
    
}

module.exports = {
    dashboard,
    purchase,
    changeNotice,
    addRent,
    postAddRent,
    addProp,
    postAddProp,
    editRent,
    postEditRent,
    deleteRent,
    editProp,
    postEditProp,
    deleteProp,
    rentsearch,
    deletepage,
    allDash,
    leasePage,
    leaseUploadPage,
    leaseUpload,
    downloadLease
}
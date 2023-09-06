const Property = require('../model/Property')
const User = require('../model/User')
const moment = require('moment')
const nodemailer = require('nodemailer')
const Notice = require('../model/notifications')
require('dotenv').config()

const url = 'https://property-site.up.railway.app'

const Cost = async (status, owner) => {

    const getProp = await Property.find({owner: owner, status: status}).select('cost')
    if(getProp) {
        let Cost = []
        await getProp.forEach(prop => {
            Cost.push(prop.cost)
        }); 
        let sum = 0
        for (let i=0; i<Cost.length; i++) {
            sum += Cost[i]
        }            
        
        return await sum
    } else {
        return 0
    }
    
    
}


const AllCost = async (status) => {

    const getProp = await Property.find({status: status}).select('cost')
    if(getProp) {
        let Cost = []
        await getProp.forEach(prop => {
            Cost.push(prop.cost)
        }); 
        let sum = 0
        for (let i=0; i<Cost.length; i++) {
            sum += Cost[i]
        }            
        
        return await sum
    } else {
        return 0
    }
    
    
}




// send email
async function sendNotification(email, owner, text, title) {

    console.log(email, text)
    
    //create notifcation model
    if(title != 'Reset Password'){
        const notice = await Notice.create({owner: owner, message: text, title: title})
    }

    // Set up email content
    const htmlContent = `

        <h3>Hello ${owner}, </h3> <br>

        <p>${text}</p>
        <p>Login to your account here: <a href="${url}"> ${url} </a> </p><br><br>

        <p>Sincerely,</p>
        <p>From VisualGreatness.</p>
        <a class="navbar-brand brand-logo-mini" style="size: 40px;" href="https://property-site.up.railway.app"><img src="https://i.ibb.co/6BH7h6Q/20230904-062051-0000-removebg-preview.png" alt="logo"/></a>
        
    `;

    // send the reset email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth:{
            user: "info.tekcify",
            pass: process.env.EMAIL_PASSWORD
        }
    })

    const mailOptions = {
        from: 'info.tekcify@gmail.com',
        to: email,
        subject: title,
        html: htmlContent,
    };

    const transport = await transporter.sendMail(mailOptions, (error) => {
        if (error) {
            console.log(error)
        } else {
            console.log('Email sent')
        }
    })

    return {transport: transport}
}

const fivedaysSchedule = async () => {

    const currentTime = moment().format("MMMM Do YYYY"); 
    //get properties for only pending 
    var properties =  await Property.find({status: "Pending"})
  
    await properties.forEach(async property => {
  
      // Define the specific time
      const specific = await moment(`${property.deadline}`)
      const specificTime = specific.format("MMMM Do YYYY");
  
      // Subtract 5 days from the specific time
      const target = await specific.subtract(5, 'days')
      const targetTime = target.format("MMMM Do YYYY");

      if (currentTime == targetTime) {
          //set the necessary fields needed for sending notification
          const owner = property.owner
          const name = property.name
          const deadline = property.deadline
          const user = await User.findOne({username:property.owner})
          const email = user.email
          const text = `The payment of ${name} will soon be due, we are kindly reaching out to you that you pay up before the deadline: ${deadline}`
          const title = `${name} Rent Due in less than 5 days`
          await sendNotification(email, owner,text, title);
      }
  
    });
}

const deadlineDay = async () => {

    const currentTime = moment().format("MMMM Do YYYY"); 
    //get properties for only pending 
    var properties =  await Property.find({status: "Pending"})
  
    await properties.forEach(async property => {
  
      // Define the specific time
      const specific = await moment(`${property.deadline}`)
      const specificTime = specific.format("MMMM Do YYYY");

      if (currentTime == specificTime) {
          //change pending to due on deadline day
          property.status = "Due"
          await property.save()

          //create new

          //set the necessary fields needed for sending notification
          const owner = property.owner
          const name = property.name
          const deadline = property.deadline
          const user = await User.findOne({username:property.owner})
          const email = user.email
          const text = `The payment of ${name} is due today: ${deadline}. We are kindly reaching out to you that you pay up to avoid increase in the cost, as an increase of 0.5% of the cost will be added after every 4 days.`
          const title = `${name} Rent Due Today`
          await sendNotification(email,owner, text, title);
      }
  
    });
    //send mail
}


//create new rent 
const deadlineDayNew = async () => {

    const currentTime = moment().format("MMMM Do YYYY"); 

    //get properties for only pending 
    var properties =  await Property.find({})
  
    await properties.forEach(async property => {
  
      // Define the specific time
      const specific = await moment(`${property.deadline}`)
      const specificTime = specific.format("MMMM Do YYYY");

      
      if (currentTime == specificTime) {

          //create new property that new rent
          const target = await specific.add(30, 'days')
          const targetTime = target.format("YYYY-MM-DD");
          const newdeadline = targetTime
          const rent = await Property.create({owner:property.owner,name: property.name, cost: property.cost, status: "Pending", deadline: newdeadline })

          //set the necessary fields needed for sending notification
          const owner = rent.owner
          const name = rent.name
          const deadline = rent.deadline
          const cost = rent.cost
          const user = await User.findOne({username:rent.owner})
          const email = user.email
          const text = `A new rent- ${name} Rent which cost $${cost} has just been added, the deadline for payment is ${deadline} `
          const title = 'New Rent Added'
          await sendNotification(email, owner, text, title);
      }
  
    });
    //send mail
}



const EfourdaysSchedule = async () => {
    
    const currentTime = moment().format("MMMM Do YYYY"); 

    //get properties for only pending 
    var properties =  await Property.find({status: "Due"})
  
    await properties.forEach(async property => {
  
      // Define the specific time
      const specific = await moment(`${property.deadline}`)
      const specificTime = specific.format("MMMM Do YYYY");
  
      // add 4 days to the specific time
      const timeToAdd = 4 + property.addToFour
      const target = await specific.add(timeToAdd, 'days')
      const targetTime = target.format("MMMM Do YYYY");

      if (currentTime == targetTime) {
          //update addToFour field in the property
          property.addToFour = timeToAdd
          await property.save()

          //increase cost by 0.5%
          var cost_ = property.cost
          const cost = (0.5/100 * cost_) + cost_
          //save cost
          property.cost = cost
          await property.save()

          //set the necessary fields needed for sending notification
          const owner = property.owner
          const name = property.name
          const deadline = property.deadline
          const user = await User.findOne({username:property.owner})
          const email = user.email
          const addToFour = property.addToFour
          const text = `The payment of ${name} Rent has been due for ${addToFour} days, we are kindly reaching out to you that you pay up to avoid increase in the cost. Presently, the cost is now at $${cost} as a result of 0.5% increase after every 4days`
          const title = `${name} Rent Due for ${addToFour} days`
          await sendNotification(email, owner, text, title);
      }
  
    });
    
}

//resetuser login token at the end of each day
const resetToken = async () => {
    const users = await User.find({})
    users.forEach(async user => {
        user.resetToken = undefined
        await user.save()
    });
}

const checkDate = async (date,req,res) => {
    let date_regex = /^\d{4}-\d{2}-\d{2}$/
    let checkDate = date_regex.test(date)
    if(checkDate == false){
        return false
    } else {
        return true
    }
}

module.exports = {
    Cost, 
    fivedaysSchedule,
    EfourdaysSchedule,
    deadlineDay,
    deadlineDayNew,
    AllCost,
    checkDate,
    sendNotification,
    url,
    resetToken,
}

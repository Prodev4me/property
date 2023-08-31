const jwt = require('jsonwebtoken')
const jwtSecret = process.env.JWT_SECRET
const User = require('../model/User')
const noLayout = '../views/layouts/nothing.ejs'


const authMiddleware = async (req, res, next ) => {
    const token = req.cookies.token;
  
    if(!token) {
      return res.redirect('/login')
    }
  
    try {
      const decoded = jwt.verify(token, jwtSecret);
      //dont just find by Id, but by password
      const user = await User.findById(decoded.userId)
      if(!user) {
        return redirect('/login')
      }
      req.userId = decoded.userId;
      next();
    } catch(error) {
      return res.redirect('/login')
    }
  }

// Check if they are admin and if so grant them access
const authAdmin = async (req, res, next) => {
  const user = await User.findById(req.userId)
  if(!user) {
    return res.render("errors", {layout: noLayout, name: "Not Found",statusCode: 404, message: "No User Found"})
  }

  let check_admin = user.admin
  if(check_admin == true) {
    next()
  } else {
    return res.render("error", {layout: noLayout, name: "Unauthorized",statusCode: 401, message: "You are not allowed to access this page, contact ADMIN "})
  }
}

module.exports = {
    authMiddleware,
    authAdmin,
}
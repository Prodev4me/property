const noLayout = '../views/layouts/nothing.ejs'


const notFound = (req, res) =>  {
    // return res.send("not found")
    return res.render("error-404", {layout: noLayout}) 
}

module.exports = notFound

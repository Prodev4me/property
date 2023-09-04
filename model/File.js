
const mongoose = require('mongoose')

const fileSchema = mongoose.Schema({

    renter: {
        type: String,
    },
    originalname: {
        type: String,
    },
    filename: {
        type: String,
    },
    path: {
        type: String,
    }

   
}, {timestamps: true},
)

module.exports = mongoose.model('File', fileSchema)

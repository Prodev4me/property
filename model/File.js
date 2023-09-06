
const { boolean } = require('joi')
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
    },
    originalname_Renter: {
        type: String,
    },
    filename_Renter: {
        type: String,
    },
    path_Renter: {
        type: String,
    },
    approved: {
        type: Boolean,
        default: false
    }

   
}, {timestamps: true},
)

module.exports = mongoose.model('File', fileSchema)


const mongoose = require('mongoose')

const noticeSchema = mongoose.Schema({
    owner: {
        type: String,
    },
    title: {
        type: String,
    },
    message: {
        type: String,
    },
    read: {
        type: Boolean,
        default: false,
    }

   
}, {timestamps: true},
)

module.exports = mongoose.model('Notice', noticeSchema)

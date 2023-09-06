

const mongoose = require('mongoose')

const PropertySchema = new mongoose.Schema({
    owner:{
        type: String,
        required:[true, 'Please provide User'],

    },
    name:{
        type: String,
        required: [true, 'Please provide a property name'],
        maxlength: 500,
    },
    cost:{
        type: Number,
        required: [true, 'Please provide the cost of the property'],
        default: 0,
    },
    status:{
        type: String,
        enum: ['Paid', 'Pending', 'Due'],
        required: [true, 'Make sure to add the status'],
        default: 'Pending',
    },
    deadline: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Make sure to provide the date on which the property is due for payment'],
    },
    addToFour:{
        type: Number,
        default: 0,
    },
    dateOfPayment: {
        type:  mongoose.Schema.Types.Mixed
    }
}, {timestamps: true})

module.exports = mongoose.model('Property',PropertySchema)


const mongoose = require('mongoose')

const TransactionSchema = new mongoose.Schema({
    owner:{
        type: String,
        required:[true, 'Please provide User'],

    },
    property:{
        type: String,
        required: [true, 'Please provide a property name'],
        maxlength: 500,
    },
    Amount:{
        type: Number,
        required: [true, 'Please provide the cost of the property'],
        default: 0,
    },
    date:{
        type:  mongoose.Schema.Types.Mixed,
        required: [true, 'Make sure to provide the date on which the property was paid for']
    },
    deadline: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Make sure to provide the date on which the property is due for payment'],
    },
    addToFour:{
        type: Number,
        default: 0,
    },
}, {timestamps: true})

module.exports = mongoose.model('Transaction',TransactionSchema)
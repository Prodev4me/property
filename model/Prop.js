

const mongoose = require('mongoose')

//schema for holding all the properties that exist
const PropSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Please provide a property name'],
        maxlength: 500,
        unique: true,
    },
    cost:{
        type: Number,
        required: [true, 'Please provide the cost of the property'],
        default: 0,
    }
}, {timestamps: true})

module.exports = mongoose.model('Prop',PropSchema)
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const UserSchema = new Schema({

    username: {
        type: String,
        required: [true, 'Please provide username'],
        unique: true
    },
    email:{
        type: String,
        required: [true, 'Please provide email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please Provide valid email'
        ],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide Password'],
    },
    token: {
        type: String,
    },
    resetToken: {
        type: String,
    },
    admin: {
        type: Boolean,
        default: false
    }

});

module.exports = mongoose.model('User', UserSchema);
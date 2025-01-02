const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: 'assests/default_pic/sample_profile_pic.jpg',
        required: false,
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Refresh Token Schema
const RefreshTokenSchema = new mongoose.Schema({
    refreshToken: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expires: {
        type: Date,
        default: () => {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + 10); // Add 10 days
            return currentDate;
        }
    }
});


// Blacklisted Token Schema
const BlacklistedTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now
    }
});

// Exporting the models
module.exports = {
    User: mongoose.model('User', UserSchema),
    RefreshToken: mongoose.model('RefreshToken', RefreshTokenSchema),
    BlacklistedToken: mongoose.model('BlacklistedToken', BlacklistedTokenSchema)
};

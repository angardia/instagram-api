const mongoose = require("mongoose");

const Post = mongoose.model("Post", {
    user: {
        type: mongoose.ObjectId,
        // required: true,
        ref: "User"
    },
    description: {
        type: String,
    },
    image: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date()
    }

});

module.exports = Post;
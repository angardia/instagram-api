const mongoose = require("mongoose");

const Comment = mongoose.model("Comment", {
    user: {
        type: mongoose.ObjectId,
        required: true,
        ref: "User"
    },
    postId: {
        type: mongoose.ObjectId,
        required: true,
        // ref: "Post"
    },
    content: {
        type: String,
    },
    likes: [mongoose.ObjectId],
    createdAt: {
        type: Date,
        required: true,
        default: () => new Date()
    }

});

module.exports = Comment;
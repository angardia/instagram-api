// const fs = require("fs").promises; << check if actually needed
const Mongoose = require('mongoose')
const ObjectId = Mongoose.Types.ObjectId;
const fs = require("fs");
const aws = require("aws-sdk");
// aws.config.loadFromPath("src/s3_config.json");
const {accessKeyId, secretAccessKey, region} = require("../config/environment/index");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

const s3 = new aws.S3({
    params: { Bucket: "fpia-bucket" },
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey
});


class PostsController {

    static async getComments(req, res) {
        //populate to connect the userId from comment to the user collection - "user" - model name
        const postId = req.params.id;
        try {
            const comment = await Comment.find({ postId }).populate("user", ["avatar", "username"]);
            // console.log(comment);

            if (!comment) {
                res.sendStatus(404);
                return;
            }
            res.send(comment);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(500);
        }

    }
    static async deleteComment(req, res) {
        const commentId = req.params.id;
        try {
            const deletingComment = await Comment.findByIdAndDelete(commentId);
            // console.log(removeComment);
            res.status(201).send(deletingComment);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(400);
        }

    }

    static async addComment(req, res) {

        const postId = req.params.id;
        const userId = req.user._id;
        const { content } = req.body;

        try {
            const comment = new Comment({
                postId,
                user: userId,
                content
            });
            const createComment = await comment.save()
            await createComment.populate("user", ["avatar", "username"]).execPopulate();
            res.send(createComment);

        }
        catch (e) {
            console.log(e);
            res.sendStatus(400);
        }

    }



    static async likes(req, res) {
        const postId = req.params.id;
        const userId = req.user._id;

        try {
            const likeArr = await Post.findOne({ _id: postId, likes: userId });
            if (likeArr === null) {
                const post = await Post.findByIdAndUpdate({ _id: postId }, { $addToSet: { likes: userId } }, { useFindAndModify: false, new: true });
                return res.status(200).send(post);
            }
            const post = await Post.findByIdAndUpdate({ _id: postId }, { $pull: { likes: userId } }, { useFindAndModify: false, new: true });
            return res.status(200).send(post);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }


    static async feed(req, res) {
        try {
            const posts = await Post.find()
                .populate("user", ["username", "avatar"])
                .sort({ createdAt: req.query.sort || 1 });
            res.send(posts);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }

    static async create(req, res) {
        const { filename, originalname, mimetype } = req.file;
        const fileContent = fs.readFileSync("public/posts/" + filename);
        const params = {
            Key: originalname,
            Body: fileContent,
            ContentType: mimetype,
            ACL: "public-read",
        };


        try {
            const uploadData = await s3.upload(params, function (e, data) {
                if (e) {
                    throw e;
                }
                console.log("Image uploaded successfully");
            }).promise();

            let location = uploadData.Location

            const post = new Post({
                description: req.body.description,
                image: location,
                user: req.user._id
            });
            const createPost = await post.save();
            PostsController.deleteFile(filename);
            res.status(201).send(createPost);
        }
        catch (e) {
            console.log(e);
            PostsController.deleteFile(filename);
            res.sendStatus(400);
        }

    }


    //delete function
    static deleteFile(filename) {
        let fileNameWithPath = "public/posts/" + filename;
        fs.unlink(fileNameWithPath, (e) => {
            if (e) {
                console.log(e);
                return;
            }
            console.log(`File ${filename} was deleted`);
        });
    }
    //get ONE POST

    static async getPost(req, res) {
        const postId = req.params.id;
        try {
            const post = await Post.findById(postId).populate("user", ["username", "avatar"]);
            if (!post) {
                res.sendStatus(404);
                return;
            }
            res.send(post);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(500);
        }

    }


}

module.exports = PostsController;

        //read the img file with filesystem(fs)
        // try {
        //     const imageBase64 = await fs.readFile("public/posts/" + fileName, {encoding : "base64"});
        //     const post = new Post({
        //         description: req.body.description,
        //         image: imageBase64
        //     });
        //     const createPost = await post.save();
        //     res.status(201).send(createPost);

        // }
        // catch (e) {
        //     console.log(e);
        //     res.sendStatus(400);
        // }

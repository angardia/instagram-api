const md5 = require("md5");
const Mongoose = require('mongoose');
const fs = require("fs");
const aws = require("aws-sdk");
aws.config.loadFromPath("src/s3_config.json");
const User = require("../models/user");
const Post = require("../models/post");
const jwt = require('jsonwebtoken');
const { jwtSecret } = require("../config/environment/index");
const PostsController = require("./posts.controller");

const s3 = new aws.S3({
    params: { Bucket: "fpia-bucket" }
});

class UserController {

    static async editUser(req, res) {
        const userId = req.params.id;
        let pass;
        console.log(req.body.password);
        try {

            if (req.body.password) {
                pass = md5(req.body.password)
            }
            let location;
            if (req.file) {
                const { filename , originalname, mimetype } = req.file;
                const fileContent = fs.readFileSync("public/posts/" + filename);
                const params = {
                    Key: originalname,
                    Body: fileContent,
                    ContentType: mimetype,
                    ACL: "public-read",
                };
                const uploadData = await s3.upload(params, function (e, data) {
                    if (e) {
                        throw e;
                    }
                    console.log("Image uploaded successfully");
                }).promise();

                location = uploadData.Location;
            }

            const toUpdateUser = {
                avatar: location,
                bio: req.body.bio,
                password: pass,
                email: req.body.email
            }
            for (let prop in toUpdateUser) if (!toUpdateUser[prop]) delete toUpdateUser[prop];
            const userToEdit = await User.findByIdAndUpdate(userId, toUpdateUser, { useFindAndModify: false, new: true });
            PostsController.deleteFile(req.file.filename);
            return res.status(200).send(userToEdit);
        }
        catch (e) {
            console.log(e);
            PostsController.deleteFile(req.file.filename);
            res.sendStatus(400);
        }


    }

    static async follow(req, res) {
        const userToFollowId = req.params.id;
        const userId = req.user._id;
        try {
            if (userToFollowId === userId) res.sendStatus(400);
            const followerArr = await User.findOne({ _id: userToFollowId, followers: userId });
            if (followerArr === null) {
                const follower = await User.findByIdAndUpdate({ _id: userToFollowId }, { $addToSet: { followers: userId } }, { useFindAndModify: false, new: true });
                return res.status(200).send(follower);
            }
            const follower = await User.findByIdAndUpdate({ _id: userToFollowId }, { $pull: { followers: userId } }, { useFindAndModify: false, new: true });
            return res.status(200).send(follower);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }
    
    static async getAll(req, res) {
        //get username from request query
        const { username } = req.query;

        try {
            const user = await User.find({
                username: new RegExp(username, "i")
            });
            res.json(user.map(user => {
                return {
                    _id: user._id,
                    username: user.username,
                    createdAt: user.createdAt,
                    avatar: user.avatar,
                    bio: user.bio
                }
            }));
        }
        catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }

    static async userInfo(req, res) {
        const username = req.params.username;
        try {
            const user = await User.findOne({ username });
            if (!user) {
                res.sendStatus(404);
                return;
            }
            const { _id, avatar, followers } = user;
            res.json({
                _id, username, avatar, followers
            });
        }
        catch (e) {
            res.sendStatus(500);
        }
    }

    static async posts(req, res) {
        //username
        const username = req.params.username;

        try {
            const user = await User.findOne({ username });
            if (!user) {
                res.sendStatus(404);
                return;
            }
            const posts = await Post.find({ user: user._id })
                .populate("user", ["username", "avatar"]);
            res.json(posts);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }
    // user?email=www@gmail.com
    static checkdup(req, res) {
        const { username, email } = req.query;
        if (!username && !email) {
            res.sendStatus(400);
            return;
        }
        let property = email ? "email" : "username";
        // console.log(property);
        try {
            User.exists({
                [property]: req.query[property]
            }).then(isExist => {
                res.json(isExist);
            });
        } catch (err) {
            res.status(400).json(err);
        }
    }

    static create(req, res) {
        req.body.password = md5(req.body.password);
        const user = new User(req.body);
        user.save().then((newUser) => {
            res.status(201).send(newUser);
        })
            .catch((e) => {
                res.status(400).send("from users.controller.js")
            });
    }


    static login(req, res) {
        User.findOne({
            username: req.body.username,
            password: md5(req.body.password)
        }).then(user => {
            if (!user) {
                res.sendStatus(401);
                return;
            }
            const payload = {
                _id: user._id,
                username: user.username
            };
            const token = jwt.sign(payload, jwtSecret);

            res.send({
                token
            });
        }).catch(err => {
            console.log(err);
            res.sendStatus(500);
        })
    }

    static async me(req, res) {
        const user = await User.findById(req.user._id)
        res.send(user);

    }


}

module.exports = UserController;
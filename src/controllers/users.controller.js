const md5 = require("md5");
const User = require("../models/user");
const Post = require("../models/post");
const jwt = require('jsonwebtoken');
const { jwtSecret } = require("../config/environment/index");

class UserController {

    static async follow(req, res) {
        const userToFollowId = req.params.id;
        const userId = req.user._id;
        try {
            if(userToFollowId === userId) res.sendStatus(400);
            const followerArr = await User.findOne({ _id: userToFollowId, followers : userId });
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

    static async editEmail(req, res) {
        const { username } = req.query;
        console.log(username);
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
        console.log('user')
        try {
            const user = await User.findOne({ username });
            if (!user) {
                res.sendStatus(404);
                return;
            }
            const { _id, avatar } = user;
            res.json({
                _id, username, avatar
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
        console.log(username, email);
        // if (!username && !email) {
        // 	res.sendStatus(400);
        // 	return;
        // }
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
        // console.log(req.user._id);
        const user = await User.findById(req.user._id)
        // res.send(req.user);
        res.send(user);

    }

    // static update(req, res) {
    //     User.findOneAndUpdate
    // }

}

module.exports = UserController;
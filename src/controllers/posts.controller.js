const fs = require("fs").promises;
const Post = require("../models/post")


class PostsController {
    static async feed(req, res) {
        try {
            const posts = await Post.find();
            res.send(posts);
        }
        catch (e) {
            console.log(e);
            res.sendStatus(500);
        }
    }

    static async create(req, res) {
        const fileName = req.file.filename;

        //read the img file with filesystem(fs)
        try {
            const imageBase64 = await fs.readFile("public/posts/" + fileName, {encoding : "base64"});
            const post = new Post({
                description: req.body.description,
                image: imageBase64
            });
            const createPost = await post.save();
            res.status(201).send(createPost);

        }
        catch (e) {
            console.log(e);
            res.sendStatus(400);
        }
    }
}



module.exports = PostsController;
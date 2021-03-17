const express = require("express");
//multer - handle multipart/form-data used to uploading files. 
const multer = require("multer");
const PostsController = require("../controllers/posts.controller");
const UsersController = require("../controllers/users.controller");
const auth = require("../middlewares/auth");
const routes = express.Router();
const upload = multer({ dest: "public/posts" });



routes.put("/user", UsersController.create);
routes.post("/user/login", UsersController.login);
routes.post("/user/me", auth, UsersController.me);
routes.post("/user/:id/follow", auth, UsersController.follow);
routes.get('/user/check', UsersController.checkdup);
routes.get("/user/:username/posts", auth, UsersController.posts);
routes.get("/user/:username" , auth, UsersController.userInfo);
routes.get("/user", auth, UsersController.getAll);


routes.post("/post/:id/likes", auth, PostsController.likes);
routes.put("/post/:id/comment", auth, PostsController.addComment);
routes.get("/post/:id/comment", auth, PostsController.getComments);
routes.get("/post", auth, PostsController.feed);
routes.put("/post", auth, upload.single("image"), PostsController.create);
routes.get("/post/:id",auth, PostsController.getPost);

routes.get("/", (req,res) => res.send());

module.exports = routes;
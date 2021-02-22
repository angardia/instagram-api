const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/environment/index");


function auth(req, res, next) {
    // console.log(req.headers.authorization);
    //if auth token valid
    try {
        const token = req.headers.authorization;
        req.user = jwt.verify(token, jwtSecret);
        next();

    }
    catch (e) {
        res.sendStatus(401);
    }
}

module.exports = auth;
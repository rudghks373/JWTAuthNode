const User = require("../../../models/user");
const jwt = require("jsonwebtoken");

/*
    POST /api/auth
    {
        username,
        password
    }
*/

exports.register = (req, res) => {
  const { username, password } = req.body;
  let newUser = null;

  // create a new user if does not exist
  const create = user => {
    if (user) {
      throw new Error("username exists");
    } else {
      return User.create(username, password);
    }
  };

  // count the number of the user
  const count = user => {
    newUser = user;
    return User.count({}).exec();
  };

  // assign admin if count is 1
  const assign = count => {
    if (count === 1) {
      return newUser.assignAdmin();
    } else {
      // if not, return a promise that returns false
      return Promise.resolve(false);
    }
  };

  // respond to the client
  const respond = isAdmin => {
    res.json({
      message: "registered successfully",
      admin: isAdmin ? true : false
    });
  };

  // run when there is an error (username exists)
  const onError = error => {
    res.status(409).json({
      message: error.message
    });
  };

  // check username duplication
  User.findOneByUsername(username)
    .then(create)
    .then(count)
    .then(assign)
    .then(respond)
    .catch(onError);
};

/*
    POST /api/auth/login
    {
        username,
        password
    }
*/

exports.login = (req, res) => {
  res.send("login api is working");
};

/*
    GET /api/auth/check
*/

exports.check = (req, res) => {
  // read the token from header or url
  const token = req.headers["x-access-token"] || req.query.token;

  // token does not exist
  if (!token) {
    return res.status(403).json({
      success: false,
      message: "not logged in"
    });
  }

  // create a promise that decodes the token
  const p = new Promise((resolve, reject) => {
    jwt.verify(token, req.app.get("jwt-secret"), (err, decoded) => {
      if (err) reject(err);
      resolve(decoded);
    });
  });

  // if token is valid, it will respond with its info
  const respond = token => {
    res.json({
      success: true,
      info: token
    });
  };

  // if it has failed to verify, it will return an error message
  const onError = error => {
    res.status(403).json({
      success: false,
      message: error.message
    });
  };

  // process the promise
  p.then(respond).catch(onError);
};

const { User } = require("../model/user.model");
const jwt = require("jsonwebtoken");
const {promisify} = require('util')

const signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm } = req.body;
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
    });
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
    console.log(token);
    // jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    //   if (err) console.log(err);
    //   else console.log(decoded);
    // });
    res.status(201).send({ message: "User Created", newUser, token });
  } catch (err) {
    console.log("Error while creating user ", err);
    res.status(409).send({ message: "Error while creating a user" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // 1. Check if user email & password Exists
    const userObj = await User.isEmailTaken(email);
    if (!userObj.email) {
      throw new Error("EmailID is not present in DB");
    }
    // 2. Check if user exists and password is correct
    const isUserPasswordCorrect = await User.passwordCompare(userObj, password);
    // 3.If everything is ok, send token to client
    if (!!userObj && isUserPasswordCorrect) {
      console.log("inside");
      const token = jwt.sign(
        { id: userObj._id, email: userObj.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      res.status(200).send({
        message: "User logged in successfully",
        name: userObj.name,
        token,
      });
    }
  } catch (err) {
    res.send({ err });
  }
};

const protect = async (req, res, next) => {
  try {
    // 1. Getting token and check of it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
      console.log(token);
    }
    if(!token) {
      throw new Error("You are not logged in")
    }
    // 2. Verification token
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    console.log(decodedToken)
    // 3. Check if user still exists
    const freshUser = await User.findById(decodedToken.id);
    if(!freshUser){
      throw new Error("The user belonging to this token does no longer exist.")
    }
    // 4. Check if user changed the password
    if(freshUser.changePasswordAfter(decodedToken.iat)){
      throw new Error("User recently changed password")
    }
    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = freshUser
    next();
  } catch (err) {
    res.send({message: err})
  }
};

module.exports = {
  signup,
  login,
  protect,
};

const { User } = require("../model/user.model");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const sendEmail = require("../utils/email");
const crypto = require("crypto");
const signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, roles } = req.body;
    const newUser = await User.create({
      name,
      email,
      password,
      passwordConfirm,
      roles,
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
    } else {
      res.status(403).send({ message: "email or password invalid" });
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
      // console.log(token);
    }
    if (!token) {
      throw new Error("You are not logged in");
    }
    // 2. Verification token
    const decodedToken = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );
    // console.log(decodedToken);
    // 3. Check if user still exists
    const freshUser = await User.findById(decodedToken.id);
    if (!freshUser) {
      throw new Error("The user belonging to this token does no longer exist.");
    }
    // 4. Check if user changed the password
    if (freshUser.changePasswordAfter(decodedToken.iat)) {
      throw new Error("User recently changed password");
    }
    // GRANT ACCESS TO PROTECTED ROUTE

    req.user = freshUser;
    next();
  } catch (err) {
    console.log(err);
    res.send({ message: err });
  }
};

const restrict = (...roles) => {
  return (req, res, next) => {
    try {
      if (!roles.includes(req.user.roles)) {
        throw new Error("You are not authenticated to delete this tour :)");
      }
      next();
    } catch (err) {
      res.status(403).send({ message: err });
    }
  };
};

const forgotPassword = async (req, res, next) => {
  try {
    // 1. Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(404).send({ message: "No user with this email address" });
    }
    // 2 Generate random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3 Send it to user email

    const resetURL = `${req.protocol}://${req.get(
      "host"
    )}/v1/auth/resetPassword/${resetToken}`;
    const message = `Forgot your password? submit a patch request with your new password and passwordConfirm to: ${resetURL}/ \nIf you did not forget your password please ignore this email!!`;
    await sendEmail({
      to: "myemail@mail.com",
      subject: "Password Change token",
      message,
    });
    res.status(200).json({
      status: "Success",
      message: "Token sent to email",
    });
    next();
  } catch (err) {
    // console.log(err);
    user.createPasswordResetToken = undefined;
    uesr.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).send(err);
  }
};

const resetPassword = async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2. If token has not expired, and there is user, set the new password
  if (!user) {
    throw new Error("Token is invalid or expired");
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3. Update changedPassworAt Property for the user

  // 4. Log the user in, send jwt
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  res.status(200).send({
    message: "Success",
    token,
  });
  next();
};

module.exports = {
  signup,
  login,
  protect,
  restrict,
  forgotPassword,
  resetPassword,
};

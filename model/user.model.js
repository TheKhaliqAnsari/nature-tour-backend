const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    trim: true,
    required: true,
    lowercase: true,
    validate: validator.isEmail,
  },
  photo: {
    type: String,
  },
  roles: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },

  passwordConfirm: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
      // This will only works on create and save
      validator: function (ele) {
        return ele === this.password;
        43333;
      },
      message: "Password are not the same",
    },
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  // Only run this function if pass was actually modified
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.statics.isEmailTaken = async function (email) {
  return await this.findOne({ email }, { email: 1, name: 1, password: 1 });
};

userSchema.statics.passwordCompare = async function (user, password) {
  return await bcrypt.compare(password, user.password);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangeAt) {
    const changedTimeStamp = parseInt(this.passwordChangeAt.getTime() / 1000);
    console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = { User };

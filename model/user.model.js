const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require('bcryptjs')

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
  password: {
    type: String,
    required: true,
    minlength: 8,
  },

  passwordConfirm: {
    type: String,
    required: true,
    minlength: 8,
    validate: {
        // This will only works on create and save
      validator: function (ele) {
        return ele === this.password;
      },
      message: "Password are not the same",
    },
  },
});

userSchema.pre('save', async function(next){
    // Only run this function if pass was actually modified
    if(!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12)
    this.passwordConfirm = undefined
    next()
})




const User = mongoose.model("User", userSchema);
module.exports = { User };

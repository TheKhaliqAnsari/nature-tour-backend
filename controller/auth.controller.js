const { User } = require("../model/user.model");

const signup = async (req, res) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).send({ message: "User Created", newUser });
  } catch (err) {
    console.log("Error while creating user ", err);
    res.status(409).send({ message: "Error while creating a user" });
  }
};

module.exports = {
  signup,
};

const router = require("express").Router();
const authController = require("../controller/auth.controller");

router.post("/signup", authController.signup);
router.post("/login", authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword/:token", authController.resetPassword);

module.exports = router;

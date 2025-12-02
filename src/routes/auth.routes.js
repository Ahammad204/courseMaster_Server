const express = require("express");
const {
  register,
  login,
  logout,
  me,
  updateProfile,
} = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// USER
router.get("/me", me);
router.patch("/users/:email", verifyToken, updateProfile);

module.exports = router;

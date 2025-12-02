const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { client } = require("../config/db");

const UsersCollection = client.db("UserDB").collection("Users");

// REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, phone, passwordHash, avatarUrl, roles, status } = req.body;

    const existingUser = await UsersCollection.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(passwordHash, 10);

    const newUser = {
      name,
      email,
      phone,
      password: hashedPassword,
      avatar: avatarUrl,
      roles: roles || "user",
      status: status || "active",
      createdAt: new Date(),
    };

    const result = await UsersCollection.insertOne(newUser);

    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ message: "Registration successful", userId: result.insertedId });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UsersCollection.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid password" });

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};
// ------------------ LOGOUT ------------------
exports.logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

// ------------------ CHECK LOGGED IN USER ------------------
exports.me = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await UsersCollection.findOne({ email: decoded.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};

// ------------------ UPDATE PROFILE ------------------
exports.updateProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const { name, phone, avatarUrl } = req.body;

    // Only user can edit their own profile
    if (req.user.email !== email) {
      return res.status(403).json({ message: "Forbidden: Not your profile" });
    }

    const updateDoc = { $set: {} };

    if (name) updateDoc.$set.name = name;
    if (phone) updateDoc.$set.phone = phone;
    if (avatarUrl) updateDoc.$set.avatar = avatarUrl;

    const result = await UsersCollection.updateOne({ email }, updateDoc);

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedUser = await UsersCollection.findOne({ email });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      message: "Profile update failed",
      error: error.message,
    });
  }
};

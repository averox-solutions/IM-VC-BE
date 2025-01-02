const {
  User,
  RefreshToken,
  BlacklistedToken,
} = require("../../models/authentication/Models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const randomString = require("randomstring");


const JWT_SECRET = process.env.JWT_SECRET;

const fetchUser = (req, res, next) => {
  // Extract the bearer token from the request
  const token = req.header("Authorization").split(" ")[1];

  if (!token) {
    res.status(401).send({ error: "Please authenticate using a valid token" });
  }

  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch (error) {
    res.status(401).send({ error: "Please authenticate using a valid token" });
  }
};

const signupUser = async (req, res) => {
  try {
    const { email, password, confirmPassword, username } = req.body;

    // Check if email, password, username, and confirmPassword are provided
    if (!email || !password || !confirmPassword || !username) {
      return res
        .status(400)
        .json({
          message:
            "Email, password, username, and confirm password are required.",
        });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$&*]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters long, include at least 1 uppercase letter, and at least 1 special character.",
      });
    }

    // Check if a user with the provided email or username already exists
    if (await User.findOne({ email })) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    } else if (await User.findOne({ username })) {
      return res
        .status(400)
        .json({ message: "User with this username already exists." });
    } else {
      const salt = await bcrypt.genSalt(10);
      const securePassword = await bcrypt.hash(password, salt);

      // Create a new user instance with the provided email, username, and password
      await User.create({
        email: email,
        username: username,
        password: securePassword,
      });

      res.status(201).json({ message: "User created successfully" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
};

const loginUser = async (req, res) => {
  // Change to POST method since you are creating a new user
  try {
    const { email, password } = req.body;

    // Check if both email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Both email and password are required." });
    } else {
      let user = await User.findOne({ email });
      if (user) {
        if (await bcrypt.compare(password, user.password)) {
          const payload = {
            id: user.id,
            email: user.email,
            username: user.username
          };
          const accessToken = jwt.sign(payload, JWT_SECRET, {
            expiresIn: "1440m",
          });

          // Generate Refresh Token
          const refreshTokenString = randomString.generate(192);

          // Create a new refresh token document
          const refreshToken = new RefreshToken({
            refreshToken: refreshTokenString,
            user: user.id,
            // expires field will be automatically set to 10 days in the future
          });

          // Save the refresh token in the database
          await refreshToken.save();

          res.status(201).json({
            accessToken: accessToken,
            refreshToken: refreshTokenString,
          });
        } else {
          res.status(500).json({ message: "Error Logging In" });
        }
      } else {
        res.status(500).json({ message: "Error Logging In" });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error Logging In" });
  }
};

const verify = async (req, res) => {
  const { accesstoken } = req.body;
  try {
    // Verify the token
    const decoded = jwt.verify(accesstoken, JWT_SECRET);

    // If verification is successful
    res.status(201).json({ valid: true, message: "Token is valid" });
  } catch (error) {
    // If verification fails
    res.status(401).json({ valid: false, message: "Invalid or expired token" });
  }
};

const verifyTokenForRTC = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
        if (!user) {
            throw new Error('User not found');
        }
    decoded.user = user;
    return decoded;
  } catch(error) {
    throw new Error('Invalid token');
  }
}

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // Check if refreshToken is provided
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required." });
    }

    // Check if the refreshToken is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({
      token: refreshToken,
    });
    if (isBlacklisted) {
      return res.status(401).json({ message: "Invalid refresh token." });
    }

    // Verify if the refreshToken exists in the database and is not expired
    // Also, retrieve the associated user
    const storedToken = await RefreshToken.findOne({ refreshToken });

    if (!storedToken || storedToken.expires < new Date()) {
      return res
        .status(401)
        .json({ message: "Refresh token expired or invalid." });
    }

    const user = storedToken.user;
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username
      // include any other user data needed in the token
    };

    // Generate new Access Token
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "1440m" });

    // Generate new Refresh Token
    const newRefreshTokenString = randomString.generate(192);

    // Save the new Refresh Token in the database
    const newRefreshToken = new RefreshToken({
      refreshToken: newRefreshTokenString,
      user: user._id,
    });
    await newRefreshToken.save();

    // Blacklist the old refresh token
    const blacklistedToken = new BlacklistedToken({ token: refreshToken });
    await blacklistedToken.save();

    // Delete the old refresh token from the database
    await RefreshToken.deleteOne({ refreshToken });

    // Send new tokens to the client
    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenString,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  loginUser,
  fetchUser,
  signupUser,
  refresh,
  verify,
  verifyTokenForRTC
};

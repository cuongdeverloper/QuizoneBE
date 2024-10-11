const uploadCloud = require("../config/cloudinaryConfig");
const User = require("../modal/User");

const addUser = async (req, res) => {
  uploadCloud.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: `Image upload error: ${err.message}` });
    }

    const { username, password, role, email, phoneNumber, gender } = req.body;
    const image = req.file ? req.file.path : null; 

    if (!username || !password || !role || !email || !phoneNumber || !gender) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const validRoles = ['teacher', 'student', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    try {
      const newUser = new User({
        username,
        password,
        role,
        email,
        phoneNumber,
        gender,
        image
      });

      await newUser.save();
      res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
      if (error.code === 11000) { 
        return res.status(400).json({ message: 'Username or email already exists.' });
      }
      res.status(500).json({ message: 'Error registering user', error });
    }
  });
};
const getUserFromUserId = async(req,res) =>{
  try {
    let{userId} = req.params;
    if(!userId) {
      return res.status(400).json({ message: 'Invalid userId.' })
    }
    const userData = await User.findById(userId);
    return res.status(200).json({
      errorCode: 0,
      message: 'Get user success',
      data: userData
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      errorCode: 7,
      message: 'An error occurred while find user'
    });
  }
}
const getId = async(req,res) =>{
  return res.status(200).json({
    errorCode: 0,
    data: req.user
  });
}
const searchUser = async (req, res) => {
  try {
    const { query } = req.query; 

    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phoneNumber: { $regex: query, $options: 'i' } }
      ]
    });

    if (users.length === 0) {
      return res.status(404).json({ message: 'No users found.' });
    }

    return res.status(200).json({
      errorCode: 0,
      message: 'Search completed successfully',
      data: users
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      errorCode: 7,
      message: 'An error occurred during the search operation'
    });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(); 

    return res.status(200).json({
      errorCode: 0,
      message: 'Fetched all users successfully',
      data: users
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      errorCode: 7,
      message: 'An error occurred while fetching users'
    });
  }
};
module.exports = { addUser,getUserFromUserId,getId,searchUser,getAllUsers };

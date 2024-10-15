const User = require("../modal/User");
const Flashcard = require('../modal/Flashcard');
const QuestionPack = require('../modal/QuestionPack');
const getDashboardData = async (req, res) => {
    const user = req.user;
    
    try {
      // Check if the requesting user is an admin
      if (user.role !== 'admin') {
        return res.status(403).json({
          errorCode: 1,
          message: 'Access denied: Only admins can view the dashboard'
        });
      }
  
      // Fetch counts
      const userCount = await User.countDocuments();
      const flashcardCount = await Flashcard.countDocuments();
      const questionPackCount = await QuestionPack.countDocuments();
  
      // Prepare dashboard data
      const dashboardData = {
        userCount,
        flashcardCount,
        questionPackCount,
        // Add more counts as necessary
      };
  
      return res.status(200).json({
        errorCode: 0,
        message: 'Dashboard data fetched successfully',
        data: dashboardData
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        errorCode: 7,
        message: 'An error occurred while fetching dashboard data'
      });
    }
  };
  
  module.exports = {
    getDashboardData
  };
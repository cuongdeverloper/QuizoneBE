const uploadCloud = require('../config/cloudinaryConfig');
const Comment = require('../modal/Comment');
const FlashCard = require('../modal/FlashCard');
const QuestionPack = require('../modal/QuestionPack');

const addComment = async (req, res) => {
    uploadCloud.single('image')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          errorCode: 7,
          message: `Upload Error: ${err.message}`
        });
      }
  
      const { user, content, flashcardId } = req.body;
      let imageUrl = '';
  
      if (req.file) {
        imageUrl = req.file.path; // The path should be the URL provided by Cloudinary
      }
  
      if (!user || !content || !flashcardId) {
        return res.status(400).json({
          errorCode: 5,
          message: 'User, content, and flashcardId are required fields'
        });
      }
  
      try {
        const newComment = new Comment({
          user,
          content,
          image: imageUrl, // Save the image URL
          flashcard: flashcardId
        });
  
        await newComment.save();
  
        // Optionally: Update the flashcard to include the new comment if needed
        await FlashCard.findByIdAndUpdate(
          flashcardId,
          { $push: { comments: newComment._id } },
          { new: true }
        );
  
        return res.status(201).json({
          errorCode: 0,
          message: 'Comment added successfully',
          data: newComment
        });
      } catch (error) {
        console.error('Error adding comment:', error);
        return res.status(500).json({
          errorCode: 6,
          message: 'An error occurred while adding the comment'
        });
      }
    });
  };
  const getComments = async (req, res) => {
    const { flashcardId } = req.params;
    const { page = 1, limit = 4 } = req.query;

    try {
        const comments = await Comment.find({ flashcard: flashcardId })
            .sort({ createdAt: -1 }) 
            .skip((page - 1) * limit)  
            .limit(parseInt(limit))    
            .populate({
                path: 'user',
                select: 'username email phoneNumber gender image role type' 
            }).populate({
              path: 'replies.user',  // Populate replies user field
              select: 'username'    // Only select the username of the reply user
          });
        const totalComments = await Comment.countDocuments({ flashcard: flashcardId });
        res.status(200).json({
            errorCode: 0,
            message: 'Comments retrieved successfully',
            data: comments.map(comment => ({
                ...comment.toObject(),
                isOwner: comment.user.toString() === req.user.id 
            })),
            total: totalComments,
            page: parseInt(page),
            totalPages: Math.ceil(totalComments / limit)
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({
            errorCode: 6,
            message: 'An error occurred while fetching comments'
        });
    }
};



const getCommentById = async (req, res) => {
    const { commentId } = req.params;

    try {
        // Find the comment by its ID and populate the user field for more information
        const comment = await Comment.findById(commentId).populate({
            path: 'user',
            select: 'username' // Include username in the response
        });

        if (!comment) {
            return res.status(200).json({
                errorCode: 0,
                message: 'No comments found for this Flashcard',
                data: [] // Return an empty array instead of an error
            });
        }

        res.status(200).json({
            errorCode: 0,
            message: 'Comment retrieved successfully',
            data: comment
        });
    } catch (error) {
        console.error('Error fetching comment:', error);
        res.status(500).json({
            errorCode: 6,
            message: 'An error occurred while fetching the comment'
        });
    }
};
const deleteComment = async (req, res) => {
  const {questionPackId, commentId } = req.params;
  const userId = req.user.id; 

  try {
      const comment = await Comment.findById(commentId);
      const questionPack = await QuestionPack.findById(questionPackId)
      if (!comment) {
          return res.status(404).json({
              errorCode: 1,
              message: 'Comment not found'
          });
      }
      if (comment.user.toString() !== userId && questionPack.teacher.toString() !== userId) {
          return res.status(403).json({
              errorCode: 2,
              message: 'You are not authorized to delete this comment'
          });
      }

      await Comment.findByIdAndDelete(commentId);

      await FlashCard.findByIdAndUpdate(
          comment.flashcard,
          { $pull: { comments: commentId } }
      );

      return res.status(200).json({
          errorCode: 0,
          message: 'Comment deleted successfully'
      });
  } catch (error) {
      console.error('Error deleting comment:', error);
      return res.status(500).json({
          errorCode: 6,
          message: 'An error occurred while deleting the comment'
      });
  }
};
const addReply = async (req, res) => {
  const { commentId } = req.params;
  const { user, content } = req.body; 

  if (!user || !content) {
    return res.status(400).json({
      errorCode: 5,
      message: 'User and content are required fields'
    });
  }

  try {
    const reply = { user, content }; 
    await Comment.findByIdAndUpdate(
      commentId,
      { $push: { replies: reply } },
      { new: true }
    );

    return res.status(201).json({
      errorCode: 0,
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while adding the reply'
    });
  }
};
const deleteReply = async (req, res) => {
  const { commentId, replyId } = req.params;
  const userId = req.user.id;

  try {
    const comment = await Comment.findById(commentId);

    // Check if the comment exists
    if (!comment) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Comment not found'
      });
    }

    const replyIndex = comment.replies.findIndex(reply => reply._id.toString() === replyId);
    // Check if the reply exists
    if (replyIndex === -1) {
      return res.status(404).json({
        errorCode: 2,
        message: 'Reply not found'
      });
    }

    if (comment.replies[replyIndex].user.toString() !== userId ) {
      return res.status(403).json({
        errorCode: 3,
        message: 'You are not authorized to delete this reply'
      });
    }

    comment.replies.splice(replyIndex, 1);
    await comment.save();

    return res.status(200).json({
      errorCode: 0,
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while deleting the reply'
    });
  }
};



module.exports = { addComment, getComments, getCommentById, deleteComment, addReply,deleteReply};
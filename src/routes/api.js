const express = require('express');
const { addUser, getUserFromUserId, getId, searchUser, getAllUsers } = require('../controller/ApiUser');
const { apiLogin, apiRegister, verifyOtp, resendOTPVerificationCode, requestPasswordReset, resetPassword } = require('../controller/ApiAuth');
const { createRefreshToken, createJWT, decodeToken, checkAccessToken } = require('../middleware/JWTAction');
const passport = require('passport');
const { createQuestionPack, getAllQuestionPack, searchQuestionPack, addQuestionPackToClass, getQuestionPackById, getAllQuestionPacksForTeacher, updateQuestionPack } = require('../controller/ApiQuestionPack');
const { addQuestionFlashCard, getQuestionFlashCardByQuestionPackId, updateFlashcard } = require('../controller/ApiQuestionFlashCard');
const { addComment, getComments, getCommentById, deleteComment, addReply, deleteReply } = require('../controller/ApiComment');
const { createClass, getClassesForUser, inviteStudentToClass, getClassByClassId, removeQuestionPackFromClass, joinClassByInvite, getStudentsByClassId, getAllMembersByClassId } = require('../controller/ApiClass');
const { sendMessage, getMessages } = require('../controller/ApiMessage');
const { addExam, getExam, getExamByQuestionPack } = require('../controller/ApiExam');
const { submitExam, getExamResults, getStudentResults } = require('../controller/ApiResult');

const routerApi = express.Router();

routerApi.get('/id', checkAccessToken, getId)
//auth
routerApi.post('/auth', apiLogin);
routerApi.post('/register',apiRegister)
routerApi.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

    routerApi.get('/google/redirect', 
      passport.authenticate('google', { failureRedirect: 'https://flash-card-fe-client.vercel.app/login' }), 
      (req, res) => {
          // Create a payload for JWT
          const payload = { 
              email: req.user.email, 
              name: req.user.username, 
              role: req.user.role, 
              id: req.user.id 
          };
  
          // Generate access and refresh tokens
          const accessToken = createJWT(payload);
          const refreshToken = createRefreshToken(payload);
  
          // Construct the redirect URL
          const redirectUrl = `https://flash-card-fe-client.vercel.app/auth/callback?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&user=${encodeURIComponent(JSON.stringify(req.user))}`;
  
          // Redirect to the frontend with tokens
          res.redirect(redirectUrl);
      }
  );
  
routerApi.post('/decode-token', (req, res) => {
    const { token } = req.body;
    const data = decodeToken(token);
    if (data) {
        res.json({ data });
    } else {
        res.status(400).json({ error: 'Invalid token' });
    }
});

//APiUser
routerApi.post('/user', addUser)
routerApi.get('/user/:userId', getUserFromUserId)
routerApi.get('/searchUser',checkAccessToken,searchUser)
routerApi.get('/users',checkAccessToken,getAllUsers)
//Api QuestionPack
routerApi.post('/questionPack', checkAccessToken, createQuestionPack)
routerApi.get('/questionPack', getAllQuestionPack)
routerApi.get('/questionPacks/search', searchQuestionPack)
routerApi.get('/questionPacks/:questionPackId', checkAccessToken,getQuestionPackById)
routerApi.put('/questionpack/:questionpackId',checkAccessToken,updateQuestionPack);

routerApi.get('/questionPack/:questionPackId', checkAccessToken,getQuestionFlashCardByQuestionPackId)
//Api questionFC
routerApi.post('/question',checkAccessToken, addQuestionFlashCard)
routerApi.put('/flashcard/:flashcardId', checkAccessToken,updateFlashcard);

//Api comment
routerApi.post('/questionpack/comments', checkAccessToken, addComment)
routerApi.get('/questionpack/comments/:flashcardId', checkAccessToken, getComments)
routerApi.get('/questionpack/comment/:commentId', getCommentById)
routerApi.delete('/questionpack/comment/:questionPackId/:commentId', checkAccessToken, deleteComment)
routerApi.post('/questionpack/comment/reply/:commentId',checkAccessToken,addReply)
routerApi.delete('/questionpack/comment/reply/:commentId/:replyId', checkAccessToken, deleteReply);

//Api class
routerApi.post('/class',checkAccessToken,createClass)
routerApi.get('/class',checkAccessToken,getClassesForUser);
routerApi.post('/class/invite',checkAccessToken,inviteStudentToClass)
routerApi.get('/class/:classId',checkAccessToken,getClassByClassId)
routerApi.post('/class/questionPackToClass',checkAccessToken,addQuestionPackToClass)
routerApi.delete('/class/removeQp',checkAccessToken,removeQuestionPackFromClass)
routerApi.get('/class/getMembers/:classId', checkAccessToken, getAllMembersByClassId);  
routerApi.get('/join-class/:token', checkAccessToken, joinClassByInvite);  


// message:
routerApi.post('/messages/:id', checkAccessToken, sendMessage);
routerApi.get('/messages/:id', checkAccessToken, getMessages);


//Quiz
routerApi.post('/quiz',checkAccessToken,addExam)
routerApi.get('/quiz/:examId', checkAccessToken, getExam);
routerApi.get('/exam/:questionPackId', checkAccessToken, getExamByQuestionPack);

//result
routerApi.post('/finish',checkAccessToken,submitExam)
routerApi.get('/results/:examId',checkAccessToken,getExamResults)
routerApi.get('/results-student/',checkAccessToken ,getStudentResults);
//teacher
routerApi.get('/getQp4Teacher/:teacherId',checkAccessToken,getAllQuestionPacksForTeacher)

routerApi.post('/verify-otp', verifyOtp);

routerApi.post('/rqreset-password', requestPasswordReset);
routerApi.post('/reset-password', resetPassword);
module.exports = { routerApi };

const Exam = require("../modal/Exam");
const Result = require("../modal/Result");

const submitExam = async (req, res) => {
    try {
      const { examId, answers } = req.body; 
      const studentId = req.user.id;
  
      // Fetch the exam details
      const exam = await Exam.findById(examId).populate('questions');
      if (!exam) {
        return res.status(404).json({ error: 'Exam not found.' });
      }
  
      // Check the answers and calculate the score
      const results = exam.questions.map((question) => {
        const selectedAnswers = answers[question._id] || [];
        const correctAnswers = question.correctAnswers.map((index) => question.answers[index]);
        const isCorrect = selectedAnswers.length === correctAnswers.length &&
          correctAnswers.every((answer) => selectedAnswers.includes(answer));
  
        return {
          questionId: question._id,
          selectedAnswers,
          isCorrect
        };
      });
  
      const totalQuestions = results.length;
      const correctAns = results.filter(result => result.isCorrect).length;
      const score1 = totalQuestions > 0 ? (correctAns / totalQuestions) * 100 : 0;
      const score = Math.round(score1);
      // Save the result in the database
      const newResult = new Result({
        student: studentId,
        exam: examId,
        score,
        answers: results
      });
  
      await newResult.save();
  
      res.status(201).json({ success: true, message: 'Exam submitted successfully', result: newResult });
    } catch (error) {
      console.error('Error submitting exam:', error);
      res.status(500).json({ error: 'An error occurred while submitting the exam.' });
    }
  };
  
  const getExamResults = async (req, res) => {
    try {
      const { examId } = req.params;
      const teacherId = req.user.id; 
      
      // Ensure the teacher owns the exam
      const exam = await Exam.findById(examId)
        .populate({
          path: 'questionPack',  // Populate the question pack
          populate: {
            path: 'questions',    // Populate the questions inside the question pack
            select: 'answers',    // Only return the answers field from each question
          }
        });
  
      if (!exam || exam.questionPack.teacher.toString() !== teacherId) {
        return res.status(403).json({ error: 'You do not have access to this exam.' });
      }
  
      // Find all results for this exam
      const results = await Result.find({ exam: examId })
        .populate('student', 'username name email'); // Populate student details
      
      if (!results.length) {
        return res.status(404).json({ error: 'No results found for this exam.' });
      }
  
      // Return the exam results along with the answers from the question pack
      res.status(200).json({ 
        success: true, 
        answers: exam.questionPack.questions.map(question => question.answers), // Only return the answers from each question
        results 
      });
    } catch (error) {
      console.error('Error fetching exam results:', error);
      res.status(500).json({ error: 'An error occurred while fetching the results.' });
    }
  };
  const getStudentResults = async (req, res) => {
    const studentId = req.user.id;

    try {
        // Fetch results and populate exam and questionPack
        const results = await Result.find({ student: studentId })
            .populate({
                path: 'exam',
                populate: {
                    path: 'questionPack', // Populate questionPack from Exam
                },
            });

        if (!results.length) {
            return res.status(404).json({ error: 'No results found for this student.' });
        }

        res.status(200).json({ success: true, results });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching results.' });
    }
};

module.exports = { submitExam,getExamResults,getStudentResults };

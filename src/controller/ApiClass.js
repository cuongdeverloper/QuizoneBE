const Class = require('../modal/Class');
const User = require('../modal/User');
const crypto = require('crypto');
const createClass = async (req, res) => {
  try {
      const authenticatedUser = req.user;
      if (authenticatedUser.role !== 'teacher' &&  authenticatedUser.role !== 'admin') {
          return res.status(403).json({ message: 'Only teachers or admins can create classes' });
      }

      const name = req.body.name;
      const students = Array.isArray(req.body.students) ? req.body.students : [];
      const creatorId = authenticatedUser.id;

      let validStudents = [];
      if (students.length > 0) {
          validStudents = await User.find({ _id: { $in: students } });
          if (validStudents.length !== students.length) {
              return res.status(400).json({ message: 'One or more user IDs are invalid' });
          }
      }

      const invitationToken = crypto.randomBytes(16).toString('hex');
      const invitationLink = `${process.env.FRONTEND_URL}/join-class/${invitationToken}`;

      const newClass = new Class({
          name,
          teacher: creatorId,
          students: validStudents.map(student => student._id),
          invitationLink
      });

      await newClass.save();

      return res.status(201).json({
          message: 'Class created successfully',
          data: newClass,
      });
  } catch (error) {
      console.error('Error creating class:', error);
      return res.status(500).json({ message: 'An error occurred while creating the class' });
  }
};
  const getAllClasses = async (req, res) => {
    try {
      const authenticatedUser = req.user;
  
      const classes = await Class.find({
        $or: [
          { teacher: authenticatedUser._id },  // If user is the teacher (creator)
          { students: authenticatedUser._id }  // If user is a student in the class
        ]
      })
        .populate('students', 'username email')  // Populate student info
        .populate('teacher', 'username email');  // Populate teacher info
  
      return res.status(200).json({
        errorCode: 0,
        message: 'Classes retrieved successfully',
        data: classes
      });
    } catch (err) {
      console.error('Error fetching classes:', err);
      return res.status(500).json({
        errorCode: 6,
        message: 'An error occurred while fetching the classes'
      });
    }
  };
  
  const inviteStudentToClass = async (req, res) => {
    try {
      const { classId, studentId } = req.body;
  
      const authenticatedUser = req.user;
      // Find the class and check if the authenticated user is the teacher (creator of the class)
      const classData = await Class.findById(classId);
      if (!classData || classData.teacher.toString() !== authenticatedUser.id.toString()) {
        return res.status(403).json({
          errorCode: 7,
          message: 'You are not authorized to invite students to this class'
        });
      }
  
      // Check if the student exists and is not already in the class
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({
          errorCode: 8,
          message: 'Student not found or invalid role'
        });
      }
  
      if (classData.students.includes(studentId)) {
        return res.status(400).json({
          errorCode: 9,
          message: 'Student is already in the class'
        });
      }
  
      // Add the student to the class
      classData.students.push(studentId);
      await classData.save();
  
      return res.status(200).json({
        errorCode: 0,
        message: 'Student invited successfully',
        data: classData
      });
    } catch (error) {
      console.error('Error inviting student:', error);
      return res.status(500).json({
        errorCode: 6,
        message: 'An error occurred while inviting the student'
      });
    }
  };
  const getClassesForUser = async (req, res) => {
    try {
        const authenticatedUser = req.user; 
        const classes = await Class.find({
            $or: [
                { teacher: authenticatedUser.id },  // If user is the teacher (creator)
                { students: authenticatedUser.id }  // If user is a student in the class
            ]
        })
        .populate('students', 'username email')  // Populate student info
        .populate('teacher', 'username email');   // Populate teacher info

        return res.status(200).json({
            errorCode: 0,
            message: 'Classes retrieved successfully',
            data: classes
        });
    } catch (err) {
        console.error('Error fetching classes:', err);
        return res.status(500).json({
            errorCode: 6,
            message: 'An error occurred while fetching the classes'
        });
    }
};

const getClassByClassId = async (req, res) => {
  try {
    const { classId } = req.params;  
    const authenticatedUser = req.user;  


    const classData = await Class.findById(classId)
        .populate('students', 'username email') 
        .populate('teacher', 'username email');   

    if (!classData) {
        return res.status(404).json({
            errorCode: 1,
            message: 'Class not found'
        });
    }
    const isTeacher = classData.teacher._id.toString() === authenticatedUser.id.toString();
    const isStudent = classData.students.some(student => student._id.toString() === authenticatedUser.id.toString());

    if (!isTeacher && !isStudent) {
        return res.status(403).json({
            errorCode: 7,
            message: 'You are not authorized to view this class'
        });
    }

    return res.status(200).json({
        errorCode: 0,
        message: 'Class retrieved successfully',
        data: classData
    });
} catch (err) {
    console.error('Error fetching class by ID:', err);
    return res.status(500).json({
        errorCode: 6,
        message: 'An error occurred while fetching the class'
    });
}
};
const removeQuestionPackFromClass = async (req, res) => {
  try {
      const { classId, questionPackId } = req.body; 
      const authenticatedUser = req.user;

      const classData = await Class.findById(classId);
      if (!classData || classData.teacher.toString() !== authenticatedUser.id.toString()) {
          return res.status(403).json({
              errorCode: 7,
              message: 'You are not authorized to remove question packs from this class'
          });
      }

      if (!classData.questionPacks.includes(questionPackId)) {
          return res.status(404).json({
              errorCode: 10,
              message: 'Question pack not found in this class'
          });
      }

      classData.questionPacks = classData.questionPacks.filter(id => id.toString() !== questionPackId);
      await classData.save();

      return res.status(200).json({
          errorCode: 0,
          message: 'Question pack removed successfully',
          data: classData
      });
  } catch (error) {
      console.error('Error removing question pack from class:', error);
      return res.status(500).json({
          errorCode: 6,
          message: 'An error occurred while removing the question pack from the class'
      });
  }
};
const joinClassByInvite = async (req, res) => {
  try {
    const { token } = req.params;
    const authenticatedUser = req.user;

    const classData = await Class.findOne({ invitationLink: `${process.env.FRONTEND_URL}/join-class/${token}` });
    
    if (!classData) {
      return res.status(404).json({ message: 'Class not found or invalid invite link' });
    }


    const alreadyJoined = classData.students.includes(authenticatedUser.id);
    
    if (alreadyJoined || authenticatedUser.id === classData.teacher._id.toString()) {
      return res.status(200).json({
        message: 'Your are joined to class',
        data: classData
      });
    }
    if (!classData.students.includes(authenticatedUser.id)) {
      classData.students.push(authenticatedUser.id);
      await classData.save();
    }

    return res.status(200).json({
      message: 'Successfully joined the class',
      data: classData
    });
  } catch (error) {
    console.error('Error joining class:', error);
    return res.status(500).json({ message: 'An error occurred while joining the class' });
  }
};

const getAllMembersByClassId = async (req, res) => {
  try {
    const { classId } = req.params;  
    const authenticatedUser = req.user;

    const classData = await Class.findById(classId)
      .populate('students', 'username email image')  
      .populate('teacher', 'username email image ');   

    if (!classData) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Class not found'
      });
    }

    // Check if the authenticated user is the teacher or a student in the class
    const isTeacher = classData.teacher._id.toString() === authenticatedUser.id.toString();
    const isStudent = classData.students.some(student => student._id.toString() === authenticatedUser.id.toString());

    if (!isTeacher && !isStudent) {
      return res.status(403).json({
        errorCode: 7,
        message: 'You are not authorized to view the members of this class'
      });
    }

    // Combine teacher and students into a single array
    const allMembers = {
      teacher: classData.teacher,
      students: classData.students
    };

    return res.status(200).json({
      errorCode: 0,
      message: 'Members retrieved successfully',
      data: allMembers
    });
  } catch (err) {
    console.error('Error fetching all members by class ID:', err);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while fetching the members'
    });
  }
};

const deleteStudentFromClass = async (req, res) => {
  try {
    const { classId, studentId } = req.body;
    const authenticatedUser = req.user;

    const classData = await Class.findById(classId);
    if (!classData || classData.teacher.toString() !== authenticatedUser.id.toString()) {
      return res.status(403).json({
        errorCode: 7,
        message: 'You are not authorized to remove students from this class'
      });
    }

    // Check if the student exists in the class
    if (!classData.students.includes(studentId)) {
      return res.status(404).json({
        errorCode: 8,
        message: 'Student not found in this class'
      });
    }

    // Remove the student from the class
    classData.students = classData.students.filter(id => id.toString() !== studentId);
    await classData.save();

    return res.status(200).json({
      errorCode: 0,
      message: 'Student removed successfully',
      data: classData
    });
  } catch (error) {
    console.error('Error removing student from class:', error);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while removing the student from the class'
    });
  }
};

const deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const authenticatedUser = req.user;

    // Find the class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        errorCode: 1,
        message: 'Class not found'
      });
    }

    // Only allow the teacher or an admin to delete the class
    const isTeacher = classData.teacher.toString() === authenticatedUser.id.toString();
    if (!isTeacher && authenticatedUser.role !== 'admin') {
      return res.status(403).json({
        errorCode: 7,
        message: 'You are not authorized to delete this class'
      });
    }

    // Delete the class
    await Class.findByIdAndDelete(classId);

    return res.status(200).json({
      errorCode: 0,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return res.status(500).json({
      errorCode: 6,
      message: 'An error occurred while deleting the class'
    });
  }
};
  module.exports = { createClass, getAllClasses, inviteStudentToClass,getClassesForUser,
    getClassByClassId,removeQuestionPackFromClass,joinClassByInvite,getAllMembersByClassId,
  deleteClass,deleteStudentFromClass};
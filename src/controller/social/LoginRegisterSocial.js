const User = require("../../modal/User");

const upsertSocialMedia = async (typeAcc, dataRaw) => {
    try {
        let dataUser = null;

        if (typeAcc === 'GOOGLE') {
            // Find user by email and type
            dataUser = await User.findOne({
                email: dataRaw.email,
                type: typeAcc
            });

            if (!dataUser) {
                // Check if a user with the same email exists but with a different type
                const existingUser = await User.findOne({ email: dataRaw.email });

                if (existingUser) {
                    // If user exists with the same email but different type, return or handle as needed
                    return null; // or throw an error or handle according to your business logic
                }

                // Create new user if not found
                dataUser = new User({
                    email: dataRaw.email,
                    username: dataRaw.name,
                    type: typeAcc,
                    profileImage:dataRaw.photo,
                    image:dataRaw.photo,
                    socialLogin: true 
                });
                await dataUser.save();
            }
        }

        return dataUser;
    } catch (error) {
        console.error('Error in upsertSocialMedia:', error);
        throw error; // It's a good practice to rethrow the error after logging it
    }
};

module.exports = { upsertSocialMedia };

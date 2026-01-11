const User = require('../models/user')

const registor = async (req, res) => {
    try {
        const { username, email } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        // Create new user
        const user = await User.create({ username, email });
        res.status(201).json({  _id: user._id, username: user.username, email: user.email});
    } catch {
        res.status(500).json({ message: error.message });
    }

}

const login = async (req, res) => {
    try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email
    });

    } catch {
        res.status(500).json({ message: error.message });
    }
}



module.exports = {registor,login }
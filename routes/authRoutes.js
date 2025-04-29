const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const { image } = require('../config/cloudinary');
const upload = require('../middleware/uploadMiddleware')
const nodemailer = require('nodemailer'); // For sending emails
const crypto = require('crypto'); // For generating a token
// Register Route
router.post('/register',upload.single("image"), async (req, res) => {
  const { name, email, password ,isAdmin} = req.body;
  const imageUrl = req.file?.path
  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      image:imageUrl,
      isAdmin: isAdmin || false, // default
    });

    const savedUser = await newUser.save();

    // Create token
    const token = jwt.sign({ id: savedUser._id, isAdmin: savedUser.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email,
      image:savedUser.image,
      isAdmin: savedUser.isAdmin,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Create token
    const token = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image:user.image,
      isAdmin: user.isAdmin,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});






// router.post('/forgot-password', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: 'User with this email does not exist' });
//     }

//     // Generate a token (valid for 15 minutes)
//     const resetToken = crypto.randomBytes(32).toString('hex');
//     const resetTokenExpiration = Date.now() + 15 * 60 * 1000; // 15 minutes

//     // Save the reset token and its expiration time in the user's record
//     user.resetToken = resetToken;
//     user.resetTokenExpiration = resetTokenExpiration;
//     await user.save();

//     // Send the email with the reset link (using Nodemailer)
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//     });

//     const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: 'Password Reset Request',
//       text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
//     };

//     await transporter.sendMail(mailOptions);
//     res.json({ message: 'Password reset link sent to email' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });





  
// router.post('/forgot-password', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     const resetToken = crypto.randomBytes(32).toString('hex');
//     const hash = crypto.createHash('sha256').update(resetToken).digest('hex');

//     user.resetPasswordToken = hash;
//     user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins

//     await user.save();

//     const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

//     // Email this resetLink to user
//     // ...
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER, // e.g., 'blogbrewofficial@gmail.com'
//         pass: process.env.EMAIL_PASS, // Your App Password
//       },
//     });

//     const mailOptions = {
//             from: process.env.EMAIL_USER,
//             to: email,
//             subject: 'Password Reset Request',
//             text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
//           };
      
//           await transporter.sendMail(mailOptions);
//           res.json({ message: 'Password reset link sent to email' });
//         } catch (error) {
//           res.status(500).json({ message: error.message });
//         }

  
// });




router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Create a short-lived JWT
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Setup mail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${resetLink}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset link sent' });
  } catch (err) {
    res.status(500).json({ message: 'Error sending reset email' });
  }
});







router.post('/contactus', async (req, res) => {
  const { name, email, phone, message } = req.body;

  let senderEmail = email;
  let senderName = name;

  if (req.user) {
    senderEmail = req.user.email;
    senderName = req.user.name;
  }

  const content = `
    Name: ${senderName}
    Email: ${senderEmail}
    Phone: ${phone || 'Not Provided'}
    
    Message:
    ${message}
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'New Contact Form Submission',
      text: content,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Failed to send message' });
  }
});



router.post('/subscribetonewsletter', async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // Setup transporter (Use your SMTP provider or Gmail)
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password if using Gmail 2FA
      },
    });

    // const mailOptions = {
    //   from: `BlogBrew,${process.env.EMAIL_USER}`,
    //   to: email,
    //   subject: '🎉 You’re subscribed to our Newsletter!',
    //   html: `
    //     <h2>Thank you for subscribing!</h2>
    //     <p>Hi there,</p>
    //     <p>We're thrilled to have you on board. You'll now be the first to know about our latest news, updates, and more.</p>
        
    //     <p>— The Team at BlogBrew ❤️</p>
    //   `,
    // };

    const mailOptions = {
      from:`BlogBrew,${process.env.EMAIL_USER}`,
      to: email,
      subject: '✅ You’ve Successfully Subscribed to Our Newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">Welcome to the Family! 👋</h2>
    
          <p>Hi there,</p>
    
          <p>We're excited to let you know that your email <strong>${email}</strong> has been successfully added to our newsletter list.</p>
    
          <p>From now on, you’ll receive:</p>
          <ul style="line-height: 1.6;">
            <li>✅ Weekly insights, tips & tricks</li>
            <li>🚀 Early access to new features and updates</li>
            <li>🎁 Exclusive deals and subscriber-only perks</li>
          </ul>
    
          <p>We value your inbox — no spam, just value. You can unsubscribe anytime using the link provided in our emails.</p>
    
          <br/>
          <p style="color: #888;">If you didn’t sign up for this, you can safely ignore this email.</p>
    
          <hr style="margin-top: 40px;"/>
          <p style="font-size: 14px; color: #aaa;">
            — The Team at <strong>BlogBrew</strong><br/>
            <a href="https://www.blogbrew.com" style="color: #3498db;">www.blogbrew.com</a><br/>
            📧 blogbrewofficial@gmail.com
          </p>
        </div>
      `,
    };
    
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Subscription confirmation email sent!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send email' });
  }
});





// router.post('/reset-password/:token', async (req, res) => {
//   const { token } = req.params;
//   const { newPassword } = req.body;

//   try {
//     // Find the user by the reset token
//     const user = await User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } });

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid or expired token' });
//     }

//     // Hash the new password
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Update the password and clear the reset token
//     user.password = hashedPassword;
//     user.resetToken = undefined;
//     user.resetTokenExpiration = undefined;

//     await user.save();

//     res.json({ message: 'Password updated successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });






// router.post('/reset-password/:token', async (req, res) => {
//   try {
//     // Decode the token
//     const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
//     const userId = decoded.userId;

//     // Find the user based on the decoded userId
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Update the user's password after validating new password
//     const hashedPassword = await bcrypt.hash(req.body.password, 10);
//     user.password = hashedPassword;
//     await user.save();

//     res.json({ message: 'Password reset successfully' });
//   } catch (err) {
//     res.status(400).json({ message: 'Invalid or expired token' });
//   }
// });





// Example route to reset password
// router.post('/reset-password/:token', async (req, res) => {
//   try {
//     const resetToken = req.params.token;  // Extract the token from the URL
//     console.log(resetToken,"resdt")
//     // Verify the reset token (check expiry, signature, etc.)
//     const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
//     console.log(decoded,"decode")
//     // Check if the user exists using decoded info (e.g., user ID from the token)
//     const user = await User.findById(decoded.id);
//     console.log(user,"0000")
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     // If token is valid, show reset password form (or API for password update)
//     res.json({ message: 'Token is valid, proceed to reset password' });
//   } catch (error) {
//     return res.status(400).json({ message: 'Invalid or expired token' });
//   }
// });



// router.post('/reset-password/:token', async (req, res) => {
//   const { token } = req.params;
//   const { password } = req.body;

//   try {
//     const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
//     console.log("hashed token", hashedToken)
//     const user = await User.findOne({
//       resetPasswordToken: hashedToken,
//       resetPasswordExpires: { $gt: Date.now() },
//     });

//     if (!user) {
//       return res.status(400).json({ message: 'Token is invalid or expired' });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     user.password = hashedPassword;
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;

//     await user.save();

//     res.json({ message: 'Password reset successful' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Something went wrong' });
//   }
// });


// Route to handle password reset using JWT token
router.post('/reset-password/:token', async (req, res) => {
  const resetToken = req.params.token;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'New password is required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    // Find the user using decoded ID
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(400).json({ message: 'Invalid or expired reset token' });
  }
});



module.exports = router;

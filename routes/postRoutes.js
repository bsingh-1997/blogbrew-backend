const express = require('express');
const router = express.Router();
const Post = require('../models/postSchema');  // Assuming you have a Post model
const User = require('../models/User');  // Assuming you have a Post model
const { protect, isAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware')
const cloudinary = require('../config/cloudinary')
const bcrypt = require('bcryptjs')
// Route to create a new post (only logged-in users can create)
router.post('/', protect,upload.single("image"), async (req, res) => {
  const { title, content,tags,category} = req.body;
  const imageUrl = req.file?.path;
  
  try {
    const newPost = new Post({
      title,
      content,
      user: req.user._id,  // Set the user as the creator of the post
      image:imageUrl,
      tags,
      category
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


  
// router.put('/profile',protect, upload.single("image"), async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: "User not found" });

//     // for name
//     if (req.body.name) {
//       user.name = req.body.name;
//       return res.status(200).json({message:"Name Changed Successfully!"})
//     }
    
//     // If email is passed and different
//     if (req.body.email && req.body.email !== user.email) {
//       const emailExists = await User.findOne({ email: req.body.email });
//       if (emailExists) return res.status(400).json({ message: 'Email already in use' });
//       user.email = req.body.email;
//       return res.status(200).json({message:"Email Changed Successfully!"})
//     }

//     // // If password is passed
//     // if (req.body.password) {
//     //   const hashed = await bcrypt.hash(req.body.password, 10);
//     //   user.password = hashed;
//     // }
//     // If password is passed
// if (req.body.password && req.body.oldPassword) {
//   const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
//   if (!isMatch) {
//     return res.status(400).json({ message: 'Old password is incorrect' });
//   }

//   const hashed = await bcrypt.hash(req.body.password, 10);
//   user.password = hashed;
//   // return res.status(200).json({message:"Password changed successfully"})
// } else if (req.body.password && !req.body.oldPassword) {
//   return res.status(400).json({ message: 'Old password is required to set a new one' });
// }


//     // If image is uploaded
//     if (req.file?.path) {
//       // OPTIONAL: Delete old image from Cloudinary
//       if (user.image && user.image.includes("res.cloudinary.com")) {
//         const segments = user.image.split('/');
//         const publicIdWithExtension = segments[segments.length - 1];
//         const publicId = publicIdWithExtension.split('.')[0];
//         await cloudinary.uploader.destroy(publicId); // only if you're storing public_id
//       }

//       user.image = req.file.path;
//       return res.status(200).json({message:"Image Changed Successfully!"})
//     }


//     // If user wants to remove image
// if (req.body.removeImage === 'true') {
//   if (user.image && user.image.includes("res.cloudinary.com")) {
//     const segments = user.image.split('/');
//     const publicIdWithExtension = segments[segments.length - 1];
//     const publicId = publicIdWithExtension.split('.')[0];
//     await cloudinary.uploader.destroy(publicId);
//   }
//   user.image = '';
//   return res.status(200).json({message:"Image Deleted Successfully!"})
// }




//     const updatedUser = await user.save();

//     res.json({
//       _id: updatedUser._id,
//       name: updatedUser.name,
//       email: updatedUser.email,
//       image: updatedUser.image,
//       isAdmin: updatedUser.isAdmin,
//       message:req.body.password?"Password changed successfully":""
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });





router.put('/profile', protect, upload.single("image"), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let message = [];

    // Name
    if (req.body.name && req.body.name !== user.name) {
      user.name = req.body.name;
      message.push("Name changed");
    }

    // Email
    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) return res.status(400).json({ message: 'Email already in use' });
      user.email = req.body.email;
      message.push("Email changed");
    }

    // Password
    if (req.body.password && req.body.oldPassword) {
      const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Old password is incorrect' });
      const hashed = await bcrypt.hash(req.body.password, 10);
      user.password = hashed;
      message.push("Password changed");
    } else if (req.body.password && !req.body.oldPassword) {
      return res.status(400).json({ message: 'Old password is required to set a new one' });
    }

    // Remove Image
    if (req.body.removeImage === 'true') {
      if (user.image && user.image.includes("res.cloudinary.com")) {
        const segments = user.image.split('/');
        const publicIdWithExtension = segments[segments.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      user.image = '';
      message.push("Image removed");
    }

    // Update Image
    if (req.file?.path) {
      if (user.image && user.image.includes("res.cloudinary.com")) {
        const segments = user.image.split('/');
        const publicIdWithExtension = segments[segments.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      user.image = req.file.path;
      message.push("Image updated");
    }

    // Save changes
    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      isAdmin: updatedUser.isAdmin,
      message: message.join(", ") || "No changes made"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});





// Route to get all posts (publicly accessible)
router.get('/', async (req, res) => {
  try {
    // const posts = await Post.find();
    const posts = await Post.find().populate('user','name image').populate('comments.user', 'name email');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Route to get a single post by ID (publicly accessible)
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('user', 'name image').populate('comments.user', 'name email image');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




// Route to update a post (only the user who created the post or an admin can update)
// router.put('/:id', protect, async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);

//     // Check if the post exists
//     if (!post) {
//       return res.status(404).json({ message: 'Post not found' });
//     }

//     // Check if the logged-in user is the owner or an admin
//     if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
//       return res.status(403).json({ message: 'Not authorized to update this post' });
//     }

//     post.title = req.body.title || post.title;
//     post.content = req.body.content || post.content;

//     const updatedPost = await post.save();
//     res.json(updatedPost);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });








// Route to update a post (only the user who created the post or an admin can update)
router.put('/:id', protect, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the logged-in user is the owner or an admin
    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    // Update title and content if provided in the request
    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;

    // Update category and tags if provided in the request
    post.category = req.body.category || post.category;
    post.tags = req.body.tags || post.tags;

    // If a new image is uploaded, delete the old image if it exists
    if (req.file?.path) {
      // OPTIONAL: Delete old image from Cloudinary if it exists
      if (post.image && post.image.includes("res.cloudinary.com")) {
        const segments = post.image.split('/');
        const publicIdWithExtension = segments[segments.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(publicId); // Delete old image from Cloudinary
      }

      // Set the new image URL (Cloudinary URL)
      post.image = req.file.path;
    } else if (req.body.deleteImage === 'true') {
      // If the user wants to delete the image, remove it
      if (post.image && post.image.includes("res.cloudinary.com")) {
        const segments = post.image.split('/');
        const publicIdWithExtension = segments[segments.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        await cloudinary.uploader.destroy(publicId); // Delete old image from Cloudinary
      }
      post.image = null; // Set image to null if deleting
    }

    // Save the updated post
    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});




// Route to delete a post (only the user who created the post or an admin can delete)
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post exists
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the logged-in user is the owner or an admin
    if (post.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // await post.remove();
    await post.deleteOne();
    res.json({ message: 'Post removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// post like and unlike
router.put('/posts/:id/like', protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.user.id;

  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (post.likes.includes(userId)) {
    post.likes.pull(userId); // Unlike
  } else {
    post.likes.push(userId); // Like
    post.dislikes.pull(userId); // Remove dislike if it exists
  }

  await post.save();
  res.json({ likes: post.likes.length });
});



// post dislikes and non dislike
router.put('/posts/:id/dislike', protect, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.user.id;

  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (post.dislikes.includes(userId)) {
    post.dislikes.pull(userId); // Remove dislike
  } else {
    post.dislikes.push(userId); // Dislike
    post.likes.pull(userId); // Remove like if it exists
  }

  await post.save();
  res.json({ dislikes: post.dislikes.length });
});


  // add comment
  router.post('/posts/:id/comments', protect, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
  
    const comment = {
      user: req.user.id,
      text: req.body.text,
    };
  
    post.comments.push(comment);
    await post.save();
  
    // res.json(post.comments);
    const updatedPost = await Post.findById(req.params.id)
  .populate('comments.user', 'name '); // only populate the name field

res.json(updatedPost.comments);
console.log(updatedPost.comments)

  });

  // // delete comments
  // router.delete('/posts/:postId/comments/:commentId', protect, async (req, res) => {
  //   const post = await Post.findById(req.params.postId);
  //   if (!post) return res.status(404).json({ message: 'Post not found' });
  
  //   const comment = post.comments.id(req.params.commentId);
  //   if (!comment) return res.status(404).json({ message: 'Comment not found' });
  
  //   if (comment.user.toString() !== req.user.id) {
  //     return res.status(403).json({ message: 'Not authorized to delete this comment' });
  //   }
  
  //   comment.remove();
  //   await post.save();
  
  //   res.json({ message: 'Comment deleted' });
  // });
  // Delete comment route


  // router.delete('/posts/:postId/comments/:commentId', protect, async (req, res) => {
//   const post = await Post.findById(req.params.postId);
//   if (!post) return res.status(404).json({ message: 'Post not found' });

//   const comment = post.comments.id(req.params.commentId);
//   if (!comment) return res.status(404).json({ message: 'Comment not found' });

//   if (comment.user.toString() !== req.user.id) {
//     return res.status(403).json({ message: 'Not authorized to delete this comment' });
//   }

//   // Manually filter out the comment
//   post.comments = post.comments.filter(
//     (c) => c._id.toString() !== req.params.commentId
//   );

//   await post.save();

//   res.json({ message: 'Comment deleted' });
// });


// delete comments


// router.delete('/posts/:postId/comments/:commentId', protect, async (req, res) => {
//   const post = await Post.findById(req.params.postId);
//   if (!post) return res.status(404).json({ message: 'Post not found' });

//   const comment = post.comments.id(req.params.commentId);
//   if (!comment) return res.status(404).json({ message: 'Comment not found' });

//   // Allow deletion if the current user is the comment owner OR the post owner
//   const isCommentOwner = comment.user.toString() === req.user.id;
//   const isPostOwner = post.user.toString() === req.user.id;

//   if (!isCommentOwner && !isPostOwner) {
//     return res.status(403).json({ message: 'Not authorized to delete this comment' });
//   }

//   // Remove the comment
//   post.comments = post.comments.filter(
//     (c) => c._id.toString() !== req.params.commentId
//   );

//   await post.save();

//   res.json({ message: 'Comment deleted', comments: post.comments });
// });




router.delete('/posts/:postId/comments/:commentId', protect, async (req, res) => {
  const post = await Post.findById(req.params.postId);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  const comment = post.comments.id(req.params.commentId);
  if (!comment) return res.status(404).json({ message: 'Comment not found' });

  const postOwnerId = post.user._id ? post.user._id.toString() : post.user.toString();
  const isCommentOwner = comment.user.toString() === req.user.id;
  const isPostOwner = postOwnerId === req.user.id;

  if (!isCommentOwner && !isPostOwner) {
    return res.status(403).json({ message: 'Not authorized to delete this comment' });
  }

  post.comments = post.comments.filter(
    (c) => c._id.toString() !== req.params.commentId
  );

  await post.save();

  res.json({ message: 'Comment deleted', comments: post.comments });
});




module.exports = router;

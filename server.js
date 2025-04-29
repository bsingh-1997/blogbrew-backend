const dotenv = require("dotenv");
// const projectRoutes = require("./routes/projectRoutes")
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const postRoutes = require('./routes/postRoutes')
const authRoutes = require('./routes/authRoutes')
const editUser = require('./routes/editUser')
// require('dotenv').config();
dotenv.config();
require('dotenv').config();


const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected'))
  .catch((err) => console.log(err));

// Basic route
app.get('/', (req, res) => {
  res.send('API is running');
});
// app.use('/products',projectRoutes)
// Start server
app.use('/api',postRoutes)
app.use('/route',authRoutes)
// app.use('/edit',editUser)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

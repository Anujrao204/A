const express = require('express')
const path = require('path')
const bodyparser = require('body-parser')
const mongoose = require("mongoose")
const detailsModel = require('./details')
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const session = require('express-session');
const crypto = require('crypto');
require('dotenv').config();


const app = express();
const port=4000

//Database connection
const db=process.env.URL
mongoose.connect(db,{useNewUrlParser:true,useUnifiedTopology:true}).then(()=>{
    console.log("Database connected")
});

const secretKey = crypto.randomBytes(64).toString('hex');
app.use(bodyparser.urlencoded({extended: false}))
app.use(
    session({
      secret: secretKey, // Use the imported secret key
      resave: false,
      saveUninitialized: true,
    })
  );


app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname + "/index.html"))
})

app.get('/otp',(req,res)=>{
    res.sendFile(path.join(__dirname + "/otp.html"))
})

app.get('/signup.html',(req,res)=>{
    res.sendFile(path.join(__dirname + "/signup.html"))
})

app.post('/signup/done',async(req,res)=>{
    try {
        const { name, email, password } = req.body;
        const user = await detailsModel.findOne({ email });
        if(user){
          res.redirect('/')
        }
        else{
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        // Create a new user document using the detailsModel
        const newUser = new detailsModel({
          name,
          email,
          password :hash,
        });
        // Save the user document to the "Users" collection
        await newUser.save();
        const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
        req.session.otp = otp;
        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
              user: 'anujanilnemanwar204@gmail.com',
              pass: process.env.pass,
            },
          });
          const mailOptions = {
            from: 'anujanilnemanwar204@gmail.com', // Your email address
            to: `${email}`, // Recipient's email address
            subject: 'Your OTP for Sign Up', // Email subject
            text: `Your OTP is: ${otp}`, // Email body containing the OTP
          };
          
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              console.error('Error sending email:', error);
            } else {
              console.log('Email sent:', info.response);
            }
          });
        res.redirect('/otp');
        }

      } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error occurred during sign-up' });
}})


app.post('/otp/verify',async(req,res)=>{
    const userEnteredOTP = req.body.otp; // Assuming the user entered the OTP in a request body field

  // Retrieve the stored OTP from the session
  const storedOTP = req.session.otp;

  if (userEnteredOTP === storedOTP) {
    res.redirect('/')
  }   
})

app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find the user by email in the database
      const user = await detailsModel.findOne({ email });
  
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
  
      // Compare the entered password with the stored hashed password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
  
      if (!isPasswordMatch) {
        return res.status(401).json({ message: 'Invalid password' });
      }
  
      // Successful login
      // You can set a user session or generate a token here
      // Redirect to a user dashboard or return a success message
      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Error occurred during login' });
    }
  });
app.listen(port,()=>{
    console.log(`The server is up and running at ${port}`);
})
const express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.status(200).send('You just hit the API');
});

var courses = []
var registered = []

// Add validation for admin and student

// Admin related requests
// Method for viewing all courses
// Method for adding new courses
// Method for updating a course
// Method for deleting a course
// Method to view a student's courses

// Student related methods
// Method for signup/login
// Method to view courses available
// Method for registering courses
// Method to view registered courses
// Method to delete a course



app.listen(3000);
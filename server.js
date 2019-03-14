const express = require('express');
const fs = require('fs');
const joi = require('joi');
var app = express();

app.set('views', './views');
app.set('view engine', 'pug');


// ###################

// ****** DATA *******

// ###################


var courses = [
    {
        id: "CSE101",
        name : "VAP",
        credits : 2,
        duration : 10,
        startDate: new Date(2019, 1, 5),
        status: "active",
        enrolled: 6
    }, {
        id: "CSE102",
        name : "Data Structures",
        credits : 2,
        duration : 5,
        startDate: new Date(2019, 10, 1),
        status: "inactive",
        enrolled: 10
    }, {
        id: "CSE105",
        name : "DBMS",
        credits : 1,
        duration : 6,
        startDate: new Date(2019, 1, 3),
        status: "active",
        enrolled: 5
    }, {
        id: "CSE209",
        name : "Operating Systems",
        credits : 1,
        duration : 5,
        startDate: new Date(2019, 9, 20),
        status: "inactive",
        enrolled: 20
    }, {
        id: "CSE210",
        name : "System Design",
        credits : 2,
        duration : 5,
        startDate: new Date(2019, 2, 5),
        status: "active",
        enrolled: 15
    }
];

var students = [
    {
        id: "STUD001",
        name: "Saumay",
        password: "123456",
        registered: ["CSE101", "CSE102"]
    }, {
        id: "STUD002",
        name: "Pritish",
        password: "123456",
        registered: ["CSE210", "CSE209"]
    }
];

var admin = [
    {
        id: "ADMN001",
        admin: "admin1",
        password: "123456"
    },{
        id: "ADMN001",
        admin: "admin2",
        password: "123456"
    }
];

var uid = undefined;

const loginschema = {
    id: joi.string().length(7).required(),
    password: joi.string().min(6).required(),
    user: joi.string().required()
}

const courseSchema = {
    id: joi.string().length(6).required(),
    name: joi.string().min(5).max(20).required(),
    credits: joi.number().integer().min(0).max(4).required(),
    duration: joi.number().integer().min(1).max(10).required(),
    date: joi.date().min('1-1-2019').required(),
    status: joi.string().required(),
    enrolled: joi.number().integer()
}




// ##########################

// ****** MIDDLEWARES *******

// ##########################

app.use(express.json())
app.use(express.urlencoded({ extended: true}));

// This middleware creates a server log for all the requests with their methods handled by the server.
app.use(function(req, res, next) {
    let ts = Date();
    let logline = '[' + ts.substr(0,33) + '] UID:' + uid  + ' ' + req.method + ' ' + req.path + '\n';
    fs.appendFile('log.txt', logline, {'flag': 'a'}, function(err) {
        if (err) console.log(err);
        else {
            console.log(logline);
        }
    });
    next();
});



// ###########################

// ****** API Endpoints ****** 

// ###########################



app.get('/', function(req, res) {
    res.status(200).render('index');
});

app.get('/signup', function(req, res) {
    res.status(200).render('signup');
});

app.get('/login', function(req, res) {
    res.status(200).render('login');
});


// API endpoint for signup
app.post('/signup', function(req, res) {
    let id = req.body.id;
    let name = req.body.name;
    let password = req.body.password;
    let newStudent = {
        id: id,
        name: name, 
        password: password,
        registered: [],
        totalCredits: 0
    }
    students.push(newStudent);
    res.status(200).send('Sign up successful!!');
});

// API endpoint for login
app.post('/login', function(req, res) {
    
    let data = {
        id: req.body.id,
        password: req.body.password,
        user: req.body.user
    }

    joi.validate(data, loginschema, function(err, value) {
        if(err) {
            console.log(err);
            res.status(400).json({
                status: 'error',
                message: 'Invalid request data',
                data: data
            });
        }
        else {
            if (data.user === "student") {
                if (validateStudent(data.id, data.password)) {
                    uid = data.id;
                    res.status(200).render('studentIndex', {id: uid});
                } else {
                    res.status(401).send('Invalid information.');
                }
            }
            else {
                if (validateAdmin(data.id, data.password)) {
                    uid = data.id;
                    res.status(200).render('adminIndex', {id: uid});
                } else {
                    res.status(401).send('Invalid information');
                }
            }
        }
    });
});

// API endpoint for getting student details
app.get('/getStudentDetails/:studid', function(req, res) {
    result = getStudentDetails(req.params.studid);
    if(result) {
        res.status(200).json(result);
    }
    else {
        res.status(400).send("Student not found");
    }
});

// API endpoint for enrolling in a course
app.get("/enroll/:studid/:courseid", function(req, res) {
    let student = getStudentDetails(req.params.studid);
    let course = getCourseDetails(req.params.courseid);
    if((student && course) && checkStatus(course.data.startDate) === "inactive") {
        // console.log(student, course);
        students[student.index].registered.push(course.data.id);
        courses[course.index].enrolled += 1;
        res.status(200).send('Enrollment successful.');
    }
    else {
        res.status(400).send('Enrollment unsuccesful.');
    }
});

// API endpoint for unenrolling a course
app.get("/unenroll/:studid/:courseid", function(req, res) {
    let student = getStudentDetails(req.params.studid);
    let course = getCourseDetails(req.params.courseid);
    // console.log(student);
    // console.log(course);
    if((student && course) && checkStatus(course.data.startDate) === "inactive" ) {
        courses[course.index].enrolled -= 1;
        for(let i=0; i<students[student.index].registered.length; i++) {
            if(students[student.index].registered[i] === course.data.id) {
                students[student.index].registered.splice(i, 1);
                break;
            }
        }
        res.status(200).send("Unenrollment successful.");
    }
    else {
        res.status(200).send('Unenrollment unsuccesful.');
    }
});

// API endpoint for viewing available courses
app.get("/getcoursesavailable", function(req, res) {
    if(uid.match('STUD')) {
        result = {
            courses: [],
            id: uid
        }
        let student = getStudentDetails(uid).data;
        // console.log(student);
        // console.log(result);
        for(let i=0; i<courses.length; i++) {
            let flag = 1;
            for(let j=0; j<student.registered.length; j++) {
                // console.log(courses[i].id, student.)
                if(courses[i].id === student.registered[j]) {
                    flag = 0;
                    break;
                }
            }
            if(flag == 1) {
                result.courses.push(courses[i]);
            }
        }
        // console.log(result);

        res.status(200).render('viewCoursesStud', {result: result});
    }
    else if(uid.match('ADMN')) {
        result = {
            courses: courses,
            id: uid,
        }
        res.status(200).render('viewCoursesAdmin', {result: result});
    }
    else
        res.status(400).send('Invalid UID: ' + uid);
});

app.get("/getcoursesregistered/:studid", function(req, res) {
    let student = getStudentDetails(req.params.studid);
    let coursesreg = [];
    for(let i=0; i<student.data.registered.length; i++) {
        coursesreg.push(
            getCourseDetails(student.data.registered[i]).data
        );
    }
    // console.log(coursesreg);
    let result = {
        courses: coursesreg,
        id: uid
    }
    res.status(200).render('regCoursesStud', {result: result});
});

// API endpoint for adding a new course
app.get('/addcourse', function(req, res) {
    res.status(200).render('addCourse');
});

app.post('/addcourse', function(req, res) {
    let date = new Date(req.body.year, req.body.month-1, req.body.day-1);
    let newcourse = {
        id: req.body.id,
        name: req.body.name,
        credits: req.body.credits,
        duration: req.body.duration,
        startdate: date,
        status: checkStatus(date, Date.now()),
        enrolled: 0
    };

    joi.validate(newcourse, courseSchema, function(err, value) {
        if(err) {
            console.log(err);
            res.status(400).json({
                status: 'error',
                message: 'Invalid request data',
                data: newcourse
            });
        }
        else {
            courses.push(newcourse);
            res.write('Course added successfully! Redirecting...');
            setTimeout(function() {
                res.status(300).redirect('/getcoursesavailable');
            }, 5000);
        }
    });

});

// API endpoint for deleting a course
app.get('/deletecourse/:courseid', function(req, res) {
    let course = getCourseDetails(req.params.courseid);
    courses.splice(course.index, 1);
    for(let i=0; i<students.length; i++) {
        for(let j=0; j<students[i].registered.length; j++) {
            if(students[i].registered[j] === req.params.courseid) {
                students[i].registered.splice(j, 1);
                break;
            }
        }
    }
    res.status(200).send('Course deletion successful.');
});


// API endpoint for getting a course's details
app.get("/getcoursedetails/:courseid", function(req, res) {
    let course = getCourseDetails(req.params.courseid).data;
    res.status(200).render('courseDetails', {course: course});
});

// API endpoint for accessing students details
app.get("/viewstudents", function(req, res) {
    let result = {
        students: students
    }
    res.status(200).render('viewStudents', { result: result });
});








// ############################# 

// ***** Utility functions *****

// #############################


function checkStatus(date) {
    let tsdiff = date.getTime() - Date.now();
    if(tsdiff < 0)
        return 'active'
    else
        return 'inactive'
}

function validateStudent(id, password) {
    for(var i=0; i < students.length; i++) {
        if (students[i].id === id) {
            if (students[i].password === password)
                return 1;
            else
                return 0;
        }
    }
    return 0;
}

function validateAdmin(id, password) {
    for(var i=0; i < admin.length; i++) {
        if (admin[i].id === id) {
            if (admin[i].password === password)
                return 1;
            else
                return 0;
        }
    }
    return 0;
}


function getStudentDetails(studid) {
    for(let i=0; i<students.length; i++) {
        if(students[i].id === studid) {
            return {
                data: students[i],
                index: i,
            };
        }
    }
    return undefined;
}

function getCourseDetails(courseid) {
    for(let i=0; i<courses.length; i++) {
        if(courses[i].id === courseid) {
            return {
                data: courses[i],
                index: i,
            };
        }
    }
    return undefined;
}


app.listen(3000);
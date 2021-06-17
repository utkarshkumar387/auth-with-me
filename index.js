const Joi = require('joi');
const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs')
const mongoose = require('mongoose');
const User = require('./model/user');
const app = express();

app.use(express.json());

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

dotenv.config();

mongoose.connect(`${process.env.DB_CONNECT}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
},
    () => console.log("connected to db")
);

//get all users
app.get('/', async (req, res) => {
    //getting all users
    const allUsers = await User.find();
    res.send(allUsers);
});

//get user by id
app.get('/get/:id', async (req, res) => {
    //getting user data by id
    const user = await User.findOne({ _id: req.params.id });
    if (!user) return res.status(404).send(`User with this id is not present`);
    res.send(user);
});

// //login api
app.post('/login', async (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password: Joi.string().required(),
    })
    //validation of requested data
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    //checking email
    const user = await User.findOne({ email: req.body.email });
    if (!user) res.status(404).send(`${req.body.email} ID is not present.`);
    //checking password
    const validatePass = await bcrypt.compare(req.body.password, user.password);
    if (!validatePass) return res.status(400).send("Invalid password")
    res.json({ error: false, data: user });
});

// //register api
app.post('/register', async (req, res) => {
    //validation of requested data
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    //checking is email or phone number present or not in database
    const user = await User.findOne({ email: req.body.email }, { phone_no: req.body.phone_no });
    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassward = await bcrypt.hash(req.body.password, salt);

    if (!user) {
        const currentUser = new User({
            'email': req.body.email,
            'phone_no': req.body.phone_no,
            'name': req.body.name,
            'password': hashPassward,
        })
        try {
            const newUser = await currentUser.save();
            res.json({ error: false, data: newUser });
            res.status(201).send('User added successfully')
        } catch (error) {
            res.status(400).send(error);
        }
    } else {
        res.send('user already registered')
    }
});

// //update user data api
app.put('/:id', async (req, res) => {
    console.log(req.params.id);
    const user = await User.findOne({ _id: req.params.id });
    if (!user) res.status(404).send(`User with this id is not present`);
    console.log(user);
    const { error } = validateUser(req.body);

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    const userUpdate = await User.findOneAndUpdate({
        _id: req.params.id
    },
        {
            $set:
            {
                name: (req.body.name) ? req.body.name : user.name,
                phone_no: (req.body.phone_no) ? req.body.phone_no : user.phone_no,
                email: (req.body.email) ? req.body.email : user.email,
                password: (req.body.password) ? req.body.password : user.password,
            }
        }, { new: true });
    res.send(userUpdate);

});

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().required(),
        phone_no: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password: Joi.string().required(),
    })
    return schema.validate(user);
}

const port = process.env.PORT || 7000;
app.listen(port, () => console.log(`server is running on port ${port}`));

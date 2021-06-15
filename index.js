const Joi = require('joi');
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./model/user');
const app = express();

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


app.use(express.json());

//get all users
app.get('/', async (req, res) => {
    const allUsers = await User.find();
    res.send(allUsers);
});

//get user by id
app.get('/get/:id', async (req, res) => {
    const user = await User.findOne({ id: req.body.id });
    if (!user) res.status(404).send(`User with this id is not present`);

    res.send(user);
});

//login api
app.post('/login', async (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    })

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) res.status(404).send(`${req.body.email} ID is not present.`);
    res.send(user);
});

//register api
app.post('/register', async (req, res) => {
    console.log(req.body);
    const { error } = validateUser(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    const user = await User.findOne({ email: req.body.email }, { phone_no: req.body.phone_no });
    if (!user) {
        const currentUser = new User({
            'email': req.body.email,
            'phone_no': req.body.phone_no,
            'name': req.body.name,
        })
        const newUser = await currentUser.save();
        res.json({ error: false, data: newUser });
        res.status(201).send('User added successfully')
    } else {
        res.send('user already registered')
    }
});

//update user data api
app.put('/:id', async (req, res) => {
    const user = await User.findOne({ id: req.body.id });
    if (!user) res.status(404).send(`User with this id is not present`);

    const { error } = validateUser(req.body);

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    user.name = req.body.name;
    user.phone_no = req.body.phone_no;
    user.email = req.body.email;

    res.send(user);

});

function validateUser(user) {
    const schema = Joi.object({
        name: Joi.string().required(),
        phone_no: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    })
    return schema.validate(user);
}

const port = process.env.PORT || 7000;
app.listen(port, () => console.log(`server is running on port ${port}`));

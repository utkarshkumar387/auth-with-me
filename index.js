const Joi = require('joi');
const express = require('express');

const app = express();
app.use(express.json());

const users = [
    { id: 1, email: 'utkarshkumar387@gmail.com', phone_no: '7541079745', name: 'utkarsh' },
]

//get all users
app.get('/', (req, res) => {
    res.send(users);
});

app.get('/get/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) res.status(404).send(`User with this id is not present`);

    res.send(user);
});

//login api
app.post('/login', (req, res) => {
    const schema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    })

    const { error } = schema.validate(req.body);
    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }

    const user = users.find(u => u.email === req.body.email);
    if (!user) res.status(404).send(`${req.body.email} ID is not present.`);
    res.send(user);
});

//register api
app.post('/register', (req, res) => {
    const { error } = validateUser(req.body);

    if (error) {
        res.status(400).send(error.details[0].message);
        return;
    }
    const user = users.find(u => u.email === req.body.email || u.phone_no === req.body.phone_no)
    if (!user) {
        const currentUser = {
            'id': users.length + 1,
            'email': req.body.email,
            'phone_no': req.body.phone_no,
            'name': req.body.name,
        }
        users.push(currentUser);
        res.status(201).send('User added successfully')
    } else {
        res.send('user already registered')
    }

});

//update user data api
app.put('/update/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
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

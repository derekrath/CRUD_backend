const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
const bcrypt = require('bcryptjs');

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
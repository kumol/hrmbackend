const express = require("express");
var morgan = require('morgan')
require('dotenv').config();
require("./config/db");
const route = require("./server/api/index");
const cors = require("cors");
const bodyParser = require("body-parser");
// const fileUpload = require("express-fileupload")
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const corsOptions ={
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
}

app.use(cors(corsOptions));
app.use("/api", route);
app.listen(process.env.PORT,(error)=>{
    if(error) console.log(error);
    else console.log("Server is running on port 8000")
})
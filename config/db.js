const mongoose = require("mongoose");
mongoose.connect(process.env.DB_URL,  {useNewUrlParser: true, useUnifiedTopology: true})
    .then((v)=> console.log("db connected successfully"))
    .catch(err=>console.log(err))
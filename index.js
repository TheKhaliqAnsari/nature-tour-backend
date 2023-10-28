const mongoose = require("mongoose");
require("dotenv").config();
const app = require('./app')

mongoose.connect(process.env.DB_URL).then(() => {
  console.log("DB connected successfully");
  app.listen(process.env.PORT, () =>
    console.log("Server is started at: ", process.env.PORT)
  );
}).catch(err => console.log("There is some error in you code. Backend or db not started!!"))

const mongoose = require("mongoose")

const detailsSchema = mongoose.Schema(
    {
        name :String,
        email :String,
        password : String
    }
)

const detailsModel = mongoose.model("details",detailsSchema)

module.exports=detailsModel;
const userModels = require("../models/userModels");
const userProfile = require("../models/userProfile")
const jwt = require("jsonwebtoken");

const { isValidData, isValidRequestBody, isValidEmail, isValidPhone, isValidName } = require("../utils/validator");


const aws= require("aws-sdk")


aws.config.update({
    accessKeyId: "AKIAY3L35MCRUJ6WPO6J",
    secretAccessKeyId: "7gq2ENIfbMVs0jYmFFsoJnh/hhQstqPBNmaX9Io1",
    region: "ap-south-1"
})

let uploadFile= async ( file) =>{
   return new Promise( function(resolve, reject) {
    // this function will upload file to aws and return the link
    let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws

    var uploadParams= {
        ACL: "public-read",
        Bucket: "classroom-training-bucket",  
        Key: "sunil/" + file.originalname,  
        Body: file.buffer
    }


    s3.upload( uploadParams, function (err, data ){
        if(err) {
            return reject({"error": err})
        }
        console.log(data)
        console.log("file uploaded succesfully")
        return resolve(data.Location)
    })


   })
}

const createUser = async function (req, res) {
    try {
        let requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }

        let { title , name, phone, email, password } = requestBody;

    
        if (title !== "Mr" && title !== "Mrs" && title !== "Miss") {
            return res.status(400).send({ status: false, message: "title should be  Mr, Mrs, Miss" });
        }

        if (!isValidData(name)) {
            return res.status(400).send({ status: false, message: "Name is required." });
        }
        if (!isValidName.test(name)) {
            return res.status(400).send({ status: false, msg: "Please enter a valid Name" })
        }

        if (!isValidData(phone)) {
            return res.status(400).send({ status: false, message: "Phone is required." });
        }

        if (!isValidPhone.test(phone)) {
            return res.status(400).send({ status: false, message: "Please enter a valid phone number" });
        }

        let duplicatePhone = await userModel.findOne({ phone });
        if (duplicatePhone) {
            return res.status(400).send({ status: false, msg: "Phone number already exist" });
        }

        if (!isValidData(email)) {
            return res.status(400).send({ status: false, message: "Email is required." });
        }

        if (!isValidEmail.test(email)) {
            return res.status(400).send({ status: false, message: "Please enter valid a email " });
        }

        let duplicateEmail = await userModel.findOne({ email });
        if (duplicateEmail) {
            return res.status(400).send({ status: false, msg: "Email already exist" });
        }

        if (!isValidData(password)) {
            return res.status(400).send({ status: false, message: "Password is required." });
        }

        if (!(password.length >= 5 && password.length <= 15)) {
            return res.status(400).send({ status: false, msg: "Password Should be minimum 8 characters and maximum 15 characters", });
        }
       

        let createData = await userModel.create(requestBody);
        res.status(201).send({ status: true, message: "User data created successfully", data: createData, });
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};


//=================================================================================

const loginUser = async function (req, res) {
    try {
        const requestBody = req.body;
        const { email, password } = requestBody;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }

        if (!isValidData(email)) {
            return res.status(400).send({ status: false, message: "Email is required." });
        }

        if (!isValidData(password)) {
            return res.status(400).send({ status: false, message: "Password is required." });
        }

        const matchUser = await userModels.findOne({ email, password });
        if (!matchUser) {
            return res.status(404).send({ status: false, message: " Email/Password is Not Matched" });
        }

        const token = jwt.sign(
            {
                userId: matchUser._id.toString(),
            },
            "Sunil123",
            {
                expiresIn: "1800sec",
            });

        res.setHeader("x-user-key", token)
        return res.status(200).send({ status: true, message: "User Logged in successfully", data: token, });
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
};


const getUserList = async function (req, res) {
    try {
        let requestQuery = req.query;

        let findUser = await userModels.find({ ...requestQuery  })


        if (findUser.length == 0)
            return res.status(404).send({ status: false, msg: "No User Data Found" })

        res.status(200).send({ status: true, msg: "All Users", data: findUser })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}


const createUserProfile = async function (req, res) {
    try {
        const requestBody = req.body;

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "No data provided" });
        }

        

        let files = req.files
        
        if(!files || files.length==0){ 
           return res.status(400).send({ status : false,  msg: "No file found" })
        }

           //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
          console.log(files)
        let uploadedFileURL= await uploadFile( files[0] )
        console.log(uploadedFileURL)
        requestBody.bookCover = uploadedFileURL
         


        let { userId } = requestBody;

       
        if (!isValidData(userId)) {
            return res.status(400).send({ status: false, message: "userId is Required" });
        }

        if (!isValidObjectId.test(userId)) {
            return res.status(400).send({ status: false, message: "userId is Invalid" });
        }

        let userDetails = await userModel.findById({ _id: userId });
        if (!userDetails) {
            return res.status(404).send({ status: false, msg: "User does not exists" });
        }

        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "You Are Not Unauthorized" });
        }
x

        let newProfile = await userProfile.create(requestBody)
        res.status(201).send({ status: true, message: "Profile is created successfully", data: newProfile });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

module.exports = { createUser, loginUser ,getUserList, createUserProfile};
const express = require('express');
const router = express.Router();


const { createUser, loginUser , getUserList, createUserProfile } = require("../controllers/userController");


const { authentication } = require("../middlewares/mid");


router.post("/write-file-aws", async function(req, res){

    try{
        let files= req.files
        if(files && files.length>0){
          
            let uploadedFileURL= await uploadFile( files[0] )
            res.status(201).send({msg: "file uploaded succesfully", data: uploadedFileURL})
        }
        else{
            res.status(400).send({ msg: "No file found" })
        }
        
    }
    catch(err){
        res.status(500).send({msg: err})
    }
    
})



router.post("/register", createUser);

router.post("/login", loginUser);

router.get("/userList", authentication, getUserList);

router.post("/createUserProfile" , createUserProfile)




module.exports = router;
var express = require('express');
var router = express.Router();
var connection=require('../utils/mysql');
var crypto=require('../utils/hash-salt');
var _ = require('lodash');
var jwt= require("jsonwebtoken");
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/signup', function(req, res, next) {
   res.render('signup');
});

router.get('/login/editProfile/:id', function(req, res, next) {
  

      
       res.render('editProfile',{name:req.params.id});
});

router.post('/login/editProfile', function(req, res, next) {
  

      console.log(req.body);
       res.render('editProfile',{name:req.body.id});
});


router.post('/signup',(req,res)=>{
        
       if (!req.files)
        return res.status(400).send('No files were uploaded.');
        var file = req.files.uploaded_image;
        var img_name=file.name;
      
      if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
                                 
              file.mv('public/images/upload_images/'+file.name, function(err) {
                             
               if (err)
 
                 return res.status(500).send(err);
                img_name=file.name;
              })
      };
       var user={
         image:img_name,
        name:req.body.name,
        email:req.body.email,
        password:req.body.psw
      };

     Object.assign(user, crypto.createHash(user.password));
     
     connection.query('INSERT INTO users SET ?', user,function(error,results) {
        if (error) {
            console.log(error.message);
        } else {
            
            console.log(results.insertId);    
          res.redirect('/');  
        }
       
    });

           
});

router.post('/editProfile',(req,res)=>{
       console.log(req.body);
       var  body=_.pick(req.body,["email","password"]);
      if(body.password.length>0 && body.email.length>0){
         Object.assign(body, crypto.createHash(body.password));
      }else if(body.password.length>0){
          body=_.pick(req.body,["password"]);
         Object.assign(body, crypto.createHash(body.password));
      }else{
          body=_.pick(req.body,["email"]);
      }

         connection.query(`SELECT * FROM users  WHERE name like '${req.body.name}'`,function(error,result) {
                if (error) {
                    console.log(error.message);
                } else{
                        connection.query(`UPDATE  users SET ?`,body,function(error,result1) {
                             if (error) {
                                       console.log(error.message);
                               } else{
                                       connection.query(`SELECT * FROM users  WHERE name like '${req.body.name}'`,function(error,result) {
                                          if (error) {
                                              console.log(error.message);
                                          } else {
                                                res.render('profile',{name:result[0].name,email:result[0].email});
                                          }
                                        });

                                    } 
                         })
                     }
                });     
       
})

router.post('/login',(req,res)=>{
       
       console.log(req.body);
      
      connection.query(`SELECT * FROM users  WHERE name like '${req.body.uname}'`,function(error,result) {
        if (error) {
            console.log(error.message);
        } else {
          if(result.length>0){
            if(crypto.validate(result[0].password,result[0].salt,req.body.psw)){
                 
                console.log('login success');
              res.render('profile',{image:result[0].image,name:result[0].name,email:result[0].email});
          
            }else{
              console.log('password did not match');
              res.json({
                  status:false,                  
                  message:"Email and password does not match"
                 });
            }
          }else{
            console.log('register first');
            res.json({
              status:false,
            message:"User does not exits"
          });
          }
            
        }
       
    });
     
     
})
module.exports = router;

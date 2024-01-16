// There is a error in this code. Its not running properly.



//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require("md5")
// const bcrypt = require("bcrypt");
// const saltRounds = 10;
const session = require ('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate")

const app = express();

//console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({
    extended: true
}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false

}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done (null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id) 
    // .then ( if (err === false){ function(user) {

    // }
    //     // function(err, user)
    //     // done(err, user);
    // })  
       
    // });
    .then (function(user) {
        done (user);
    })
    .catch (function (error) {
        done (err);
        console.log (err);
    });
});

passport.use(new GoogleStrategy({

    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRETS,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"

  },

  function(accessToken, refreshToken, profile, cb) {

    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);

    });
  }
));


// const secret = process.env.SECRETS ;
// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"] });



app.get("/", function(req, res) {
    res.render("home");
});

app.get("/auth/google", 
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get("/login", function(req, res) {
    res.render("login");
});

app.get("/register", function(req, res) {
    res.render("register");
});

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
      if (err){
        console.log(err);
      } else {
        if (foundUsers) {
          res.render("secrets", {usersWithSecrets: foundUsers});
        }
      }
    });

    User.find({"secret": {$ne: null}})
    .then (function (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
    })
    .catch (function(err) {
        console.log(err);
    });

});

app.get("/logout", function(req, res) {
    req.logOut(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/")
        }
    });
    // res.redirect("/");
})

app.post("/register", function(req, res) {

//     Adding Cookies and Session
//    -----------------------------

    User.register({username: req.body.username}, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });




// -------------------------------------------------------------------------------------------------------------------------------

    // Salting and Hashing password with mongoose-bycrypt (Authentication level 4).
    //-------------------------------------------------------------------------------


    // bcrypt.hash(req.body.password, saltRounds, function (err, hash) {

        // const newUser = new User ({
        //     username: req.body.username,
        //     password: hash
        // });
    
    //     newUser.save()
    //     .then (function () {
    //         res.render("secrets");
    //     })
    //     .catch(function(err) {
    //         console.log(err);
    //     });
        
    // });

// ---------------------------------------------------------------------------------------------------------------------------------------

    // Hashing password (Authentication level 3).
    //------------------------------------------

    // const newUser = new User ({
    //     email: req.body.username,
    //     password: md5 (req.body.password)
    // });

    // newUser.save()
    // .then (function () {
    //     res.render("secrets");
    // })
    // .catch(function(err) {
    //     console.log(err);
    // });
});

app.post("/login", function(req, res) {

//     Adding Cookies and Session
//    -----------------------------

    const user = new User ({
        username: req.body.username,
        password: req.body.passport
    });

    req.login(user, function(err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            });
        }
    })

// ---------------------------------------------------------------------------------------------------------------------------------------


//   Salting and Hashing password using mongoose bycrypt (Authentication level 4).
// ----------------------------------------------------------------------------------

    // const username = req.body.username;
    // const password = req.body.password;

    // User.findOne({email: username})
    // .then(function(foundUser) {
    //     if (foundUser) {
    //         bcrypt.compare(password, foundUser.password, function(err, result) {
    //             // result == true
    //             if (result === true) {
    //                 res.render("secrets")
    //                 console.log("Loading page secrets😃")
    //             } else {
    //                 console.log("Wrong password🙁")
    //             }

    //         });
            // if (foundUser.password === password) {
            //     res.render("secrets");
            // }
    //     } else {
    //         console.log ("User not found😔")
    //     }
    // })
    // .catch (function(err) {
    //     console.log(err);
    // })
});















app.listen(3000, function() {
    console.log("Server running on port 3000");
});
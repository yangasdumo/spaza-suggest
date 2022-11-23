const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const exphbs = require("express-handlebars");
const bodyParser = require('body-parser');
const shop = require('./spaza-suggest.js');


const app = express();
app.use(flash());

const  shopinstance = shop();
//database
const pgp = require('pg-promise')({});

const local_database_url = 'postgres://postgres:codex123@localhost:5432/spaza-suggest';
const connectionString = process.env.DATABASE_URL || local_database_url;

const config = {
    connectionString
}

if (process.env.NODE_ENV == "production") {
    config.ssl = {
        rejectUnauthorized: false
    }
}

app.use(session({
    secret: 'this is my longest string that is used to test my registration with routes app for browser',
    resave: false,
    saveUninitialized: true
}));

app.engine('handlebars', exphbs.engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

const db = pgp(config)

// const routes = shop()


app.get('/', function (req, res) {
    res.render("index", {
    });
});

app.get('/sign',function(req,res){

    res.render('sign_up');
});

app.post('/sign',async function(req,res){
    let user= req.body.areaname
    let surname = req.body.usersurname
    let code = req.body.usercode

    if (user && surname && code){
        await shopinstance.clientLogin(user,surname,code)
        req.flash('message', "Your details has been added !!")
    }else{
        console.log('customers')
    }
    res.redirect('/')
});

app.post('/log',async function(req,res){

    let name = req.body.areaname
    let code = req.body.usercode

   let codes = code.toUpperCase()
    name.toUpperCase()
    var check = await shop.registerClient(codes)
    req.flash('message', "Welcome to the Sdumo Spaza !!")
    if(check){
        res.redirect("back")
    }else
    res.redirect('/area')
});


app.post('/area',async function(req,res){
    
    let getfood = req.body.foods
    let getdrink = req.body.drinks
    
    if(getfood && getdrink ){
        await shop.suggestProduct(getfood,getdrink)
        req.flash('message', "You have choosen your suggested product !!")
    }else{
        console.log('')
    }
   res.render('area')
});

app.get('/area',async function(req,res){

   res.render('area')
});




const PORT = process.env.PORT || 2000;

app.listen(PORT, function () {
    console.log('App starting on port', PORT);
});
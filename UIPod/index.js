'use strict';

const ImageDataURI = require('image-data-uri');
const express = require('express');
const bodyParser =  require('body-parser');
const cors = require('cors');
const fs = require("fs");
const FormData = require('form-data');
const axios = require('axios');
let port = 8001;

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;
const USER_EXIST = 202;

const app = express();
app.locals.port = port;
app.use(bodyParser.json({limit: '50mb', type: 'application/json'}));
app.use(cors());

app.use('/assets', express.static('assets'));

app.get('/index.html', function (req,res) {
    fs.readFile("index.html", "utf8", (err, html) => {
        if(err) throw err;
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(html);
    })
});
app.get('/data', function(req,res){
    res.json({"msg": " yes I did it!!"})
});

app.get('/register', function (req,res) {
    res.sendfile('Register.html')
});

app.get('/sigin', function (req,res) {
    res.sendfile('Validate.html')
});

app.post('/enroll',async function (req,res) {
    let data =  req.body;
    const imageName = await dataToPng(data);
    await enrollUser(req,res,imageName,data.label);
});

app.post('/validate', async function(req,res){
    let data =  req.body;
    //console.log(data);
    const imageName =  await dataToPng(data);
    await checkIsUserValid(req,res,imageName);
});

app.get('/quiz', async (req, res)=>{
    try{
        const result = await axios.get('http://localhost:8002/questions');
        await res.json(result.data);
    }
    catch (error) {
       console.log(error);
    }
});

async function enrollUser(req,res,imageName,label){
    let form = new FormData();
    form.append('file', fs.createReadStream(__dirname + `/${imageName}`), {
        filename: imageName
    });
    await axios.create({
        headers: form.getHeaders()
    }).post('http://localhost:8080/facebox/check', form).then( async response => {

        if(response !== null && response !== undefined && response.data !== null && response.data !== undefined){
            // let userData = response.data;
            response.data.userExist = (response.data.success && response.data.facesCount === 1 && response.data.faces.length > 0 && response.data.faces[0].matched);
            //response.data.userExist = false;
            if(response.data.userExist){
                res.json(response.data);
            }
            else{
                let form1 = new FormData();
                form1.append('file', fs.createReadStream(__dirname + `/${imageName}`), {
                    filename: imageName
                });
                form1.append('name',label);
                form1.append('id',imageName);
                await axios.create({
                    headers: form1.getHeaders()
                }).post('http://localhost:8080/facebox/teach', form1).then(teachResp => {

                    if(teachResp !== null && teachResp !== undefined && teachResp.data !== null && teachResp.data !== undefined){
                        teachResp.data.userExist = false;
                        res.json(teachResp.data)
                    }

                }).catch(error => {
                    if (error.response) {
                        res.sendStatus(SERVER_ERROR);
                        console.log(error.response);
                    }
                    console.log(error.message);
                });
            }
        }
    }).catch(error => {
        if (error.response) {
            res.sendStatus(SERVER_ERROR);
            console.log(error.response);
        }
        console.log(error.message);
    }).then(()=>{
        fs.unlink(imageName, function (err) {
            if (err) throw err;
        });
    });
}

async function checkIsUserValid(req,res,imageName){
    let form = new FormData();
    form.append('file', fs.createReadStream(__dirname + `/${imageName}`), {
        filename: imageName
    });
    await axios.create({
        headers: form.getHeaders()
    }).post('http://localhost:8080/facebox/check', form).then(response => {

        if(response !== null && response !== undefined && response.data !== null && response.data !== undefined){
            response.data.userExist = (response.data.success && response.data.facesCount === 1 && response.data.faces.length > 0 && response.data.faces[0].matched)
            res.json(response.data);
        }
    }).catch(error => {
        if (error.response) {
            res.sendStatus(SERVER_ERROR);
            console.log(error.response);
        }
        console.log(error.message);
    }).then(()=>{
        fs.unlink(imageName, function (err) {
            if (err) throw err;

        });
    });
}

app.listen(port, function () {
    console.log(`listening on port ${port}`);
});

async function dataToPng(data){

    const filePath = data.label !== undefined ? `${data.label.replace(/ /g,'')}.png` : 'random.png';
    await ImageDataURI.outputFile(data.dataUri, filePath);
    return data.label !== undefined ? `${data.label.replace(/ /g,'')}.png` : 'random.png';
}
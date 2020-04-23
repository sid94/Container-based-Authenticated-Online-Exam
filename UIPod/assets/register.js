let constraints = { video: { facingMode: "user" }, audio: false };
let track = null;
let uri = 'http://localhost:8001';

const cameravideo = document.querySelector("#video"),
    output = document.querySelector("#output"),
    canvas = document.querySelector("#canvas")

function videoPlay() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            track = stream.getTracks()[0];
            cameravideo.srcObject = stream;
        })
        .catch(function(error) {
            // console.error("Oops. Something is broken.", error);
            console.log(error)
        });
}

async function captureImage(){
    canvas.width = cameravideo.videoWidth;
    canvas.height = cameravideo.videoHeight;
    canvas.getContext("2d").drawImage(cameravideo, 0, 0);
    output.src = canvas.toDataURL("image/png");
    output.classList.add("taken");
}


async function postData(data, action){
    $.ajax({
        type:"POST",
        url:`${uri}/${action}`,
        data: JSON.stringify(data),
        headers: {
            "Content-Type":"application/json",
            "Content-Length": JSON.stringify(data).length,
        },
        success: function(res) {
            console.log(res);
            if(res.success && res.userExist && action === "enroll"){
                alert("User already exist!!Please go to validate page.");
                $("#loading").fadeOut(1000);
            }
            if(res.success && action === "validate"){
                afterValidateResp(res);
            }
            if(res.success && !res.userExist && action === "enroll"){
                afterEnrollResp(res);
            }
            if(!res.success){
                alert("Incorrect Information. Please check before submit.");
            }
        }.bind(this),
        error: function(xhr, status, err) {
            console.error(`${uri}/${action}`, status, err.toString());

        }.bind(this)
    });
}

async function registerUser(){
    $("#loading").show();
    await captureImage();
    let data = {"dataUri": output.src, "label" : document.getElementById("name").value };

    await postData(data, "enroll");
}

async function validateUser(){
    $("#loading").show();
    await captureImage();
    let data = {"dataUri": output.src};
    await postData(data, "validate");
}

function afterValidateResp(res){
    if(res.success && res.userExist){
        $("#loading").hide();
        $.when( $("#verified").fadeIn(2000))
            .done(function() {
                window.location.replace("./Exam.html");
            });
    }
    else{
        $("#loading").hide();
        $.when( $("#notverified").fadeIn(1000))
            .done(function() {
                $("#notverified").fadeOut(3000);
            });
    }
}

function afterEnrollResp(res) {
    if(res.success){
        $.when( $("#loading").fadeOut(500))
            .done(function() {
                $("#verified").fadeIn(2000)
                window.location.replace("./validate.html")
            });
    }
    else{
        $.when( $("#loading").fadeOut(2000))
            .done(function() {
                alert("something went wrong try again");
            });
    }
}

window.addEventListener("load", videoPlay, false);

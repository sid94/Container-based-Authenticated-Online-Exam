let constraints = { video: { facingMode: "user" }, audio: false };
let track = null;
let uri = 'http://localhost:8001';
let videoStream  = null;

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
    const cameravideo = document.querySelector("#video"),
        output = document.querySelector("#output"),
        canvas = document.querySelector("#canvas")
    canvas.width = cameravideo.videoWidth;
    canvas.height = cameravideo.videoHeight;
    canvas.getContext("2d").drawImage(cameravideo, 0, 0);
    output.src = canvas.toDataURL("image/png");
    output.classList.add("taken");
}


async function postData(data, action){
    await $.ajax({
        type:"POST",
        url:`${uri}/${action}`,
        data: JSON.stringify(data),
        headers: {
            "Content-Type":"application/json",
            "Content-Length": JSON.stringify(data).length,
        },
        success: function(res) {
            // console.log(res);
            //res.userExist = false;
            if(res.success && res.userExist && action === "enroll"){
                //alert("User already exist!!Please go to validate page.");
                $("#loading").fadeOut(1000);
                $("#alertInfo").fadeIn(1000);
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
    if(document.getElementById('name').validity.valid){
        $("#name").css('border-color', 'green');
        $("#loading").show();
        await captureImage();
        let data = {"dataUri": output.src, "label" : document.getElementById("name").value };
        await postData(data, "enroll");
    }
    else{
        $("#name").css('border-color', 'red');
    }
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
                // window.location.replace("./Exam.html");
                $("#verified").fadeOut(1000);
                displayQuiz(res);
            });
    }
    else{
        $("#loading").hide();
        $.when( $("#notverified").fadeIn(1000), $("#alertDanger").fadeIn(100))
            .done(function() {
                $("#notverified").fadeOut(3000);
            });
    }
}

function afterEnrollResp(res) {
    if(res.success){
        $.when( $("#loading").fadeOut(),$("#verified").fadeIn(1000),$("#verified").fadeOut(1000))
            .done(function() {
                displayReg("validate");
            });
    }
    else{
        $.when( $("#loading").fadeOut(2000))
            .done(function() {
                alert("something went wrong try again");
            });
    }
}

function displayReg(popup){

    let url = "";
    if(popup === "register"){
        url = "http://localhost:8001/register";
        document.getElementById('valContainer').innerHTML = '<li>html data</li>';
        document.getElementById('validate').style.display='none';
        document.getElementById('register').style.display = 'block';
    }
    else{
       // document.getElementById('alertInfo').style.display = 'none';
        url = "http://localhost:8001/sigin";
        document.getElementById('regContainer').innerHTML = '<li>html data</li>';
        document.getElementById('register').style.display='none';
        document.getElementById('validate').style.display = 'block';
    }
    if(videoStream && videoStream.getTracks().length > 0){
        videoStream.getTracks().forEach((track) =>{
            debugger;
            track.stop();
        });
    }

    $.when(
        $.ajax({
            url:url,
            type:'GET',
            success: function(data) {
                popup==="register" ? $('#regContainer').html( data ) : $('#valContainer').html( data );
            }
        })
    ).done(function(){
            let video = document.querySelector("#video");
            // cameravideo.addEventListener("play", videoPlay, false);
            navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
                //video.src = window.URL.createObjectURL(stream);
                track = stream.getTracks();
                video.srcObject = stream;
                videoStream = stream;
            }).catch (function (error) {
                console.log(error);
            });
    }
    )

}

function closePopup(popup) {
    if(popup === "register"){
        $('regContainer').empty();
        document.getElementById('regContainer').innerHTML = '<li>html data</li>';
        document.getElementById('register').style.display='none';
        document.getElementById('alertInfo').style.display='none';
        //$('alertInfo').hide();
    }
    else if(popup === "validate"){
        document.getElementById('valContainer').innerHTML = '<li>html data</li>';
        document.getElementById('validate').style.display='none';
    }
    else if(popup === "quiz"){
        document.getElementById('quizContainer').innerHTML = '';
        document.getElementById('quiz').style.display='none';
    }
    if(videoStream && videoStream.getTracks().length > 0){
        videoStream.getTracks().forEach((track) =>{
            debugger;
            track.stop();
        });
    }
}

function displayQuiz(res) {
    document.getElementById('validate').style.display='none';
    document.getElementById('quiz').style.display='block';
    let userName = res.faces[0].name;
    $.ajax({
        type: 'GET',
        url: `${uri}/quiz`,
        success: function(data){
            let ol = document.createElement('ol');
            document.getElementById('quizContainer').appendChild(ol);
            data.forEach(function (ques) {
                let li = document.createElement('li');
                ol.appendChild(li);
                li.innerHTML += ques.question;
            });
            document.getElementById('quizHeader').innerText = "Welcome!!  " + userName;
        },
        error: function () {
            console.log("Error while quiz service!!!");
        }
    });
}


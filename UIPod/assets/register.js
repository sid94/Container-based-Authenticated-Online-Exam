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
        url:`/${action}`,
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
            console.error(`/${action}`, status, err.toString());

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
        url = "/register";
        document.getElementById('valContainer').innerHTML = '<li>html data</li>';
        document.getElementById('validate').style.display='none';
        document.getElementById('register').style.display = 'block';
    }
    else{
       // document.getElementById('alertInfo').style.display = 'none';
        url = "/sigin";
        document.getElementById('regContainer').innerHTML = '<li>html data</li>';
        document.getElementById('register').style.display='none';
        document.getElementById('validate').style.display = 'block';
    }
    if(videoStream && videoStream.getTracks().length > 0){
        videoStream.getTracks().forEach((track) =>{
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
        //document.getElementById('alertInfo').style.display='none';
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
            track.stop();
        });
    }
}

function displayQuiz(res) {
    document.getElementById('validate').style.display='none';
    document.getElementById('quiz').style.display='block';
    $("#quizResults").empty();
    let userName = res.faces[0].name;
    $.ajax({
        type: 'GET',
        url: `/quiz`,
        success: function(data){
            const output = [];
            data.forEach((currentQuestion, questionNumber)=>{
                const answer = [];
                for(const num in currentQuestion.options){
                    answer.push(
                        `<input type="radio" id="${num}_${currentQuestion.id}" name="question${currentQuestion.id}" value="${num}">
                            <label for="${num}_${currentQuestion.id}">${currentQuestion.options[num]}</label><br>`
                    );
                }
                output.push(
                    `<div class="question" id="${currentQuestion.id}"> ${questionNumber+1}. ${currentQuestion.question} </div>
                     <div class="answers"> ${answer.join('')} </div>`
                );
            });
            document.getElementById('quizContainer').style.display = 'block';
            document.getElementById('quizContainer').innerHTML = output.join('');
            $("#quizContainer").append('<button id="submitQuiz" class="submit-btn" onclick="submitQuiz()">Submit Quiz</button>');
            document.getElementById('quizHeader').innerText = "Welcome!!  " + userName;
        },
        error: function () {
            console.log("Error while quiz service!!!");
        }
    });
}

function submitQuiz() {
    const quizContainer = document.getElementById('quizContainer');
    const submitQuiz = document.getElementById('submitQuiz');
    const answerContainers = quizContainer.querySelectorAll('.answers');
    let numCorrect = 0;
    let result = [];
    let index = 0;
    $("#quizContainer > .question").each(function () {
        let obj = {};
        obj.id = $(this).attr('id');
        const answerContainer = answerContainers[index];
        obj.answer = $(answerContainer.children).filter(":input[type=radio]").filter(":checked").val() || "";
        result.push(obj);
        index = index + 1;
    });
    console.log(result);
    let queryStr = [];
    result.forEach((obj)=>{
        queryStr.push(`${obj.id}_${obj.answer}`);
    });
    let scoreStr = queryStr.toString();
    let bar = {};
    $.ajax({
        type: 'GET',
        url: `/score?sol=${scoreStr}`,
        success: function (data) {
            $.when(
                $("#quizContainer").empty()
        ).done(

                $("#quizContainer").show(),
                $("#quizContainer").html("<div id='progressBar' class='outPopUp'></div>"),
                bar = new ProgressBar.SemiCircle(progressBar, {
                strokeWidth: 6,
                color: '#FFEA82',
                trailColor: '#eee',
                trailWidth: 1,
                easing: 'easeInOut',
                duration: 1400,
                svgStyle: null,
                text: {
                    value: '',
                    alignToBottom: false
                },
                from: {color: '#FFEA82'},
                to: {color: '#ED6A5A'},
                // Set default step function for all animate calls
                step: (state, bar) => {
                    bar.path.setAttribute('stroke', state.color);
                    let value = Math.round(bar.value() * 100);
                    if (value === 0) {
                        bar.setText('');
                    } else {
                        bar.setText(value);
                    }

                    bar.text.style.color = state.color;
                }
            }),
            bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif',
            bar.text.style.fontSize = '2rem',
            console.log(data.percentage),
            bar.animate(data.percentage),
            );

            //$("#quizContainer").hide();
            // $("#quizResults").text("Scored " + data.score + " out of " + data.outof);
        },
        error: function () {
            console.log("Error while getting quiz score!!!");
        }
    });
}


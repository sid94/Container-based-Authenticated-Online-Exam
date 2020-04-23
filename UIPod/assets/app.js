// Set constraints for the video stream
let constraints = { video: { facingMode: "user" }, audio: false };
let track = null;

// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#camera--trigger");
    cameraEnroll =  document.querySelector("#enroll");

// Access the device camera and stream to cameraView
function cameraStart() {
    navigator.mediaDevices
        .getUserMedia(constraints)
        .then(function(stream) {
            track = stream.getTracks()[0];
            cameraView.srcObject = stream;
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });
}

// Take a picture when cameraTrigger is tapped
cameraTrigger.onclick = function() {
    cameraSensor.width = cameraView.videoWidth;
    cameraSensor.height = cameraView.videoHeight;
    cameraSensor.getContext("2d").drawImage(cameraView, 0, 0);
    cameraOutput.src = cameraSensor.toDataURL("image/png");
    cameraOutput.classList.add("taken");
    postDataURI(cameraOutput.src,"sid")
    // track.stop();
};

function postDataURI(dataUri,label){
    let data = {"dataUri": dataUri, "label" : label };

    $.ajax({
        type:"POST",
        url:"http://localhost:8001/data",
        data: JSON.stringify(data),
        headers: {
            "Content-Type":"application/json",
            "Content-Length": JSON.stringify(data).length,
        },
        success: function(res) {
            console.log(res);
            console.log("Added");
        }.bind(this),
        error: function(xhr, status, err) {
            console.error(url, status, err.toString());
        }.bind(this)
    });
}

// Start the video stream when the window loads
window.addEventListener("load", cameraStart, false);
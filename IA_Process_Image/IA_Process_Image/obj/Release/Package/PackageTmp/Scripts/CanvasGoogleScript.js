document.addEventListener('DOMContentLoaded', function () {

    // References to all the element we will need.
    var video = document.querySelector('#camera-stream'),
        image = document.querySelector('#snap'),
        start_camera = document.querySelector('#start-camera'),
        controls = document.querySelector('.controls'),
        take_photo_btn = document.querySelector('#take-photo'),
        delete_photo_btn = document.querySelector('#delete-photo'),
        download_photo_btn = document.querySelector('#download-photo'),
        error_message = document.querySelector('#error-message');


    // The getUserMedia interface is used for handling camera input.
    // Some browsers need a prefix so here we're covering all the options
    navigator.getMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);


    if (!navigator.getMedia) {
        displayErrorMessage("Your browser doesn't have support for the navigator.getUserMedia interface.");
    }
    else {

        // Request the camera.
        navigator.getMedia(
            {
                video: true
            },
        // Success Callback
            function (stream) {

                // Create an object URL for the video stream and
                // set it as src of our HTLM video element.
                video.src = window.URL.createObjectURL(stream);

                // Play the video element to start the stream.
                //video.play();
                video.onplay = function () {
                    showVideo();
                };

            },
        // Error Callback
            function (err) {
                displayErrorMessage("There was an error with accessing the camera stream: " + err.name, err);
            }
        );

    }



    // Mobile browsers cannot play video without user input,
    // so here we're using a button to start it manually.
    start_camera.addEventListener("click", function (e) {

        e.preventDefault();

        // Start video playback manually.
        video.play();
        showVideo();

    });


    take_photo_btn.addEventListener("click", function (e) {

        e.preventDefault();

        var snap = takeSnapshot();

        // Show image. 
        image.setAttribute('src', snap);
        image.classList.add("visible");

        // Enable delete and save buttons
        delete_photo_btn.classList.remove("disabled");
        download_photo_btn.classList.remove("disabled");

        // Set the href attribute of the download button to the snap url.
        download_photo_btn.href = snap;

        // Pause video playback of stream.
        video.pause();

    });


    delete_photo_btn.addEventListener("click", function (e) {

        e.preventDefault();

        // Hide image.
        image.setAttribute('src', "");
        image.classList.remove("visible");

        // Disable delete and save buttons
        delete_photo_btn.classList.add("disabled");
        download_photo_btn.classList.add("disabled");

        // Resume playback of stream.
        video.play();

    });



    function showVideo() {
        // Display the video stream and the controls.

        hideUI();
        video.classList.add("visible");
        controls.classList.add("visible");
    }


    function takeSnapshot() {
        // Here we're using a trick that involves a hidden canvas element.  

        var hidden_canvas = document.querySelector('canvas'),
            context = hidden_canvas.getContext('2d');

        var width = video.videoWidth,
            height = video.videoHeight;

        if (width && height) {

            // Setup a canvas with the same dimensions as the video.
            hidden_canvas.width = width;
            hidden_canvas.height = height;

            // Make a copy of the current frame in the video on the canvas.
            context.drawImage(video, 0, 0, width, height);

            // Storing Base64String
            var datacaptured = hidden_canvas.toDataURL('image/jpeg');

            // Ajax Post to Save Image in Folder

            //Label Detection
            //Uploadsubmit(datacaptured);
            //Face Detection
            UploadFaceDetection(datacaptured);

            // Turn the canvas image into a dataURL that can be used as a src for our photo.
            return datacaptured;
        }
    }

    function Uploadsubmit(datacaptured)
    {

        if (datacaptured != "") {
            $.ajax({
                type: 'POST',
                dataType: 'json',
                contentType: 'application/json; charset=utf-8',
                url: ("../ProcessImageGoogle/Capture"),
                data: { base64String: datacaptured },
                success: function (data) {
                    if (data == false) {

                        alert("Photo Captured is not Proper!");
                        $('#ResponseTable').empty();
                    }
                    else {

                        if (data.length == 9) {
                            $('#ResponseTable').empty();
                            alert("Its not a Face!");
                        } else {
                            $('#ResponseTable').empty();
                            var _faceAttributes = JSON.parse(data);
                            var _responsetable = "";
                            var _emotiontable = "";
                            _responsetable += '<div class="panel panel-default"><div class="panel-heading">Google Face API Response</div>';
                            _responsetable += "<div class='panel-body'>"
                            _responsetable += '<table class="table table-bordered"><thead><tr> <th>Description</th> <th>score</th></tr></thead>';

                            for (var i = 0; i < _faceAttributes.responses[0].labelAnnotations.length; i++) {

                                _responsetable += '<tr><td>' +
                                    _faceAttributes.responses[0].labelAnnotations[i].description +
                                    '</td><td>' +
                                    _faceAttributes.responses[0].labelAnnotations[i].score +
                                    '</td></tr>';


                            }

                            _responsetable += "</table></div></div>"
                            $('#ResponseTable').append(_responsetable);
                        }
                    }
                }
            });
        }

    }

    function UploadFaceDetection(datacaptured) {

        if (datacaptured != "") {
            $("body").addClass("loading");
            $.ajax({
                type: 'POST',
                url: ("../ProcessImageGoogle/Capture"),
                dataType: 'json',
                data: { base64String: datacaptured },
                success: function (data) {
                    if (data.data == false) {
                        alert("No se encontro ningun texto en la imagen.");
                        $('#ResponseTable').empty();
                    }
                    else {
                        $('#ResponseTable').empty();
                        $('#ResponseTable').text(data.data[0].Description);                        
                    }
                    if (data.dataDetail.WebEntities != null) {
                        var dataConcat = "";
                        $.each(data.dataDetail.WebEntities, function (index, value) {
                            dataConcat = dataConcat + "- " + value.Description + "<br>";
                        });
                        $('#ResponseTableOne').html(dataConcat);     
                    }
                    if (data.dataDetail.BestGuessLabels != null) {
                        var dataConcat = "";
                        $.each(data.dataDetail.BestGuessLabels, function (index, value) {
                            dataConcat = dataConcat + "- " + value.Label + "<br>";
                        });
                        $('#ResponseTableTwo').html(dataConcat);
                    }
                    if (data.dataDetail.VisuallySimilarImages != null) {
                        var dataConcat = "";
                        $.each(data.dataDetail.VisuallySimilarImages, function (index, value) {
                            dataConcat = dataConcat + "<div class='col-md-2'><img src='" + value.Url +"' width='100%' /></div>";
                        });
                        $('#ResponseTableThree').html(dataConcat);
                    }

                },
                complete: function () {
                    $("body").removeClass("loading");
                }
            });
        }

    }

    function displayErrorMessage(error_msg, error) {
        error = error || "";
        if (error) {
            console.error(error);
        }

        error_message.innerText = error_msg;

        hideUI();
        error_message.classList.add("visible");
    }


    function hideUI() {
        // Helper function for clearing the app UI.

        controls.classList.remove("visible");
        start_camera.classList.remove("visible");
        video.classList.remove("visible");
        snap.classList.remove("visible");
        error_message.classList.remove("visible");
    }

});

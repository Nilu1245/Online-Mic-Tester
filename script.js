window.addEventListener("DOMContentLoaded", function () {
    const record = document.getElementById("record");
    const visualizer = document.getElementById("visualizer");
    const stop = document.getElementById("stop");
    const audio = document.getElementById("audio");
  
    const canvasCtx = visualizer.getContext("2d");
    let chunks = [];
  
    navigator.mediaDevices
        .getUserMedia({
            audio: true
        })
        .then(function (stream) {
            visualize(stream);
  
            const mediaRecorder = new MediaRecorder(stream);
  
            mediaRecorder.ondataavailable = function (e) {
                chunks.push(e.data);
            };
  
            mediaRecorder.onstop = function (e) {
                const blob = new Blob(chunks, {
                    type: "audio/ogg; codecs=opus"
                });
                audio.src = window.URL.createObjectURL(blob);
                audio.play();
  
                // clear recorded audio
                chunks = [];
            };
  
            record.onclick = function () {
                mediaRecorder.start();
  
                visualizer.style.display = "block";
                audio.style.display = "none";
                stop.style.display = "block";
                record.style.display = "none";
  
                stop.disabled = false;
                record.disabled = true;
            };
  
            stop.onclick = function () {
                mediaRecorder.stop();
  
                visualizer.style.display = "none";
                audio.style.display = "block";
                stop.style.display = "none";
                record.style.display = "block";
  
                stop.disabled = true;
                record.disabled = false;
            };
        })
        .catch(function (err) {
            console.log(err);
            alert("There was a problem accessing your microphone.");
        });
  
    function visualize(stream) {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
  
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
  
        source.connect(analyser);
  
        draw();
  
        function draw() {
            WIDTH = visualizer.width;
            HEIGHT = visualizer.height;
  
            requestAnimationFrame(draw);
  
            analyser.getByteTimeDomainData(dataArray);
  
            canvasCtx.fillStyle = "#ffffff";
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  
            canvasCtx.lineWidth = 1;
            canvasCtx.strokeStyle = "#4287f5";
  
            canvasCtx.beginPath();
  
            let sliceWidth = (WIDTH * 1.0) / bufferLength;
            let x = 0;
  
            for (let i = 0; i < bufferLength; i++) {
                let v = dataArray[i] / 128.0;
                let y = (v * HEIGHT) / 2;
  
                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
  
                x += sliceWidth;
            }
  
            canvasCtx.lineTo(visualizer.width, visualizer.height / 2);
            canvasCtx.stroke();
        }
    }
  });
  
  
  
  const audioInputSelect = document.querySelector('select#audioSource');
  const selectors = [audioInputSelect];
  
  function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map(select => select.value);
    selectors.forEach(select => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'audioinput') {
            option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            audioInputSelect.appendChild(option);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
            select.value = values[selectorIndex];
        }
    });
  }
  
  
  function handleError(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }
  
  function start() {
    // Second call to getUserMedia() with changed device may cause error, so we need to release stream before changing device
    if (window.stream) {
        stream.getAudioTracks()[0].stop();
    }
  
    const audioSource = audioInputSelect.value;
  
    const constraints = {
        audio: { deviceId: audioSource ? { exact: audioSource } : undefined }
    };
  
  }
  
  audioInputSelect.onchange = start;
  
  
  navigator.mediaDevices.enumerateDevices()
    .then(gotDevices)
    .then(start)
    .catch(handleError);
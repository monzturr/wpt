// This should be removed when the webaudio/historical.html tests are passing.
// Tracking bug: https://bugs.webkit.org/show_bug.cgi?id=204719
window.AudioContext = window.AudioContext || window.webkitAudioContext;

var FFT_SIZE = 2048;

function getPitchDetector(media) {
  var audioContext = new AudioContext();

  var sourceNode = audioContext.createMediaElementSource(media);

  var analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;

  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);

  return {
    start() { return audioContext.resume(); },
    detect() { return getPitch(analyser); },
    stop() { return audioContext.close(); },
  };
}

function getPitch(analyser) {
  // Returns the frequency value for the nth FFT bin.
  var binConverter = (bin) =>
    (analyser.context.sampleRate/2)*((bin)/(analyser.frequencyBinCount-1));

  var buf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buf);
  return findDominantFrequency(buf, binConverter);
}

// Returns the dominant frequency, +/- a certain margin.
function findDominantFrequency(buf, binConverter) {
  var max = 0;
  var bin = 0;

  for (var i=0;i<buf.length;i++) {
    if(buf[i] > max) {
      max = buf[i];
      bin = i;
    }
  }

  // The spread of frequencies within bins is constant and corresponds to
  // (1/(FFT_SIZE-1))th of the sample rate. Use the value of bin #1 as a
  // shorthand for that value.
  return { value:binConverter(bin), margin:binConverter(1) };
}

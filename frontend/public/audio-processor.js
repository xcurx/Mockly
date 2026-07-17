// audio worklet processor runs in a separate audio thread
// receives float32 mic samples converts to int16 pcm and posts to main thread

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2048;
    this._buffer = new Float32Array(this._bufferSize);
    this._bytesWritten = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono channel

    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bytesWritten++] = channelData[i];

      if (this._bytesWritten >= this._bufferSize) {
        this._flush();
      }
    }

    return true; // keep processing
  }

  _flush() {
    const int16 = new Int16Array(this._bytesWritten);
    for (let i = 0; i < this._bytesWritten; i++) {
      const s = Math.max(-1, Math.min(1, this._buffer[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    this.port.postMessage(int16.buffer, [int16.buffer]);
    this._bytesWritten = 0;
  }
}

registerProcessor("audio-processor", AudioProcessor);

class PCMWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 2048; // Adjust as needed
  }

  process(inputs) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      this.buffer.push(...channelData);

      if (this.buffer.length >= this.bufferSize) {
        const chunk = this.buffer.slice(0, this.bufferSize);
        this.buffer = this.buffer.slice(this.bufferSize);
        const arrayBuffer = Float32Array.from(chunk).buffer;
        this.port.postMessage(arrayBuffer, [arrayBuffer]);
      }
    }
    return true;
  }
}

registerProcessor("pcm-worklet-processor", PCMWorkletProcessor);
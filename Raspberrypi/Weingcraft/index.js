

async function streamingRecognize(
  filename,
  encoding,
  sampleRateHertz,
  languageCode
) {
  // [START speech_transcribe_streaming]
  const fs = require('fs');

  // Imports the Google Cloud client library
  const speech = require('@google-cloud/speech');

  // Creates a client
  const client = new speech.SpeechClient();

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const filename = 'Local path to audio file, e.g. /path/to/audio.raw';
  // const encoding = 'Encoding of the audio file, e.g. LINEAR16';
  // const sampleRateHertz = 16000;
  // const languageCode = 'BCP-47 language code, e.g. en-US';

  const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
    },
    interimResults: false, // If you want interim results, set this to true
  };

  // Stream the audio to the Google Cloud Speech API
  const recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', data => {
      console.log(
        `Transcription: ${data.results[0].alternatives[0].transcript}`
      );
    });

  // Stream an audio file from disk to the Speech API, e.g. "./resources/audio.raw"
  fs.createReadStream(filename).pipe(recognizeStream);
  // [END speech_transcribe_streaming]
}

function streamingMicRecognize(encoding, sampleRateHertz, languageCode) {
  var express = require('express');
  var app = express();
  var router = require('./router/main')(app);


  app.set('views', __dirname + '/pages');
  app.set('view engine', 'ejs');
  app.engine('html', require('ejs').renderFile);

  var server = app.listen(3001,function(){
    console.log("Express server has started on port 3001");
  });

  var voice = require('pi-voice-command-google');
  var fs = require('fs');
  var keysPath = './speech_keys.json';

  voice(keysPath, function (err, res){
      if (err) throw err
      console.log(res);
      fs.writeFile('./read-file.txt',res.toString("utf-8"),function(writeerr){
          if(writeerr){
              console.log('Error' + writeerr);
          }
          console.log("output.txt file written");
      });
  })

  // Using the bleno module
  var bleno = require('bleno');
  const SerialPort = require('serialport')
  const serialport = new SerialPort("/dev/ttyUSB0",{baudRate:9600});
  const readline = require("readline");
  process.stdin.setEncoding('utf8');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on("line", function(line) {
    serialport.write(line);
    
  }).on("close", function() {
    process.exit();
  });

  serialport.on("open", function() {
   console.log('OPEN'); 
   serialport.write('Hello ARduino! \n');

   serialport.on('data', function(data){
      console.log('data rcv: ' + data );
   });
  });
   
  // Once bleno starts, begin advertising our BLE address
  bleno.on('stateChange', function(state) {
      console.log('State change: ' + state);
      if (state === 'poweredOn') {
          bleno.startAdvertising('WeingCraft-Rpi',['1234']);
      } else {
          bleno.stopAdvertising();
      }
  });
   
  // Notify the console that we've accepted a connection
  bleno.on('accept', function(clientAddress) {
      console.log("Accepted connection from address: " + clientAddress);
  });
   
  // Notify the console that we have disconnected from a client
  bleno.on('disconnect', function(clientAddress) {
      console.log("Disconnected from address: " + clientAddress);
  });
   
  // When we begin advertising, create a new service and characteristic
  bleno.on('advertisingStart', function(error) {
      if (error) {
          console.log("Advertising start error:" + error);
      } else {
          console.log("Advertising start success");
          bleno.setServices([
              
              // Define a new service
              new bleno.PrimaryService({
                  uuid : '1234',
                  characteristics : [
                      
                      // Define a new characteristic within that service
                      new bleno.Characteristic({
                          value : null,
                          uuid : '5678',
                          properties : ['notify', 'read', 'write'],
                          
                          // If the client subscribes, we send out a message every 1 second
                          onSubscribe : function(maxValueSize, updateValueCallback) {
                              console.log("Device subscribed");
                              this.intervalId = setInterval(function() {
                                  console.log("Sending: Hi!");
                                  updateValueCallback(new Buffer("Hi!"));
                              }, 1000);
                          },
                          
                          // If the client unsubscribes, we stop broadcasting the message
                          onUnsubscribe : function() {
                              console.log("Device unsubscribed");
                              clearInterval(this.intervalId);
                          },
                          
                          // Send a message back to the client with the characteristic's value
                          onReadRequest : function(offset, callback) {
                              console.log("Read request received");
                              callback(this.RESULT_SUCCESS, new Buffer("Echo: " + 
                                      (this.value ? this.value.toString("utf-8") : "")));
                          },
                          
                          // Accept a new value for the characterstic's value
                          onWriteRequest : function(data, offset, withoutResponse, callback) {
                              this.value = data;
                              console.log('Write request: value = ' + this.value.toString("utf-8"));
                              fs.writeFile('./android-file.txt',this.value.toString("utf-8"),function(err){
                                  if(err){
                                      console.log('Error' + err);
                                  }
                                  console.log("output.txt file written");
                              });
                              serialport.write(data);
                              callback(this.RESULT_SUCCESS);
                          }
   
                      })
                      
                  ]
              })
          ]);
      }
  });
  
  
  
  
  
  // [START speech_transcribe_streaming_mic]
  const recorder = require('node-record-lpcm16');

  // Imports the Google Cloud client library
  const speech = require('@google-cloud/speech');

  // Creates a client
  const client = new speech.SpeechClient();

  /**
   * TODO(developer): Uncomment the following lines before running the sample.
   */
  // const encoding = 'Encoding of the audio file, e.g. LINEAR16';
  // const sampleRateHertz = 16000;
  // const languageCode = 'BCP-47 language code, e.g. en-US';

  const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
    },
    interimResults: false, // If you want interim results, set this to true
  };

  // Create a recognize stream
  const recognizeStream = client
    .streamingRecognize(request)
    .on('error', console.error)
    .on('data', data => {
      var clientStreamVoice = `${data.results[0].alternatives[0].transcript}`.trim()
      if(clientStreamVoice == '켜 줘' || clientStreamVoice == '불 켜 줘'){
        serialport.write('1')
      }else if(clientStreamVoice == '꺼 줘' || clientStreamVoice == '불 꺼 줘'){
        serialport.write('0')
      }
      fs.writeFile('./read-file.txt',clientStreamVoice,function(err){
                      if(err){
                          console.log('Error' + err)
                      }
                      console.log("output.txt file written")
                  })
      }
    )

  // Start recording and send the microphone input to the Speech API
  recorder
    .record({
      sampleRateHertz: sampleRateHertz,
      threshold: 0,
      // Other options, see https://www.npmjs.com/package/node-record-lpcm16#options
      verbose: false,
      recordProgram: 'rec', // Try also "arecord" or "sox"
      silence: '10.0',
    })
    .stream()
    .on('error', console.error)
    .pipe(recognizeStream);

  console.log('Listening, press Ctrl+C to stop.');
  // [END speech_transcribe_streaming_mic]
}

require(`yargs`) // eslint-disable-line
  .demand(1)
  .command(
    `listen`,
    `Detects speech in a microphone input stream. This command requires that you have SoX installed and available in your $PATH. See https://www.npmjs.com/package/node-record-lpcm16#dependencies`,
    {},
    opts =>
      streamingMicRecognize(
        opts.encoding,
        opts.sampleRateHertz,
        opts.languageCode
      )
  )
  .options({
    encoding: {
      alias: 'e',
      default: 'LINEAR16',
      global: true,
      requiresArg: true,
      type: 'string',
    },
    sampleRateHertz: {
      alias: 'r',
      default: 16000,
      global: true,
      requiresArg: true,
      type: 'number',
    },
    languageCode: {
      alias: 'l',
      default: 'ko-KR',
      global: true,
      requiresArg: true,
      type: 'string',
    },
  })
  .example(`node $0 listen`)
  .wrap(120)
  .recommendCommands()
  .epilogue(`For more information, see https://cloud.google.com/speech/docs`)
  .help()
  .strict().argv;


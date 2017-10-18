/* eslint-disable capitalized-comments */
var SerialPort = require('serialport');
var Parser = require('binary-parser').Parser;
const Delimiter = SerialPort.parsers.Delimiter;

var port = new SerialPort('/dev/tty.usbserial-A703X36E', {
  baudRate: 230400
});

const parser = port.pipe(new Delimiter({delimiter: Buffer.from('0d0a', 'hex')}));

const toHexString = function (arr) {
  return Buffer.from(arr).toString('hex');
};

const CMMCParser = new Parser().endianess('big')
  .array('header', {
    type: 'uint8',
    length: 2,
    formatter: toHexString
  })
  .uint8('reserved')
  .array('from', {
    type: 'uint8',
    length: 6,
    formatter: toHexString
  })
  .array('to', {
    type: 'uint8',
    length: 6,
    formatter: toHexString
  })
  .uint8('type')
  .uint8('dataLen')
  .endianess('little')
  .uint16('battery')
  .uint8('myNameLen')
  .array('myName', {
    type: 'uint8', length: 12, formatter: function (arr) {
      return Buffer.from(arr.filter(function (a) {
        return a >= 32;
      })).toString();
    }
  })
  .uint8('fieldLen')
  .uint32('field1')
  .uint32('field2')
  .uint32('field3')
  .uint32('field4')
  .uint8('checksum');

var packetCounter = 0;
var bytesCounter = 0;

// setInterval(function () {
//   console.log(packetCounter + ' packet/s data = ' + bytesCounter + ' bytes/s');
//   packetCounter = 0;
//   bytesCounter = 0;
// }, 1000);

parser.on('data', function (data) {
  bytesCounter += data.length;
  // console.log(data.toString('hex'))
  if (data[0] === 0xff && data[1] === 0xfa) {
    packetCounter++;
    console.log(CMMCParser.parse(data));
  } else {
    // console.log(data.toString());
  }
});

port.on('error', function (err) {
  console.log('Error: ', err.message);
});

port.on('close', function (err) {
  console.log('Error: ', err.message);
});

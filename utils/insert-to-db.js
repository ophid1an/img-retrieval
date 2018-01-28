const readline = require('readline');
const fs = require('fs');
const mongoose = require('mongoose');
const Image = require('../models/image');
const dbURI = require('../config/server.conf').dbURI;
const descVecsSupported = require('../config/server.conf').descVecsSupported;

const linesPerEntry = 1;
const entriesNum = Number(process.argv[3]);
const linesNum = entriesNum ? linesPerEntry * entriesNum : undefined;
const vectorsLen = descVecsSupported.reduce((acc, cur) => acc + cur.len, 0);
const images = [];
const image = {};

let totalCnt = 0;
let discardImage = true;

mongoose.connect(dbURI, {
  useMongoClient: true,
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const rl = readline.createInterface({
  input: fs.createReadStream(process.argv[2]),
  crlfDelay: Infinity,
});

rl.on('line', (line) => {
  if (linesNum) {
    if (totalCnt >= linesNum) {
      return rl.close();
    }
  }
  const lineArr = line.replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ');

  if (lineArr.length >= vectorsLen + 1) {
    image.filename = lineArr.splice(0, 1)[0];
    descVecsSupported.forEach((desc) => {
      const tmpVec = lineArr.splice(0, desc.len);
      let discardVec = false;
      const vec = tmpVec.map((e) => {
        const num = Number(e);
        if (Number.isNaN(num)) {
          discardVec = true;
        }
        return num;
      });
      if (!discardVec) {
        discardImage = false;
      }
      image[desc.value] = discardVec ? [] : vec;
    });
    image.annotations = lineArr;
    if (!discardImage) {
      images.push(Object.assign({}, image));
    }
    Object.keys(image).forEach((key) => {
      image[key] = null;
    });
    discardImage = true;
  }
  totalCnt += 1;
  return undefined;
}).on('close', () => {
  const sendChunks = (arr, chunkSize, numOfDocsInserted = 0) => {
    if (arr.length === 0) {
      return Promise.resolve(numOfDocsInserted);
    }

    return Image.insertMany(arr.splice(0, chunkSize))
      .then((docs) => {
        console.log(`Inserted ${docs.length} documents.`);
        return sendChunks(arr, chunkSize, numOfDocsInserted + docs.length);
      });
  };

  sendChunks(images, 50)
    .then((msg) => {
      console.log(`Inserted a total of ${msg} documents.`);
      return mongoose.disconnect();
    })
    .catch((err) => {
      console.log(err);
      return mongoose.disconnect();
    });
});

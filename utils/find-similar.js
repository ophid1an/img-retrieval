const mongoose = require('mongoose');
const Heap = require('heap');
const Image = require('../models/image');
const dbURL = require('./config').dbURL;
const algorithmsSupported = require('./config').algorithmsSupported;

const numNeighbors = Number(process.argv[2]);
const alg = process.argv[3];

const algorithmsSupportedObj = {};
const ranges = [];
algorithmsSupported.forEach((e) => {
  algorithmsSupportedObj[e.name] = e.len;
});

if (Number.isNaN(numNeighbors) || numNeighbors < 1 || numNeighbors > 10000) {
  console.log('Number of neighbors should be between 1 and 10000.');
  process.exit(1);
}

if (Object.keys(algorithmsSupportedObj).indexOf(alg) === -1) {
  console.log(`Algorithms supported: [${Object.keys(algorithmsSupportedObj)}].`);
  process.exit(1);
}

let inputVec = process.argv[4]
  .trim()
  .split(',');

if (inputVec.length === 1) {
  inputVec = inputVec[0].split(' ');
}

inputVec.filter((e) => {
  if (e === ' ') {
    return false;
  }
  const num = Number(e.trim());
  if (Number.isNaN(num)) {
    return false;
  }
  ranges.push([num, num]);
  return true;
});

if (inputVec.length !== algorithmsSupportedObj[alg]) {
  console.log(`Algorithm "${alg}" vector should consist of ${algorithmsSupportedObj[alg]} elements.`);
  process.exit(1);
}

mongoose.connect(dbURL, {
  useMongoClient: true,
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


const projection = {
  filename: 1,
  annotations: 1,
};
projection[alg] = 1;

Image
  .find({}, projection)
  .exec()
  .then((docs) => {
    // const distances = [];
    const distancesHeap = new Heap((a, b) => b.distance - a.distance);
    docs.forEach((doc) => {
      doc[alg].forEach((feature, ind) => {
        if (feature < ranges[ind][0]) {
          ranges[ind][0] = feature;
        }
        if (feature > ranges[ind][1]) {
          ranges[ind][1] = feature;
        }
      });
    });
    docs.forEach((doc, dInd) => {
      let sum = 0;
      doc[alg].forEach((num, nInd) => {
        const range = ranges[nInd][1] - ranges[nInd][0];
        sum += ((num - inputVec[nInd]) / range) ** 2; // scale at [0,1]
      });
      const obj = {
        filename: doc.filename,
        distance: Math.sqrt(sum),
        annotations: doc.annotations,
      };
      // distances.push(obj);
      if (dInd < numNeighbors) {
        distancesHeap.push(obj);
      } else {
        distancesHeap.pushpop(obj);
      }
    });
    // console.log(distances.length);
    // distances.sort((a, b) => a.distance - b.distance);
    // console.log(distances.slice(0, numNeighbors));
    console.log(distancesHeap.size());
    console.log(ranges.length, ranges);
    console.log([...Array(distancesHeap.size()).keys()].map(() => distancesHeap.pop()).reverse());
    mongoose.disconnect();
  })
  .catch((err) => {
    console.log(err);
    mongoose.disconnect();
  });

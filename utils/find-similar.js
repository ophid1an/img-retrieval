const mongoose = require('mongoose');
const Heap = require('heap');
const Decimal = require('decimal.js');
const BigNumber = require('bignumber.js');
const Image = require('../models/image');
const dbURL = require('./config').dbURL;
const algorithmsSupported = require('./config').algorithmsSupported;

const argsLen = process.argv.length;
if (argsLen < 6 || argsLen % 2 !== 0) {
  console.log('Wrong number of arguments!');
  process.exit(1);
}

const numNeighbors = Number(process.argv[2]);
const metric = process.argv[3];
const alg = process.argv[4];

const algorithmsSupportedObj = {};
const metrics = {
  manhattan: {
    addToSum(x1, x2, range) {
      const diff = x1 - x2;
      if (diff !== 0) {
        return Math.abs(diff) / range; // scale to [0,1]
      }
      return 0;
    },
    transformSum(sum) {
      return sum;
    },
  },
  euclidean: {
    addToSum(x1, x2, range) {
      const diff = x1 - x2;
      if (diff !== 0) {
        return (diff / range) ** 2; // scale to [0,1]
      }
      return 0;
    },
    transformSum(sum) {
      return Math.sqrt(sum);
    },
  },
  matusita: {
    addToSum(x1, x2, range, min) {
      const diff = x1 - x2;
      if (diff !== 0) {
        return (Math.sqrt((x1 - min) / range) - Math.sqrt((x2 - min) / range)) ** 2; // scale to [0,1]
      }
      return 0;
    },
    transformSum(sum) {
      return Math.sqrt(sum);
    },
  },
};
const ranges = [];
algorithmsSupported.forEach((e) => {
  algorithmsSupportedObj[e.name] = e.len;
});

if (Number.isNaN(numNeighbors) || numNeighbors < 1 || numNeighbors > 10000) {
  console.log('Number of neighbors should be between 1 and 10000.');
  process.exit(1);
}

if (Object.keys(metrics).indexOf(metric) === -1) {
  console.log(`Metrics supported: [${Object.keys(metrics)}].`);
  process.exit(1);
}

if (Object.keys(algorithmsSupportedObj).indexOf(alg) === -1) {
  console.log(`Algorithms supported: [${Object.keys(algorithmsSupportedObj)}].`);
  process.exit(1);
}

let inputVec = process.argv[5]
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
    // const distancesHeap = new Heap((a, b) => b.distance.minus(a.distance));
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
      // let sum = new BigNumber(0);
      doc[alg].forEach((num, nInd) => {
        const min = ranges[nInd][0];
        const range = ranges[nInd][1] - min;
        // const range = new BigNumber(ranges[nInd][1]).minus(ranges[nInd][0]);
        // console.log(sum.toString(), num, nInd)
        // console.log(`DB_NUM: ${num} , INP_NUM ${inputVec[nInd]} , DIFF: ${new BigNumber(num).minus(inputVec[nInd])}`)

        sum += metrics[metric].addToSum(num, inputVec[nInd], range, min);


        // sum = sum.add(new BigNumber(num).minus(inputVec[nInd]).div(range).pow(2)); // scale at [0,1]
        // sum = sum.add(1);
      });

      const obj = {
        filename: doc.filename,
        distance: metrics[metric].transformSum(sum),
        annotations: doc.annotations,
        // distance1: sum.sqrt().toString(),
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

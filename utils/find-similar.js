const mongoose = require('mongoose');
const Heap = require('heap');
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
const algs = [];
const inputVecs = [];
const ranges = [];

process.argv.forEach((arg, ind) => {
  if (ind >= 4) {
    if (ind % 2 === 0) {
      algs.push(arg);
    } else {
      inputVecs.push(arg);
    }
  }
});

const metrics = {
  manhattan: {
    addToSum(x1, x2, range) {
      if (x1 !== x2) {
        return Math.abs(x1 - x2) / range; // scale to [0,1]
      }
      return 0;
    },
    transformSum(sum) {
      return sum;
    },
  },
  euclidean: {
    addToSum(x1, x2, range) {
      if (x1 !== x2) {
        return ((x1 - x2) / range) ** 2; // scale to [0,1]
      }
      return 0;
    },
    transformSum(sum) {
      return Math.sqrt(sum);
    },
  },
  matusita: {
    addToSum(x1, x2, range, min) {
      if (x1 !== x2) {
        return (Math.sqrt((x1 - min) / range) - Math.sqrt((x2 - min) / range)) ** 2; // scale to [0,1]
      }
      return 0;
    },
    transformSum(sum) {
      return Math.sqrt(sum);
    },
  },
};

const algorithmsSupportedObj = {};
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

algs.forEach((e) => {
  if (Object.keys(algorithmsSupportedObj).indexOf(e) === -1) {
    console.log(`Algorithms supported: [${Object.keys(algorithmsSupportedObj)}].`);
    process.exit(1);
  }
});

for (let i = 0, len = inputVecs.length; i < len; i += 1) {
  const vecRange = [];
  let tmpVec = inputVecs[i]
    .trim()
    .split(',');

  if (tmpVec.length === 1) {
    tmpVec = tmpVec[0].split(' ');
  }

  let discardVec = false;
  const inputVec = tmpVec.map((e) => {
    const num = Number(e.trim());
    if (Number.isNaN(num)) {
      discardVec = true;
    }
    vecRange.push([num, num]);
    return num;
  });

  if (discardVec || inputVec.length !== algorithmsSupportedObj[algs[i]]) {
    console.log(`Algorithm "${algs[i]}" vector should consist of ${algorithmsSupportedObj[algs[i]]} elements.`);
    process.exit(1);
  }

  ranges.push(vecRange);
  inputVecs[i] = inputVec;
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

algs.forEach((alg) => {
  projection[alg] = 1;
});

Image
  .find({}, projection)
  .exec()
  .then((docs) => {
    // const distances = [];
    const distancesHeap = new Heap((a, b) => b.distance - a.distance);
    algs.forEach((alg, algInd) => {
      docs.forEach((doc) => {
        doc[alg].forEach((feature, featInd) => {
          if (feature < ranges[algInd][featInd][0]) {
            ranges[algInd][featInd][0] = feature;
          }
          if (feature > ranges[algInd][featInd][1]) {
            ranges[algInd][featInd][1] = feature;
          }
        });
      });
    });

    docs.forEach((doc, dInd) => {
      const obj = {
        filename: doc.filename,
        distance: 0,
        annotations: doc.annotations,
      };
      algs.forEach((alg, algInd) => {
        let sum = 0;
        doc[alg].forEach((num, nInd) => {
          const min = ranges[algInd][nInd][0];
          const range = ranges[algInd][nInd][1] - min;
          sum += metrics[metric].addToSum(num, inputVecs[algInd][nInd], range, min);
        });

        obj.distance += metrics[metric].transformSum(sum / algorithmsSupportedObj[alg]);
      });
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
    // console.log(distancesHeap.size());
    // console.log(ranges.length, ranges);
    console.log([...Array(distancesHeap.size()).keys()].map(() => distancesHeap.pop()).reverse());
    mongoose.disconnect();
  })
  .catch((err) => {
    console.log(err);
    mongoose.disconnect();
  });

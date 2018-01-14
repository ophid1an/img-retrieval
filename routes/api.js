const express = require('express');
const Image = require('../models/image');
const Heap = require('heap');
const descVecsSupported = require('../config/server.conf').descVecsSupported;
const numNeighbors = require('../config/server.conf').numNeighbors;

const router = express.Router();


router.get('/find/:filename', (req, res, next) => {
  const filename = req.params.filename;
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({
      err: 'Bad input',
    });
  }
  return Image
    .find({
      filename,
    }, {
      filename: 1,
      annotations: 1,
    })
    .exec()
    .then(docs => res.json(docs))
    .catch(err => next(err));
});


router.get('/find-full/:filename', (req, res, next) => {
  const filename = req.params.filename;
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({
      err: 'Bad input',
    });
  }
  return Image
    .find({
      filename,
    })
    .exec()
    .then(docs => res.json(docs))
    .catch(err => next(err));
});


router.get('/random', (req, res, next) => {
  const numberOfImages = numNeighbors;
  return Image
    .aggregate()
    .sample(numberOfImages)
    .project({
      filename: 1,
      annotations: 1,
      _id: 0,
    })
    .then(docs => res.json(docs))
    .catch(err => next(err));
});


router.post('/compare', (req, res, next) => {
  const filename = req.body.filename;
  const metric = req.body.metric;
  const vecs = req.body.vecs;
  const metrics = ['manhattan', 'euclidean', 'matusita', 'histIntersection', 'divergence'];
  const descVecsSupportedObj = {};
  const badInput = () => res.status(400).json({
    err: 'Bad input',
  });
  const isImgInDB = (filename && typeof filename === 'string');

  if (!metric || typeof metric !== 'string' || metrics.indexOf(metric) === -1) {
    return badInput();
  }

  descVecsSupported.forEach((e) => {
    descVecsSupportedObj[e.name] = e.len;
  });

  if (!vecs || typeof vecs !== 'object') {
    return badInput();
  }

  const descriptors = Object.keys(vecs);
  if (descriptors.length < 1 || descriptors.length > 6) {
    return badInput();
  }
  for (let i = 0, len = descriptors.length; i < len; i += 1) {
    if (!descVecsSupportedObj[descriptors[i]]) {
      return badInput();
    }
  }

  const compareImages = () => {
    if (!descriptors.length) {
      return res.json([]);
    }

    const projection = {
      filename: 1,
      annotations: 1,
    };

    descriptors.forEach((desc) => {
      projection[desc] = 1;
    });

    Image
      .find({}, projection)
      .exec()
      .then((docs) => {
        const distancesHeap = new Heap((a, b) => b.distance - a.distance);
        descriptors.forEach((desc) => {
          let sum = 0;
          docs.forEach((docu) => {
            const doc = docu;
            doc.sums = {};
            doc[desc].forEach((val, valInd) => {
              sum += val;
              const range = vecs[desc].ranges[valInd];
              if (val < range[0]) {
                range[0] = val;
              }
              if (val > range[1]) {
                range[1] = val;
              }
            });
            doc.sums[desc] = sum;
          });
        });

        docs.forEach((doc, docInd) => {
          const obj = {
            filename: doc.filename,
            distance: 0,
            annotations: doc.annotations,
          };
          descriptors.forEach((desc) => {
            if (!doc[desc].length) {
              obj.distance += 1;
            }
          });
          descriptors.forEach((desc) => {
            let sum = 0;
            let sumX = 0;
            let sumY = 0;
            doc[desc].forEach((val, valInd) => {
              const r = vecs[desc].ranges[valInd];
              const min = r[0];
              const range = r[1] - min;
              if (range !== 0) {
                const x = (vecs[desc].vec[valInd] - min) / range; // scale to [0,1]
                const y = (val - min) / range; // scale to [0,1]
                if (metric === 'manhattan') {
                  sum += Math.abs(x - y);
                } else if (metric === 'euclidean') {
                  sum += (x - y) ** 2;
                } else if (metric === 'histIntersection') {
                  sumX += x;
                  sumY += y;
                  sum += Math.min(x, y);
                } else if (metric === 'matusita') {
                  const px = vecs[desc].vec[valInd] / vecs[desc].sum;
                  const py = val / doc.sums[desc];
                  sum += (Math.sqrt(px) - Math.sqrt(py)) ** 2;
                } else if (metric === 'divergence') {
                  const px = vecs[desc].vec[valInd] / vecs[desc].sum;
                  const py = val / doc.sums[desc];
                  sum += (px - py) * Math.log(px / py);
                }
              }
            });

            if (metric === 'manhattan') {
              // obj.distance += sum;
              obj.distance += sum / descVecsSupportedObj[desc];
            } else if (metric === 'euclidean') {
              // obj.distance += Math.sqrt(sum);
              obj.distance += Math.sqrt(sum / descVecsSupportedObj[desc]);
            } else if (metric === 'histIntersection') {
              obj.distance += (1 / (sum / Math.min(sumX, sumY))) - 1;
            } else if (metric === 'matusita') {
              obj.distance += Math.sqrt(sum);
              // obj.distance += Math.sqrt(sum / descVecsSupportedObj[desc]);
            } else if (metric === 'divergence') {
              obj.distance += sum;
            }
          });
          if (docInd < numNeighbors) {
            distancesHeap.push(obj);
          } else {
            distancesHeap.pushpop(obj);
          }
        });

        const results = [...Array(distancesHeap.size()).keys()]
          .map(() => distancesHeap.pop()).reverse();
        res.json(results);
      })
      .catch(err => next(err));
  };

  if (isImgInDB) {
    const projection = {};
    descriptors.forEach((desc) => {
      projection[desc] = 1;
    });
    Image
      .find({
        filename,
      }, projection)
      .exec()
      .then((docs) => {
        const tmpDescs = descriptors.map(x => x);
        tmpDescs.forEach((desc) => {
          if (!docs[0][desc].length) {
            descriptors.splice(descriptors.indexOf(desc), 1);
          } else {
            const vecRanges = [];
            let vecSum = 0;
            docs[0][desc].forEach((val) => {
              vecRanges.push([val, val]);
              vecSum += val;
            });
            vecs[desc] = {
              vec: docs[0][desc],
              ranges: [],
              sum: vecSum,
            };
            vecs[desc].ranges = vecRanges;
          }
        });

        return compareImages();
      })
      .catch(err => next(err));
  } else {
    const tmpDescs = descriptors.map(x => x);
    for (let i = 0, len = tmpDescs.length; i < len; i += 1) {
      const desc = tmpDescs[i];
      if (!Array.isArray(vecs[desc]) ||
        vecs[desc].length !== descVecsSupportedObj[desc]) {
        descriptors.splice(descriptors.indexOf(desc), 1);
        continue;
      }

      const vecRanges = [];
      let vecSum = 0;
      let discardVec = false;
      const vec = vecs[desc].map((e) => {
        const val = Number(e);
        if (Number.isNaN(val)) {
          discardVec = true;
        } else {
          vecRanges.push([val, val]);
          vecSum += val;
        }
        return val;
      });

      if (discardVec || vec.length !== descVecsSupportedObj[desc]) {
        descriptors.splice(descriptors.indexOf(desc), 1);
        continue;
      }

      vecs[desc] = {
        vec,
        ranges: [],
        sum: vecSum,
      };
      vecs[desc].ranges = vecRanges;
    }
    return compareImages();
  }
});

module.exports = router;

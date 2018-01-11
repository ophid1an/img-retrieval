const express = require('express');
const Image = require('../models/image');
const Heap = require('heap');
const algorithmsSupported = require('../config/server.conf').algorithmsSupported;
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
          return (Math.sqrt((x1 - min) / range) -
            Math.sqrt((x2 - min) / range)) ** 2; // scale to [0,1]
        }
        return 0;
      },
      transformSum(sum) {
        return Math.sqrt(sum);
      },
    },
  };
  const algorithmsSupportedObj = {};
  const badInput = () => res.status(400).json({
    err: 'Bad input',
  });
  const isImgInDB = (filename && typeof filename === 'string');

  if (!metric || typeof metric !== 'string' || !metrics[metric]) {
    return badInput();
  }

  algorithmsSupported.forEach((e) => {
    algorithmsSupportedObj[e.name] = e.len;
  });

  if (!vecs || typeof vecs !== 'object') {
    return badInput();
  }

  const algs = Object.keys(vecs);
  if (algs.length < 1 || algs.length > 6) {
    return badInput();
  }
  for (let i = 0, len = algs.length; i < len; i += 1) {
    if (!algorithmsSupportedObj[algs[i]]) {
      return badInput();
    }
  }

  const compareImages = () => {
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
        const distancesHeap = new Heap((a, b) => b.distance - a.distance);
        algs.forEach((alg) => {
          docs.forEach((doc) => {
            doc[alg].forEach((val, valInd) => {
              const range = vecs[alg].ranges[valInd];
              if (val < range[0]) {
                range[0] = val;
              }
              if (val > range[1]) {
                range[1] = val;
              }
            });
          });
        });

        docs.forEach((doc, docInd) => {
          const obj = {
            filename: doc.filename,
            distance: algs.length,
            annotations: doc.annotations,
          };
          algs.forEach((alg) => {
            if (doc[alg].length) {
              obj.distance -= 1;
            }
          });
          algs.forEach((alg) => {
            let sum = 0;
            doc[alg].forEach((val, valInd) => {
              const r = vecs[alg].ranges[valInd];
              const min = r[0];
              const range = r[1] - min;
              sum += metrics[metric].addToSum(val, vecs[alg].vec[valInd], range, min);
            });

            obj.distance += metrics[metric].transformSum(sum / algorithmsSupportedObj[alg]);
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
    algs.forEach((alg) => {
      projection[alg] = 1;
    });
    Image
      .find({
        filename,
      }, projection)
      .exec()
      .then((docs) => {
        const tmpAlgs = algs.map(x => x);
        tmpAlgs.forEach((alg) => {
          if (!docs[0][alg].length) {
            algs.splice(algs.indexOf(alg), 1);
          } else {
            const vecRanges = [];
            docs[0][alg].forEach((val) => {
              vecRanges.push([val, val]);
            });
            vecs[alg] = {
              vec: docs[0][alg],
              ranges: [],
            };
            vecs[alg].ranges = vecRanges;
          }
        });
        if (!algs.length) {
          return res.json([]);
        }
        return compareImages();
      })
      .catch(err => next(err));
  }
});

module.exports = router;

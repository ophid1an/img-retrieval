const express = require('express');
const readline = require('readline');
const fs = require('fs');
const Image = require('../models/image');
const descVecsSupported = require('../config/server.conf').descVecsSupported;
const metricsSupported = require('../config/server.conf').metricsSupported;
const numNeighbors = require('../config/server.conf').numNeighbors;
const uploadFolder = require('../config/server.conf').uploadFolder;
const multer = require('multer');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadFolder);
  },
  filename(req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({
  storage,
});

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
  const numberOfImages = numNeighbors.default;
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

router.post('/upload', upload.fields([{
  name: 'images',
  maxCount: 50,
}, {
  name: 'text',
  maxCount: 1,
}]), (req, res) => {
  // TODO: Verification, error handling in parsing
  const imagesInput = [];
  const imagesFilenames = [];
  const textFilePath = req.files.text[0].path;
  const images = [];
  const imagesPath = 'static/images/data/';
  const thumbsPath = 'static/images/data/thumbs/';
  let image = {};
  let firstImage = true;

  req.files.images.forEach(({
    filename,
    path,
  }) => {
    imagesInput.push({
      filename,
      path,
    });
    imagesFilenames.push(filename);
  });

  const rl = readline.createInterface({
    input: fs.createReadStream(textFilePath),
    crlfDelay: Infinity,
  });

  rl.on('line', (line) => {
    const lineArr = line.replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ');

    if (lineArr.length > 1) {
      if (lineArr[0] === 'filename') {
        if (!firstImage) {
          if (imagesFilenames.indexOf(image.filename) !== -1) {
            images.push(Object.assign({}, image));
          }
        }
        image = {};
        image[lineArr[0]] = lineArr[1];
        firstImage = false;
      } else {
        image[lineArr[0]] = lineArr.slice(1);
      }
    }
  }).on('close', () => {
    if (imagesFilenames.indexOf(image.filename) !== -1) {
      images.push(Object.assign({}, image));
    }

    return Image.insertMany(images)
      .then((docs) => {
        images.forEach((img) => {
          const imgPath = imagesInput[imagesFilenames.indexOf(img.filename)].path;
          fs.copyFileSync(imgPath, `${thumbsPath}${img.filename}`);
          fs.copyFileSync(imgPath, `${imagesPath}${img.filename}`);
        });
        return res.json({
          msg: `Done uploading ${docs.length} images.`,
        });
      })
      .catch(err => res.status(500).json({
        err,
      }));
  });
});


router.post('/compare', (req, res, next) => {
  const filename = req.body.filename;
  const metric = req.body.metric;
  const vecs = req.body.vecs;
  const halfDims = req.body.halfDims;
  const metrics = metricsSupported.map(m => m.value);
  const descVecsSupportedObj = {};
  const badInput = () => res.status(400).json({
    err: 'Bad input',
  });
  const isImgInDB = (filename && typeof filename === 'string');
  let numResults = req.body.numResults;

  if (!metric || typeof metric !== 'string' || metrics.indexOf(metric) === -1) {
    return badInput();
  }

  if (!numResults || typeof numResults !== 'number') {
    numResults = numNeighbors.default;
  } else {
    numResults = Math.floor(numResults);
    if (numResults < numNeighbors.min || numResults > numNeighbors.max) {
      numResults = numNeighbors.default;
    }
  }

  descVecsSupported.forEach((e) => {
    descVecsSupportedObj[e.value] = e.len;
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
        const distances = {};
        descriptors.forEach((desc) => {
          distances[desc] = [];
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

        docs.forEach((doc) => {
          descriptors.forEach((desc) => {
            const obj = {
              filename: doc.filename,
              distance: 0,
              annotations: doc.annotations,
            };
            if (!doc[desc].length) {
              obj.distance += 1000; // TODO: Remove magic number
            }
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
                }
              }
            });

            if (metric === 'manhattan') {
              obj.distance += sum;
            } else if (metric === 'euclidean') {
              obj.distance += Math.sqrt(sum);
            } else if (metric === 'histIntersection') {
              obj.distance += (1 / (sum / Math.min(sumX, sumY))) - 1;
            }

            distances[desc].push(obj);
          });
        });
        descriptors.forEach((desc) => {
          distances[desc].sort((a, b) => a.distance - b.distance);
        });

        const descArrLength = descriptors.length;

        if (descArrLength > 1) {
          const finalDist = [];

          const imagesObj = {};
          descriptors.forEach((desc) => {
            distances[desc].forEach(({
              filename,
              annotations,
            }, objInd) => {
              if (!imagesObj[filename]) {
                const obj = {
                  distance: objInd / descArrLength,
                  annotations,
                };
                imagesObj[filename] = obj;
              } else {
                imagesObj[filename].distance += objInd / descArrLength;
              }
            });
          });

          Object.keys(imagesObj).forEach((fname) => {
            const obj = {
              filename: fname,
              distance: imagesObj[fname].distance,
              annotations: imagesObj[fname].annotations,
            };
            finalDist.push(obj);
          });


          finalDist.sort((a, b) => a.distance - b.distance);
          const results = finalDist.slice(0, numResults);
          return res.json(results);
        }
        const results = distances[descriptors[0]].slice(0, numResults);
        res.json(results);
      })
      .catch(err => next(err));
  };

  if (isImgInDB) {
    const projection = {};

    if (halfDims) {
      descriptors.forEach((desc, descInd) => {
        descriptors[descInd] = `${desc}Half`;
      });
    }

    descriptors.forEach((desc) => {
      projection[desc] = 1;
    });

    Image
      .find({
        filename,
      }, projection)
      .exec()
      .then((docs) => {
        if (!docs.length) {
          return badInput();
        }

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

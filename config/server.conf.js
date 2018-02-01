exports.dbURI = process.env.MONGODB_URI || 'mongodb://localhost/mm-dbs-project'

exports.descVecsSupported = [{
    value: 'gist',
    text: 'Gist',
    len: 512,
  },
  {
    value: 'hsvHist',
    text: 'HSV Histogram',
    len: 343,
  },
  {
    value: 'hsvHistLayout',
    text: 'HSV Histogram Layout',
    len: 375,
  },
  {
    value: 'rgbHist',
    text: 'RGB Histogram',
    len: 343,
  },
  {
    value: 'sfta',
    text: 'SFTA',
    len: 42,
  },
  {
    value: 'sift',
    text: 'SIFT',
    len: 100,
  },
];

exports.metricsSupported = [{
    text: 'Euclidean distance',
    value: 'euclidean',
  },
  {
    text: 'Histogram intersection',
    value: 'histIntersection',
  },
  {
    text: 'Manhattan distance',
    value: 'manhattan',
  },
];

exports.numNeighbors = {
  default: 20,
  min: 2,
  max: 50,
};

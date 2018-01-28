exports.dbURI = process.env.MONGODB_URI || 'mongodb://localhost/mm-dbs-project'

exports.descVecsSupported = [{
    name: 'gist',
    len: 512,
  },
  {
    name: 'hsvHist',
    len: 343,
  },
  {
    name: 'hsvHistLayout',
    len: 375,
  },
  {
    name: 'rgbHist',
    len: 343,
  },
  {
    name: 'sfta',
    len: 42,
  },
  {
    name: 'sift',
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
  // {
  //   text: 'Matusita distance',
  //   value: 'matusita',
  // },
  // {
  //   text: 'Divergence',
  //   value: 'divergence',
  // },
];

exports.numNeighbors = {
  default: 20,
  min: 2,
  max: 50,
};

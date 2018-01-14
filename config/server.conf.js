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

exports.numNeighbors = 20;

const mongoose = require('mongoose');
const descVecsSupported = require('../config/server.conf').descVecsSupported;

const Schema = mongoose.Schema;
const imageObj = {
  filename: {
    type: String,
    required: true,
    unique: true,
  },
  annotations: [String],
};

descVecsSupported.forEach((e) => {
  imageObj[e.name] = {
    type: [Number],
  };
});

const imageSchema = Schema(imageObj);

module.exports = mongoose.model('Image', imageSchema);

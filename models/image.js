const mongoose = require('mongoose');
const algorithmsSupported = require('../config/server.conf').algorithmsSupported;

const Schema = mongoose.Schema;
const imageObj = {
  filename: {
    type: String,
    required: true,
    unique: true,
  },
  annotations: [String],
};

algorithmsSupported.forEach((e) => {
  imageObj[e.name] = {
    type: [Number],
  };
});

const imageSchema = Schema(imageObj);

module.exports = mongoose.model('Image', imageSchema);

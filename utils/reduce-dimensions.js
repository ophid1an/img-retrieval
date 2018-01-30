const mongoose = require('mongoose');
const Image = require('../models/image');
const dbURI = require('../config/server.conf').dbURI;
const descVecsSupported = require('../config/server.conf').descVecsSupported;

mongoose.connect(dbURI, {
  useMongoClient: true,
});
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

Image
  .find({})
  .exec()
  .then((docs) => {
    const sets = {};
    descVecsSupported.forEach((desc) => {
      const descValue = desc.value;
      sets[descValue] = [];
      [...Array(desc.len).keys()].forEach((ind) => {
        sets[descValue].push({
          ind,
          unique: new Set(),
        });
      });
    });

    descVecsSupported.forEach((desc) => {
      const descValue = desc.value;
      docs.forEach((doc) => {
        doc[descValue].forEach((el, elInd) => {
          sets[descValue][elInd].unique.add(el);
        });
      });
    });

    descVecsSupported.forEach((desc) => {
      const descValue = desc.value;
      [...Array(desc.len).keys()].forEach((ind) => {
        sets[descValue][ind].unique = sets[descValue][ind].unique.size;
      });
    });

    descVecsSupported.forEach((desc) => {
      const descValue = desc.value;
      sets[descValue].sort((a, b) => b.unique - a.unique);
    });

    const updateImages = (arr, numOfDocsUpdated = 0) => {
      if (arr.length === 0) {
        return Promise.resolve(numOfDocsUpdated);
      }

      const obj = {};
      const doc = arr.splice(0, 1)[0];

      descVecsSupported.forEach((desc) => {
        const descValue = desc.value;
        obj[`${descValue}Half`] = [];
        [...Array(Math.floor(doc[descValue].length / 2)).keys()].forEach((ind) => {
          obj[`${descValue}Half`].push(doc[descValue][sets[descValue][ind].ind]);
        });
        sets[descValue].sort((a, b) => b.unique - a.unique);
      });

      return Image.update({
          _id: doc.id,
        }, {
          $set: obj,
        })
        .then(() => updateImages(arr, numOfDocsUpdated + 1));
    };

    updateImages(docs)
      .then((msg) => {
        console.log(`Updated a total of ${msg} documents.`);
        return mongoose.disconnect();
      })
      .catch((err) => {
        console.log(err);
        return mongoose.disconnect();
      });

    // [...Object.keys(sets)].forEach((desc) => {
    //   console.log(desc);
    //   let output = '';
    //   sets[desc].forEach((el) => {
    //     output += `${el.ind} `;
    //   });
    //   console.log(output);
    // });
    // return mongoose.disconnect();
  })
  .catch((err) => {
    console.log(err);
    return mongoose.disconnect();
  });

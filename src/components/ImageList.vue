<template>
<div class="columns is-multiline">
  <image-card v-for="image in images" :init="image"></image-card>
</div>
</template>

<script>
import axios from 'axios';
import ImageCard from './ImageCard';

export default {
  name: 'image-list',
  components: {
    ImageCard,
  },
  data() {
    return {
      images: [],
    };
  },
  created() {
    axios.get('/api/random')
      .then((res) => {
        this.images = res.data;
      })
      .catch(err => console.log(err));

    Event.$on('compareImage', ({
      metric,
      vecs,
      numResults,
    }) => {
      axios.post('/api/compare', {
          metric,
          vecs,
          numResults,
        })
        .then((res) => {
          this.images = res.data;
        })
        .catch(err => console.log(err));
    });

    Event.$on('compareImageFromDB', ({
      filename,
      metric,
      descsSelected,
      numResults,
      halfDims,
    }) => {
      const vecs = {};
      this.images.forEach((img) => {
        const image = img;
        image.filename = '__waiting__';
        image.annotations = [];
        image.distance = undefined;
      });
      descsSelected.forEach((desc) => {
        vecs[desc] = [];
      });
      axios.post('/api/compare', {
          filename,
          metric,
          vecs,
          numResults,
          halfDims,
        })
        .then((res) => {
          this.images = res.data;
        })
        .catch(err => console.log(err));
    });
  },
};
</script>

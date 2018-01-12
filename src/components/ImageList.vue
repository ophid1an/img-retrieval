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
      filename,
      metricSelected,
      algsSelected,
    }) => {
      const vecs = {};
      algsSelected.forEach((alg) => {
        vecs[alg] = [];
      });
      axios.post('/api/compare', {
          filename,
          metric: metricSelected,
          vecs,
        })
        .then((res) => {
          this.images = res.data;
        })
        .catch(err => console.log(err));
    });
  },
};
</script>

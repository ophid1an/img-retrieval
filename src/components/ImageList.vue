<template>
<div class="columns is-multiline">
  <image-card v-for="image in images" class="column is-one-fifth" :init="image"></image-card>
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
  mounted() {
    axios.get('/api/random')
      .then((res) => {
        this.images = res.data;
      })
      .catch(err => console.log(err));
  },
};
</script>

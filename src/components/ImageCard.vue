<template>
<div class="column is-one-fifth">
  <div class="card">
    <header class="card-header">
      <p v-if="!waiting" class="card-header-title is-centered" @click="onFilenameClick">
        {{ init.filename }}
      </p>
    </header>

    <div class="card-image">
      <figure class="image">
        <img :src="getSrc" alt="Placeholder image" @click="onImageClick">
      </figure>
    </div>

    <div v-if="!waiting" class="card-content">
      <p v-if="hasDistance"><strong>Distance: {{ Number(init.distance).toFixed(5) }}</strong></p>
      <p> <span v-for="ann in init.annotations">{{ ann }} </span> </p>
    </div>
  </div>
</div>
</template>

<script>
export default {
  name: 'image-card',
  props: ['init'],
  methods: {
    onImageClick() {
      Event.$emit('imageClicked', this.getSrc);
    },
    onFilenameClick() {
      Event.$emit('imageSelected', this.init.filename);
    },
  },
  data() {
    return {
      waitingFilename: '/static/images/waiting.png',
      dataImagesPath: '/static/images/data/',
    };
  },
  computed: {
    waiting() {
      return this.init.filename === '__waiting__';
    },
    getSrc() {
      return this.waiting ? this.waitingFilename : `${this.dataImagesPath}${this.init.filename}`;
    },
    hasDistance() {
      return typeof this.init.distance !== 'undefined';
    },
  },
};
</script>

<style scoped>
/*.image img {
  object-fit: scale-down;
}*/

.card-content {
  text-align: center;
}
</style>

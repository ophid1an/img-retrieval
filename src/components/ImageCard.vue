<template>
<div class="column is-one-fifth">
  <div class="card">
    <header class="card-header">
      <p v-if="!waiting" class="card-header-title is-centered" @click="imageSelected">
        {{ init.filename }}
      </p>
    </header>

    <div class="card-image">
      <figure class="image">
        <img :src="getSrc" alt="Placeholder image" @click="imageClicked">
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
    imageClicked() {
      Event.$emit('imageClicked', this.getSrc);
    },
    imageSelected() {
      Event.$emit('imageSelected', this.init.filename);
    },
  },
  computed: {
    waiting() {
      return this.init.filename === 'waiting.png';
    },
    getSrc() {
      return this.waiting ? `/static/images/${this.init.filename}` :
        `/static/images/data/${this.init.filename}`;
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

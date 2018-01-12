<template>
<div class="column is-one-fifth">
  <div class="card">
    <header class="card-header">
      <p class="card-header-title is-centered" @click="imageSelected">
        {{ init.filename }}
      </p>
    </header>

    <div class="card-image">
      <figure class="image">
        <img :src="getSrc" alt="Placeholder image" @click="imageClicked">
      </figure>
    </div>

    <div class="card-content">
      <p v-if="init.distance"><strong>Distance: {{ Number(init.distance).toFixed(5) }}</strong></p>
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
    getSrc() {
      return `/static/images/data/${this.init.filename}`;
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

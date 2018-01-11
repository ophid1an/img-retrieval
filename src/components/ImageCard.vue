<template>
<div class="card">
  <header class="card-header">
    <p class="card-header-title is-centered">
      {{ init.filename }}
    </p>
  </header>

  <div class="card-content">
    <figure class="image">
      <img :src="getSrc" alt="Placeholder image" @click="imageClicked">
    </figure>
    <p class="title is-4"></p>
    <span v-for="ann in init.annotations">{{ ann }} </span>
  </div>

</div>
</template>

<script>
export default {
  name: 'image-card',
  props: ['init'],
  data() {
    return {
      // filename: this.init.filename,
      // annotations: this.init.annotations,
    };
  },
  methods: {
    imageClicked() {
      Event.$emit('imageClicked', this.getSrc);
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
.image img {
  object-fit: scale-down;
}

.card-content {
  text-align: center;
}
</style>

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
        <img :src="getThumbSrc" alt="Placeholder image" @click="onImageClick">
      </figure>
    </div>

    <div v-if="!waiting" class="card-content">
      <p v-if="hasDistance" :class="{ distance: hasAnnotations }"><strong>Distance: {{ Number(init.distance).toFixed(5) }}</strong></p>
      <p v-if="hasAnnotations"><span v-for="ann in init.annotations">{{ ann }} </span> </p>
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
      Event.$emit('imageClicked', this.getImageSrc);
    },
    onFilenameClick() {
      Event.$emit('imageSelected', this.init.filename);
    },
  },
  data() {
    return {
      waitingFilename: '/static/images/waiting.png',
      imagesPath: '/static/images/data/',
      thumbsPath: '/static/images/data/thumbs/',
    };
  },
  computed: {
    waiting() {
      return this.init.filename === '__waiting__';
    },
    getImageSrc() {
      return `${this.imagesPath}${this.init.filename}`;
    },
    getThumbSrc() {
      return this.waiting ? this.waitingFilename : `${this.thumbsPath}${this.init.filename}`;
    },
    hasDistance() {
      return typeof this.init.distance !== 'undefined';
    },
    hasAnnotations() {
      const annots = this.init.annotations;
      return annots.length ? annots[0] : false; // Hack for annotations: [""]
    },
  },
};
</script>

<style scoped>
.card-header,
.card-image {
  cursor: pointer;
}

.card-content {
  text-align: center;
}

.distance {
  border-bottom: 1px #777 solid;
}
</style>

<template>
<div class="modal is-active">
  <div class="modal-background"></div>
  <div class="modal-content">
    <p class="image" @click="onImageModalClose">
      <img :src="src" alt="">
    </p>
  </div>
  <button class="modal-close is-large" aria-label="close" @click="onImageModalClose"></button>
</div>
</template>

<script>
export default {
  name: 'image-modal',
  data() {
    return {
      src: '',
    };
  },
  methods: {
    onImageModalClose() {
      Event.$emit('imageModalClosed');
    },
  },
  created() {
    Event.$on('imageClicked', (src) => {
      this.src = src;
    });
  },
};
</script>

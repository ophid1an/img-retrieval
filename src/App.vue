<template>
<div>
  <section class="hero is-dark">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">
          Εργασία
      </h1>
      </div>
    </div>
  </section>
  <section class="section">
    <div class="container">
      <image-modal v-show="showImageModal"></image-modal>
      <image-list></image-list>
    </div>
  </section>
</div>
</template>

<script>
import ImageList from './components/ImageList';
import ImageModal from './components/ImageModal';

export default {
  name: 'app',
  components: {
    ImageList,
    ImageModal,
  },
  data() {
    return {
      distances: {
        euclidean: 'Euclidean distance',
        manhattan: 'Manhattan distance',
        matusita: 'Matusita distance',
      },
      showImageModal: false,
    };
  },
  created() {
    Event.$on('imageClicked', () => {
      this.showImageModal = true;
    });

    Event.$on('imageModalClosed', () => {
      this.showImageModal = false;
    });
  },
};
</script>

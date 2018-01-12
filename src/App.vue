<template>
<div>
  <section class="section has-text-centered">
    <h1 class="title">
          Image Retrieval
      </h1>
  </section>

  <image-modal v-show="showImageModal"></image-modal>

  <section class="section">
    <div class="container">

      <div class="field">
        <label class="label">Metric</label>
        <div class="control">
          <div class="select">
            <select v-model="metricSelected">
              <option v-for="metric in metrics" :value="metric.value">{{ metric.text }}</option>
            </select>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label">Algorithms</label>
        <label class="checkbox">
          <input type="checkbox" :value="algs[0].value" v-model="algsSelected">
          {{ algs[0].text }}
        </label>

        <label class="checkbox">
          <input type="checkbox" :value="algs[1].value" v-model="algsSelected">
          {{ algs[1].text }}
        </label>

        <label class="checkbox">
          <input type="checkbox" :value="algs[2].value" v-model="algsSelected">
          {{ algs[2].text }}
        </label>

        <label class="checkbox">
          <input type="checkbox" :value="algs[3].value" v-model="algsSelected">
          {{ algs[3].text }}
        </label>

        <label class="checkbox">
          <input type="checkbox" :value="algs[4].value" v-model="algsSelected">
          {{ algs[4].text }}
        </label>

        <label class="checkbox">
          <input type="checkbox" :value="algs[5].value" v-model="algsSelected">
          {{ algs[5].text }}
        </label>
      </div>

    </div>
  </section>

  <section class="section">
    <div class="container">
      <image-list></image-list>
    </div>
  </section>

  <footer class="footer">
    <div class="container">
      <div class="content has-text-centered">
        <p> <small>&copy; 2017 Ioannis Dermentzoglou</small> </p>
      </div>
    </div>
  </footer>

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
      metricSelected: 'euclidean',
      metrics: [{
          text: 'Euclidean distance',
          value: 'euclidean',
        },
        {
          text: 'Manhattan distance',
          value: 'manhattan',
        },
        {
          text: 'Matusita distance',
          value: 'matusita',
        },
      ],
      algsSelected: ['gist'],
      algs: [{
          text: 'GIST',
          value: 'gist',
          vector: [],
        },
        {
          text: 'HSV Histogram',
          value: 'hsvHist',
          vector: [],
        },
        {
          text: 'HSV Histogram Layout',
          value: 'hsvHistLayout',
          vector: [],
        },
        {
          text: 'RGB Histogram',
          value: 'rgbHist',
          vector: [],
        },
        {
          text: 'SFTA',
          value: 'sfta',
          vector: [],
        },
        {
          text: 'SIFT',
          value: 'sift',
          vector: [],
        },
      ],
      showImageModal: false,
    };
  },
  created() {
    Event.$on('imageClicked', () => {
      this.showImageModal = true;
    });

    Event.$on('imageSelected', (filename) => {
      if (!this.algsSelected.length) {
        this.algsSelected.push(this.algs[0].value);
      }
      Event.$emit('compareImage', {
        filename,
        metricSelected: this.metricSelected,
        algsSelected: this.algsSelected,
      });
    });

    Event.$on('imageModalClosed', () => {
      this.showImageModal = false;
    });
  },
};
</script>

<style>
html {
  background-color: #e7e7e7;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='52' height='52' viewBox='0 0 52 52'%3E%3Cpath fill='%232a584a' fill-opacity='0.05' d='M0 17.83V0h17.83a3 3 0 0 1-5.66 2H5.9A5 5 0 0 1 2 5.9v6.27a3 3 0 0 1-2 5.66zm0 18.34a3 3 0 0 1 2 5.66v6.27A5 5 0 0 1 5.9 52h6.27a3 3 0 0 1 5.66 0H0V36.17zM36.17 52a3 3 0 0 1 5.66 0h6.27a5 5 0 0 1 3.9-3.9v-6.27a3 3 0 0 1 0-5.66V52H36.17zM0 31.93v-9.78a5 5 0 0 1 3.8.72l4.43-4.43a3 3 0 1 1 1.42 1.41L5.2 24.28a5 5 0 0 1 0 5.52l4.44 4.43a3 3 0 1 1-1.42 1.42L3.8 31.2a5 5 0 0 1-3.8.72zm52-14.1a3 3 0 0 1 0-5.66V5.9A5 5 0 0 1 48.1 2h-6.27a3 3 0 0 1-5.66-2H52v17.83zm0 14.1a4.97 4.97 0 0 1-1.72-.72l-4.43 4.44a3 3 0 1 1-1.41-1.42l4.43-4.43a5 5 0 0 1 0-5.52l-4.43-4.43a3 3 0 1 1 1.41-1.41l4.43 4.43c.53-.35 1.12-.6 1.72-.72v9.78zM22.15 0h9.78a5 5 0 0 1-.72 3.8l4.44 4.43a3 3 0 1 1-1.42 1.42L29.8 5.2a5 5 0 0 1-5.52 0l-4.43 4.44a3 3 0 1 1-1.41-1.42l4.43-4.43a5 5 0 0 1-.72-3.8zm0 52c.13-.6.37-1.19.72-1.72l-4.43-4.43a3 3 0 1 1 1.41-1.41l4.43 4.43a5 5 0 0 1 5.52 0l4.43-4.43a3 3 0 1 1 1.42 1.41l-4.44 4.43c.36.53.6 1.12.72 1.72h-9.78zm9.75-24a5 5 0 0 1-3.9 3.9v6.27a3 3 0 1 1-2 0V31.9a5 5 0 0 1-3.9-3.9h-6.27a3 3 0 1 1 0-2h6.27a5 5 0 0 1 3.9-3.9v-6.27a3 3 0 1 1 2 0v6.27a5 5 0 0 1 3.9 3.9h6.27a3 3 0 1 1 0 2H31.9z'%3E%3C/path%3E%3C/svg%3E");
}

.footer {
  background-color: initial;
}
</style>

<template>
<div>
  <section class="hero is-dark is-bold">
    <div class="hero-body">
      <div class="container">
        <h1 class="title">
          Image Retrieval
      </h1>
      </div>
    </div>
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
      <p>
        <small>&copy; 2017 Ioannis Dermentzoglou</small>
      </p>
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

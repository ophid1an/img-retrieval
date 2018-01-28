<template>
<div>
  <section class="section">
    <div class="container has-text-centered">
      <h1 class="title">
          Image Retrieval Project
      </h1>
    </div>
  </section>

  <image-modal v-show="isImageModalVisible"></image-modal>

  <section class="section">
    <div class="container box">

      <div class="form">
        <div class="icon has-text-link" @click="onFormAngleClick">
          <i class="fa fa-2x" :class="{ 'fa-angle-right': !isFormVisible, 'fa-angle-down': isFormVisible }"></i>
        </div>

        <form :class="{ 'is-hidden': !isFormVisible}" @submit.prevent="onFormSubmit">

          <template v-for="desc in descs">
            <div class="field">
              <label class="label" v-text="desc.text"></label>
              <div class="control has-icons-right">
                <input class="input" type="text" v-model="desc.vecStr" :placeholder="`${desc.len} features`" @focus="inInput(desc)" @blur="computeVec(desc)">
                <span class="icon is-small is-right" :class="getInputIconColor(desc)">
                  <i class="fa" :class="getInputIconType(desc)"></i>
                </span>
              </div>
            </div>
          </template>

          <div class="field">
            <div class="control">
              <button class="button is-link" :disabled="!isFormSubmissible">Submit</button>
            </div>
          </div>

        </form>
      </div>

      <div class="field">
        <label class="label">Number of results</label>
        <div class="control">
          <input class="slider is-fullwidth is-info has-output" v-model="numResults.default" step="1" :min="numResults.min" :max="numResults.max" type="range">
          <output>{{ numResults.default }}</output>
        </div>
      </div>

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
        <label class="label">Descriptors</label>

        <template v-for="desc in descs">
          <label class="checkbox">
            <div class="control">
              <input type="checkbox" :value="desc.value" v-model="descsSelected">
              {{ desc.text }}
            </div>
          </label>
        </template>
      </div>

    </div>
  </section>

  <section class="section">
    <div class="container box">
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
import {
  descVecsSupported,
  metricsSupported,
  numNeighbors,
} from '../config/server.conf';

export default {
  name: 'app',
  components: {
    ImageList,
    ImageModal,
  },
  data() {
    return {
      isFormVisible: false,
      isImageModalVisible: false,
      vecs: {},
      numResults: numNeighbors,
      metricSelected: 'euclidean',
      metrics: metricsSupported,
      descsSelected: ['sift'],
      descs: descVecsSupported.map((desc) => {
        const obj = desc;
        obj.vecStr = '';
        obj.vec = [];
        obj.isInInput = false;
        return obj;
      }),
    };
  },
  methods: {
    inInput(descrip) {
      const desc = descrip;
      desc.isInInput = true;
      desc.vec.splice(0, desc.vec.length);
    },
    computeVec(descrip) {
      const desc = descrip;
      desc.isInInput = false;
      if (desc.vecStr) {
        const vecStrArr = desc.vecStr.replace(/,/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ');

        if (vecStrArr.length === desc.len) {
          let discardVec = false;
          vecStrArr.forEach((e) => {
            const val = Number(e);
            if (Number.isNaN(val)) {
              discardVec = true;
            }
            desc.vec.push(val);
          });
          if (discardVec) {
            desc.vec.splice(0, desc.vec.length);
          }
        }
      }
    },
    getInputIconType(desc) {
      let res = 'fa-pencil';
      if (desc.vecStr && !desc.isInInput) {
        if (desc.vec.length) {
          res = 'fa-check';
        } else {
          res = 'fa-times';
        }
      }
      return res;
    },
    getInputIconColor(desc) {
      let res = '';
      if (desc.vecStr && !desc.isInInput) {
        if (desc.vec.length) {
          res = 'has-text-success';
        } else {
          res = 'has-text-danger';
        }
      }
      return res;
    },
    onFormAngleClick() {
      this.isFormVisible = !this.isFormVisible;
    },
    onFormSubmit() {
      if (this.isFormSubmissible) {
        const vecs = {};
        this.descs.forEach((descrip) => {
          const desc = descrip;
          const vec = desc.vec;
          if (desc.vecStr) {
            vecs[desc.value] = vec;
          }
          desc.vecStr = '';
        });

        Event.$emit('compareImage', {
          metric: this.metricSelected,
          vecs,
          numResults: Number(this.numResults.default),
        });
      }
    },
  },
  computed: {
    isFormSubmissible() {
      let isOneFieldGood = false;
      let areAllFieldsGood = true;
      this.descs.forEach((desc) => {
        if (desc.vecStr) {
          if (desc.vec.length) {
            isOneFieldGood = true;
          } else {
            areAllFieldsGood = false;
          }
        }
      });
      return isOneFieldGood && areAllFieldsGood;
    },
  },
  created() {
    Event.$on('imageClicked', () => {
      this.isImageModalVisible = true;
    });

    Event.$on('imageSelected', (filename) => {
      if (!this.descsSelected.length) {
        this.descsSelected.push('sift');
      }
      Event.$emit('compareImageFromDB', {
        filename,
        numResults: Number(this.numResults.default),
        metric: this.metricSelected,
        descsSelected: this.descsSelected,
      });
    });

    Event.$on('imageModalClosed', () => {
      this.isImageModalVisible = false;
    });
  },
};
</script>

<style>
html {
  background-color: #e7e7e7;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='52' height='52' viewBox='0 0 52 52'%3E%3Cpath fill='%232a584a' fill-opacity='0.05' d='M0 17.83V0h17.83a3 3 0 0 1-5.66 2H5.9A5 5 0 0 1 2 5.9v6.27a3 3 0 0 1-2 5.66zm0 18.34a3 3 0 0 1 2 5.66v6.27A5 5 0 0 1 5.9 52h6.27a3 3 0 0 1 5.66 0H0V36.17zM36.17 52a3 3 0 0 1 5.66 0h6.27a5 5 0 0 1 3.9-3.9v-6.27a3 3 0 0 1 0-5.66V52H36.17zM0 31.93v-9.78a5 5 0 0 1 3.8.72l4.43-4.43a3 3 0 1 1 1.42 1.41L5.2 24.28a5 5 0 0 1 0 5.52l4.44 4.43a3 3 0 1 1-1.42 1.42L3.8 31.2a5 5 0 0 1-3.8.72zm52-14.1a3 3 0 0 1 0-5.66V5.9A5 5 0 0 1 48.1 2h-6.27a3 3 0 0 1-5.66-2H52v17.83zm0 14.1a4.97 4.97 0 0 1-1.72-.72l-4.43 4.44a3 3 0 1 1-1.41-1.42l4.43-4.43a5 5 0 0 1 0-5.52l-4.43-4.43a3 3 0 1 1 1.41-1.41l4.43 4.43c.53-.35 1.12-.6 1.72-.72v9.78zM22.15 0h9.78a5 5 0 0 1-.72 3.8l4.44 4.43a3 3 0 1 1-1.42 1.42L29.8 5.2a5 5 0 0 1-5.52 0l-4.43 4.44a3 3 0 1 1-1.41-1.42l4.43-4.43a5 5 0 0 1-.72-3.8zm0 52c.13-.6.37-1.19.72-1.72l-4.43-4.43a3 3 0 1 1 1.41-1.41l4.43 4.43a5 5 0 0 1 5.52 0l4.43-4.43a3 3 0 1 1 1.42 1.41l-4.44 4.43c.36.53.6 1.12.72 1.72h-9.78zm9.75-24a5 5 0 0 1-3.9 3.9v6.27a3 3 0 1 1-2 0V31.9a5 5 0 0 1-3.9-3.9h-6.27a3 3 0 1 1 0-2h6.27a5 5 0 0 1 3.9-3.9v-6.27a3 3 0 1 1 2 0v6.27a5 5 0 0 1 3.9 3.9h6.27a3 3 0 1 1 0 2H31.9z'%3E%3C/path%3E%3C/svg%3E");
}

.box {
  background-color: #bccfd2;
}

.checkbox {
  margin-right: 1em;
}

.checkbox:last-child {
  margin-right: initial;
}

.icon.has-text-link {
  border: 1px #777 solid;
  margin-bottom: 1em;
}

.form {
  border-bottom: 1px #777 solid;
  padding-bottom: 1em;
  margin-bottom: 1em;
}

.footer {
  background-color: initial;
}
</style>

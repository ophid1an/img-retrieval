// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import 'font-awesome/css/font-awesome.min.css';
import 'bulma/css/bulma.css';
import App from './App';

Vue.config.productionTip = false;

/* eslint-disable no-new */
window.Event = new Vue();

new Vue({
  el: '#app',
  template: '<App/>',
  components: { App },
});

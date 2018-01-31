<template>
<div>

  <div class="tabs is-centered is-medium is-toggle">
    <ul>
      <li v-for="tab in tabs" :class="{ 'is-active': tab.isActive }">
        <a :href="tab.href" @click="selectTab(tab)">{{ tab.name }}</a>
      </li>
    </ul>
  </div>

  <div class="tabs-details">
    <slot> </slot>
  </div>

</div>
</template>

<script>
export default {
  name: 'tabs',
  data() {
    return {
      tabs: [],
    };
  },
  methods: {
    selectTab(selectedTab) {
      this.tabs.forEach((t) => {
        const tab = t;
        tab.isActive = (tab.name === selectedTab.name);
      });
    },
  },
  created() {
    this.tabs = this.$children;
  },
};
</script>

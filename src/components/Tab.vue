<template>
<div v-show="isActive">
  <slot></slot>
</div>
</template>

<script>
export default {
  name: 'tab',
  props: {
    name: {
      required: true,
    },
    selected: {
      default: false,
    },
  },
  data() {
    return {
      isActive: false,
    };
  },
  computed: {
    href() {
      return `#${this.name.toLowerCase().split(' ')[0]}`;
    },
  },
  mounted() {
    this.isActive = this.selected;
  },
};
</script>

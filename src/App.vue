<template>
  <Home />
</template>

<script setup>
import Home from './views/Home.vue'
</script>

<style>
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--surface);
  color: var(--ink-muted);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
</style>

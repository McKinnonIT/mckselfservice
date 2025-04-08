<template>
  <div id="app" class="bg-default">
    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: "Open Sans", sans-serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #525f7f;
  text-align: left;
  background-color: #f8f9fe;
}

.bg-default {
  background-color: #172b4d !important;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.container {
  max-width: 2800px;
  width: 95%;
  margin: 0 auto;
}
</style> 
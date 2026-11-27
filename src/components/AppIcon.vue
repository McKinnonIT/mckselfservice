<!-- The design system's AppIcon: the squircle radiant mark on McK Navy, ported from its React bundle. -->
<template>
  <div class="app-icon" :style="{ width: size + 'px', height: size + 'px' }" role="img" :aria-label="label">
    <div v-for="(ring, i) in rings" :key="i" class="ring" :style="ring"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: { type: Number, default: 28 },
  label: { type: String, default: 'App icon' },
});

// A colour t (0..1) of the way along the eight-stop ramp, dark to light, kept as tokens.
function sample(t) {
  t = Math.max(0, Math.min(0.9999, t)) * 7;
  const i = Math.floor(t);
  const f = Math.round((t - i) * 100);
  if (f === 0) return `var(--ramp-${i + 1})`;
  return `color-mix(in srgb, var(--ramp-${i + 1}) ${100 - f}%, var(--ramp-${i + 2}))`;
}

// Outer ring first, dark outside to light core (the icon sits on Navy).
const rings = computed(() => {
  const n = props.size >= 32 ? 7 : props.size >= 24 ? 4 : 3;
  const minPct = n <= 3 ? 30 : n <= 4 ? 22 : 14;
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 1 : i / (n - 1);
    const p = (100 - t * (100 - minPct)).toFixed(1) + '%';
    return { width: p, height: p, background: `linear-gradient(150deg, ${sample(t)} 0%, ${sample(Math.min(1, t + 0.12))} 100%)` };
  });
});
</script>

<style scoped>
.app-icon {
  position: relative;
  overflow: hidden;
  flex: none;
  background: var(--ramp-1);
  border-radius: var(--radius-app-icon);
}

.ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: var(--radius-squircle);
}
</style>

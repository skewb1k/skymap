## 🌌 SkyMap – Interactive & Customizable Star Map for JavaScript

**SkyMap** is a lightweight, highly customizable JavaScript/TypeScript library for rendering a realistic sky map on an HTML `<canvas>`. It supports modern frontend frameworks like **React, Vue, Svelte, and Next.js**, while remaining easy to use in plain JavaScript.

🚀 **Designed for simplicity, customization, and performance.**

<!-- [![npm version](https://img.shields.io/npm/v/@nardora/skymap)](https://www.npmjs.com/package/@nardora/skymap) -->
[![Stars](https://img.shields.io/github/stars/skewb1k/skymap?style=social)](https://github.com/nardora/skymap)

## ✨ Features

-  **Realistic Star Rendering** – Uses scientifically accurate colors and positions.
-  **Customizable** – Adjust colors, sizes, labels and more.
-  **Framework-Agnostic** – Compatible with **Vanilla JS, React, Vue, Svelte, Next.js, and others**.
-  **Optimized for Performance** – Smooth rendering with efficient WebGL & Canvas APIs.
-  **Supports Real-Time Updates** – Change time, location, and visibility dynamically.
-  **Well-Documented** – Clear API with examples for easy integration.


## 🚀 Installation

Install via **npm**, **pnpm**, **yarn** or **bun**:
```sh
npm install skymap

yarn add skymap

pnpm add skymap

bun add skymap
```


## 📌 Quick Start

### 🔹 **Vanilla JavaScript (Plain HTML)**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sky Map</title>
</head>
<body>
  <div id="sky-container" style="width: 500px; height: 500px;"></div>
  <script type="module">
    import { SkyMap } from "@nardora/skymap";

    const sky = new SkyMap(document.getElementById("sky-container"), {
      latitude: 52.52,
      longitude: 13.405,
      datetime: new Date(),
    });
  </script>
</body>
</html>
```


### 🔹 **React (With Hooks)**
```tsx
import { useEffect, useRef } from "react";
import { SkyMap } from "@nardora/skymap";

const SkyMapComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<SkyMap | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      skyRef.current = new SkyMap(containerRef.current, {
        latitude: 52.52,
        longitude: 13.405,
      });
    }
    return () => skyRef.current?.destroy();
  }, []);

  return <div ref={containerRef} style={{ width: "500px", height: "500px" }} />;
};

export default SkyMapComponent;
```


### 🔹 **Vue 3 (Composition API)**
```vue
<template>
  <div ref="skyContainer" style="width: 500px; height: 500px;"></div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { SkyMap } from "@nardora/skymap";

const skyContainer = ref(null);
let skyMapInstance;

onMounted(() => {
  skyMapInstance = new SkyMap(skyContainer.value, {
    latitude: 52.52,
    longitude: 13.405,
  });
});
</script>
```
<!--
---

## ⚙️ **Configuration Options**
You can customize the sky map with various options:

```ts
new SkyMap(container, {
  latitude: 52.52,           // Observer's latitude
  longitude: 13.405,         // Observer's longitude
  datetime: new Date(),      // Time for the sky projection
  showConstellations: true,  // Show constellation lines
  starBrightness: 1.0,       // Adjust star brightness
  projection: "stereographic" // Projection type: "stereographic", "mercator", etc.
});
```

---

## 🛠️ **API Methods**
```ts
sky.setDate(new Date("2025-06-15T22:00:00Z")); // Change date/time
sky.setLocation(34.05, -118.25); // Update observer’s location
sky.toggleConstellations(); // Show/hide constellation lines
sky.destroy(); // Clean up the instance
```
-->

<!--
## 📖 **Documentation & Examples**
📚 **Full API Documentation:** [nardora.github.io/skymap](https://nardora.github.io/skymap) (TODO)

🛠 **Live Demos:** [CodeSandbox](https://codesandbox.io/) (TODO)

## 👥 **Contributing**
Contributions are welcome! Please follow these steps:
1. **Fork the repo** and clone it.
2. Run `npm install` to set up dependencies.
3. Make changes in the `src/` directory.
4. Submit a **pull request (PR)** with a clear description.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---
-->

## 📜 **License**
Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

## ⭐ **Support the Project!**
If you like **SkyMap**, consider **starring** the repo! ⭐
👉 [GitHub: skewb1k/skymap](https://github.com/skewb1k/skymap)

### 🔭 **Enjoy exploring the stars!** 🚀✨

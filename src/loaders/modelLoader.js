import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

let gltfLoaderInstance = null;

export function getBaseUrl() {
  const base = import.meta.env.BASE_URL || './';
  return base.endsWith('/') ? base : `${base}/`;
}

export function getGLTFLoader() {
  if (!gltfLoaderInstance) {
    const dracoLoader = new DRACOLoader();
    const base = getBaseUrl();
    dracoLoader.setDecoderPath(`${base}draco/gltf/`);

    gltfLoaderInstance = new GLTFLoader();
    gltfLoaderInstance.setDRACOLoader(dracoLoader);
  }
  return gltfLoaderInstance;
}

export function loadGLTF(url) {
  const loader = getGLTFLoader();
  const base = getBaseUrl();
  // Strip leading slash if present, and resolve with BASE_URL
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  const resolvedUrl = (url.startsWith('http://') || url.startsWith('https://'))
    ? url
    : `${base}${cleanUrl}`;

  return new Promise((resolve, reject) => {
    loader.load(
      resolvedUrl,
      resolve,
      undefined,
      (err) => {
        console.error(`Failed to load 3D model from ${resolvedUrl}:`, err);
        reject(err);
      }
    );
  });
}

import { installCssZoomGeometry } from '../utils/browserGeometry';

export default defineNuxtPlugin({
  name: 'browser-geometry',
  enforce: 'pre',
  setup() {
    installCssZoomGeometry();
  },
});

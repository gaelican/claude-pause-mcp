import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Import Shoelace styles
import '@shoelace-style/shoelace/dist/themes/dark.css';
// Import Shoelace components
import '@shoelace-style/shoelace/dist/shoelace.js';

// Set base path for Shoelace assets
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path';
setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.20.1/cdn/');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
);
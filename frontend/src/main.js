import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App    from './App.vue';
import router from './router';
import './assets/main.css'; // Tailwind + custom utilities

const app = createApp(App);

app.use(createPinia()); // state management (auth, curriculum, notification)
app.use(router);        // Vue Router พร้อม navigation guard

app.mount('#app');


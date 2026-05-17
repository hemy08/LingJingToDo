import { createApp } from "vue";
import App from "./App.vue";
import { pinia } from "./stores";

const app = createApp(App);

// 使用 Pinia 状态管理
app.use(pinia);

app.mount("#app");

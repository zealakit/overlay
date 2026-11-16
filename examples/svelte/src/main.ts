import { mount } from "svelte";
import App from "./app.svelte";
import "./styles.css";
import "./popover-examples.css";
import "./tooltip-examples.css";
import "./dialog-examples.css";
import "./context-menu-examples.css";
import "./arrow-animation-examples.css";

const target = document.getElementById("app");
if (!target) {
  throw new Error("Target element #app not found");
}

const app = mount(App, { target });

export default app;

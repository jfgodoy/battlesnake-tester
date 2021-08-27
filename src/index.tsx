import { render } from "solid-js/web";

import "./index.pcss";
import App from "./App";

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}

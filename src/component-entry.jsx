import React from "react";
import ReactDOM from "react-dom/client";
import ConceptMap from "./ConceptMap";

class ConceptMapElement extends HTMLElement {
  connectedCallback() {
    const mountPoint = document.createElement("div");
    mountPoint.style.width = "100%";
    mountPoint.style.height = "400px";
    this.appendChild(mountPoint);

    const root = ReactDOM.createRoot(mountPoint);
    root.render(
    <ConceptMap />);
  }
}

if (!customElements.get("concept-map")) {
  customElements.define("concept-map", ConceptMapElement);
}

export default ConceptMapElement;

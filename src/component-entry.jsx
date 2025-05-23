import React from "react";
import ReactDOM from "react-dom/client";
import ConceptMap from "./ConceptMap";

class ConceptMapElement extends HTMLElement {
  connectedCallback() {
    this.addEventListener("concept-map:hydrate", this.handleHydration);
    const mountPoint = document.createElement("div");
    this.appendChild(mountPoint);
    const root = ReactDOM.createRoot(mountPoint);
    root.render(<ConceptMap />);
  }

  disconnectedCallback() {
    // Cleanup
    this.removeEventListener("concept-map:hydrate", this.handleHydration);
  }

  handleHydration = (event) => {
    const payload = event.detail;

    // Best practice: validazione base
    if (typeof payload !== "object" || payload === null) return;

    // Setta data attributes
    Object.keys(payload).forEach((key) => {
      this.dataset[key] = payload[key];
    });

    console.debug("ConceptMap: received payload", payload);

    // Facoltativo: notifica il React component
    this.dispatchEvent(
      new CustomEvent("concept-map:updated", { detail: payload })
    );
  };
}

if (!customElements.get("concept-map")) {
  customElements.define("concept-map", ConceptMapElement);
}

export default ConceptMapElement;

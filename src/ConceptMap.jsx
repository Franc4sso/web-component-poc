import { useEffect, useState } from "react";

export default function ConceptMap() {
  const [topic, setTopic] = useState(null);

  useEffect(() => {
    const el = document.querySelector("concept-map");
    if (el?.dataset?.topic) {
      setTopic(el.dataset.topic);
    }

    const updateHandler = (e) => {
      if (e.detail.topic) setTopic(e.detail.topic);
    };

    el?.addEventListener("concept-map:updated", updateHandler);

    return () => {
      el?.removeEventListener("concept-map:updated", updateHandler);
    };
  }, []);

  return <div>Mappa concettuale per: {topic}</div>;
}

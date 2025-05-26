import { useEffect, useState } from "react";

export default function ConceptMap() {
  const [timestamp, setTimestamp] = useState(null);

  useEffect(() => {
    const el = document.querySelector("concept-map");
    if (el?.dataset?.timestamp) {
      setTimestamp(el.dataset.timestamp);
    }

    const updateHandler = (e) => {
      if (e.detail.timestamp) setTimestamp(e.detail.timestamp);
    };

    el?.addEventListener("concept-map:updated", updateHandler);

    return () => {
      el?.removeEventListener("concept-map:updated", updateHandler);
    };
  }, []);

  return <div>Timestamp della lezione: {timestamp}</div>;
}

import React, { useEffect, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";

export default function ConceptMap() {
  const [topic, setTopic] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const defaultNodes = [
    {
      id: "1",
      data: { label: "Concetto centrale" },
      position: { x: 150, y: 100 },
    },
  ];
  const defaultEdges = [];

  const [nodes, setNodes] = useState(defaultNodes);
  const [edges, setEdges] = useState(defaultEdges);

  useEffect(() => {
    const el = document.querySelector("concept-map");

    const hydrateHandler = (e) => {
      const { topic, timestamp } = e.detail;
      setTopic(topic || null);

      if (topic) {
        setNodes([
          {
            id: "1",
            data: { label: topic },
            position: { x: 150, y: 100 },
          },
        ]);
        setEdges([]);
      }
    };

    const openEditorHandler = () => {
      setShowEditor(true);
    };

    el?.addEventListener("concept-map:hydrate", hydrateHandler);
    el?.addEventListener("concept-map:openEditor", openEditorHandler);

    return () => {
      el?.removeEventListener("concept-map:hydrate", hydrateHandler);
      el?.removeEventListener("concept-map:openEditor", openEditorHandler);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {showEditor ? (
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      ) : (
        <p style={{ padding: "1rem", color: "#ccc", fontStyle: "italic" }}>
          Clicca il bottone esterno per aprire l'editor.
        </p>
      )}
    </div>
  );
}

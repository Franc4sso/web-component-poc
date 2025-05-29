import React, { useEffect, useState, useRef } from "react";
import * as d3 from "d3";
import html2canvas from "html2canvas";
import jsPDF from "jspdf"; 

const ConceptMap = () => {
  const [showEditor, setShowEditor] = useState(false);

  const svgRef = useRef();
  const wrapperRef = useRef();
  const [nodes, setNodes] = useState([
    { id: "1", label: "Concetto iniziale", fx: null, fy: null },
  ]);
  const [links, setLinks] = useState([]);
  const [selectedParent, setSelectedParent] = useState("1");

  const addNode = () => {
    const newId = `${nodes.length + 1}`;
    const parentNode = nodes.find((n) => n.id === selectedParent);
    const offsetX = 100 + Math.random() * 50;
    const offsetY = 100 + Math.random() * 50;
    const newNode = {
      id: newId,
      label: `Nodo ${newId}`,
      x: parentNode?.x + offsetX || 300,
      y: parentNode?.y + offsetY || 300,
      fx: parentNode?.x + offsetX || 300,
      fy: parentNode?.y + offsetY || 300,
    };
    setNodes((prev) => [...prev, newNode]);
    setLinks((prev) => [...prev, { source: selectedParent, target: newId }]);
  };

  useEffect(() => {
    const el = document.querySelector("concept-map");
    const openEditorHandler = () => setShowEditor(true);
    el?.addEventListener("concept-map:openEditor", openEditorHandler);
    return () =>
      el?.removeEventListener("concept-map:openEditor", openEditorHandler);
  }, []);

  const deleteNode = (nodeId) => {
    setLinks((prevLinks) => {
      const updatedLinks = prevLinks.filter(
        (l) =>
          (l.source.id ?? l.source) !== nodeId &&
          (l.target.id ?? l.target) !== nodeId
      );
      return updatedLinks;
    });

    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.filter((n) => n.id !== nodeId);
      if (!updatedNodes.some((n) => n.id === selectedParent)) {
        setSelectedParent(updatedNodes.length > 0 ? updatedNodes[0].id : "");
      }
      return updatedNodes;
    });
  };

  const exportAsPDF = () => {
    const container = document.getElementById("svg-export-container");

    html2canvas(container, {
      backgroundColor: "#f8fafc",
      useCORS: true,
      scale: 2,
    })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height],
        });
        pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
        pdf.save("mappa-concettuale.pdf");
      })
      .catch((err) => {
        console.error("Errore esportazione PDF:", err);
      });
  };

  useEffect(() => {
    if (!showEditor) return;

    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight - 120;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Definisci gradients e filtri per effetti moderni
    const defs = svg.append("defs");

    // Gradient per i rettangoli
    const nodeGradient = defs
      .append("linearGradient")
      .attr("id", "nodeGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");
    nodeGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#667eea");
    nodeGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#764ba2");

    // Gradient per i collegamenti
    const linkGradient = defs
      .append("linearGradient")
      .attr("id", "linkGradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "100%");
    linkGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#a8edea")
      .attr("stop-opacity", "0.8");
    linkGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#fed6e3")
      .attr("stop-opacity", "0.6");

    // Filtro glow
    const glowFilter = defs.append("filter").attr("id", "glow");
    glowFilter
      .append("feGaussianBlur")
      .attr("stdDeviation", "4")
      .attr("result", "coloredBlur");
    const feMerge = glowFilter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const zoomGroup = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([0.3, 2])
      .on("zoom", (event) => zoomGroup.attr("transform", event.transform));

    svg.call(zoom);

    const simulation = d3
      .forceSimulation()
      .nodes(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(200)
      )
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .alpha(1)
      .restart();

    // Collegamenti con stile moderno
    const link = zoomGroup
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "url(#linkGradient)")
      .attr("stroke-width", 3)
      .attr("stroke-linecap", "round")
      .style("filter", "drop-shadow(0px 2px 4px rgba(0,0,0,0.1))")
      .style("opacity", 0.8);

    const nodeGroup = zoomGroup
      .append("g")
      .selectAll("g")
      .data(nodes, (d) => d.id)
      .join("g")
      .style("cursor", "grab")
      .call(drag(simulation));

    // Calcola dimensioni dinamiche per i rettangoli
    const getNodeDimensions = (d) => ({
      width: Math.max(120, d.label.length * 12),
      height: 50
    });

    // Rettangolo principale del nodo con effetti moderni
    nodeGroup
      .append("rect")
      .attr("width", (d) => getNodeDimensions(d).width)
      .attr("height", (d) => getNodeDimensions(d).height)
      .attr("x", (d) => -getNodeDimensions(d).width / 2)
      .attr("y", (d) => -getNodeDimensions(d).height / 2)
      .attr("rx", 15)
      .attr("ry", 15)
      .attr("fill", "url(#nodeGradient)")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 3)
      .style(
        "filter",
        "url(#glow) drop-shadow(0px 4px 12px rgba(102, 126, 234, 0.3))"
      )
      .style("transition", "all 0.3s ease");

    // Rettangolo interno per effetto glassmorphism
    nodeGroup
      .append("rect")
      .attr("width", (d) => getNodeDimensions(d).width - 8)
      .attr("height", (d) => getNodeDimensions(d).height - 8)
      .attr("x", (d) => -(getNodeDimensions(d).width - 8) / 2)
      .attr("y", (d) => -(getNodeDimensions(d).height - 8) / 2)
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", "rgba(255, 255, 255, 0.1)")
      .attr("stroke", "rgba(255, 255, 255, 0.2)")
      .attr("stroke-width", 1);

    // Input per il testo del nodo
    nodeGroup
      .append("foreignObject")
      .attr("x", (d) => -getNodeDimensions(d).width / 2 + 10)
      .attr("y", (d) => -getNodeDimensions(d).height / 2 + 10)
      .attr("width", (d) => getNodeDimensions(d).width - 20)
      .attr("height", (d) => getNodeDimensions(d).height - 20)
      .append("xhtml:input")
      .attr("value", (d) => d.label)
      .style("width", "100%")
      .style("height", "100%")
      .style("text-align", "center")
      .style("border", "none")
      .style("background", "transparent")
      .style("color", "white")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style(
        "font-family",
        "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
      )
      .style("text-shadow", "0px 1px 3px rgba(0,0,0,0.5)")
      .style("outline", "none")
      .style("caret-color", "white")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .on("input", function (event, d) {
        d.label = this.value;
        const dimensions = getNodeDimensions(d);
        
        // Aggiorna le dimensioni dei rettangoli
        const nodeSelection = d3.select(this.parentNode.parentNode);
        nodeSelection.selectAll("rect")
          .attr("width", (_, i) => i === 0 ? dimensions.width : dimensions.width - 8)
          .attr("x", (_, i) => i === 0 ? -dimensions.width / 2 : -(dimensions.width - 8) / 2);
        
        // Aggiorna la posizione del foreignObject
        d3.select(this.parentNode)
          .attr("x", -dimensions.width / 2 + 10)
          .attr("width", dimensions.width - 20);
      });

    // Pulsante di eliminazione moderno
    nodeGroup
      .append("foreignObject")
      .attr("x", (d) => getNodeDimensions(d).width / 2 - 16)
      .attr("y", (d) => -getNodeDimensions(d).height / 2 - 8)
      .attr("width", 24)
      .attr("height", 24)
      .append("xhtml:button")
      .text("×")
      .style("cursor", "pointer")
      .style("width", "24px")
      .style("height", "24px")
      .style("background", "linear-gradient(135deg, #ff6b6b, #ee5a5a)")
      .style("color", "white")
      .style("border", "none")
      .style("border-radius", "50%")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("line-height", "1")
      .style("padding", "0")
      .style("box-shadow", "0px 2px 8px rgba(238, 90, 90, 0.4)")
      .style("transition", "all 0.2s ease")
      .style("opacity", "0.8")
      .on("mouseenter", function () {
        d3.select(this)
          .style("opacity", "1")
          .style("transform", "scale(1.1)")
          .style("box-shadow", "0px 4px 12px rgba(238, 90, 90, 0.6)");
      })
      .on("mouseleave", function () {
        d3.select(this)
          .style("opacity", "0.8")
          .style("transform", "scale(1)")
          .style("box-shadow", "0px 2px 8px rgba(238, 90, 90, 0.4)");
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        deleteNode(d.id);
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    function drag(simulation) {
      return d3
        .drag()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
          d3.select(event.sourceEvent.target.parentNode).style(
            "cursor",
            "grabbing"
          );
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = d.x;
          d.fy = d.y;
          d3.select(event.sourceEvent.target.parentNode).style(
            "cursor",
            "grab"
          );
        });
    }
  }, [showEditor, nodes, links]);

  if(!showEditor) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "50%",
        height: "50vh",
        padding: "1rem",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {showEditor && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                padding: "1rem 1.5rem",
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              <label
                style={{
                  fontWeight: "600",
                  color: "white",
                  fontSize: "14px",
                  textShadow: "0px 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                Collega a:
              </label>
              <select
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                style={{
                  padding: "0.75rem",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  background: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                  fontSize: "14px",
                  fontWeight: "500",
                  minWidth: "150px",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.label}
                  </option>
                ))}
              </select>
              <button
                onClick={addNode}
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "600",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0rem",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px rgba(16, 185, 129, 0.6)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 16px rgba(16, 185, 129, 0.4)";
                }}
              >
                <span style={{ fontSize: "16px" }}>+</span>
                Aggiungi Nodo
              </button>
            </div>
            <button
              onClick={exportAsPDF}
              style={{
                padding: "0.75rem 1.5rem",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(59, 130, 246, 0.4)",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.6)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 16px rgba(59, 130, 246, 0.4)";
              }}
            >
              📄 Esporta PDF
            </button>
          </div>
          <div id="svg-export-container" style={{ flexGrow: 1, width: "100%" }}>
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              style={{
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "20px",
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ConceptMap;
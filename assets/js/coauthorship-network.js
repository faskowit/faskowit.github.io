(() => {
  const container = document.querySelector("#coauthorship-network");
  const dataElement = document.querySelector("#coauthorship-data");
  if (!container || !dataElement || !window.d3) return;

  const data = JSON.parse(dataElement.textContent);
  const displayNames = JSON.parse(container.dataset.displayNames || "{}");
  data.nodes.forEach((node) => {
    node.name = displayNames[node.id] || node.name;
  });
  const configuredLabelCount = Number(container.dataset.labelCount);
  const labelCount = Number.isFinite(configuredLabelCount) ? Math.max(0, configuredLabelCount) : 15;
  const slider = document.querySelector("#minimum-shared-papers");
  const output = document.querySelector("#minimum-output");
  const summary = document.querySelector("#network-summary");
  const details = document.querySelector("#network-details");
  const resetButton = document.querySelector("#reset-network");
  const maxWeight = Math.max(1, ...data.links.map((link) => link.weight));
  slider.max = String(maxWeight);
  let selectedId = null;
  let simulation;

  const render = () => {
    const threshold = Number(slider.value);
    output.value = threshold;
    const links = data.links.filter((link) => link.weight >= threshold);
    const activeIds = new Set(links.flatMap((link) => [link.source, link.target]));
    const nodes = data.nodes.filter((node) => activeIds.has(node.id)).map((node) => ({ ...node }));
    const activeLinks = links.map((link) => ({ ...link }));
    const width = Math.max(320, container.clientWidth);
    const height = Math.max(500, Math.min(760, width * 0.72));
    const color = d3.scaleSequential(d3.interpolateTurbo).domain([1, Math.max(2, ...nodes.map((node) => node.publication_count))]);
    const radius = d3
      .scaleSqrt()
      .domain([1, Math.max(1, ...nodes.map((node) => node.publication_count))])
      .range([5, 22]);

    container.replaceChildren();
    if (!nodes.length) {
      summary.textContent = "No collaborations match this threshold.";
      details.textContent = "Lower the shared-paper threshold to reveal the network.";
      return;
    }
    summary.textContent = `${nodes.length} authors and ${activeLinks.length} collaborations shown from ${data.paper_count} bibliography entries.`;
    const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
    const labelNodes = [...nodes]
      .sort((first, second) => second.publication_count - first.publication_count)
      .slice(0, labelCount);
    const linksSelection = svg
      .append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.18)
      .selectAll("line")
      .data(activeLinks)
      .join("line")
      .attr("stroke-width", (link) => 0.7 + Math.sqrt(link.weight));
    const nodesSelection = svg
      .append("g")
      .selectAll("circle")
      .data(nodes, (node) => node.id)
      .join("circle")
      .attr("r", (node) => radius(node.publication_count))
      .attr("fill", (node) => color(node.publication_count))
      .attr("stroke", "var(--global-bg-color)")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer");
    const labelsSelection = svg
      .append("g")
      .attr("class", "coauthor-labels")
      .selectAll("text")
      .data(labelNodes, (node) => node.id)
      .join("text")
      .text((node) => node.name);
    const selectedLabel = svg.append("g").attr("class", "coauthor-selected-label").append("text");

    const showDetails = (node) => {
      selectedId = node.id;
      selectedLabel
        .text(node.name)
        .attr("display", labelNodes.some((labelNode) => labelNode.id === node.id) ? "none" : null);
      const related = activeLinks.filter((link) => link.source.id === node.id || link.target.id === node.id);
      const papers = related.flatMap((link) => link.papers).filter((paper, index, all) => all.findIndex((item) => item.key === paper.key) === index);
      details.replaceChildren();
      const heading = document.createElement("strong");
      heading.textContent = `${node.name} — ${node.publication_count} papers in this bibliography`;
      details.append(heading);
      const list = document.createElement("ul");
      papers
        .sort((a, b) => b.year.localeCompare(a.year))
        .forEach((paper) => {
          const item = document.createElement("li");
          item.textContent = `${paper.year || "n.d."}: ${paper.title || paper.key}`;
          list.append(item);
        });
      details.append(list);
      nodesSelection.attr("opacity", (candidate) =>
        candidate.id === node.id || related.some((link) => link.source.id === candidate.id || link.target.id === candidate.id) ? 1 : 0.2
      );
      linksSelection.attr("stroke-opacity", (link) => (link.source.id === node.id || link.target.id === node.id ? 0.75 : 0.04));
    };

    nodesSelection.on("click", (_, node) => showDetails(node));
    simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(activeLinks)
          .id((node) => node.id)
          .distance((link) => 115 - Math.min(60, link.weight * 8))
          .strength(0.25)
      )
      .force("charge", d3.forceManyBody().strength(-130))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((node) => radius(node.publication_count) + 3)
      )
      .on("tick", () => {
        linksSelection
          .attr("x1", (link) => link.source.x)
          .attr("y1", (link) => link.source.y)
          .attr("x2", (link) => link.target.x)
          .attr("y2", (link) => link.target.y);
        nodesSelection.attr("cx", (node) => node.x).attr("cy", (node) => node.y);
        labelsSelection
          .attr("x", (node) => node.x)
          .attr("y", (node) => node.y - radius(node.publication_count) - 7);
        const selectedNode = nodes.find((node) => node.id === selectedId);
        if (selectedNode) {
          selectedLabel
            .attr("x", selectedNode.x)
            .attr("y", selectedNode.y - radius(selectedNode.publication_count) - 9);
        }
      });
    nodesSelection.call(
      d3
        .drag()
        .on("start", (event, node) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          node.fx = node.x;
          node.fy = node.y;
        })
        .on("drag", (event, node) => {
          node.fx = event.x;
          node.fy = event.y;
        })
        .on("end", (event, node) => {
          if (!event.active) simulation.alphaTarget(0);
          node.fx = null;
          node.fy = null;
        })
    );
    const selected = nodes.find((node) => node.id === selectedId);
    if (selected) showDetails(selected);
    else details.textContent = "Select an author to see shared papers.";
  };

  slider.addEventListener("input", () => {
    selectedId = null;
    if (simulation) simulation.stop();
    render();
  });
  resetButton.addEventListener("click", () => {
    selectedId = null;
    slider.value = "2";
    if (simulation) simulation.stop();
    render();
  });
  render();
})();

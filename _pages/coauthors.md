---
layout: page
permalink: /coauthors/
title: co-authorship network
description: an interactive map of collaborations across my publications.
nav: true
nav_order: 2.5
---

<p>
  Each circle is an author in <a href="{{ '/publications/' | relative_url }}">my bibliography</a>;
  a line means we have co-authored at least one paper. Circle size reflects publication count (relative to my co-authorship network) and
  line width reflects the number of papers shared. Drag circles to explore, hover for details, and
  select a circle to focus on that collaboration neighborhood.
</p>

<div class="coauthor-controls" aria-label="Co-authorship network controls">
  <label for="minimum-shared-papers">Show collaborations with at least <output id="minimum-output">2</output> shared papers</label>
  <input id="minimum-shared-papers" type="range" min="1" max="10" value="2" />
  <button id="reset-network" type="button">Reset view</button>
</div>

<p id="network-summary" class="coauthor-summary"></p>
<div
  id="coauthorship-network"
  class="coauthor-network"
  role="img"
  aria-label="Interactive co-authorship network"
  data-label-count="{{ site.coauthorship_network.label_count | default: 15 }}"
  data-display-names='{{ site.coauthorship_network.display_names | jsonify }}'
></div>
<div id="network-details" class="coauthor-details" aria-live="polite">Select an author to see shared papers.</div>
<p class="coauthor-credit">
  Network visualization inspired by <a href="https://canlab.science/network.html">CANlab</a>.
</p>

<script id="coauthorship-data" type="application/json">{{ site.data.coauthorship_network | jsonify }}</script>
<script
  src="https://cdn.jsdelivr.net/npm/d3@{{ site.third_party_libraries.d3.version }}/dist/d3.min.js"
  integrity="{{ site.third_party_libraries.d3.integrity.js }}"
  crossorigin="anonymous"
></script>
<script src="{{ '/assets/js/coauthorship-network.js' | relative_url }}"></script>
<link rel="stylesheet" href="{{ '/assets/css/coauthorship-network.css' | relative_url }}" />

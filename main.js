d3.json("data/annual_temp.json").then(data => {
  data.forEach(d => {
    d.year = +d.year;
    d.tas_K = +d.tas_K;
    d.anomaly_K = +d.anomaly_K;
  });

  const svg = d3.select("#chart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const margin = { top: 50, right: 60, bottom: 60, left: 80 };

  /* === 1️⃣ 定义比例尺 === */
  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.year))
    .range([margin.left, width - margin.right]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, d => d.tas_K) - 0.3,
      d3.max(data, d => d.tas_K) + 0.3
    ])
    .range([height - margin.bottom, margin.top]);

  /* === 2️⃣ 背景网格线 === */
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(
      d3.axisBottom(x)
        .tickSize(-height + margin.top + margin.bottom)
        .tickFormat("")
    )
    .selectAll("line")
    .attr("stroke", "#e5e5e5")
    .attr("stroke-opacity", 0.7);

  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(${margin.left},0)`)
    .call(
      d3.axisLeft(y)
        .tickSize(-width + margin.left + margin.right)
        .tickFormat("")
    )
    .selectAll("line")
    .attr("stroke", "#e5e5e5")
    .attr("stroke-opacity", 0.7);

  /* === 3️⃣ 渐变定义 === */
  const defs = svg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "lineGradient")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");
  gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4facfe");
  gradient.append("stop").attr("offset", "100%").attr("stop-color", "#00f2fe");

  /* === 4️⃣ 绘制主折线 === */
  const line = d3.line()
    .x(d => x(d.year))
    .y(d => y(d.tas_K))
    .curve(d3.curveMonotoneX);

  const path = svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "url(#lineGradient)")
    .attr("stroke-width", 3)
    .attr("d", line)
    .style("filter", "drop-shadow(0 2px 3px rgba(0,0,0,0.15))");

  /* === 5️⃣ 添加图例（右上角） === */
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 150}, ${margin.top - 25})`);

  legend.append("rect")
    .attr("x", 0)
    .attr("y", -10)
    .attr("width", 15)
    .attr("height", 3)
    .attr("rx", 2)
    .attr("fill", "url(#lineGradient)");

  legend.append("text")
    .attr("x", 25)
    .attr("y", 0)
    .text("Yearly Average")
    .attr("fill", "#333")
    .attr("font-size", "14px")
    .attr("font-weight", "600");

  /* === 6️⃣ 坐标轴 === */
  svg.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")))
    .style("font-size", "13px");

  svg.append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3.axisLeft(y))
    .style("font-size", "13px");

  /* === 7️⃣ Tooltip & circle === */
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  const circle = svg.append("circle")
    .attr("r", 6)
    .attr("fill", "#0077b6")
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .style("opacity", 0);

  /* === 8️⃣ 滑块 & 年份标签 === */
  const slider = d3.select("#yearSlider");
  const yearLabel = d3.select("#yearLabel");
  const years = data.map(d => d.year);
  slider.attr("min", d3.min(years))
        .attr("max", d3.max(years))
        .property("value", d3.min(years));
  yearLabel.text(d3.min(years));

  /* === 9️⃣ 动态文字显示 === */
  const statusText = d3.select("body")
    .append("div")
    .style("font-size", "16px")
    .style("color", "#444")
    .style("margin-bottom", "30px");

  /* === 🔟 更新函数 === */
  function update(year) {
    const closest = data.reduce((a, b) =>
      Math.abs(b.year - year) < Math.abs(a.year - year) ? b : a
    );

    // 平滑移动圆点
    circle.transition()
      .duration(300)
      .ease(d3.easeCubicOut)
      .style("opacity", 1)
      .attr("cx", x(closest.year))
      .attr("cy", y(closest.tas_K));

    // 更新 tooltip
    tooltip
      .style("opacity", 1)
      .style("left", `${x(closest.year) + 80}px`)
      .style("top", `${y(closest.tas_K) + 80}px`)
      .html(`<b>${closest.year}</b><br>${closest.tas_K.toFixed(2)} K`);

    // 更新状态文字
    const base = data.find(d => d.year === 2015).tas_K;
    const diff = closest.tas_K - base;
    const sign = diff >= 0 ? "+" : "";
    statusText.html(
      `Global temperature in <b>${closest.year}</b> was 
       <b>${closest.tas_K.toFixed(2)} K</b> 
       (${sign}${diff.toFixed(2)} K vs. 2015)`
    );

    yearLabel.text(closest.year);
  }

  // 初始状态
  update(+slider.property("value"));

  // 滑块交互
  slider.on("input", function() {
    const year = +this.value;
    update(year);
  });

  // 鼠标离开时隐藏 tooltip
  svg.on("mouseleave", () => {
    tooltip.style("opacity", 0);
    circle.style("opacity", 0);
  });
});

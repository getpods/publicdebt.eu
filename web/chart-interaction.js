/* Shared keyboard, pointer and screen-reader navigation for chart timelines. */
(() => {
  let nextId = 0;
  let active = null;
  const watchedCharts = new WeakMap();

  window.watchChartResize = (container, render) => {
    const existing = watchedCharts.get(container);
    if (existing) {
      existing.render = render;
      return;
    }
    const state = { width: container.clientWidth, render };
    const observer = new ResizeObserver(() => {
      const width = container.clientWidth;
      if (width > 0 && width !== state.width) {
        state.width = width;
        state.render();
      }
    });
    watchedCharts.set(container, state);
    observer.observe(container);
  };

  // Hover details must also be dismissible without moving the pointer.
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !event.defaultPrevented && active?.control.isConnected) {
      active.dismiss();
    }
  });

  window.createChartInteraction = ({ container, svg, tooltip, language, hide, cancelHide, detailRows = 1 }) => {
    const control = document.createElement("div");
    control.className = "chart-timeline";
    control.appendChild(svg);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const details = document.createElement("div");
    details.className = "chart-details";
    const prompt = document.createElement("p");
    prompt.className = "chart-details-prompt";
    prompt.textContent = language === "en"
      ? "Tap or drag to select a period."
      : "Klepněte nebo táhněte prstem v grafu.";
    tooltip.style.setProperty("--chart-details-rows", detailRows);
    details.append(tooltip, prompt);
    const entries = [];
    let index = 0;
    const isFocused = () => document.activeElement === control;
    const heading = container.closest("section")?.querySelector("h2");
    const instructions = document.createElement("span");
    instructions.id = `chart-instructions-${++nextId}`;
    instructions.className = "chart-sr-only";
    instructions.textContent = language === "en"
      ? "Use arrow keys to select a period, Home and End for the first and last period, Escape to hide details. You can also tap or drag across the chart to select a period."
      : "Šipkami vyberete období, Home a End přejdou na první a poslední období, Escape skryje podrobnosti. Období můžete vybrat také klepnutím nebo vodorovným tažením prstu po grafu.";
    container.appendChild(instructions);

    control.setAttribute("tabindex", "0");
    control.setAttribute("role", "slider");
    control.setAttribute("aria-orientation", "horizontal");
    control.setAttribute("aria-label", heading?.textContent.trim() || (language === "en" ? "Chart timeline" : "Časová osa grafu"));
    control.setAttribute("aria-describedby", instructions.id);
    control.setAttribute("aria-valuemin", "1");
    tooltip.setAttribute("aria-hidden", "true");

    function updateValue() {
      control.setAttribute("aria-valuemax", String(entries.length));
      control.setAttribute("aria-valuenow", String(index + 1));
      control.setAttribute("aria-valuetext", entries[index].label());
    }

    function select(nextIndex) {
      const next = Math.max(0, Math.min(entries.length - 1, nextIndex));
      if (next === index && !tooltip.hidden) {
        cancelHide();
        active = { control, dismiss };
        return;
      }
      index = next;
      updateValue();
      entries[index].show();
      active = { control, dismiss };
      if (getComputedStyle(tooltip).position === "absolute") {
        const plot = svg.getBoundingClientRect();
        const bounds = container.getBoundingClientRect();
        const anchor = entries[index].anchor();
        const x = plot.left - bounds.left + anchor.x * plot.width;
        const halfWidth = tooltip.offsetWidth / 2;
        const left = Math.max(halfWidth + 8, Math.min(x, container.clientWidth - halfWidth - 8));
        tooltip.style.left = `${left}px`;
        tooltip.style.top = tooltip.classList.contains("chart-comparison-details") ? "20px" : "40px";
      }
    }

    function dismiss() {
      cancelHide();
      hide();
      if (active?.control === control) active = null;
    }

    let gesture = null;
    let suppressedClick = null;

    function endGesture() {
      const previous = gesture;
      gesture = null;
      if (previous && control.hasPointerCapture(previous.id)) {
        control.releasePointerCapture(previous.id);
      }
    }

    function selectAt(clientX) {
      const rect = svg.getBoundingClientRect();
      const position = (clientX - rect.left) / rect.width;
      // Find the closest observation, including unevenly spaced periods.
      let low = 0;
      let high = entries.length - 1;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (entries[middle].anchor().x < position) low = middle + 1;
        else high = middle;
      }
      if (low > 0 && position - entries[low - 1].anchor().x < entries[low].anchor().x - position) low -= 1;
      select(low);
    }

    control.addEventListener("pointerdown", event => {
      control.dataset.pointerFocus = "true";
      if (event.pointerType === "mouse") return;
      if (!event.isPrimary) {
        // Let the browser take over a second finger for pinch zoom.
        endGesture();
        return;
      }
      if (!event.target.closest(".chart-hit-zone")) return;
      suppressedClick = null;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, axis: null };
    });

    control.addEventListener("pointermove", event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      if (!gesture.axis) {
        const dx = Math.abs(event.clientX - gesture.x);
        const dy = Math.abs(event.clientY - gesture.y);
        if (Math.max(dx, dy) < 6) return;
        if (dy > dx * 1.2) gesture.axis = "vertical";
        else if (dx > dy * 1.2) {
          gesture.axis = "horizontal";
          control.setPointerCapture(event.pointerId);
        } else return;
      }
      if (gesture.axis === "horizontal") {
        selectAt(event.clientX);
        control.focus({ preventScroll: true });
      }
    });

    control.addEventListener("pointerup", event => {
      if (!gesture || event.pointerId !== gesture.id) return;
      if (gesture.axis !== "vertical") {
        // Handle taps here too: some browsers delay compatibility clicks after a drag.
        selectAt(event.clientX);
        control.focus({ preventScroll: true });
        // A compatibility click must not reset the selection to the starting period.
        suppressedClick = { id: event.pointerId, until: performance.now() + 500 };
      }
      endGesture();
    });
    control.addEventListener("pointercancel", event => {
      if (event.pointerId === gesture?.id) endGesture();
    });
    control.addEventListener("lostpointercapture", event => {
      if (event.target === control && event.pointerId === gesture?.id) endGesture();
    });
    control.addEventListener("click", event => {
      if (event.pointerId === suppressedClick?.id && performance.now() < suppressedClick.until) {
        suppressedClick = null;
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);

    control.addEventListener("focus", () => select(index));
    control.addEventListener("blur", () => {
      delete control.dataset.pointerFocus;
      dismiss();
    });
    control.addEventListener("keydown", event => {
      delete control.dataset.pointerFocus;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const next = {
        ArrowLeft: index - 1,
        ArrowDown: index - 1,
        ArrowRight: index + 1,
        ArrowUp: index + 1,
        Home: 0,
        End: entries.length - 1
      }[event.key];
      if (next !== undefined) {
        event.preventDefault();
        select(next);
      } else if (event.key === "Escape") {
        event.preventDefault();
        dismiss();
      }
    });

    return {
      control,
      details,
      isFocused,
      finish() {
        // Populate the hidden template so the details panel reserves its full size.
        entries[index].show();
        hide();
      },
      register(hitArea, show, label, anchor) {
        const entryIndex = entries.length;
        entries.push({ show, label, anchor });
        // Start at the latest period and keep one Tab stop per chart.
        index = entryIndex;
        updateValue();
        hitArea.addEventListener("mouseenter", () => select(entryIndex));
        hitArea.addEventListener("mousemove", () => select(entryIndex));
        hitArea.addEventListener("click", () => {
          select(entryIndex);
          control.focus({ preventScroll: true });
        });
      }
    };
  };
})();

/* WELAND International: photographs fade in once loaded; the conferences menu; the contents row shows when there is more;
   contents highlight. */
(function () {
  "use strict";

  // Photographs fade in once loaded. The fade is only on while .js is set, so without JS every image shows.
  // Images already loaded are marked in the same step, so they never flash.
  document.documentElement.classList.add("js");
  document.querySelectorAll(".wide, .three img, .editions img").forEach(function (img) {
    var show = function () { img.classList.add("loaded"); };
    if (img.complete) show();
    else { img.addEventListener("load", show); img.addEventListener("error", show); }
  });

  // The conferences menu is a <details>: it opens and closes by itself on click, Enter and Space.
  // Here: open while a mouse is over it; arrow keys, Home and End move between the items; close on Escape (focus back on
  // the summary), on a click elsewhere, on choosing an item and when focus leaves it. aria-expanded follows the state.
  document.querySelectorAll("details.menu").forEach(function (menu) {
    var summary = menu.querySelector("summary");
    var byHover = false;  // opened by the pointer arriving, not by a click
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      // open when a mouse arrives (mouseenter as well: some browsers report a trackpad oddly); close 160ms after it
      // leaves the menu and its panel, so a pointer that strays briefly, or crosses a gap, does not lose it
      var timer = null;
      var arrive = function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        clearTimeout(timer);
        if (!menu.open) { menu.open = true; byHover = true; }
      };
      var leave = function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        clearTimeout(timer);
        timer = setTimeout(function () { if (byHover) { menu.open = false; byHover = false; } }, 160);
      };
      menu.addEventListener("pointerenter", arrive);
      menu.addEventListener("mouseenter", arrive);
      menu.addEventListener("pointerleave", leave);
      menu.addEventListener("mouseleave", leave);
    }
    // keyboard focus on the summary opens the panel too (focus-visible only, so a mouse click is not doubled)
    // Escape puts focus back on the summary (and Chrome may blur and refocus it as the panel closes): for a moment after
    // Escape, focus arriving on the summary must not reopen the panel
    var quiet = false;
    summary.addEventListener("focusin", function () {
      if (!quiet && summary.matches(":focus-visible") && !menu.open) { menu.open = true; byHover = true; }
    });
    // a click on the summary of a menu the pointer has just opened keeps it open (pins it) instead of closing it
    summary.addEventListener("click", function (e) {
      if (byHover) { e.preventDefault(); byHover = false; }
    });
    var items = function () { return Array.prototype.slice.call(menu.querySelectorAll("ul a")); };
    menu.addEventListener("toggle", function () {
      summary.setAttribute("aria-expanded", menu.open ? "true" : "false");
      if (!menu.open) byHover = false;
    });
    menu.addEventListener("keydown", function (e) {
      var list = items(), k = list.indexOf(document.activeElement), to = null;
      if (e.key === "ArrowDown") to = k < 0 ? 0 : (k + 1) % list.length;
      else if (e.key === "ArrowUp") to = k < 0 ? list.length - 1 : (k - 1 + list.length) % list.length;
      else if (e.key === "Home" && k >= 0) to = 0;
      else if (e.key === "End" && k >= 0) to = list.length - 1;
      if (to === null) return;
      e.preventDefault();
      menu.open = true;
      list[to].focus();
    });
    // closes when keyboard focus leaves (Tab past the last item, or away); a press inside the menu is not leaving:
    // Safari does not focus a link on click, and closing on the press would swallow the click
    var pressing = false;
    menu.addEventListener("pointerdown", function () { pressing = true; });
    document.addEventListener("pointerup", function () { setTimeout(function () { pressing = false; }, 0); });
    menu.addEventListener("focusout", function (e) {
      if (menu.open && !pressing && !menu.contains(e.relatedTarget)) menu.open = false;
    });
    menu.querySelector("ul").addEventListener("click", function (e) {
      if (e.target.closest("a")) menu.open = false;  // choosing an item closes the panel as the page changes
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) {
        quiet = true; setTimeout(function () { quiet = false; }, 300);
        menu.open = false; summary.focus();
      }
    });
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
  });

  // The contents row scrolls sideways on a narrow screen and fades out at the right edge while there is more to see.
  document.querySelectorAll(".toc .row").forEach(function (row) {
    var check = function () { row.classList.toggle("more", row.scrollLeft + row.clientWidth < row.scrollWidth - 1); };
    row.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check();
  });

  // Contents highlight. Only reads scroll position and never moves the page.
  // On a narrow screen the contents are a row that scrolls sideways; the current item is kept in view within the row.
  var toc = document.querySelector(".toc .row");
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (links.length) {
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); });
    var row = window.matchMedia("(max-width: 72rem)");
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    var last = -1;
    var reveal = function (a) {
      var left = a.offsetLeft, right = left + a.offsetWidth, pad = 16;  // the row (position: relative) is the links' offsetParent
      var to = left - pad < toc.scrollLeft ? left - pad : right + pad > toc.scrollLeft + toc.clientWidth ? right + pad - toc.clientWidth : null;
      if (to !== null) toc.scrollTo({ left: to, behavior: calm.matches ? "auto" : "smooth" });
    };
    var update = function () {
      var line = window.innerHeight * 0.3;
      var current = 0;
      targets.forEach(function (t, k) { if (t && t.getBoundingClientRect().top <= line) current = k; });
      links.forEach(function (a, k) {
        if (k === current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      if (current !== last && row.matches) reveal(links[current]);
      last = current;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
})();

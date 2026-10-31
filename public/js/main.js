(function () {
  "use strict";

  // Year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Mobile menu
  var burger = document.getElementById("burger");
  var menu = document.getElementById("menu");
  function setMenu(open) {
    menu.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // Reveal on scroll
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Charging demo (clearly labelled as demo in the page)
  var run = document.getElementById("demo-run");
  if (run) {
    var bar = document.getElementById("demo-bar");
    var pct = document.getElementById("demo-pct");
    var temp = document.getElementById("demo-temp");
    var timer = null;
    run.addEventListener("click", function () {
      clearInterval(timer);
      var v = 0;
      run.disabled = true;
      timer = setInterval(function () {
        v += 2;
        bar.style.width = v + "%";
        pct.textContent = v + "%";
        temp.textContent = "Pad temperature: " + (v > 70 ? "warm, within limits" : "normal");
        if (v >= 100) { clearInterval(timer); run.disabled = false; run.textContent = "Run again"; }
      }, 70);
    });
  }

  // Forms
  var EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;
  var PHONE = /^\+?[0-9\s\-()]{7,18}$/;

  function localISO(d) {
    var p = function (n) { return String(n).padStart(2, "0"); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  document.querySelectorAll("input[data-future]").forEach(function (i) { i.min = localISO(new Date()); });

  function setError(input, msg) {
    var f = input.closest(".field");
    f.classList.toggle("invalid", !!msg);
    f.querySelector(".err").textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function checkField(input) {
    var v = input.value.trim();
    var msg = "";
    if (input.required && !v) msg = "This field is required.";
    else if (input.type === "email" && v && !EMAIL.test(v)) msg = "Enter a valid email address.";
    else if (input.type === "tel" && v && (!PHONE.test(v) || v.replace(/\D/g, "").length < 7)) msg = "Enter a valid phone number.";
    else if (input.type === "datetime-local" && v && new Date(v) < new Date()) msg = "Choose a future date and time.";
    setError(input, msg);
    return !msg;
  }

  document.querySelectorAll("form[data-kind]").forEach(function (form) {
    var fields = form.querySelectorAll("input:not(.hp), select, textarea");
    var status = form.querySelector(".status");
    var btn = form.querySelector("button[type=submit]");

    fields.forEach(function (f) {
      f.addEventListener("blur", function () { checkField(f); });
      f.addEventListener("input", function () { if (f.closest(".field").classList.contains("invalid")) checkField(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.className = "status";
      status.textContent = "";
      var ok = true, first = null;
      fields.forEach(function (f) { if (!checkField(f)) { ok = false; first = first || f; } });
      if (!ok) { first.focus(); status.classList.add("bad"); status.textContent = "Please fix the highlighted fields."; return; }

      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      btn.disabled = true;
      var label = btn.textContent;
      btn.textContent = "Sending...";

      fetch("/api/" + form.dataset.kind, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (res.ok && res.body.ok) {
            form.reset();
            status.classList.add("ok");
            status.textContent = res.body.message;
          } else {
            var errs = res.body.errors || {};
            Object.keys(errs).forEach(function (k) {
              var inp = form.querySelector("[name=" + k + "]");
              if (inp) setError(inp, errs[k]);
            });
            status.classList.add("bad");
            status.textContent = res.body.message || "Something went wrong.";
          }
        })
        .catch(function () {
          status.classList.add("bad");
          status.textContent = "Network error. Please try again.";
        })
        .finally(function () { btn.disabled = false; btn.textContent = label; });
    });
  });
})();

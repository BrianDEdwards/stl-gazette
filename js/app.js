const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// Tiny markup: **bold**, *italic*, {{ink only visible under the black light}}
const fmt = s => esc(s)
  .replace(/\{\{(.+?)\}\}/g, '<span class="uv">$1</span>')
  .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
  .replace(/\*(.+?)\*/g, "<i>$1</i>");
const paras = body => (Array.isArray(body) ? body : [body || ""]).map(p => `<p>${fmt(p)}</p>`).join("");
const note = n => n ? `<div class="note" aria-hidden="true">${esc(n)}</div>` : "";

let index, ed, timer;

async function boot() {
  try {
    index = await (await fetch("editions/index.json", {cache: "no-cache"})).json();
  } catch (e) {
    $("#paper").innerHTML = `<p>The presses are jammed (couldn't load editions/index.json). If you opened this file directly, serve the folder instead.</p>`;
    return;
  }
  const sel = $("#edition");
  sel.innerHTML = index.editions.map(e => `<option value="${esc(e.id)}">${esc(e.label || e.id)}</option>`).join("");
  sel.onchange = () => { location.hash = sel.value; };
  window.onhashchange = load;
  $("#foot").textContent = index.paper.footer || "";
  load();
}

async function load() {
  const id = decodeURIComponent(location.hash.slice(1)) || index.editions[0].id;
  const entry = index.editions.find(e => e.id === id) || index.editions[0];
  $("#edition").value = entry.id;
  try {
    ed = await (await fetch(entry.file, {cache: "no-cache"})).json();
  } catch (e) {
    $("#paper").innerHTML = `<p>Couldn't load ${esc(entry.file)}: ${esc(e.message)}</p>`;
    return;
  }
  render(entry);
  const art = new URLSearchParams(location.search).get("a");
  if (art) openArticle(art);
}

function render(entry) {
  const p = Object.assign({}, index.paper, ed.paper);
  document.title = `${p.name} · ${ed.issue?.date || entry.label}`;
  const arts = ed.articles || [];
  const lead = arts.find(a => a.size === "lead") || arts[0];
  const rest = arts.filter(a => a !== lead);
  const mainArts = rest.filter(a => a.column !== "side");
  const sideArts = rest.filter(a => a.column === "side");

  $("#paper").innerHTML = `
    <header class="masthead">
      <div class="ears"><span>${esc(p.leftEar || "")}</span><span>${esc(p.rightEar || "")}</span></div>
      <h1>${esc(p.name)}</h1>
      <div class="motto">${esc(p.motto || "")}</div>
    </header>
    <div class="dateline">
      <span>${esc(ed.issue?.volume || "")}</span>
      <span>${esc(ed.issue?.date || "")}</span>
      <span>${esc(ed.issue?.edition || "")}</span>
      <span>${esc(ed.issue?.price || "")}</span>
    </div>
    ${ed.ticker?.length ? `<div class="ticker"><span>${ed.ticker.map(t => `<b>&#9670;</b> ${fmt(t)}`).join(" &nbsp; ")}</span></div>` : ""}
    <div class="topboxes ${ed.previously ? "" : "solo"}">
      ${ed.previously ? `<section class="box previously"><h3>${esc(ed.previously.title || "Previously")}</h3>${paras(ed.previously.body)}${note(ed.previously.marginalia)}</section>` : ""}
      <section class="box countdown" id="countdown"></section>
    </div>
    <div class="grid">
      <div class="main">
        ${lead ? card(lead, "lead") : ""}
        ${mainArts.map(a => card(a)).join("")}
      </div>
      <aside class="side">
        ${ed.weather ? `<section class="weather"><h2>Weather</h2><div class="big">${esc(ed.weather.headline)}</div><div>${fmt(ed.weather.text)}</div>${note(ed.weather.marginalia)}</section>` : ""}
        ${sideArts.map(a => `<section>${card(a)}</section>`).join("")}
        ${ed.blotter?.length ? `<section class="blotter"><h2>Police Blotter</h2><ul>${ed.blotter.map(b => `<li><span class="t">${esc(b.time)}</span> &middot; ${esc(b.where.replace(/\.$/, ""))}. ${fmt(b.text)}</li>`).join("")}</ul></section>` : ""}
        ${(ed.ads || []).map(ad => `<section class="ad"><div class="ad-head">${esc(ad.headline)}</div><div class="ad-body">${fmt(ad.body)}</div><div class="ad-foot">${esc(ad.footer || "")}</div>${note(ad.marginalia)}</section>`).join("")}
        ${ed.classifieds?.length ? `<section class="classifieds"><h2>Classifieds &amp; Personals</h2><ul>${ed.classifieds.map(c => `<li><b>${esc(c.heading)}</b>${fmt(c.text)}${note(c.marginalia)}</li>`).join("")}</ul></section>` : ""}
      </aside>
    </div>`;

  document.querySelectorAll(".article").forEach(el => {
    el.onclick = () => openArticle(el.dataset.id);
    el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openArticle(el.dataset.id); } };
  });
  startCountdown();
}

function card(a, kind) {
  const body = Array.isArray(a.body) ? a.body : [a.body];
  const shown = kind === "lead" ? 2 : 1;
  const more = body.length > shown;
  return `<div class="article ${kind || a.size || ""}" data-id="${esc(a.id)}" tabindex="0" role="button">
    ${a.kicker ? `<div class="kicker">${esc(a.kicker)}</div>` : ""}
    <h2 class="headline">${esc(a.headline)}</h2>
    ${a.subhead ? `<p class="subhead">${esc(a.subhead)}</p>` : ""}
    ${a.byline ? `<div class="byline">${esc(a.byline)}</div>` : ""}
    ${a.image && kind === "lead" ? `<figure><img src="${esc(a.image)}" alt="${esc(a.caption || "")}"><figcaption>${esc(a.caption || "")}</figcaption></figure>` : ""}
    <div class="teaser">${body.slice(0, shown).map(t => `<p>${fmt(t)}</p>`).join("")}</div>
    ${more ? `<div class="more">Continued &rarr;</div>` : ""}
    ${note(a.marginalia)}
  </div>`;
}

function openArticle(id) {
  const a = (ed.articles || []).find(x => x.id === id);
  if (!a) return;
  $("#reader").innerHTML = `
    <button class="close" aria-label="Close">&times;</button>
    ${a.kicker ? `<div class="kicker">${esc(a.kicker)}</div>` : ""}
    <h2 class="headline">${esc(a.headline)}</h2>
    ${a.subhead ? `<p class="subhead">${esc(a.subhead)}</p>` : ""}
    ${a.byline ? `<div class="byline">${esc(a.byline)}</div>` : ""}
    ${a.image ? `<figure><img src="${esc(a.image)}" alt="${esc(a.caption || "")}"><figcaption>${esc(a.caption || "")}</figcaption></figure>` : ""}
    <div class="body">${paras(a.body)}</div>
    ${note(a.marginalia)}`;
  $("#readerWrap").classList.add("open");
  $("#reader .close").onclick = closeArticle;
  $("#reader .close").focus();
  history.replaceState(null, "", `?a=${encodeURIComponent(id)}${location.hash}`);
}
function closeArticle() {
  $("#readerWrap").classList.remove("open");
  history.replaceState(null, "", location.pathname + location.hash);
}
$("#readerWrap").onclick = e => { if (e.target.id === "readerWrap") closeArticle(); };
document.addEventListener("keydown", e => { if (e.key === "Escape") closeArticle(); });

function startCountdown() {
  clearInterval(timer);
  const box = $("#countdown"), n = ed.nextSession || {};
  const when = n.when ? new Date(n.when) : null;
  const head = `<h3>${esc(n.title || "The Next Hunt")}</h3>`;
  if (!when || isNaN(when)) {
    box.innerHTML = `${head}<div class="tba">${fmt(n.tba || "Date to be announced. Tell your GM when you're free.")}</div>${note(n.marginalia)}`;
    return;
  }
  const tick = () => {
    let ms = when - Date.now();
    if (ms <= 0) { box.querySelector(".clock").textContent = n.nowText || "Tonight. Bring a flashlight."; clearInterval(timer); return; }
    const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    box.querySelector(".clock").textContent = `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;
  };
  box.innerHTML = `${head}<div class="clock"></div>
    <div class="when">${esc(when.toLocaleString(undefined, {weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit"}))}${n.where ? ` &middot; ${esc(n.where)}` : ""}</div>
    <button id="calBtn">Add to my calendar</button>${note(n.marginalia)}`;
  tick(); timer = setInterval(tick, 1000);
  $("#calBtn").onclick = () => {
    const f = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const end = new Date(when.getTime() + (n.hours || 4) * 36e5);
    const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//STL Gazette//EN","BEGIN:VEVENT",
      `UID:${f(when)}@stl-gazette`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(when)}`, `DTEND:${f(end)}`,
      `SUMMARY:${(n.calendarTitle || "Hunter: St. Louis By Night")}`, n.where ? `LOCATION:${n.where}` : "", `URL:${location.href.split("?")[0]}`,
      "END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], {type: "text/calendar"}));
    a.download = "next-session.ics"; a.click();
  };
}

$("#uvBtn").onclick = () => {
  const on = document.body.classList.toggle("uvon");
  $("#uvBtn").setAttribute("aria-pressed", on);
  $("#uvBtn").textContent = on ? "Lights on" : "Hold to the black light";
};
$("#shareBtn").onclick = async () => {
  const url = location.href.split("?")[0];
  try {
    if (navigator.share) await navigator.share({title: document.title, url});
    else { await navigator.clipboard.writeText(url); $("#shareBtn").textContent = "Link copied"; setTimeout(() => $("#shareBtn").textContent = "Share", 2000); }
  } catch (e) {}
};

boot();

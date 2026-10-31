// DocuClear Workspace
// Upload, privacy scan, multilingual analysis, read-aloud,
// dashboard, account and navigation.

var BADAPI = window.DC_API && !/^https?:\/\//.test(window.DC_API);
if (BADAPI) window.DC_API = "";

var $ = DC.$;
var F = null;
var LAST = null;
var BASE_RESULT = null;

var ICON = { r: "🔴", a: "🟡", g: "🟢" };
var KEYS = ["sign", "cancel", "delay", "noncomply"];
var TAB = "sign";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function esc(t) {
  return String(t == null ? "" : t)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getL() {
  try {
    if (window.DC_getLanguage) {
      return window.DC_getLanguage().code;
    }

    return localStorage.getItem("dc_preferred_language") ||
      localStorage.getItem("dc_lang") ||
      "en-IN";
  } catch (e) {
    return "en-IN";
  }
}

function setL(code) {
  if (window.DC_setLanguage) {
    window.DC_setLanguage(code);
  } else {
    try {
      localStorage.setItem("dc_preferred_language", code);
      localStorage.setItem("dc_lang", code);
    } catch (e) {}
  }
}

function getLangInfo(code) {
  if (window.langInfo) {
    return window.langInfo(code);
  }

  if (window.DC_LANGUAGES) {
    var found = window.DC_LANGUAGES.find(function (l) {
      return l.code === code;
    });

    if (found) {
      return [found.code, found.native + " — " + found.name];
    }
  }

  return [code, code];
}

// --------------------------------------------------
// Document type
// --------------------------------------------------

$("dt").innerHTML = TY.map(function (t) {
  return "<option>" + esc(t[0] + " " + t[1]) + "</option>";
}).join("");

// Language dropdowns are populated by js/lang.js.

// --------------------------------------------------
// Results display
// --------------------------------------------------

function paint(r, c) {
  LAST = r;

  var L = LABELS[c] ||
    LABELS[c.split("-")[0]] ||
    LABELS.en;

  $("smh").textContent = L.sum;
  $("smt").textContent = r.summary || "";
  $("spk").textContent = L.listen;
  $("stp").textContent = L.stop;
  $("h1").textContent = L.h1;

  $("rgn").textContent = r.score;
  $("rg").style.setProperty("--v", r.score);
  $("vd").textContent = r.verdict;

  var counts = r.counts || [0, 0, 0];

  $("tgs").innerHTML =
    '<span class="tg r">' + counts[0] + " " + L.hi + "</span> " +
    '<span class="tg a">' + counts[1] + " " + L.at + "</span> " +
    '<span class="tg g">' + counts[2] + " " + L.nm + "</span>";

  $("mt").textContent = r.meta || "";

  if (r.docLang || r.note) {
    $("spn").textContent =
      (r.docLang ? "📄 " + r.docLang + "  " : "") +
      (r.note || "");
  } else {
    $("spn").textContent = "";
  }

  $("h5").textContent = L.h5;
  $("h5n").textContent = L.h5n;
  $("hwi").textContent = L.hw;

  var findings = Array.isArray(r.five) ? r.five : [];

  $("five").innerHTML = findings.map(function (f, i) {
    return '<div class="itm">' +
      "<span>" + (ICON[f[0]] || "🟡") + "</span>" +
      "<div><b>" + (i + 1) + ". " + esc(f[1]) + "</b>" +
      '<div class="ex"><b>' + esc(L.ex) + "</b> " +
      esc(f[2]) + "</div></div></div>";
  }).join("");

  $("tabs").innerHTML = L.tabs.map(function (t, i) {
    return '<button data-k="' + KEYS[i] + '" class="' +
      (KEYS[i] === TAB ? "on" : "") + '">' +
      esc(t) + "</button>";
  }).join("");

  wi();
  updateLifeSimulator(r.simulator);
}

// --------------------------------------------------
// What-if information
// --------------------------------------------------

function wi() {
  var data = (LAST && LAST.wi) ? LAST.wi : {};
  var items = Array.isArray(data[TAB]) ? data[TAB] : [];

  $("wi").innerHTML =
    "<ul style='margin:0;padding-left:20px'>" +
    items.map(function (x) {
      return "<li>" + esc(x) + "</li>";
    }).join("") +
    "</ul>";
}

$("five").onclick = function (e) {
  var n = e.target.closest(".itm");
  if (n) n.classList.toggle("open");
};

$("tabs").onclick = function (e) {
  var button = e.target.closest("[data-k]");
  if (!button) return;

  var k = button.getAttribute("data-k");
  if (KEYS.indexOf(k) === -1) return;

  TAB = k;

  [].forEach.call($("tabs").children, function (b) {
    b.classList.toggle("on", b === button);
  });

  wi();
};

// --------------------------------------------------
// Read aloud
// --------------------------------------------------

function mark(on) {
  $("spk").classList.toggle("on", on);
}

$("spk").onclick = function () {
  if (!LAST) return;

  var c = getL();

  var t = [LAST.summary || ""]
    .concat((LAST.five || []).map(function (f) {
      return f[1] + ". " + f[2];
    }))
    .filter(Boolean)
    .join(". ");

  if (!window.dcSpeak) {
    $("spn").textContent = "Read aloud is not available.";
    return;
  }

  var result = window.dcSpeak(t, c, function () {
    mark(false);
  });

  $("spn").textContent = result === true ? "" : (result || "");
  mark(result === true);
};

$("stp").onclick = function () {
  if (window.dcStop) window.dcStop();
  mark(false);
};

// --------------------------------------------------
// Privacy masking
// --------------------------------------------------

function maskText(t) {
  return t
    .replace(/\b\d{4}\s?\d{4}\s?(\d{4})\b/g, "XXXX XXXX $1")
    .replace(/\b[A-Z]{5}(\d{4})[A-Z]\b/g, "XXXXX$1X")
    .replace(/\b[6-9]\d{5}(\d{4})\b/g, "XXXXXX$1")
    .replace(/([\w.+-])[\w.+-]*@/g, "$1***@");
}

// --------------------------------------------------
// PDF.js loading
// --------------------------------------------------

function loadPdf() {
  if (window.pdfjsLib) return Promise.resolve();

  return new Promise(function (ok, no) {
    var s = document.createElement("script");
    var B = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";

    s.src = B + "pdf.min.js";

    s.onload = function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        B + "pdf.worker.min.js";

      window.DC_PDF_STANDARD_FONTS = B + "standard_fonts/";

      ok();
    };

    s.onerror = function () {
      no(new Error("Could not load the PDF reader."));
    };

    document.head.appendChild(s);
  });
}

// --------------------------------------------------
// Image processing
// --------------------------------------------------

function shrink(img) {
  var k = Math.min(
    1,
    1600 / Math.max(img.width, img.height)
  );

  var c = document.createElement("canvas");
  c.width = img.width * k;
  c.height = img.height * k;

  c.getContext("2d").drawImage(
    img, 0, 0, c.width, c.height
  );

  return c.toDataURL("image/jpeg", 0.82);
}

function junk(t) {
  if (!t.length) return true;

  return (
    (t.match(/[\u00C0-\u00FF\uFFFD]/g) || []).length /
    t.length
  ) > 0.15;
}

// --------------------------------------------------
// Read uploaded files
// --------------------------------------------------

function prep(f) {
  if (/\.txt$/i.test(f.name)) {
    return f.text().then(function (t) {
      return { text: t };
    });
  }

  if (/\.pdf$/i.test(f.name)) {
    return loadPdf()
      .then(function () {
        return f.arrayBuffer();
      })
      .then(function (buf) {
        return pdfjsLib.getDocument({
          data: buf,
          standardFontDataUrl: window.DC_PDF_STANDARD_FONTS
        }).promise;
      })
      .then(function (pdf) {
        var n = Math.min(pdf.numPages, 12);
        var pages = [];

        for (var i = 1; i <= n; i++) {
          pages.push(
            pdf.getPage(i)
              .then(function (p) {
                return p.getTextContent();
              })
              .then(function (content) {
                return content.items.map(function (x) {
                  return x.str;
                }).join(" ");
              })
          );
        }

        return Promise.all(pages).then(function (texts) {
          var txt = texts.join("\n\n").trim();

          if (txt.length > 200 && !junk(txt)) {
            return { text: txt };
          }

          // Scanned PDF: convert first three pages to images.
          var images = [];

          for (
            var j = 1;
            j <= Math.min(pdf.numPages, 3);
            j++
          ) {
            images.push(
              pdf.getPage(j).then(function (p) {
                var viewport = p.getViewport({ scale: 1.5 });
                var canvas = document.createElement("canvas");

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                return p.render({
                  canvasContext: canvas.getContext("2d"),
                  viewport: viewport
                }).promise.then(function () {
                  return canvas.toDataURL("image/jpeg", 0.8);
                });
              })
            );
          }

          return Promise.all(images).then(function (x) {
            return { images: x };
          });
        });
      });
  }

  return new Promise(function (ok, no) {
    var url = URL.createObjectURL(f);
    var img = new Image();

    img.onload = function () {
      var result = shrink(img);
      URL.revokeObjectURL(url);
      ok({ images: [result] });
    };

    img.onerror = function () {
      URL.revokeObjectURL(url);
      no(new Error("Could not read this image."));
    };

    img.src = url;
  });
}

// --------------------------------------------------
// AI document analysis
// --------------------------------------------------

function analyze(c) {
  // Demo mode when no backend or local key is configured.
  if (!window.DC_API && !window.GROQ_KEY) {
    return new Promise(function (ok) {
      setTimeout(function () {
        ok(
          SAMPLES[c] ||
          SAMPLES[c.split("-")[0]] ||
          SAMPLES.en
        );
      }, 900);
    }).then(function (r) {
      $("spn").textContent = SAMPLES[c]
        ? ""
        : "Demo sample only. Connect the AI backend to analyze real documents in your selected language.";

      return r;
    });
  }

  if (!F) {
    return Promise.reject(new Error("Please choose a document."));
  }

  if (F.size > 12 * 1024 * 1024) {
    return Promise.reject(
      new Error("File is larger than 12 MB.")
    );
  }

  return prep(F).then(function (p) {
    if (p.text) {
      if (p.text.length < 20) {
        throw new Error("No readable text found in this file.");
      }

      if ($("mask").checked) {
        p.text = maskText(p.text);
      }

      p.text = p.text.slice(0, 12000);
    }

    p.lang = c;

    var info = getLangInfo(c);
    p.langName = info[1] + " (" + c + ")";
    p.docType = $("dt").value;

    if (!window.DC_API) {
      if (!window.localAnalyze) {
        throw new Error("Local AI analyzer is not loaded.");
      }

      return localAnalyze(p);
    }

    var tokenPromise =
      DC.AUTH && DC.AUTH.currentUser
        ? DC.AUTH.currentUser.getIdToken()
        : Promise.resolve("");

    return tokenPromise.then(function (token) {
      p.idToken = token;

      return fetch(window.DC_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(p)
      });
    }).then(function (response) {
      return response.json().then(function (json) {
        if (!response.ok || json.error) {
          throw new Error(
            json.error ||
            "Analysis service error (" + response.status + ")."
          );
        }

        return json;
      });
    });
  });
}

// --------------------------------------------------
// Loading indicator
// --------------------------------------------------

function busy(on) {
  $("go").disabled = on;
  $("bar").classList.toggle("hide", !on);

  var i = $("bar").firstChild;

  if (i) {
    i.style.width = on ? "85%" : "0";
    i.style.transition = on ? "width 6s" : "none";
  }
}

// --------------------------------------------------
// Run analysis
// --------------------------------------------------

function run() {
  if (BADAPI) {
    $("fn").textContent =
      "⚠️ js/api-config.js must contain a valid https:// Worker URL, or be empty.";
    return;
  }

  if (!F) return;

  var c = getL();

  if (window.dcStop) window.dcStop();

  mark(false);
  busy(true);

  $("xtra").classList.toggle(
    "hide",
    !!(window.DC_API || window.GROQ_KEY)
  );

  analyze(c)
    .then(function (r) {
      busy(false);

      if (!r || !r.five) {
        throw new Error("The AI returned an incomplete analysis.");
      }

      // Save original assessment once.
      BASE_RESULT = r._baseResult || r;

      paint(r, c);

      $("rn").textContent = F.name;
      $("upc").classList.add("hide");
      $("res").classList.remove("hide");

      var k =
        r.score >= 75 ? "g" :
        r.score >= 50 ? "a" : "r";

      DOCS.unshift([
        F.name,
        $("dt").value.replace(/^\S+\s/, ""),
        k,
        (window.DC_API || window.GROQ_KEY) ? "—" : "Demo"
      ]);

      dash();
    })
    .catch(function (e) {
      busy(false);

      $("fn").textContent =
        "⚠️ " + (e.message || "Analysis failed. Try again.");
    });
}

// --------------------------------------------------
// Language changes
// --------------------------------------------------

// Translate saved analysis only.
// Do not upload or analyze the PDF again.
function translateSavedAssessment(code) {
  if (!BASE_RESULT || !window.DC_API) return;

  var info = getLangInfo(code);

  var tokenPromise =
    DC.AUTH && DC.AUTH.currentUser
      ? DC.AUTH.currentUser.getIdToken()
      : Promise.resolve("");

  if (window.dcStop) window.dcStop();

  mark(false);
  busy(true);

  tokenPromise.then(function (token) {
    return fetch(window.DC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "translate",
        analysis: BASE_RESULT,
        lang: code,
        langName: info[1] + " (" + code + ")",
        idToken: token
      })
    });
  }).then(function (response) {
    return response.json().then(function (json) {
      if (!response.ok || json.error) {
        throw new Error(
          json.error ||
          "Translation failed (" + response.status + ")."
        );
      }

      return json;
    });
  }).then(function (translated) {
    busy(false);

    // Lock score and risk assessment to original values.
    translated.score = BASE_RESULT.score;
    translated.verdict = BASE_RESULT.verdict;
    translated.counts = BASE_RESULT.counts;

    translated.five = (translated.five || []).map(function (item, i) {
      return [
        BASE_RESULT.five[i]
          ? BASE_RESULT.five[i][0]
          : item[0],
        item[1],
        item[2]
      ];
    });

    paint(translated, code);
  }).catch(function (error) {
    busy(false);

    $("fn").textContent =
      "⚠️ " + (error.message ||
      "Could not change the explanation language.");
  });
}

document.addEventListener("dc-language-change", function (event) {
  var code = event.detail && event.detail.code
    ? event.detail.code
    : getL();

  if ($("lg")) $("lg").value = code;
  if ($("lg2")) $("lg2").value = code;

  if (window.dcStop) window.dcStop();

  mark(false);

  if (BASE_RESULT && !$("res").classList.contains("hide")) {
    translateSavedAssessment(code);
  }
});

// --------------------------------------------------
// Life Impact Simulator
// --------------------------------------------------

function updateLifeSimulator(data) {
  var heading = Array.prototype.find.call(
    document.querySelectorAll("#res h3"),
    function (node) {
      return node.textContent.trim() === "Life Impact Simulator";
    }
  );

  var card = heading ? heading.closest(".card") : null;
  if (!card) return;

  // Hide when no actual financial obligation exists.
  if (
    !data ||
    data.enabled !== true ||
    data.principal === null ||
    data.principal === undefined ||
    !Number.isFinite(Number(data.principal))
  ) {
    card.classList.add("hide");
    return;
  }

  card.classList.remove("hide");

  var note = card.querySelector(".nt");
  var label = card.querySelector("#ml");
  var slider = card.querySelector("#mo");
  var output = card.querySelector("#sim");

  var currency = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  });

  if (note) {
    note.textContent =
      data.obligation ||
      "Financial obligation identified in the document.";
  }

  if (label) {
    label.textContent = data.calculationSupported
      ? "Delay period"
      : "Penalty terms from the document";
  }

  if (slider) {
    slider.classList.add("hide");
  }

  var lines = [
    "Amount stated: <b>" +
    currency.format(Number(data.principal)) +
    "</b>"
  ];

  if (
    data.penaltyType &&
    data.penaltyType !== "unknown" &&
    data.penaltyType !== "none" &&
    data.penaltyValue !== null
  ) {
    var penaltyText = data.penaltyUnit === "%"
      ? data.penaltyValue + "%"
      : currency.format(Number(data.penaltyValue));

    var periodText =
      data.penaltyType === "per_day"
        ? " per day"
        : data.penaltyType === "per_month"
          ? " per month"
          : "";

    lines.push(
      "Stated penalty: <b>" +
      esc(penaltyText + periodText) +
      "</b>"
    );
  } else {
    lines.push(
      "Penalty: <b>Not specified clearly in the document</b>"
    );
  }

  if (data.graceDays !== null && data.graceDays !== undefined) {
    lines.push(
      "Grace period: <b>" +
      esc(data.graceDays) +
      " days</b>"
    );
  }

  if (!data.calculationSupported) {
    lines.push(
      '<span class="nt">A total payable amount cannot be calculated without making assumptions.</span>'
    );
  }

  if (output) {
    output.innerHTML = lines.join("<br>");
  }
}

// --------------------------------------------------
// Navigation
// --------------------------------------------------

document.querySelector(".side").onclick = function (e) {
  var button = e.target.closest("[data-v]");
  if (!button) return;

  var value = button.getAttribute("data-v");

  [].forEach.call(this.children, function (b) {
    b.classList.toggle("on", b === button);
  });

  [].forEach.call(
    document.querySelectorAll(".main>[data-v]"),
    function (section) {
      section.classList.toggle(
        "hide",
        section.getAttribute("data-v") !== value
      );
    }
  );
};

// --------------------------------------------------
// Upload
// --------------------------------------------------

$("drop").onclick = function () {
  $("file").click();
};

["dragover", "dragenter"].forEach(function (name) {
  $("drop").addEventListener(name, function (e) {
    e.preventDefault();
    $("drop").classList.add("hv");
  });
});

["dragleave", "drop"].forEach(function (name) {
  $("drop").addEventListener(name, function (e) {
    e.preventDefault();
    $("drop").classList.remove("hv");
  });
});

$("drop").addEventListener("drop", function (e) {
  pick(e.dataTransfer.files[0]);
});

$("file").onchange = function () {
  pick(this.files[0]);
};

function pick(f) {
  if (!f) return;

  var allowed = /\.(pdf|jpg|jpeg|png|webp|txt)$/i;

  if (!allowed.test(f.name)) {
    $("fn").textContent =
      "Please upload a PDF, JPG, PNG, WEBP or TXT file.";
    return;
  }

  F = f;

  // A new upload must start a new assessment.
  BASE_RESULT = null;
  LAST = null;

  $("fn").textContent = "✅ " + f.name;
  $("ps").textContent = "";

  if (/\.txt$/i.test(f.name)) {
    var reader = new FileReader();

    reader.onload = function () {
      var t = String(reader.result);

      var count = function (pattern) {
        return (t.match(pattern) || []).length;
      };

      $("ps").textContent =
        "🔒 Privacy Scan → Aadhaar: " +
        count(/\b\d{4}\s?\d{4}\s?\d{4}\b/g) +
        " · PAN: " +
        count(/\b[A-Z]{5}\d{4}[A-Z]\b/g) +
        " · Phone: " +
        count(/\b[6-9]\d{9}\b/g) +
        " · Email: " +
        count(/[\w.+-]+@[\w-]+\.[\w.]+/g) +
        ($("mask").checked ? " (will be masked)" : "");
    };

    reader.readAsText(f);
  } else if (/\.pdf$/i.test(f.name)) {
    $("ps").textContent =
      "🔒 Aadhaar, PAN, phone and email in readable PDF text are masked before analysis.";
  } else {
    $("ps").textContent =
      "⚠️ Photos cannot be masked automatically. Cover sensitive numbers before uploading.";
  }
}

// --------------------------------------------------
// Analyze button
// --------------------------------------------------

$("go").onclick = function () {
  if (!F) {
    $("fn").textContent = "Please choose a file first.";
    return;
  }

  run();
};

// --------------------------------------------------
// Analyze another document
// --------------------------------------------------

$("again").onclick = function () {
  if (window.dcStop) window.dcStop();

  mark(false);

  F = null;
  LAST = null;
  BASE_RESULT = null;

  $("fn").textContent = "";
  $("ps").textContent = "";

  $("file").value = "";

  $("res").classList.add("hide");
  $("upc").classList.remove("hide");
};

// --------------------------------------------------
// Dashboard
// --------------------------------------------------

function dash() {
  var risky = DOCS.filter(function (d) {
    return d[2] === "r";
  }).length;

  var attention = DOCS.filter(function (d) {
    return d[2] === "a";
  }).length;

  $("kp").innerHTML = [
    ["🔴", risky, "High-risk documents"],
    ["🟡", attention, "Need attention"],
    ["📅", DOCS.length, "Deadlines approaching"],
    [
      "💰",
      "₹" + (35000 + risky * 10000).toLocaleString("en-IN"),
      "Potential exposure"
    ]
  ].map(function (s) {
    return "<div><b>" + s[0] + " " + s[1] +
      "</b><span>" + s[2] + "</span></div>";
  }).join("");

  var riskLabels = {
    r: ["r", "High risk"],
    a: ["a", "Attention"],
    g: ["g", "Safe"]
  };

  $("tb").innerHTML = DOCS.map(function (d) {
    var label = riskLabels[d[2]] || riskLabels.a;

    return "<tr><td><b>" + esc(d[0]) + "</b></td>" +
      "<td>" + esc(d[1]) + "</td>" +
      '<td><span class="tg ' + label[0] + '">' +
      label[1] + "</span></td>" +
      "<td>" + esc(d[3]) + "</td></tr>";
  }).join("");
}

dash();

// --------------------------------------------------
// Account
// --------------------------------------------------

$("out2").onclick = DC.logout;

DC.ready(function (U) {
  $("hi").textContent =
    (U.name ? "Hello, " + U.name : "Hello") + " 👋";

  $("acI").innerHTML =
    "<b>" + esc(U.name || "Your account") + "</b><br>" +
    esc(U.email || U.phone || "");
});
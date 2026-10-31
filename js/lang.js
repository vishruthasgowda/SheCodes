
// js/lang.js
(function () {
  "use strict";

  const LANGUAGES = [
    { name: "English", native: "English", code: "en-IN" },
    { name: "Assamese", native: "অসমীয়া", code: "as-IN" },
    { name: "Bengali", native: "বাংলা", code: "bn-IN" },
    { name: "Bodo", native: "बड़ो", code: "brx-IN" },
    { name: "Dogri", native: "डोगरी", code: "doi-IN" },
    { name: "Gujarati", native: "ગુજરાતી", code: "gu-IN" },
    { name: "Hindi", native: "हिन्दी", code: "hi-IN" },
    { name: "Kannada", native: "ಕನ್ನಡ", code: "kn-IN" },
    { name: "Kashmiri", native: "کٲشُر", code: "ks-IN" },
    { name: "Konkani", native: "कोंकणी", code: "kok-IN" },
    { name: "Maithili", native: "मैथिली", code: "mai-IN" },
    { name: "Malayalam", native: "മലയാളം", code: "ml-IN" },
    { name: "Manipuri (Meitei)", native: "মৈতৈলোন্", code: "mni-IN" },
    { name: "Marathi", native: "मराठी", code: "mr-IN" },
    { name: "Nepali", native: "नेपाली", code: "ne-IN" },
    { name: "Odia", native: "ଓଡ଼ିଆ", code: "or-IN" },
    { name: "Punjabi", native: "ਪੰਜਾਬੀ", code: "pa-IN" },
    { name: "Sanskrit", native: "संस्कृतम्", code: "sa-IN" },
    { name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", code: "sat-IN" },
    { name: "Sindhi", native: "سنڌي", code: "sd-IN" },
    { name: "Tamil", native: "தமிழ்", code: "ta-IN" },
    { name: "Telugu", native: "తెలుగు", code: "te-IN" },
    { name: "Urdu", native: "اردو", code: "ur-IN" }
  ];

  const STORAGE_KEY = "dc_preferred_language";

  function getLanguage(code) {
    return LANGUAGES.find(function (l) {
      return l.code === code || (code === "en" && l.code === "en-IN");
    }) || LANGUAGES[0];
  }

  function getSelectedLanguage() {
    try {
      return getLanguage(
        localStorage.getItem(STORAGE_KEY) ||
        localStorage.getItem("dc_lang") ||
        "en-IN"
      );
    } catch (e) {
      return LANGUAGES[0];
    }
  }

  function setLanguage(code) {
    const language = getLanguage(code);

    try {
      localStorage.setItem(STORAGE_KEY, language.code);
      localStorage.setItem("dc_lang", language.code);
    } catch (e) {}

    ["lg", "lg2"].forEach(function (id) {
      const select = document.getElementById(id);
      if (select) select.value = language.code;
    });

    document.dispatchEvent(new CustomEvent("dc-language-change", {
      detail: language
    }));

    return language;
  }

  function populateSelect(select) {
    if (!select) return;

    select.innerHTML = "";

    LANGUAGES.forEach(function (language) {
      const option = document.createElement("option");
      option.value = language.code;
      option.textContent = language.native + " — " + language.name;
      select.appendChild(option);
    });

    select.value = getSelectedLanguage().code;

    select.addEventListener("change", function () {
      setLanguage(this.value);
    });
  }

  function initializeLanguages() {
    populateSelect(document.getElementById("lg"));
    populateSelect(document.getElementById("lg2"));

    const modal = document.getElementById("lgm");
    const grid = document.getElementById("lgg");

    if (grid) {
      grid.innerHTML = "";

      LANGUAGES.forEach(function (language) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn o";
        button.style.margin = "5px";
        button.textContent =
          language.native + " (" + language.name + ")";

        button.addEventListener("click", function () {
          setLanguage(language.code);
          if (modal) modal.classList.add("hide");
        });

        grid.appendChild(button);
      });
    }

    if (modal) {
      let saved = false;
      try {
        saved = !!(
          localStorage.getItem(STORAGE_KEY) ||
          localStorage.getItem("dc_lang")
        );
      } catch (e) {}

      if (!saved) modal.classList.remove("hide");
    }
  }

  window.LANGS = LANGUAGES.map(function (l) {
    return [l.code, l.native + " — " + l.name];
  });

  window.DC_LANGUAGES = LANGUAGES;
  window.DC_getLanguage = getSelectedLanguage;
  window.DC_setLanguage = setLanguage;

  window.langInfo = function (code) {
    const l = getLanguage(code);
    return [l.code, l.native + " — " + l.name];
  };

  document.addEventListener("DOMContentLoaded", initializeLanguages);

})();

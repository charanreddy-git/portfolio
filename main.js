(function () {
  function revealLink(linkId, url) {
    const link = document.getElementById(linkId);
    const trimmed = url?.trim();

    if (!link || !trimmed || trimmed.includes("YOUR_")) return;

    link.href = trimmed;
    link.hidden = false;
  }

  function initResumeLink() {
    revealLink("resume-link", window.SITE_CONFIG?.resumeUrl);
  }

  document.addEventListener("DOMContentLoaded", initResumeLink);
})();

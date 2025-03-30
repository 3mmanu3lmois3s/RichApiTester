window.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.getElementById("openBtn");
  const urlInput = document.getElementById("urlInput");

  openBtn.addEventListener("click", () => {
    const url = urlInput.value.trim();

    if (!/^https?:\/\//i.test(url)) {
      alert("La URL debe comenzar con http:// o https://");
      return;
    }

    window.electronAPI.openWebview(url);
  });
});

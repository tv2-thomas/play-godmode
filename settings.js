const settings = getSettings();

waitFor(() => document.querySelector("h1") && document.querySelector("h1").textContent.includes("404"))
    .then(setupSettingsPage);

waitFor(() => document.querySelector("#header nav ul")).then(async (list) => {
    await waitFor(() => Array.from(document.querySelectorAll("#header nav ul li a"))
        .some(a => a.href===window.origin + "/min-liste"));

    const liStyle = list.childNodes[0].className;
    const aStyle = list.childNodes[0].childNodes[0].className;
    const settingsLi = document.createElement("li");
    settingsLi.innerHTML = `<a href="/godmode" style="color:red" class="${aStyle}">Godmode</a>`;
    settingsLi.className = liStyle;
    list.appendChild(settingsLi);
});
function setupSettingsPage() {
    if (window.location.pathname !== "/godmode") return;
    const main = document.querySelector("main");
    main.childNodes.forEach(n => n.remove());

    // Pallet is clean..
    main.innerHTML = `
    <style>
        article {
            max-width: 800px;
            margin: 0 auto;
        }
        label {
            padding-left: 5rem;
        }
    </style>
    <article>    
    <h1>Godmode Settings</h1>
        
        <form>
            <input type="checkbox" id="godmode-reprocess" name="godmode-reprocess">
            <label for="godmode-reprocess">Enable Reprocess button for images</label>
        </form>
   </article> 
    `;

    waitFor(() => document.getElementById("godmode-reprocess")).then(preprocessImagesCheck => {
        preprocessImagesCheck.checked = settings.imagereprocess;
        preprocessImagesCheck.addEventListener("change", (e) => {
            settings.imagereprocess = e.target.checked;
            window.localStorage.setItem("godmode-settings", JSON.stringify(settings));
            if (e.target.checked) {
                startImageReprocessInterval();
            } else {
                stopImageReprocessInterval();
            }
        });
    });
}

function getSettings() {
    const settings = window.localStorage.getItem("godmode-settings");

    if (settings) {
        return JSON.parse(settings);
    }
   return {}; 
}
let dropdownDivPromise = () => waitFor(() => document.querySelector("#user-dropdown > div"));

function addGodModeToggle(dropdownsep) {
    console.debug("Adding Godmode toggle");
    if (!dropdownsep) {
        return;
    }

    let toggle = createToggleButton(onGodModeToggle);
    insertAfter(toggle, dropdownsep);
    window.godmodeinput.checked = isGodMode();
}

async function onGodModeToggle({ target }) {
    if (target.checked) {
        if (target.checked === isGodMode()) {
            return;
        }
        localStorage.setItem("godmode", true);
        await handleNavigation(window.location.href);
    } else {
        localStorage.removeItem("godmode");

        cleanupDOM()
    }
}
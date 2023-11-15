let env = window.location.origin.includes("discovery")
    ? "dev"
    : window.location.origin.includes("stage")
        ? "stage"
        : "prod";
        
let statusURL;
let apiURL;
let altApiURL;
switch (env) {
    case ("dev"):
        statusURL = "";
        apiURL = "https://dev.ai.tv2.no";
        break;
    case "stage":
        statusURL = "https://publisering.status.tv2.no/status/program/";
        apiURL = "https://stage.ai.tv2.no";
        break;
    case "prod":
        statusURL = "https://publisering.status.tv2.no/status/program/";
        apiURL = "https://play.tv2.no";
        altApiURL = "https://ai.sumo.tv2.no";
        break;
}


let sleep = ms => new Promise(r => setTimeout(r, ms));
let waitFor = async function waitFor(f) {
    let attempts = 0;
    while (!f() && attempts < 100) 
        await sleep(100);
    return f();
};

function isGodMode() {
    // ...
    return !!localStorage.getItem("godmode");
}

function br() { return document.createElement("br") }

function findFirst(list, fn) {
    if (!list) {
        return;
    }
    for (let l of list) {
        if (fn(l)) {
            return l
        }
    }
}

function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}



const copyContent = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}

// Inject a style tag for custom styling, like copy button hover color
waitFor(() => document.querySelector("head")).then(head => {
    var css = `
        .godmode-copy-button:hover{ color: #a6b4f1 }
    `;
    var style = document.createElement('style');

    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else {
        style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
});

window.addEventListener('popstate', function (event) {
    // Handle the back button event here
    const hrefChangeEvent = new CustomEvent('hrefchange', { detail: window.location.href });
    window.dispatchEvent(hrefChangeEvent);
});

// Create a dummy element
const urlElement = document.createElement('a');

// Update the href attribute of the dummy element whenever the URL changes
(function (history) {
    var pushState = history.pushState;
    history.pushState = function (state) {
        pushState.apply(history, arguments);
        urlElement.href = window.location.href;
    };
})(window.history);

// Create a MutationObserver instance
const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
        const hrefChangeEvent = new CustomEvent('hrefchange', { detail: window.location.href });
        window.dispatchEvent(hrefChangeEvent);
    });
});

// Start observing the dummy element for attribute changes
observer.observe(urlElement, { attributes: true });

// Trigger an initial change to set the current URL
urlElement.href = window.location.href;

window.addEventListener('hrefchange', function (event) {
    handleNavigation(event.detail);
});


function convertToTitleCase(str) {
    if (!str) {
        return ""
    }
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase());
}
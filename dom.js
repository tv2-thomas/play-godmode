//@ts-check
let godModeElements = [];


function createInfoDiv(d, dom) {
    let container = document.createElement("div");
    let menu = document.createElement("div");
    let hamburger = document.createElement("div");

    // Style the container
    container.style.position = "absolute";
    container.style.top = "0px";
    container.style.right = "0px";
    container.style.display = "none"; // Initially hidden
    container.style.backgroundColor = "#ff0000"; // Red background
    container.style.flexDirection = "column";
    container.style.padding = "10px 40px 10px 10px"; // Padding inside the bubble
    container.style.borderRadius = "5px"; // Rounded edges

    // Addons
    for (let addon of GodModeInfoAddons) {
        let elem = addon(d, dom);
        if (typeof elem === "string") {
            elem = document.createTextNode(elem);
        }
        if (elem) {
            container.appendChild(elem);
        }
    }

    // Applying text alignment to button elements specifically
    const buttons = container.getElementsByTagName('button');
    for (let button of buttons) {
        button.style.textAlign = "left";
    }

    // Style the menu (hamburger icon)
    hamburger.innerHTML = "&#9776;"; // Hamburger icon
    hamburger.style.fontSize = "20px";
    hamburger.style.padding = "2px 8px";
    hamburger.style.cursor = "pointer";
    hamburger.style.position = "absolute";
    hamburger.style.top = "0px";
    hamburger.style.right = "0px";
    hamburger.style.color = "white";
    hamburger.style.backgroundColor = "#ff0000"; // Red background
    hamburger.style.zIndex = "8001"; // Make sure it stays on top
    hamburger.style.borderRadius = "5px"; // Rounded edges
    hamburger.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.5)"; // Subtle shadow



    // Toggle the display of the container on click
    hamburger.addEventListener('click', function() {
        container.style.display = container.style.display === "none" ? "flex" : "none";
    });

    // Append the hamburger and container to the menu
    menu.appendChild(hamburger);
    menu.appendChild(container);

    container.classList.add("godmode-info");

    // Hover effect to scale the bubble slightly
    hamburger.addEventListener('mouseover', function() {
        hamburger.style.transform = "scale(1.1)";
    });
    
    hamburger.addEventListener('mouseout', function() {
        hamburger.style.transform = "scale(1)";
    });

    container.style.zIndex = "8000"

    return menu;
}

function createToggleButton(onToggle) {
    const checkbox = document.createElement("input");
    checkbox.id = "godmodeinput";
    checkbox.type = "checkbox";
    checkbox.addEventListener("change", onToggle);

    const label = document.createElement("label");
    label.htmlFor = "godmodeinput";
    label.id = "godmodelabel";
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode("Toggle God mode"));

    label.style.display = "flex";
    label.style.gap = "8px";
    label.style.paddingLeft = "3rem";
    return label;
}

function cleanupDOM() {
    for (let element of godModeElements) {
        try {
            element.remove();
        } catch (err) {
            console.error(err);
        }
    }
}

function createIconedText(iconurl ,text) {
    const span = document.createElement("span");
    const icon = document.createElement("img");
    span.style.display = "flex";
    icon.src = iconurl;
    icon.style.width = "40px";
    icon.style.height = "40px";
    icon.style.marginRight = "5px";

    span.appendChild(icon);
    span.appendChild(document.createTextNode(text))
    return span;
}

function createLink(link, text, title="") {
    let linkElem = document.createElement("a");

    // If text is string add to TextContent, else assume it's a DOM element
    if (typeof text === "string") {
        linkElem.textContent = text;
    } else {
        linkElem.appendChild(text);
    }
    linkElem.href = link;
    if (title) {
        linkElem.title = title;
    }
    linkElem.style.cursor = "pointer";
    return linkElem
}

function createButton(text, func, cssClass) {
    let buttonElem = document.createElement("button");

    if (typeof text === "string") {
        buttonElem.textContent = text;
    } else {
        buttonElem.appendChild(text);
    }
    buttonElem.addEventListener("click", func);
    if (cssClass) {
        buttonElem.classList.add(cssClass);
    }
    return buttonElem

}

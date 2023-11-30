let godModeElements = [];


function createInfoDiv(d) {
    let div = document.createElement("div");
    for (let addon of GodModeInfoAddons) {
        let elem = addon(d);
        if (typeof elem === "string") {
            elem = document.createTextNode(elem);
        }
        if (elem) {
            div.appendChild(elem);
        }
    }

    div.style.position = "absolute";
    div.style.width = "200px";
    div.style.top = "0px";
    div.style.right = "0px";
    div.style.color = "white";
    div.style.backgroundColor = "#ff0000"; // Red background
    div.style.borderRadius = "10px"; // Rounded edges
    div.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)"; // Subtle shadow
    div.style.padding = "10px"; // Padding inside the bubble
    div.style.fontSize = "14px"; // Readable font size
    div.style.transition = "transform 0.2s"; // Smooth transition for hover effect
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.whiteSpace = "nowrap";
    div.style.textAlign = "left"; // Align content to the left
    
    // Applying text alignment to button elements specifically
    const buttons = div.getElementsByTagName('button');
    for (let button of buttons) {
        button.style.textAlign = "left";
    }

    div.classList.add("godmode-info");

    // Hover effect to scale the bubble slightly
    div.addEventListener('mouseover', function() {
        div.style.transform = "scale(1.1)";
    });
    
    div.addEventListener('mouseout', function() {
        div.style.transform = "scale(1)";
    });

    return div;
}

function createInfoDiv(d) {
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
        let elem = addon(d);
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
    hamburger.style.zIndex = "9999"; // Make sure it stays on top
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

function createLink(link, text, title="") {
    let linkElem = document.createElement("a");
    linkElem.textContent = text;
    linkElem.href = link;
    if (title) {
        linkElem.title = title;
    }
    linkElem.style.cursor = "pointer";
    return linkElem
}

function createButton(text, func, cssClass) {
    let buttonElem = document.createElement("button");
    buttonElem.textContent = text;
    buttonElem.addEventListener("click", func);
    if (cssClass) {
        buttonElem.classList.add(cssClass);
    }
    return buttonElem

}
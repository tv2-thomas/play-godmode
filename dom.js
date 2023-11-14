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
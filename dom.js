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
    div.style.fontWeight = "500";
    div.style.margin = "1rem";
    div.style.fontFamily = "monospace";
    div.style.borderRadius = "5px";
    div.style.backgroundColor = "#bb0000b5";
    div.style.padding = "1rem";
    div.style.display = "flex";
    div.style.flexDirection = "column";
    div.style.whiteSpace = "nowrap";
    
    div.classList.add("godmode-info");

    godModeElements.push(div)

    return div
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
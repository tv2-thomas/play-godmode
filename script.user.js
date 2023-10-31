// ==UserScript==
// @name         Play interceptor
// @namespace    http://tampermonkey.net/
// @version      0.1.5
// @description  Sniff play responses, and modify the view
// @author       Thomas Petersson
// @match        https://play.tv2.no/*
// @match        https://stage-sumo.tv2.no/*
// @icon         https://play.tv2.no/gfx/logo_1200x630.png
// @grant        none
// ==/UserScript==

let responses = {};
let godModeElements = [];
let userID;
let profileID;
let feedCssClass;

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
    while (!f()) await sleep(100);
    return f();
};

let dropdownDivPromise = () => waitFor(() => document.querySelector("#user-dropdown > div"));

// A list of functions that compose the contents of the red info box
// Each function should return an element to be appended to the info box
// and take a single parameter which can contain fields like content_id, title, image, etc.
// The functions are called in order, and the result is appended to the info box, and should fail gracefully
// Also supports just returning a string, these will be created into string nodes automatically
let GodModeInfoAddons = [
    addContentIDCopyable,
    addStatusLink,
    addBucketLink,
    () => "test"
];


// Inject a style tag for custom styling, like copy button hover color
waitFor(() => document.querySelector("head")).then(head => {
    var css = '.godmode-copy-button:hover{ color: #a6b4f1 }';
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

(async function () {
    'use strict';

    // Intercept fetch to read responses
    const { fetch: origFetch } = window;
    window.fetch = async (...args) => {
        const response = await origFetch(...args);
        if (!args[0].includes("v4/feed") && !args[0].includes("v4/content") && !args[0].includes("v5/related/content")) {
            return response;
        }

        const url = new URL(args[0]);
        const path = `${url.origin}${url.pathname}`;
        if (url.searchParams.get("userid")) {
            userID = url.searchParams.get("userid");
        }

        if (url.searchParams.get("profileid")) {
            profileID = url.searchParams.get("profileid");
        }

        response
            .clone()
            .json()
            .then(async (data) => {
                responses[path] = data;
            }).catch(err => console.error(err, args));

        return response;
    };

    if (!window.godmodeinput) {
        let dropdowndiv = await dropdownDivPromise();
        addGodModeToggle(dropdowndiv);
    }
})();

async function handleNavigation(href) {
    if (!isGodMode()) {
        return;
    }

    let path = (new URL(href)).pathname;

    let detailsPromise = waitFor(() => document.querySelector("[data-selenium-id='details-page']")).then((detailsPage) => handleDetailsPage(path));
    let feedPromise = waitFor(() => document.querySelector("[data-selenium-id='feeds-page']")).then((page) => handlePage(page));

    try {
        await Promise.race([detailsPromise, feedPromise]);
    } catch (err) {
        console.error(err);
    }
}


async function handleDetailsPage(path) {
    let tasks = [];

    let detailsResponse = await getDetailsResponse(path);
    if (!detailsResponse) {
        return;
    }

    tasks.push(
        populateDetailsPage(detailsResponse)
            .catch(err => console.error(err))
    );

    tasks.push(
        getRelatedResponse(detailsResponse)
            .then(relatedResponse => {
                if (relatedResponse) {
                    return populateFeeds(relatedResponse.feeds);
                }
            }).catch(err => console.error(err))
    );

    tasks.push(
        getActiveCollection(detailsResponse)
            .then(activeCollection => {
                if (activeCollection) {
                    return populateCollection(activeCollection);
                }
            }).catch(err => console.error(err))
    );

    await Promise.all(tasks);

    return true;
}

async function handlePage(DOMfeedsPage) {
    let DOMfeeds = await waitFor(() => DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-default']").length ?
        document.querySelectorAll("[data-selenium-id='feed-default']") :
        false);

    DOMfeeds = [...DOMfeeds, ...DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-buttons']")];
    DOMfeeds = [...DOMfeeds, ...DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-promoted']")];

    if (!DOMfeeds) {
        return;
    }

    let tasks = [];
    for (let DOMFeed of DOMfeeds) {
        let h2 = await waitFor(() => DOMFeed.querySelector("h2"));
        let restFeed = await getFeedResponse(h2.textContent);

        let textNode = document.createTextNode(` (${restFeed.id})`);
        h2.appendChild(textNode);
        godModeElements.push(textNode);

        let DOMfeedItems = await waitFor(() => DOMFeed.querySelectorAll("li").length - restFeed.content.length <= 1 ?
            DOMFeed.querySelectorAll("li") : false);
        let feedItemTasks = Array.from(DOMfeedItems).map(async (DOMItem) => {
            let h3 = DOMItem.querySelector("h3");
            if (h3) {
                let title = h3.textContent;
                let feedItemResponse = findFirst(restFeed.content, c => c.title === title);
                if (feedItemResponse) {
                    let infoDiv = createInfoDiv(feedItemResponse);
                    DOMItem.style.position = "relative";
                    DOMItem.appendChild(infoDiv);
                }
            } else {
                let img = await waitFor(() => DOMItem.querySelector("img"));
                let feedItemResponse = findFirst(restFeed.content, c => img.src.includes(c.image.src));
                if (feedItemResponse) {
                    let infoDiv = createInfoDiv(feedItemResponse);
                    DOMItem.style.position = "relative";
                    DOMItem.appendChild(infoDiv);
                }
            }
        });
        tasks.push(Promise.all(feedItemTasks));
    }

    await Promise.all(tasks);
    return true;
}
// INFO ADDONS
function addBucketLink(d){
    // Add link to image bucket
    let bucketLink = `https://console.cloud.google.com/storage/browser/codi-play-content-images/${env}/`;
    let imgurl = d.image.src;
    let regImg = /[a-z0-9]{24}/.exec(imgurl);

    if (regImg) {
        let imagepackid = regImg[0]
        let imglink = document.createElement("a");
        imglink.textContent = "Image bucket (wip)";
        imglink.href = bucketLink + imagepackid
        return imglink
    }
}

function addStatusLink(d){
        // Add link to statuspage
        if (d.content_id) {
            let link = document.createElement("a");
            link.textContent = "Status link";
            let [type, id] = d.content_id.split('-');
    
            if (type === "a") {
                link.href = `${statusURL}${id}`;
                return link
            }
        }
}

function addContentIDCopyable(d){
    if (!d && !d.content_id) {
        return;
    }
    let contentSpan = document.createElement("span");
    let copyButton = document.createElement("button");
    copyButton.textContent = "[Copy ";
    copyButton.classList.add("godmode-copy-button");
    copyButton.addEventListener("click", () => copyContent(d.content_id));
    copyButton.appendChild(document.createTextNode(d.content_id + "]"));
    contentSpan.appendChild(copyButton);
    contentSpan.style.display = "flex";
    contentSpan.style.gap = "8px";
    return contentSpan;
}

// REST
async function getFeedResponse(DOMfeedTitle) {
    return await waitFor(() => {
        let feedsResponses = []

        let feedKey = `${apiURL}/v4/feeds`;

        for (let key in responses) {
            if (key.includes(feedKey)) {
                feedsResponses.push(responses[key]);
            }
        }

        if (!feedsResponses.length) {
            feedKey = `${altApiURL}/v4/feeds`;
            for (let key in responses) {
                if (key.includes(feedKey)) {
                    feedsResponses.push(responses[key]);
                }
            }
        }

        if (!feedsResponses.length) {
            return;
        }

        for (let feedResponse of feedsResponses) {
            let feed = findFirst(feedResponse.feeds, f => f.title === DOMfeedTitle);
            if (feed) {
                return feed;
            }
        }
    });
}


async function getDetailsResponse(path) {
    return await waitFor(() => {
        let detailsKey = `${apiURL}/v4/content/path${path}`;
        let altdetailsKey = `${altApiURL}/v4/content/path${path}`;

        let response = responses[detailsKey];
        if (!response) {
            response = responses[altdetailsKey];
        }
        return response;
    });
}

async function getRelatedResponse(detailsResponse) {
    return await waitFor(() => {
        let relatedKey = `${apiURL}/v5/related/content/${detailsResponse.details.content_id}`;
        let relatedResponse = responses[relatedKey];
        if (!relatedResponse) {
            relatedKey = `${altApiURL}/v5/related/content/${detailsResponse.details.content_id}`;
            relatedResponse = responses[relatedKey];
        }

        return relatedResponse;
    });
}

async function getActiveCollection(detailsResponse) {
    return await waitFor(() => {
        let collectionKey;
        switch (detailsResponse.layout) {
            case "seasonal":
                collectionKey = "seasons";
                break;
        }

        if (collectionKey) {
            // Add listener to `aria-controls="season-select"` to listen for changes
            // #season-select needs eventlistener to retrigger populateCollection

            let collection = detailsResponse[collectionKey];
            if (!collection) {
                return;
            }
            let activeCollectionPath = collection.content[collection.selected_index].self_uri;

            let activeCollectionApiURL = `${apiURL}${activeCollectionPath}`;
            let activeCollectionAltApiURL = `${altApiURL}${activeCollectionPath}`;
            let activeCollection = responses[activeCollectionApiURL];

            if (!activeCollection) {
                activeCollection = responses[activeCollectionAltApiURL];
            }

            return activeCollection;
        }
    });
}



// DOM manipulation
async function onGodModeToggle({ target }) {
    if (target.checked) {
        if (target.checked === isGodMode()) {
            return;
        }
        localStorage.setItem("godmode", true);
        await handleNavigation(window.location.href);
    } else {
        localStorage.removeItem("godmode");

        for (let element of godModeElements) {
            try {
                element.remove();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

async function populateDetailsPage(detailsResponse) {
    let detailsTitle = await waitFor(() => document.querySelector("[data-selenium-id='details-page-title']"));

    let brEle = br();
    godModeElements.push(brEle);
    detailsTitle.appendChild(brEle);

    let textNode = document.createTextNode(`(${detailsResponse.details.content_id})`);
    godModeElements.push(textNode);
    detailsTitle.appendChild(textNode);
}

async function populateFeeds(restFeeds) {
    let feedLists = await waitFor(() => document.querySelectorAll("[data-selenium-id='feed-item-details']").length ?
        document.querySelectorAll("[data-selenium-id='feed-item-details']") :
        false);

    for (let feed of feedLists) {
        let title = feed.querySelector("h3").textContent;

        let restFeedItem;
        for (let restFeed of restFeeds) {

            restFeedItem = findFirst(restFeed.content, c => c.title === title);
            if (restFeedItem) {
                let infoDiv = createInfoDiv(restFeedItem);
                feed.appendChild(infoDiv);
                break;
            }
        }
    }
}

async function populateCollection(collection) {
    let detailsPage = await waitFor(() => document.querySelector("[data-selenium-id='details-page']"));
    // DOM might have a "show more" button that is added to this counter, allow for 1 in the length mismatch
    let collectionList = await waitFor(() => detailsPage.querySelectorAll(`section>section>div`).length - collection.content.length <= 1 ?
        detailsPage.querySelectorAll(`section>section>div`) :
        false);


    if (!collectionList) {
        return;
    }
    for (let item of collectionList) {
        if (!item.querySelector("h3")) {
            continue;
        }
        let title = item.querySelector("h3").textContent;
        let restItem = findFirst(collection.content, c => c.title === title);

        if (restItem) {
            let infoDiv = createInfoDiv(restItem);
            infoDiv.style.left = 0;
            infoDiv.style.top = 0;
            waitFor(() => item.querySelector("img")).then(img => img.parentNode.parentNode.parentNode.parentNode.appendChild(infoDiv));
        }
    }
}


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


function addGodModeToggle(dropdownsep) {
    console.debug("Adding Godmode toggle");
    if (!dropdownsep) {
        return;
    }

    let toggle = createToggleButton(onGodModeToggle);
    insertAfter(toggle, dropdownsep);
    window.godmodeinput.checked = isGodMode();
}

function isGodMode() {
    // ...
    return !!localStorage.getItem("godmode");
}

function br() { return document.createElement("br") }

function findFirst(list, fn) {
    for (let l of list) {
        if (fn(l)) {
            return l
        }
    }
}

function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
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

const copyContent = async (text) => {
    try {
        await navigator.clipboard.writeText(text);
    } catch (err) {
        console.error('Failed to copy: ', err);
    }
}
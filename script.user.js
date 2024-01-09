// ==UserScript==
// @name         Play interceptor
// @namespace    http://tampermonkey.net/
// @version      0.3.2
// @description  Sniff play responses, and modify the view
// @author       Thomas Petersson
// @match        https://play.tv2.no/*
// @match        https://discovery.sumo.tv2.no/*
// @match        https://stage-sumo.tv2.no/*
// @icon         https://play.tv2.no/gfx/logo_1200x630.png
// @require      ./utils.js
// @require      ./toggle.js
// @require      ./detailPage.js
// @require      ./dom.js
// @require      ./rest.js
// @require      ./addons.js
// @require      ./feedsPage.js
// @require      ./gridPage.js
// @grant        none
// ==/UserScript==

let userID;
let profileID;
let kidProfile = false;
let jwt;
let feedCssClass;

// A list of functions that compose the contents of the red info box
// Each function should return an element to be appended to the info box
// and take a single parameter which can contain fields like content_id, title, image, etc.
// The functions are called in order, and the result is appended to the info box, and should fail gracefully
// Also supports just returning a string, these will be created into string nodes automatically
let GodModeInfoAddons = [
    addContentIDCopyable,
    addStatusLink,
    addBucketLink,
    addCopyImagepack,
    addMuxReportLink,
    addVCCAsset,
];


(async function () {
    'use strict';

    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.includes("auth0spa")) {
            const storageItem = localStorage.getItem(key)
            const body = JSON.parse(storageItem)
            
            jwt = body.body.access_token;
            break;
        }
    }
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
    let feedGridPromise = waitFor(() => document.querySelector("[data-selenium-id='feed-page']")).then((page) => handleGridPage(page));

    try {
        await Promise.race([detailsPromise, feedPromise, feedGridPromise]);
    } catch (err) {
        console.error(err);
    }
}


async function handleGridPage(page) {
    let header = page.querySelector("h1").textContent;
    let restFeed = await getFeedResponse(header, true);

    let feedItemTasks = restFeed.content.map(async (feeditem) => {
        let DOMItem = page.querySelector(`[aria-label="${feeditem.title}"]`).parentNode.parentNode.parentNode;
        if (feeditem && DOMItem) {
            let infoDiv = createInfoDiv(feeditem);
            DOMItem.style.position = "relative";
            DOMItem.appendChild(infoDiv);
        }
    });
    await Promise.all(feedItemTasks);

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
    let DOMfeeds =  DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-default']")
    let DOMfeedButtons =  DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-buttons']")
    let DOMCWFeed =  DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-continue-watching']")
    let DOMfeedPromoted =  DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-promoted']")

    let DOMElements = [];
    for (let result of [DOMfeeds, DOMfeedButtons, DOMfeedPromoted, DOMCWFeed]) {
        if (result) {
            DOMElements.push(...result);
        }
    }

    if (!DOMElements) {
        return;
    }

    let tasks = [];
    for (let DOMFeed of DOMElements) {
        let h2 = await waitFor(() => DOMFeed.querySelector("h2"));
        let restFeed = await getFeedResponse(h2.textContent);

        let textNode = document.createTextNode(` (${restFeed.id})`);

        let gridView = createLink(document.location.origin + "/feed/" + restFeed.id, "[#️]", "Grid view")
        let vccviz = createLink(`https://vccviz.ai.gcp.tv2asa.no/vccviz/?page=${restFeed.id}`, "🧙🏻", "VCCVIZ")
        let vccviznerd = createLink(`https://vccviz.ai.gcp.tv2asa.no/vccviz/feedelement/?id=${restFeed.id}`, "🤓", "VCCVIZ Source")
        const summarizedFeed = createButton("📝", () => summarizeFeed(restFeed));

        let section = location.pathname === "/" ? "Forsiden" : location.pathname.split("/")[1];
        section = (section.charAt(0).toUpperCase() + section.slice(1)).replace("-", " ");
        section = encodeURIComponent(convertToTitleCase(section));
        let feedName = encodeURIComponent(restFeed.title);
        let looker = createLink(`https://looker.tv2.no/dashboards/1553?Feed+Name=${feedName}&Page+Title=Section+-+${section}`, "👀", `Looker: ${restFeed.title}`)
        
        h2.appendChild(textNode);
        h2.appendChild(gridView);
        h2.appendChild(vccviz);
        h2.appendChild(vccviznerd);
        h2.appendChild(looker);
        h2.appendChild(summarizedFeed);

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

// REST
async function getFeedResponse(DOMfeedTitle, grid = false) {
    return await waitFor(() => {
        let feedsResponses = []

        let feedKey = `${apiURL}/v4/${grid ? "feedgrid": "feeds"}`;

        for (let key in responses) {
            if (key.includes(feedKey)) {
                feedsResponses.push(responses[key]);
            }
        }

        if (!feedsResponses.length) {
            feedKey = `${altApiURL}/v4/${grid ? "feedgrid": "feeds"}`;
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
            if (grid && feedResponse.title === DOMfeedTitle) {
                return feedResponse;
            }

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
function getIds(data) {
    return data.content.map(item => item.content_id)
        .map(id => id.split("-"))
        .filter(([prefix, _]) => prefix === "a")
        .map(([_, id]) => id);
}

function summarizeFeed(feed) {
    let url = "https://dashboard.mux.com/organizations/2ftfvs/environments/hos1bf/data"
    //filters[0]=video_id:1928016&filters[1]=video_id:1928015&filters[2]=video_id"
    let gridUrl = `https://ai.sumo.tv2.no/v4/feedgrid/${feed.id}?size=100&start=0&userid=${userID}&profileid=${profileID}&kidsprofile=${kidProfile}`
    fetch(gridUrl, {
        headers: {
            "authorization": `Bearer ${jwt}`
        }
    }).then(res => res.json()).then(data => {
        let ids = getIds(data);
        let indx = 0;
        let filterString = ids.map(id => `filters[${indx++}]=video_id:${id}`).join("&");
        let finalUrl = encodeURI(`${url}?${filterString}&random=1`)
            console.log(finalUrl)
        window.open(finalUrl);
    })
}


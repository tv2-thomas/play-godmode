// ==UserScript==
// @name         Play interceptor
// @namespace    http://tampermonkey.net/
// @version      0.4.8
// @description  Sniff play responses, and modify the view
// @author       Thomas Petersson
// @match        https://play.tv2.no/*
// @match        https://discovery.sumo.tv2.no/*
// @match        https://stage-sumo.tv2.no/*
// @match        https://direktesport-dev.sumo.tv2.no/*
// @match        https://www.direktesport.no/*
// @match        https://direktesport.stage-sumo.tv2.no/*
// @icon         https://play.tv2.no/gfx/logo_1200x630.png
// @require      ./variables.js
// @require      ./utils.js
// @require      ./toggle.js
// @require      ./detailPage.js
// @require      ./dom.js
// @require      ./rest.js
// @require      ./infoAddons.js
// @require      ./feeds.js
// @require      ./feedsPage.js
// @require      ./gridPage.js
// @grant        none
// ==/UserScript==

// @ts-check
/// <reference path="./rest.js" />
/// <reference path="./feeds.js" />
// TODO: Clean up the ts-check errors
(async function () {
    'use strict';
    // Intercept fetch to read responses
    const { fetch: origFetch } = window;
    window.fetch = async (...args) => {
        let response;
        try {
         response = await origFetch(...args);
        } catch (err) {
            return response;
        }
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

    let detailsPromise = waitFor(() => document.querySelector("[data-selenium-id='details-page']")).then((_) => handleDetailsPage(path));
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
    let DOMfeedTopTen =  DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-top-ten']")
    let DOMfeedButtons =  DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-buttons']")
    let DOMCWFeed =  DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-continue-watching']")
    let DOMfeedPromoted =  DOMfeedsPage.querySelectorAll("[data-selenium-id='feed-promoted']")

    let DOMElements = [];
    for (let result of [DOMfeeds, DOMfeedTopTen, DOMfeedButtons, DOMfeedPromoted, DOMCWFeed]) {
        if (result) {
            DOMElements.push(...result);
        }
    }

    if (!DOMElements) {
        return;
    }

    let tasks = [];
    for (let DOMFeed of DOMElements) {
        let restFeed

        try {
            restFeed = await addFeedAddons(DOMFeed);
        }
        catch (err) {
            console.error(err);
            continue;
        }

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

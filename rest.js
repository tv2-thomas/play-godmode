//@ts-check
/// <reference path="./utils.js" />

let responses = {};

/**
 * 
 * @param {string} DOMfeedTitle - The title of the feed 
 * @param {boolean} grid - Whether or not the feed is a grid
 * @returns {Promise<Object>} - The feed response
 */
async function getFeedResponse(DOMfeedTitle, grid = false) {
    console.log(responses);
    return await waitFor(() => {
        const locationPathname = (new URL(window.location.href)).pathname;

        let pathKey = `${apiURL}/v4/content/path${locationPathname}`;
        let pathResponse = responses[pathKey];
        if (!pathResponse) {
            pathKey = `${altApiURL}/v4/content/path${locationPathname}`;
            pathResponse = responses[pathKey];
        }

        if (!pathResponse) {
            return;
        }

        let feedKey = `${apiURL}${pathResponse.feeds.self_uri}`;
        if (grid) {
            feedKey = feedKey.replace("feeds", "feedgrid");
        }

        for (let key in responses) {
            if (key.includes(feedKey)) {
                const feed = responses[key];
                for (let i = 0; i < feed.feeds.length; i++) {
                    const item = feed.feeds[i];
                    if (item.title === DOMfeedTitle) {
                        return item;
                    }
                }
            }
        }

        feedKey = `${altApiURL}${pathResponse.feeds.self_uri}`;
        if (grid) {
            feedKey = feedKey.replace("feeds", "feedgrid");
        }
        for (let key in responses) {
            if (key.includes(feedKey)) {
                const feed = responses[key];
                for (let i = 0; i < feed.feeds.length; i++) {
                    const item = feed.feeds[i];
                    if (item.title === DOMfeedTitle) {
                        return item;
                    }
                }
            }
        }

    });
}


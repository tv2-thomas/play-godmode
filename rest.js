//@ts-check

let responses = {};

/**
 * 
 * @param {string} DOMfeedTitle - The title of the feed 
 * @param {boolean} grid - Whether or not the feed is a grid
 * @returns {Promise<Object>} - The feed response
 */
async function getFeedResponse(DOMfeedTitle, grid = false) {
    return await waitFor(() => {
        let feedsResponses = []

        const locationPathname = (new URL(window.location.href)).pathname;
        const pathResponse = responses[`${apiURL}/v4/content/path${locationPathname}`];
        if (!pathResponse) {
            return;
        }
        let feedKey = apiURL
        if (grid) {
            feedKey += pathResponse.feed.self_uri;
        } else {
            feedKey += pathResponse.feeds.self_uri
        }

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


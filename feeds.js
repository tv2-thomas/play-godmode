// @ts-check

// This file handles adding information to the header of individual feeds
/// <reference path="./dom.js" />
/// <reference path="./variables.js" />
/// <reference path="./utils.js" />
/// <reference path="./rest.js" />

const FEEDADDONS = [
    addFeedGridButton,
    addFeedVCCVIZ,
    addFeedVCCVIZNerd,
    addFeedAggregatedToMux,
    addFeedLooker,
]
/**
 * Modifies the dom element to add feed-addons in a hamburger menu
* @param {HTMLElement} dom - The DOM of the feed
* @returns {Promise<Object>} - The rest of the information
*/
async function addFeedAddons(dom) {
    const h2 = await waitFor(() => dom.querySelector("h2"));
    const restFeed = await getFeedResponse(h2.textContent);
    const elems = [];
    for (let addon of FEEDADDONS) {
        const addonDom = addon(restFeed)
        godModeElements.push(addonDom)
        elems.push(addonDom)
    }
    const menu = createHamburgerMenu(elems);
    h2.appendChild(document.createTextNode(`(${restFeed.id})`));  
    h2.appendChild(menu);
    return restFeed
}

function createHamburgerMenu(elems) {
    // Creates a hamburger icon that opens a div when clicked, containing the domElem
    const wrapper = document.createElement("div");
    const menu = document.createElement("div");
    menu.style.display = "none";
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.zIndex = "9002";
    menu.style.flexDirection = "column";
    menu.style.backgroundColor = "#ff0000";
    menu.style.padding = "10px";
    menu.style.borderRadius = "5px";
    menu.style.zIndex = "9001";
    menu.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.5)";
    menu.style.overflow = "auto";
    menu.style.maxHeight = "80vh";
    menu.style.width = "50vw";
    menu.style.minWidth = "300px";
    menu.style.maxWidth = "500px";
    menu.style.position = "absolute";
    menu.style.top = "110px";
    menu.style.left = "40px";

    for (let elem of elems) {
        menu.appendChild(elem);
    }

    const hamburger = createHamburger();
    hamburger.addEventListener('click', function () {
        menu.style.display = menu.style.display === "none" ? "flex" : "none";
    });
    wrapper.appendChild(hamburger);
    wrapper.appendChild(menu);
    return wrapper;
}
function createHamburger() {
    const hamburger = document.createElement("span");
    hamburger.textContent = "🍔";
    hamburger.style.cursor = "pointer";
    hamburger.style.marginLeft = "1rem";
    hamburger.style.marginRight = "1rem";
    hamburger.style.transform = "scale(1)";
    hamburger.style.transition = "transform 0.2s";
    hamburger.addEventListener('mouseover', function () {
        hamburger.style.transform = "scale(1.1)";
    });

    hamburger.addEventListener('mouseout', function () {
        hamburger.style.transform = "scale(1)";
    });

    return hamburger;
}

//All the addons below here are added to the hamburger menu, so they need to return
//a dom element that will be added to the menu

/**
 * Adds a button to the hamburger menu that will open the feed in a grid
 * @param {Object} rest - The rest of the information
 * @returns {HTMLElement} - The DOM of the feed with the button added
 */
function addFeedGridButton(rest) {
    const div = document.createElement('div')
    const iconedText = createIconedText("https://play.tv2.no/gfx/logo_1200x630.png", "Gridview")
    const gridView = createLink(document.location.origin + "/feed/" + rest.id, iconedText, "Grid view")
    div.appendChild(gridView)
    return div
}

/**
 * Adds a link to the hamburger menu that will open the feed in VCCVIZ
 * @param {Object} rest - The rest of the information
 * @returns {HTMLElement} - The DOM of the feed with the button added
    */
function addFeedVCCVIZ(rest) {
    const div = document.createElement('div')
    const iconedText = createIconedText(VCCVIZICON, "VCC VIZ")
    const vccviz = createLink(`https://vccviz.ai.gcp.tv2asa.no/vccviz/?page=${rest.id}`, iconedText, "VCCVIZ")
    div.appendChild(vccviz)
    return div
}

/**
 * Adds a link to the hamburger menu that will open the feed in VCCVIZ Nerd
 * @param {Object} rest - The rest of the information
 * @returns {HTMLElement} - The DOM of the feed with the button added
    */
function addFeedVCCVIZNerd(rest) {
    const div = document.createElement('div')
    const iconedText = createIconedText(VCCVIZICON, "VCC VIZ Source")
    const vccviznerd = createLink(`https://vccviz.ai.gcp.tv2asa.no/vccviz/feedelement/?id=${rest.id}`, iconedText, "VCCVIZ Source")
    div.appendChild(vccviznerd)
    return div
}

/**
 * Adds a link to the hamburger menu that will open the feed in Mux
 * @param {Object} rest - The rest of the information
 * @returns {HTMLElement} - The DOM of the feed with the button added
    */
function addFeedAggregatedToMux(rest) {
    const muxIcon = "https://dashboard.mux.com/favicon.png";
    const div = document.createElement('div')
    const iconedText = createIconedText(muxIcon, "Mux - Aggregated")
    const summarizedFeed = createButton(iconedText, () => summarizeFeed(rest));
    div.appendChild(summarizedFeed)
    return div
}
/**
    * Callback for feed aggregate to mux button
    * @param {Object} feed - The feed to summarize
    */
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
        window.open(finalUrl);
    })
}

/**
 * Adds a link to the hamburger menu that will open the feed in Looker
 * @param {Object} rest - The rest of the information
 * @returns {HTMLElement} - The DOM of the feed with the button added
    */
function addFeedLooker(rest) {
    const lookerIcon = "https://looker.tv2.no/images/favicon.ico";
    const div = document.createElement('div') 
    let section = location.pathname === "/" ? "Forsiden" : location.pathname.split("/")[1];
    section = (section.charAt(0).toUpperCase() + section.slice(1)).replace("-", " ");
    section = encodeURIComponent(convertToTitleCase(section));

    const feedName = encodeURIComponent(rest.title);
    const iconedText = createIconedText(lookerIcon, "Looker")
    const looker = createLink(`https://looker.tv2.no/dashboards/1553?Feed+Name=${feedName}&Page+Title=Section+-+${section}`, iconedText, `Looker: ${rest.title}`)
    div.appendChild(looker)
    return div
}
    










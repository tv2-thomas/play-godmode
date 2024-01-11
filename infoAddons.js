//@ts-check

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


/**
 * 
 * @param {{content_id:string}} d 
 * @returns 
 */
function addContentIDCopyable(d){
    if (!d && !d.content_id) {
        return;
    }
    return createButton(`[Copy ${d.content_id}]`, () => copyContent(d.content_id), "godmode-copy-button");
}

/**
 * 
 * @param {{content_id:string}} d 
 * @returns 
 */
function addStatusLink(d){
    // Add link to statuspage
    if (!d.content_id) {
        return;
    }

    let [type, id] = d.content_id.split('-');
    if (type === "a") {
        return createLink(`${statusURL}${id}`, "Status link")
    }
}

/**
 * addMuxReportLink - Adds a link to the mux report for the content
 * @param {{content_id:string}} d
 */
function addMuxReportLink(d) {
    const muxReportLink = `https://dashboard.mux.com/organizations/2ftfvs/environments/hos1bf/data?filters[]=video_id%3A`
    
    let [type, id] = d.content_id.split('-');
    if (type === "a") {
        return createLink(`${muxReportLink}${id}`, "Mux link")
    }
}

/** 
 * addVCCAsset - Adds a link to the VCC asset for the content
 * @param {{content_id:string}} d
 */
function addVCCAsset(d) {
    const vccassetLink = `https://vcc.tv2asa.no/cms/embed?modulepath=/content/assets/`

    let [type, id] = d.content_id.split('-');
    if (type === "a") {
        return createLink(`${vccassetLink}${id}`, "VCC asset")
    }
}

/**
 * 
 * @param {{image:{src:string}}} d 
 * @returns 
 */
function addBucketLink(d){
    // Add link to image bucket
    let bucketLink = `https://console.cloud.google.com/storage/browser/codi-play-content-images-ew1/${env}/`;
    let imgurl = d.image.src;
    let s = imgurl.split("_");
    if (s.length > 1) {
        imgurl = s[1];
    }
    let regImg = /[a-z0-9]{24}/.exec(imgurl);

    if (regImg && regImg.length > 0) {
        return createLink(bucketLink + regImg[0], "Image bucket (wip)")
    }
}

/**
 * 
 * @param {{image:{src:string}}} d 
 * @returns 
 */
function addCopyImagepack(d){
    // Add link to image bucket
    let imgurl = d.image.src;
    let s = imgurl.split("_");
    if (s.length > 1) {
        imgurl = s[1];
    }
    let regImg = /[a-z0-9]{24}/.exec(imgurl);

    if (regImg != undefined && regImg.length > 0) {
        return createButton(`[Copy imgpack]`, () => copyContent(regImg[0]), "godmode-copy-button");
    }
}


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
 * 
 * @param {{image:{src:string}}} d 
 * @returns 
 */
function addBucketLink(d){
    // Add link to image bucket
    let bucketLink = `https://console.cloud.google.com/storage/browser/codi-play-content-images-ew1/${env}/`;
    let imgurl = d.image.src;
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
    let regImg = /[a-z0-9]{24}/.exec(imgurl);

    if (regImg && regImg.length > 0) {
        return createButton(`[Copy imgpack]`, () => copyContent(regImg[0]), "godmode-copy-button");
    }
}

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
    addGotoDetails,
    copyImageUrlVariants,
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
    if (!d || !d.image || !d.image.src) {
        return;
    }
    // Add link to image bucket
    let bucketLink = `https://console.cloud.google.com/storage/browser/codi-play-content-images-ew1/${env}/`;
    let imgurl = d.image.src;
    let regImg = /[a-z0-9]{24}/.exec(imgurl);

    if (!regImg || regImg.length == 0) {
        return;
    }

    const link = createLink(bucketLink + regImg[0], "Image bucket");
    
    let s = imgurl.split("_");
    if (s.length == 0) {
        return link;
    }

    const regImg2 = /[a-z0-9]{24}/.exec(s[1]);
    if (!regImg2 || regImg2.length == 0) {
        return link;
    }

    const span = document.createElement("span");
    span.appendChild(link);
    span.appendChild(br());
    span.appendChild(createLink(bucketLink + regImg2[0], "Image bucket (override)"));

    return span;
}

/**
 * 
 * @param {{image:{src:string}}} d 
 * @returns 
 */
function addCopyImagepack(d){
    if (!d || !d.image || !d.image.src) {
        return;
    }
    // Add link to image bucket
    let imgurl = d.image.src;
    let regImg = /[a-z0-9]{24}/.exec(imgurl);
    
    if (!regImg || regImg.length == 0) {
        return;
    }

    const btn = createButton(`[Copy imgpack]`, () => copyContent(regImg[0]), "godmode-copy-button");
    let s = imgurl.split("_");
    if (s.length == 1) {
        return btn;
    }

    const regImg2 = /[a-z0-9]{24}/.exec(s[1]);
    if (!regImg2 || regImg2.length == 0) {
        return btn;
    }

    const span = document.createElement("span");
    const overrideBtn = createButton(`[Copy override]`, () => copyContent(regImg2[0]), "godmode-copy-button");
    span.appendChild(btn);
    span.appendChild(br());
    span.appendChild(overrideBtn);
    return span;
}

function addGotoDetails(d, dom) {
    const a = dom.querySelector("a")
    if (a && a.href && a.href.includes("play=true")) {
        return createLink(a.href.replaceAll("play=true", ""), "Go to details");
    };
    
}

function copyImageUrlVariants(d, dom) {
    if (!d || !d.image || !d.image.src) {
        return;
    }

    let src = d.image.src;
    let s = src.split("_");
    if (s.length > 1) {
        src = s[1]
    }

    const regImg2 = /[a-z0-9]{24}/.exec(src);
    if (!regImg2 || regImg2.length == 0) {
        return;
    }
    const imagepackid = regImg2[0];

    let url = d.image.src
    const wrapper = document.createElement("div");
    const dropdown = document.createElement("select");
    const locationdropdown = document.createElement("select");
    dropdown.style.color="black";
    locationdropdown.style.color="black";

    // Select a size to copy and make a button that copies it
    const sizes = [
        { name: "Original", size: "" },
        { name: "Small", size: "_small" },
        { name: "Medium", size: "_medium" },
        { name: "Large", size: "_large" },
        { name: "4K", size: "_xlarge" },
    ];

    const locations = [
        { name: "Original", location: "" },
        { name: "main", location: "main" },
        { name: "identity", location: "identity" },
        { name: "identity16x9", location: "identity16x9" },
        { name: "list", location: "list" },
        { name: "moviePoster", location: "moviePoster" },
        { name: "list32x9", location: "list32x9" },
    ]

    sizes.forEach(s => {
        const option = document.createElement("option");
        option.value = s.size;
        option.innerText = s.name;
        dropdown.appendChild(option);
    });

    locations.forEach(s => {
        const option = document.createElement("option");
        option.value = s.location;
        option.innerText = s.name;
        locationdropdown.appendChild(option);
    });

    const copyButton = document.createElement("button");
    copyButton.innerText = "Copy";
    copyButton.addEventListener("click", () => {
        if (dropdown.value === "" && locationdropdown.value === "") {
            copyContent(dom.querySelector("img").src);
            return;
        }

        if (dropdown.value === "") {
            copyContent(url + "?location="+ locationdropdown.value)
            return;
        }

        copyContent(url + "?location="+ locationdropdown.value + "&width=" + dropdown.value)
    });

    wrapper.appendChild(locationdropdown);
    wrapper.appendChild(dropdown);
    wrapper.appendChild(copyButton);

    return wrapper;
}
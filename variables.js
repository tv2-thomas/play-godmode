//@ts-check


let userID;
let profileID;
let kidProfile = false;
let jwt;
let feedCssClass;


(function () {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.includes("auth0spa")) {
            const storageItem = localStorage.getItem(key)
            const body = JSON.parse(storageItem)
            
            jwt = body.body.access_token;
            break;
        }
    }
}());

'use strict';

const clean = () => {
    console.log('clean');
    clearDefaultCookies();
    clearNamedCookies();
    clearIndexDB();
    clearLocalStorage();
}

/**
 * Finds all non container cookies and deletes them
 */
const clearDefaultCookies = async () => {
    const nonContainerCookies = await browser.cookies.getAll({ storeId: 'firefox-default' });
    nonContainerCookies.forEach(cookie => removeCookie(cookie));
};

/**
 * Find persistent containers, then for each find the cookies which belong to a different domain and remove them
 * This is not as important now thanks to total cookie protection
 */
const clearNamedCookies = async () => {
    const contextIds = await browser.contextualIdentities.query({})
    const persistentCIs = contextIds.filter(contextId => !contextId.name.includes('Persistent'))
    persistentCIs.forEach(contextId => browser.cookies.getAll({storeId: contextId.cookieStoreId}).then(cookies => cookies
    .filter(cookie => !cookie.domain.includes(contextId.name.toLowerCase()))
    .forEach(cookie => removeCookie(cookie))))

};

/**
 * Deletes a cookie
 * @param {Object} cookie 
 * @returns 
 */
const removeCookie = cookie => browser.cookies.remove({
        storeId: cookie.storeId,
        name: cookie.name,
        url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`
    }).then(response => console.log(response));

const clearIndexDB = () => browser.browsingData.remove({
        cookieStoreId: 'firefox-default'
    },{
        indexedDB: true,
        cache: true,
        serverBoundCertificates: true,
        serviceWorkers: true,
        formData: true
    }
);

// const clearLocalStorage = () => browser.tabs.query({ cookieStoreId: 'firefox-default' }).then(tabs => tabs
//     .forEach(tab => browser.tabs.sendMessage(tab.id, { clearLocalStorage: true })));
    

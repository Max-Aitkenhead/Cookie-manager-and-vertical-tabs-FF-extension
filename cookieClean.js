'use strict';

const clean = async () => {

    await Promise.all([
        clearDefaultCookies(),
        clearNamedCookies(),
    ]); 

    // clearIndexDB();
    // clearLocalStorage();
}



/**
 * Finds all non container cookies and deletes them
 */
const clearDefaultCookies = async () => {
    const nonContainerCookies = await browser.cookies.getAll({ storeId: 'firefox-default' });
    nonContainerCookies.forEach(cookie => removeCookie(cookie));
};

/**
 * Find named containers, then for each find the cookies which belong to a different domain and remove them
 * This is not as important now thanks to total cookie protection
 */
const clearNamedCookies = async () => {
    const contextIds = await browser.contextualIdentities.query({});
    const persistentCIs = contextIds.filter(contextId => !contextId.name.includes('Persistent'));
    persistentCIs.forEach(async contextId => {
        const cookies = await browser.cookies.getAll({ storeId: contextId.cookieStoreId });
        const customContainerConfig = containerConfig.customNamedContainers.find(cnc => contextId.name.toLowerCase() === cnc.name);
        const cookiesToRemove = cookies.filter(cookie => {
            if (customContainerConfig === undefined) return !cookie.domain.includes(contextId.name.toLowerCase());
            return customContainerConfig.whiteListDomains.reduce((a, b) => !cookie.domain.includes(b) && a, true);
        })
        cookiesToRemove.forEach(cookie => removeCookie(cookie));
    })
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
}).then(response => { });

const clearIndexDB = () => browser.browsingData.remove({
    cookieStoreId: 'firefox-default'
}, {
    indexedDB: true,
    // cache: true,
    serverBoundCertificates: true,
    serviceWorkers: true,
    formData: true
}
);

// const clearLocalStorage = () => browser.tabs.query({ cookieStoreId: 'firefox-default' }).then(tabs => tabs
//     .forEach(tab => browser.tabs.sendMessage(tab.id, { clearLocalStorage: true })));


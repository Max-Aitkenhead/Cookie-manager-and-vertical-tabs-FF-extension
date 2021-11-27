const clean = () => {
    console.log('clean');
    clearDefaultCookies();
    clearNamedCookies();
    clearIndexDB();
    clearLocalStorage();
}

const clearDefaultCookies = () => browser.cookies.getAll({ storeId: 'firefox-default' }).then(cookies => cookies
    .forEach(cookie => removeCookie(cookie)));

const clearNamedCookies = () => browser.contextualIdentities.query({}).then(contextIds => contextIds
    .filter(contextId => !contextId.name.includes('Persistent'))
    .forEach(contextId => browser.cookies.getAll({storeId: contextId.cookieStoreId}).then(cookies => cookies
    .filter(cookie => !cookie.domain.includes(contextId.name.toLowerCase()))
    .forEach(cookie => removeCookie(cookie)))));

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

const clearLocalStorage = () => browser.tabs.query({ cookieStoreId: 'firefox-default' }).then(tabs => tabs
    .forEach(tab => browser.tabs.sendMessage(tab.id, { clearLocalStorage: true })));
    

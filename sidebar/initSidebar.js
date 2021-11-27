browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    setTimeout(() => updateSidebar(), 200);
});

browser.tabs.onUpdated.addListener((tabId, updateInfo, tabInfo) => {
    if (updateInfo.hasOwnProperty('status') && updateInfo.status !== 'loading')
        return;
    updateSidebar();
}, {
    properties:['attention', 'status']
});

let backgroundPage;
browser.runtime.getBackgroundPage().then(bp => backgroundPage = bp, 
    error => console.log(error));

const updateSidebar = () => {
    const containers = [];

    // Dependancy Injection - get tabs without a container => get contextIds => foreach contextId => get tabs in contextId
    browser.tabs.query({cookieStoreId: 'firefox-default'})
        .then(plainTabs => browser.contextualIdentities.query({})
        .then(contextualIdentities => contextualIdentities
        .forEach((contextualIdentity, i) => browser.tabs.query({ cookieStoreId: contextualIdentity.cookieStoreId })
        .then(contextualIdentityTabs => {

            // populate containers array
            containers.push(getCookieStoreObj(contextualIdentity, contextualIdentityTabs));

            //pass out containers array when finished populating
            if (i == contextualIdentities.length - 1) {
                containers.push(getCookieStoreObj({
                    cookieStoreId: 'firefox-default',
                    colorCode: 'black',
                    name: 'No Container'
                }, plainTabs));
                if (checkEmptyContainers(containers)) {
                    updateSidebar();
                    return;
                }
                writehtml(containers)
            };
        }))));
}

const checkEmptyContainers = containers => {
    const emptyContainers = containers.filter(container => container.contextId.name.includes('Persistent') && container.tabs.length === 0);
    if (emptyContainers.length === 0) return false
    emptyContainers.forEach(filteredContainer => browser.contextualIdentities.remove(filteredContainer.contextId.cookieStoreId));
    return true;
}

const getCookieStoreObj = (contextId, tabs) => ({
    contextId: contextId,
    tabs: tabs
})


updateSidebar();

const bpProm = browser.runtime.getBackgroundPage();

const updateSidebar = async () => {
    console.log('update');
    const bp = await bpProm;
    const plainTabs = await browser.tabs.query({cookieStoreId: 'firefox-default'});
    const contextualIdentities = await browser.contextualIdentities.query({});
    const cookieStoreObjs = await Promise.all(contextualIdentities.map(async contextId => {
        const contextualIdentityTabs = await browser.tabs.query({ cookieStoreId: contextId.cookieStoreId });
        const ciwt = Object.assign(contextId, {tabs: contextualIdentityTabs});
        console.log(ciwt);
        return getCookieStoreObj(contextId, contextualIdentityTabs);
    }))
    const containers = [].concat(getCookieStoreObj(defaultContextIdObj, plainTabs), cookieStoreObjs);
    checkEmptyContainers(containers);
    writehtml(containers, bp);
}

const checkEmptyContainers = containers => {
    const emptyContainers = containers.filter(container => container.contextId.name.includes('Persistent') && container.tabs.length === 0);
    if (emptyContainers.length === 0) return false
    emptyContainers.forEach(filteredContainer => browser.contextualIdentities.remove(filteredContainer.contextId.cookieStoreId));
    return true;
}


// convenient object made for passing in data to the html builder
const getCookieStoreObj = (contextId, tabs) => ({
    contextId: contextId,
    tabs: tabs
})

const defaultContextIdObj = {
    cookieStoreId: 'firefox-default',
    colorCode: 'black',
    name: 'No Container'
};


updateSidebar();
setTimeout(() => bpProm.then(bp => initSidebarhtml(bp)), 100);

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

document.addEventListener( "contextmenu", function(e) {
    e.preventDefault();
    toggleContextMenu(e.target);
});


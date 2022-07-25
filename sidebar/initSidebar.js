'use strict';

const bpProm = browser.runtime.getBackgroundPage();

const updateSidebar = async () => {
    console.log('update');
    const bp = await bpProm;
    const plainTabs = await browser.tabs.query({cookieStoreId: 'firefox-default'});
    const contextualIdentities = await browser.contextualIdentities.query({});
    const ciWithTabs = await Promise.all(contextualIdentities.map(async contextId => {
        const contextualIdentityTabs = await browser.tabs.query({ cookieStoreId: contextId.cookieStoreId });
        return Object.assign(contextId, {tabs: contextualIdentityTabs});
    }))
    const containers = [defaultContextIdObj(plainTabs), ...ciWithTabs];
    const filteredContainers = checkEmptyContainers(containers);
    writehtml(filteredContainers, bp);
}

const checkEmptyContainers = containers => {
    const emptyContainers = containers.filter(container => container.name.includes('Persistent') && container.tabs.length === 0);
    if (!emptyContainers.length) return containers;
    emptyContainers.forEach(filteredContainer => browser.contextualIdentities.remove(filteredContainer.cookieStoreId));
    return containers.filter(container => !(container.name.includes('Persistent') && container.tabs.length === 0));
}

const defaultContextIdObj = _tabs => ({
    cookieStoreId: 'firefox-default',
    colorCode: 'black',
    name: 'No Container',
    tabs: _tabs
});

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


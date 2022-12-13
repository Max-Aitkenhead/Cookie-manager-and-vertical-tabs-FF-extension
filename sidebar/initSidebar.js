'use strict';

const updateSidebar = async () => {
    const windowInfo = await browser.windows.getCurrent({ populate: true });
    console.log('updateTabBar');
    const plainTabs = await browser.tabs.query({cookieStoreId: 'firefox-default', windowId: windowInfo.id});
    const contextualIdentities = await browser.contextualIdentities.query({});
    const ciWithTabs = contextualIdentities.flatMap(contextId => {
        const contextualIdentityTabs = windowInfo.tabs.filter(tab => tab.cookieStoreId === contextId.cookieStoreId);
        if (!contextualIdentityTabs.length) return []; // if no tabs in current window, don't show the container
        return { ...contextId, tabs: contextualIdentityTabs };
    });
    const containers = [defaultContextIdObj(plainTabs), ...ciWithTabs];
    writehtml(containers);
}

const defaultContextIdObj = _tabs => ({
    cookieStoreId: 'firefox-default',
    colorCode: 'black',
    name: 'No Container',
    tabs: _tabs
});

updateSidebar();
setTimeout(() => initSidebarhtml(), 100);

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    setTimeout(() => updateSidebar(), 200);
});

browser.tabs.onActivated.addListener(() => {
    updateSidebar();
});

document.addEventListener( "contextmenu", function(e) {
    e.preventDefault();
    toggleContextMenu(e.target);
});


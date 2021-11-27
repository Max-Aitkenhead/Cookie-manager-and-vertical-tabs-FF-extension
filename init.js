browser.commands.onCommand.addListener(command => command === 'toggle_sidebar' ? browser.sidebarAction.toggle() : void(0));

browser.tabs.onRemoved.addListener((tabId, removeInfo) => clean());

browser.tabs.onUpdated.addListener((tabId, updateInfo, tabInfo) => {
    if (updateInfo.hasOwnProperty('attention') && updateInfo.attention === false)
        clean();
}, {
    properties:['attention']
});

browser.webRequest.onBeforeRequest.addListener(async requestDetails => {
        const cancel = (returnVal = true) => {
            if (!returnVal) return { cancel: false }
            browser.tabs.sendMessage(requestDetails.tabId, {
                    sendFrame: true,
                    frameUrl: requestDetails.url
                }
            );
            return { cancel: true };
        }
        // allow iframes in nebula container
        if (requestDetails.originUrl.includes('nebula')) return { cancel: false };
        // block iframes in the default container
        if (requestDetails.cookieStoreId === 'firefox-default') return cancel();
        // block iframes in named containers but not in persistent containers
        return await browser.contextualIdentities.get(requestDetails.cookieStoreId)
        .then(contextId => cancel(!contextId.name.includes('Persistent')));
    },
    {
        types: ["sub_frame", "object"],
        urls: ["<all_urls>"],
    },
    ["blocking", "requestBody"]
);

browser.webRequest.onBeforeRequest.addListener(() => ({ cancel: true }),
    {
        types: ["beacon", "ping"],
        urls: ["<all_urls>"],
    },
    ["blocking"]
);

// experimental blocking all javascript in default container

// browser.webRequest.onBeforeRequest.addListener(async requestDetails => { 
//         if (requestDetails.cookieStoreId === 'firefox-default') return { cancel: true };
//     },
//     {
//         types: ["script"],
//         urls: ["<all_urls>"],
//     },
//     ["blocking", 'requestBody']
// );

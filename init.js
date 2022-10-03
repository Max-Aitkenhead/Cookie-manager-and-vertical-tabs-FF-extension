'use strict';

// adds event listener for tabs sidebar
browser.commands.onCommand.addListener(command => command === 'toggle_sidebar' ? browser.sidebarAction.toggle() : void(0));

// calls cookie cleaner when a tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => clean());

// calls cookie cleaner when tabs are updated
browser.tabs.onUpdated.addListener((tabId, updateInfo, tabInfo) => {
    if (updateInfo.hasOwnProperty('attention') && updateInfo.attention === false)
        clean();
}, {
    properties:['attention']
});

// blocks certain http requests
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

        if (requestDetails.originUrl.includes('typekit')) {
            return cancel();

        }
        // allow iframes in nebula container
        if (requestDetails.originUrl.includes('nebula')) return { cancel: false };
        if (requestDetails.url.includes('reddit.com/message')) return { cancel: false };
        // block iframes in the default container
        if (requestDetails.cookieStoreId === 'firefox-default') return cancel();
        // block iframes in named containers but not in persistent containers
        const contextId = await browser.contextualIdentities.get(requestDetails.cookieStoreId)
        return cancel(!contextId.name.includes('Persistent'))
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

browser.webRequest.onBeforeRequest.addListener(requestBody => {
        console.log(requestBody);
        return { cancel: true }
    },
    {
        urls: ["https://use.typekit.net/*"],
    },
    ["blocking", "requestBody"]
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

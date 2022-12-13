'use strict';

const containerColours = [
    "green",
    "yellow",
    "orange",
    "pink",
    "red",
    "purple",
    "blue",
    "turquoise"
];

// extracts number from contextId name, slice an extra digit if the length is longer
const getCINameNo = CIname => parseInt(CIname.length === 20 ? CIname.slice(-1) : CIname.slice(-2));

// finds the lowest possible number for a new container not currently in use
const getNewContainerNum = (contextIds, n = 0) => contextIds.filter(contextId =>
    getCINameNo(contextId.name) === n).length < 1 ? n : getNewContainerNum(contextIds, n + 1);


// cycles through the colours when creating tabs
const getNewContainerColour = n => containerColours[n % containerColours.length];

const newContainer = async (url = 'about:blank') => {
    const contextualIdentities = await browser.contextualIdentities.query({});
    const containerNo = getNewContainerNum(contextualIdentities);
    const newContextualIdentity = await browser.contextualIdentities.create({
        name: `Persistent Cookies ${containerNo}`,
        color: getNewContainerColour(containerNo),
        icon: 'circle'
    })
    await newTab(newContextualIdentity.cookieStoreId, url);
}

const newTab = async (cookieStoreId, url = 'about:blank') => {
    await browser.tabs.create({
        active: true,
        cookieStoreId: cookieStoreId,
        url: url,
    });
};

const removeEmptyContainers = async () => {
    const contextIds = await browser.contextualIdentities.query({});
    contextIds.filter(contextId => contextId.name.includes('Persistent')).forEach(async contextId => {
        const tabsInContextId = await browser.tabs.query({cookieStoreId: contextId.cookieStoreId});
        if (!tabsInContextId.length) browser.contextualIdentities.remove(contextId.cookieStoreId);
    });
}


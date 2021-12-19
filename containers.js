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

// extracts number from contextId name, slice an extra digit if the length ia longer
var getCINameNo = CIname => parseInt(CIname.length === 20 ? CIname.slice(-1) : CIname.slice(-2));

 // finds the lowest possible number for a new container not currently in use
const getNewContainerNum = (contextIds, n = 0) => contextIds.filter(contextId => 
        getCINameNo(contextId.name) === n).length < 1 ? n : getNewContainerNum(contextIds, n + 1);


// cycles through the colours when creating tabs
const getNewContainerColour = n => containerColours[n % containerColours.length];

var newContainer = (url = 'about:blank') => {
        browser.contextualIdentities.query({}).then(contextIds => {
            const containerNo = getNewContainerNum(contextIds);
            browser.contextualIdentities.create({
                name: `Persistent Cookies ${containerNo}`,
                color: getNewContainerColour(containerNo),
                icon: 'circle'
        }).then(ci => newTab(ci.cookieStoreId, url));
    });
}

var newTab = (cookieStoreId, url = 'about:blank') => browser.tabs.create({
    active: true,
    cookieStoreId: cookieStoreId,
    url:url
});

const getContextIds = () => browser.contextualIdentities.query({});


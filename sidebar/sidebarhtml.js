'use strict';

const contentElement = document.getElementById('content');

/**
    writehtml is the high level flow for generating the html in the sidebar

 * @param {Object} containers - list of container to draw
 */
const writehtml = containers => {
    const deletableElement = removeOldElements();
    sortContainers(containers).forEach(container => {
        const containerElement = addElement(deletableElement, getContainerTemplate(container));
        container.tabs.forEach(tab => addElement(containerElement[0], getTabTemplate(tab)));
    })
}


/*
    sortContainers does what it says on the tin.  Containers follow order: default container -> named containers ->
    Persistent containers (sorted by number).  All tabs are also sorted alphabetically by domain within the containers.  
*/

const sortContainers = containers => {
    // sortedContainers.forEach(container => 
    //     container.tabs.sort((a, b) => a.url < b.url ? -1 : (a.url > b.url ? 1 : 0)));


    const defaultContainer = containers.filter(container =>
        container.cookieStoreId == 'firefox-default');

    const namedContainers = containers.filter(container =>
        !container.name.includes('Persistent') && !container.name.includes('No Container'));

    const persistentContainers = containers.filter(container =>
        container.name.includes('Persistent'))
        .sort((a, b) => getCINameNo(a.name) < getCINameNo(b.name) ? -1 :
            getCINameNo(a.name) > getCINameNo(b.name) ? 1 : 0);

    return [...defaultContainer, ...namedContainers, ...persistentContainers];
}

/*
    removeOldElements removes the dynamic elements in the sidebar so it can be re-written when updated
*/

const removeOldElements = () => {
    document.getElementById('deleteable').remove();
    const deletableElement = document.createElement('div');
    deletableElement.id = 'deleteable';
    contentElement.appendChild(deletableElement);
    return deletableElement;
}

/*
    addElement takes a template object, contructs a DOM element and adds it to the provided parent element.  
    Element templates are structured {html: <some html string>, eventListeners: <event listeners to be added to
    the element>}.  
    Sometimes the function passed to the event listener takes dom elements from the template as arguments.  In this
    case the dom elements won't exist until the template is constructed so cannot be passed inside a function.  Instead
    the class names of the dom elements and the function are passed through seperatley and assembled once the dom
    elements exist. 
*/

const addElement = (parent, template) => {
    //create dummy element to parse template html
    const element = document.createElement('div');
    parent.appendChild(element);
    element.innerHTML = template.html;
    // add the event listeners
    template.eventListeners.forEach(el => {
        try {
            // construct event listener function if it is not already a function
            if (typeof el.func === 'object') {
                const elElementArgs = el.func.classElementArgs.map(arg => element.getElementsByClassName(arg)[0]);
                el.func = el.func.innerfunc(...el.func.args, ...elElementArgs);
            }
            // add event listener to correct dom element specified by it's class name
            element.getElementsByClassName(el.className)[0].addEventListener(el.type, el.func);
        }
        catch { }
    })
    const nodeReturn = template.nodeReturn.length ? template.nodeReturn.map(node => element.getElementsByClassName(node)[0]) : null;
    element.replaceWith(element.firstChild);
    return nodeReturn;
}


const getContainerTemplate = container => ({
    html: `<div class="containerElement" style="border-left:15px solid ${container.colorCode}">
            <div class="containerTitle">
                <div class="containerNameElement">
                    ${container.name}  (${container.tabs.length})
                </div>
                <img class="containerTabButton" src="assets/vectorpaint.svg">
            </div>
            <div class="tabDrawer"></div>
        </div>`,
    eventListeners: [{
        type: 'click',
        className: 'containerTabButton',
        func: () => newTab(container.cookieStoreId)

    }],
    nodeReturn: ['tabDrawer']
})


const getTabTemplate = tab => {
    const activeTabColour = tab.active === true ? 'background-color:#6490b1' : '';
    const muteStyle = tab.mutedInfo.muted ? 'flex' : 'none';
    const audibleStyle = tab.audible ? 'flex' : 'none';
    const tabLoadedButton = tab.discarded & !tab.active ? '' : '<div class="tabContextMenuItem tabUnload">Unload</div>';
    const tabLoadedIconStyle = tab.discarded ? 'none' : 'flex';
    const safeTabFaviconUrl = tab.favIconUrl !== undefined && !tab.favIconUrl.includes('data:image') ? '' : tab.favIconUrl;

    return {
        html: `<div class="tab">
                <div class="tabMain" style="${activeTabColour}">
                    <img class="tabFavicon" src="${safeTabFaviconUrl}">
                    <div class="tabTitleElement">
                        ${santiseInput(tab.title)}
                    </div>
                    <img class="tabIconElement tabCloseIcon" src="assets/closeIcon.png">
                    <img class="tabIconElement tabAudibleIcon" style="display:${audibleStyle}" src="assets/soundIcon.png">
                    <img class="tabIconElement tabMuteIcon" style="display:${muteStyle}" src="assets/muteIcon.png">
                    <img class="tabIconElement tabLoadedIcon" style="display:${tabLoadedIconStyle}" src="assets/loadedIcon.png">
                </div>
                <div class="tabContextMenu">
                    <div class="tabContextMenuItem tabContextDupe">Duplicate in Current Container</div>
                    <div class="tabContextMenuItem tabNewConatiner">Open in New Container</div>
                    ${tabLoadedButton}
                </div>
            </div>`,
        eventListeners: [{
            type: 'click',
            className: 'tabMain',
            func: () => browser.tabs.update(tab.id, { active: true })
        }, {
            type: 'click',
            className: 'tabCloseIcon',
            func: () => browser.tabs.remove(tab.id)
        }, {
            type: 'click',
            className: 'tabContextDupe',
            func: () => newTab(tab.cookieStoreId, tab.url)
        }, {
            type: 'click',
            className: 'tabNewConatiner',
            func: () => newContainer(tab.url)
        }, {
            type: 'click',
            className: 'tabUnload',
            func: async () => {
                await browser.tabs.discard(tab.id)
                updateSidebar();
            }
        }, {
            type: 'click',
            className: 'tabAudibleIcon',
            func: {
                classElementArgs: ['tabAudibleIcon', 'tabMuteIcon'],
                args: [tab.id],
                innerfunc: muteTab
            }
        }, {
            type: 'click',
            className: 'tabMuteIcon',
            func: {
                classElementArgs: ['tabAudibleIcon', 'tabMuteIcon'],
                args: [tab.id],
                innerfunc: unmuteTab
            }
        }, {
            type: 'mouseover',
            className: 'tabMain',
            func: {
                classElementArgs: ['tabMain', 'tabCloseIcon'],
                args: [],
                innerfunc: tabOnHover
            }
        }, {
            type: 'mouseout',
            className: 'tabMain',
            func: {
                classElementArgs: ['tabMain', 'tabCloseIcon'],
                args: [],
                innerfunc: tabOffHover
            }
        }
        ],
        nodeReturn: []
    }
};

const santiseInput = input => input.replace('<', '').replace('>', '');

/*
    functions which are constucted after element creation are curried to preload an arg-less function to pass to the event listener.
    All future functions to be constucted later should follow suit
*/

const tabOnHover = (tabElement, tabCloseIconElement) => () => {
    if (tabElement.style.backgroundColor !== 'rgb(100, 144, 177)')
        tabElement.style.backgroundColor = '#222222';
    tabCloseIconElement.style.display = 'flex';
}

const tabOffHover = (tabElement, tabCloseIconElement) => () => {
    if (tabElement.style.backgroundColor !== 'rgb(100, 144, 177)')
        tabElement.style.backgroundColor = '#2c2b2b';
    tabCloseIconElement.style.display = 'none';
}

const muteTab = (tabId, tabAudibleIcon, tabMuteIcon) => () => {
    browser.tabs.update(tabId, { muted: true })
    tabAudibleIcon.style.display = 'none';
    tabMuteIcon.style.display = 'flex';
}

const unmuteTab = (tabId, tabAudibleIcon, tabMuteIcon) => () => {
    browser.tabs.update(tabId, { muted: false })
    tabAudibleIcon.style.display = 'flex';
    tabMuteIcon.style.display = 'none';
}


const initSidebarhtml = () => 
	addElement(document.getElementById('bottomButtonsWrapper'), getStaticControlsTemplate);


const getStaticControlsTemplate = {
	html: `<div class="bottomButtons">
		<div class="button newPersistentContainerButton">New Persistent Container</div>
		<div class="button clearStartPageTabsButton">Clear all StartPage Tabs</div>
	</div>`,
    eventListeners: [{
        type: 'click',
        className: 'newPersistentContainerButton',
        func: () => newContainer()
    },{
		type: 'click',
		className: 'clearStartPageTabsButton',
		func: () => removeAllStartpageTabs()
	}],
    nodeReturn: []
}


const toggleContextMenu = (tabElement) => {
    const contextMenuElement =
        tabElement.parentNode.getElementsByClassName('tabContextMenu').length !== 0 ?
            tabElement.parentNode.getElementsByClassName('tabContextMenu')[0] :
            tabElement.parentNode.parentNode.getElementsByClassName('tabContextMenu')[0]

    contextMenuElement.style.height = contextMenuElement.style.height === '50px' ? '0px' : '50px';
}

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
const getCINameNo = CIname => parseInt(CIname.length === 20 ? CIname.slice(-1) : CIname.slice(-2));

// finds the lowest possible number for a new container not currently in use
const getNewContainerNum = (contextIds, n = 0) => contextIds.filter(contextId =>
    getCINameNo(contextId.name) === n).length < 1 ? n : getNewContainerNum(contextIds, n + 1);


// cycles through the colours when creating tabs
const getNewContainerColour = n => containerColours[n % containerColours.length];

const newContainer = async (url = 'about:blank') => {
    const contextIds = await browser.contextualIdentities.query({});
    const containerNo = getNewContainerNum(contextIds);
    const newContextId = await browser.contextualIdentities.create({
        name: `Persistent Cookies ${containerNo}`,
        color: getNewContainerColour(containerNo),
        icon: 'circle'
    });
    await newTab(newContextId.cookieStoreId, url);
}

const newTab = async (cookieStoreId, url = 'about:blank') => {
    await browser.tabs.create({
        active: true,
        cookieStoreId: cookieStoreId,
        url: url
    });
};

const removeAllStartpageTabs = async () => {
	const tabs = await browser.tabs.query({currentWindow: true});
const startPageTabIds = tabs.filter(tab => tab.url.includes('startpage')).map(tab => tab.id);
browser.tabs.remove(startPageTabIds);
}


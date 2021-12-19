const contentElement = document.getElementById('content');

/*
    writehtml is the high level flow for generating the html in the sidebar
*/

const writehtml = (containers, bp) => {

    containers = sortContainers(containers, bp);

    const deletableElement = removeOldElements();
    containers.forEach(container => {
        container = addHeightVars(35, container);
        const containerElement = addElement(deletableElement, getContainerTemplate(container));
        const containerTitle = addElement(containerElement, getContainerTitleTemplate(container, containerElement, bp));
        const tabDrawerElement = addElement(containerElement, getTabDrawerTemplate());
        container.tabs.forEach(tab => addElement(tabDrawerElement, getTabTemplate(tab, bp)));
    })
}

/*
    sortContainers does what it says on the tin.  Containers follow order: default container -> named containers ->
    Persistent containers (sorted by number).  All tabs are also sorted alphabetically by domain within the containers.  
*/

const sortContainers = (containers, bp) => {
    // sortedContainers.forEach(container => 
    //     container.tabs.sort((a, b) => a.url < b.url ? -1 : (a.url > b.url ? 1 : 0)));

    const defaultContainer = containers.filter(container => 
        container.contextId.cookieStoreId == 'firefox-default');

    const namedContainers = containers.filter(container => 
        !container.contextId.name.includes('Persistent') && !container.contextId.name.includes('No Container'));

    const persistentContainers = containers.filter(container => 
        container.contextId.name.includes('Persistent'))
    .sort((a,b) => bp.getCINameNo(a.contextId.name) < bp.getCINameNo(b.contextId.name) ? -1 : 
    bp.getCINameNo(a.contextId.name) > bp.getCINameNo(b.contextId.name) ? 1 : 0);

    return defaultContainer.concat(namedContainers, persistentContainers);
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
    addHeightVars adds the open and closed height as paramaters to the container object.
    Both are pre converted to strings with the px postfix for ease.
    openHeight is based off the number of tabs + 1 (for the container title) * the closedHeight,
    assuming the closedHeight is also used for the height of the tabs.   
 */

const addHeightVars = (closedHeight, container) => {    
    container.closedHeightPx = `${closedHeight}px`;
    container.openHeightPx = `${(container.tabs.length * closedHeight) + closedHeight}px`;
    return container;
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
        catch{}
    })
    // this is why we hate javascript
    const fc = element.firstChild;
    element.replaceWith(element.firstChild);
    return fc;
}


const getContainerTemplate = container => ({
    html: `<div class="containerElement" 
        style="border-left:15px solid ${container.contextId.colorCode}; height:${container.openheightPx}"></div>`,
    eventListeners: []
})

const getContainerTitleTemplate = (container, containerElement, bp) => ({
    html: `<div class="containerTitle" style="height:${container.closedHeightPx}">
            <div class="containerNameElement">
                ${container.contextId.name}  (${container.tabs.length})
            </div>
            <img class="containerTabButton" src="assets/vectorpaint.svg">
        </div>`,
    eventListeners: [{
        type: 'click',
        className: 'containerTitle',
        func: () => toggleContainerElement(containerElement, container)
    },{
        type: 'click',
        className: 'containerTabButton',
        func: () => bp.newTab(container.contextId.cookieStoreId)
    }]
})

/*
    Toggles open & close the container element
*/

const toggleContainerElement = (containerElement, container) => containerElement.style.height = 
    containerElement.style.height == container.closedHeightPx ?
    container.openHeightPx : container.closedHeightPx;


const getTabDrawerTemplate = () => ({
    html: '<div class="tabDrawer"></div>',
    eventListeners: []
});

const getTabTemplate = (tab, bp) => {
    const activeTabColour = tab.active === true ? 'background-color:#6490b1' : '';
    const muteStyle = tab.mutedInfo.muted ? 'flex' : 'none';
    const audibleStyle = tab.audible ? 'flex' : 'none';
    const tabLoadedButton = tab.discarded ? '' : '<div class="tabContextMenuItem tabUnload">Unload</div>';
    const tabLoadedIconStyle = tab.discarded ? 'none' : 'flex';
    return {
        html: `<div class="tab">
                <div class="tabMain" style="${activeTabColour}">
                    <img class="tabFavicon" src="${tab.favIconUrl}">
                    <div class="tabTitleElement">
                        ${santiseInput(tab.title)}
                    </div>
                    <img class="tabIconElement tabAudibleIcon" style="display:${audibleStyle}" src="assets/soundIcon.png">
                    <img class="tabIconElement tabMuteIcon" style="display:${muteStyle}" src="assets/muteIcon.png">
                    <img class="tabIconElement tabLoadedIcon" style="display:${tabLoadedIconStyle}" src="assets/loadedIcon.png">
                    <img class="tabIconElement tabCloseIcon" src="assets/closeIcon.png">
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
            func: () => browser.tabs.update(tab.id, {active: true})
        },{
            type: 'click',
            className: 'tabCloseIcon',
            func: () => browser.tabs.remove(tab.id)
        },{
            type: 'click',
            className: 'tabContextDupe',
            func: () => bp.newTab(tab.contextId, tab.url)
        },{
            type: 'click',
            className: 'tabNewConatiner',
            func: () => bp.newContainer(tab.url)
        },{
            type: 'click',
            className: 'tabUnload',
            func: () => {
                browser.tabs.discard(tab.id)
                updateSidebar();
            }
        },{
            type: 'click',
            className: 'tabAudibleIcon',
            func: {
                classElementArgs: ['tabAudibleIcon', 'tabMuteIcon'],
                args: [tab.id],
                innerfunc: muteTab
            }
        },{
            type: 'click',
            className: 'tabMuteIcon',
            func: {
                classElementArgs: ['tabAudibleIcon', 'tabMuteIcon'],
                args: [tab.id],
                innerfunc: unmuteTab
            }
        },{
            type: 'mouseover',
            className: 'tabMain',
            func: {
                classElementArgs: ['tabMain', 'tabCloseIcon'],
                args: [],
                innerfunc: tabOnHover
            }
        },{
            type: 'mouseout',
            className: 'tabMain',
            func: {
                classElementArgs: ['tabMain', 'tabCloseIcon'],
                args: [],
                innerfunc: tabOffHover
            }
        }
    ]}
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


const initSidebarhtml = bp => 
    addElement(document.getElementById('bottomButtons'), getStaticControlsTemplate(bp));


const getStaticControlsTemplate = bp => ({
    html:`<div class="button newPersistentContainerButton">New Persistent Container</div>
    <div class="button toggleAllContainersButton">Toggle</div>`,
    eventListeners: [{
        type: 'click',
        className: 'newPersistentContainerButton',
        func: () => bp.newContainer()
    },{
        type: 'click',
        className: 'toggleAllContainersButton',
        func: () => {}
    }]
})

const toggleContextMenu = (tabElement) => {
    const contextMenuElement = 
        tabElement.parentNode.getElementsByClassName('tabContextMenu').length !== 0 ?
            tabElement.parentNode.getElementsByClassName('tabContextMenu')[0] :
            tabElement.parentNode.parentNode.getElementsByClassName('tabContextMenu')[0]

    contextMenuElement.style.height = contextMenuElement.style.height === '50px' ? '0px' : '50px';
}




const contentElement = document.getElementById('content');

/*
    writehtml is the high level flow for generating the html in the sidebar
*/

const writehtml = containers => {
    containers = sortContainers(containers);
    const deletableElement = removeOldElements();
    containers.forEach(container => {
        container = addHeightVars(35, container);
        const containerElement = addElement(deletableElement, getContainerTemplate(container));
        const containerTitle = addElement(containerElement, getContainerTitleTemplate(container, containerElement));
        const tabDrawerElement = addElement(containerElement, getTabDrawerTemplate());
        container.tabs.forEach(tab => addElement(tabDrawerElement, getTabTemplate(tab)));
    })
}

/*
    sortContainers does what it says on the tin.  Containers follow order: default container -> named containers ->
    Persistent containers (sorted by number).  All tabs are also sorted alphabetically by domain within the containers.  
*/

const sortContainers = containers => {
    let sortedContainers = [];
    // filter out and add default container
    sortedContainers.push(containers.filter(container => 
        container.contextId.cookieStoreId == 'firefox-default')[0]);
    // add custom containers by filtering out containers with 'Persistent' or 'No Container' in their name
    sortedContainers = sortedContainers.concat(containers.filter(container => 
        !container.contextId.name.includes('Persistent') && !container.contextId.name.includes('No Container')));
    // add persistent containers by filtering by 'Persistent' AND sorting them by their name number
    sortedContainers = sortedContainers.concat(containers.filter(container => 
        container.contextId.name.includes('Persistent'))
    .sort((a,b) => backgroundPage.getCINameNo(a.contextId.name) < backgroundPage.getCINameNo(b.contextId.name) ? -1 : 
    backgroundPage.getCINameNo(a.contextId.name) > backgroundPage.getCINameNo(b.contextId.name) ? 1 : 0));
    //sort tabs alphabetically by domain
    sortedContainers.forEach(container => 
        container.tabs.sort((a, b) => a.url < b.url ? -1 : (a.url > b.url ? 1 : 0)));

    return sortedContainers;
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
        // construct event listener function if it is not already a function
        if (typeof el.func === 'object') {
            const elElementArgs = el.func.classElementArgs.map(arg => element.getElementsByClassName(arg)[0]);
            el.func = el.func.innerfunc(...el.func.args, ...elElementArgs);
        }
        // add event listener to correct dom element specified by it's class name
        element.getElementsByClassName(el.className)[0].addEventListener(el.type, el.func);
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

const getContainerTitleTemplate = (container, containerElement) => ({
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
        func: () => backgroundPage.newTab(container.contextId)
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

const getTabTemplate = tab => {
    const activeTabColour = tab.active === true ? 'background-color:#6490b1' : '';
    const muteStyle = tab.mutedInfo.muted ? 'flex' : 'none';
    const audibleStyle = tab.audible ? 'flex' : 'none';
    return {
        html: `<div class="tab" style="height:35px; ${activeTabColour}">
            <img class="tabFavicon" src="${tab.favIconUrl}">
            <div class="tabTitleElement">
                ${santiseInput(tab.title)}
            </div>
            <img class="tabIconElement tabAudibleIcon" style="display:${audibleStyle}" src="assets/soundIcon.png">
            <img class="tabIconElement tabMuteIcon" style="display:${muteStyle}" src="assets/muteIcon.png">
            <img class="tabIconElement tabCloseIcon" src="assets/closeIcon.png">
        </div>`,
        eventListeners: [{
            type: 'click',
            className: 'tab',
            func: () => browser.tabs.update(tab.id, {active: true})
        },{
            type: 'click',
            className: 'tabCloseIcon',
            func: () => browser.tabs.remove(tab.id)
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
            className: 'tab',
            func: {
                classElementArgs: ['tab', 'tabCloseIcon'],
                args: [],
                innerfunc: tabOnHover
            }
        },{
            type: 'mouseout',
            className: 'tab',
            func: {
                classElementArgs: ['tab', 'tabCloseIcon'],
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


const getStaticControlsTemplate = () => ({
    html:`<div class="button newPersistentContainerButton">New Persistent Container</div>
    <div class="button toggleAllContainersButton">Toggle</div>`,
    eventListeners: [{
        type: 'click',
        className: 'newPersistentContainerButton',
        func: () => backgroundPage.newContainer()
    },{
        type: 'click',
        className: 'toggleAllContainersButton',
        func: () => {}
    }]
})

addElement(document.getElementById('bottomButtons'), getStaticControlsTemplate());


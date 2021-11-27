browser.menus.create({
    id: 'openInNewContainer',
    contexts: ['link'],
    title: 'Open in new Container'
});

browser.menus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'openInNewContainer')
        newContainer(info.linkUrl);
});



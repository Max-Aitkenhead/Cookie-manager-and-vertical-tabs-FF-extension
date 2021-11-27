browser.runtime.onMessage.addListener((message, sender) => {
    if (message.clearLocalStorage) {
        localStorage.clear();
    }
    if (message.sendFrame) {
        const allIframes = document.getElementsByTagName("iframe");
        console.log([...allIframes].filter(iframe => iframe.src === message.frameUrl)[0]);
        [...allIframes].filter(iframe => iframe.src === message.frameUrl)[0].contentDocument.body.innerHTML = 
            `<a href="${iframe.src}" target="_blank" rel="noopener noreferrer">${iframe.src}</a>`;
        // for (let iframe of allIframes) {
        //     if (iframe.src == message.frameUrl)
        //         iframe.contentDocument.body.innerHTML = `<a href="${iframe.src}" target="_blank" rel="noopener noreferrer">${iframe.src}</a>`;
        // }
    }
});



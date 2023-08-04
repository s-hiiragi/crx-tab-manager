(async ()=>{
    const tabs = await chrome.tabs.query({
        currentWindow: true
    });

    const updateTabList = (query={}) => {
        let matchedTabs;
        if (query.title) {
            matchedTabs = tabs.filter(tab => {
                return tab.title.includes(query.title);
            });
        } else {
            matchedTabs = tabs;
        }

        const ul = document.createElement('ul');

        for (const tab of matchedTabs) {
            const img = document.createElement('img');
            img.width = 16;
            img.height = 16;
            img.src = tab.favIconUrl;

            const span = document.createElement('span');
            span.textContent = tab.title;

            const li = document.createElement('li');
            li.appendChild(img);
            li.appendChild(span);

            li.onclick = () => {
                chrome.tabs.update(tab.id, {active: true});
            };
            
            ul.appendChild(li);
        }

        const oldTabList = document.querySelector('#tablist');
        const newTabList = oldTabList.cloneNode(false);
        oldTabList.parentNode.replaceChild(newTabList, oldTabList);

        newTabList.appendChild(ul);

        const splitButton = document.querySelector('#split');
        splitButton.onclick = async() => {
            if (matchedTabs.length === 0) {return;}

            const wnd = await chrome.windows.create();
            await chrome.tabs.move(matchedTabs.map(t=>t.id), {
                index: 0,
                windowId: wnd.id
            });
        };
    };

    const searchword = document.querySelector('#searchword');
    searchword.oninput = () => {
        updateTabList({
            title: searchword.value
        });
    };

    updateTabList();
})();

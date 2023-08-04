(async ()=>{
    const currentUrl = new URL(location.href);
    const paramWindowId = Number(currentUrl.searchParams.get('wid') ?? '0');
    const paramSearchWord = currentUrl.searchParams.get('sw') ?? '';

    const currentWindow = paramWindowId
        ? await chrome.windows.get(paramWindowId, {populate: true})
        : await chrome.windows.getCurrent({populate: true});

    const updateTabList = (query={title:''}) => {
        let matchedTabs;
        if (query.title) {
            matchedTabs = currentWindow.tabs.filter(tab => {
                return tab.title.includes(query.title);
            });
        } else {
            matchedTabs = currentWindow.tabs;
        }

        const ul = document.createElement('ul');

        for (const tab of matchedTabs) {

            const checkBox = document.createElement('input');
            checkBox.type = 'checkbox';
            checkBox.onchange = () => {
                tab.checked = checkBox.checked;
            };

            const checkContainer = document.createElement('div');
            checkContainer.classList.add('check-container');
            checkContainer.appendChild(checkBox);

            checkContainer.onclick = (event) => {
                event.stopPropagation();
            };

            const img = document.createElement('img');
            img.width = 16;
            img.height = 16;
            img.src = tab.favIconUrl;

            const span = document.createElement('span');
            span.textContent = tab.title;

            const titleContainer = document.createElement('div');
            titleContainer.classList.add('title-container');
            titleContainer.appendChild(img);
            titleContainer.appendChild(span);

            const li = document.createElement('li');
            li.appendChild(checkContainer);
            li.appendChild(titleContainer);

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
            let selectedTabs = matchedTabs.filter(t=>t.checked);

            if (selectedTabs.length == 0 && query.title) {
                selectedTabs = matchedTabs;
            }

            if (selectedTabs.length === 0) {return;}

            const wnd = await chrome.windows.create();
            await chrome.tabs.move(selectedTabs.map(t=>t.id), {
                index: 0,
                windowId: wnd.id
            });
            chrome.tabs.remove(wnd.tabs[0].id);
            //window.close();  // 閉じない方が便利かも？
        };

        const popupButton = document.querySelector('#popup');
        popupButton.onclick = () => {
            const baseUrl = chrome.runtime.getURL('popup.html');
            let url = new URL(baseUrl);
            url.searchParams.set('wid', currentWindow.id);
            url.searchParams.set('sw', query.title);
            
            chrome.windows.create({url: url.toString()});
            window.close();
        };
    };

    const searchword = document.querySelector('#searchword');

    if (paramSearchWord) {
        searchword.value = paramSearchWord;
    }

    searchword.oninput = () => {
        updateTabList({
            title: searchword.value
        });
    };

    if (paramWindowId === 0) {
        if (document.body) {
            document.body.classList.add('actionwindow');
        } else {
            console.log('a1');
            window.onload = () => {
                console.log('a2');
                document.body.classList.add('actionwindow');
            };
        }
    }

    updateTabList({
        title: searchword.value
    });
})();

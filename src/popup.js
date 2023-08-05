(async ()=>{
    const currentUrl = new URL(location.href);
    const paramWindowId = Number(currentUrl.searchParams.get('wid') ?? '0');
    const paramSearchWord = currentUrl.searchParams.get('sw') ?? '';

    const currentWindow = paramWindowId
        ? await chrome.windows.get(paramWindowId, {populate: true})
        : await chrome.windows.getCurrent({populate: true});

    const filterTabList = (query={title:''}) => {
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
                // chrome.tabs.Tabのプロパティと被らないように'_'を付ける
                tab._checked = checkBox.checked;
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

        const getSelectedTabs = () => {
            let selectedTabs = matchedTabs.filter(t=>t._checked);

            if (selectedTabs.length == 0 && query.title) {
                selectedTabs = matchedTabs;
            }

            return selectedTabs;
        };

        const splitButton = document.querySelector('#split');
        splitButton.onclick = async() => {
            const selectedTabs = getSelectedTabs();

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

        const closeButton = document.querySelector('#close');
        closeButton.onclick = async() => {
            const selectedTabs = getSelectedTabs();

            if (selectedTabs.length === 0) {return;}

            await chrome.tabs.remove(selectedTabs.map(t=>t.id));

            // 閉じたタブはcurrentWindow.tabsからも消す必要がある
            for (const tab of selectedTabs) {
                tab._closed = true;
            }
            for (let i = currentWindow.tabs.length - 1; i >= 0; i--) {
                const tab = currentWindow.tabs[i];
                if (tab._closed) {
                    currentWindow.tabs.splice(i, 1);
                }
            }
            
            filterTabList(query);
        };
    };

    const searchword = document.querySelector('#searchword');

    if (paramSearchWord) {
        searchword.value = paramSearchWord;
    }

    searchword.oninput = () => {
        filterTabList({
            title: searchword.value
        });
    };

    if (paramWindowId === 0) {
        if (document.body) {
            document.body.classList.add('actionwindow');
        } else {
            window.onload = () => {
                document.body.classList.add('actionwindow');
            };
        }
    }

    filterTabList({
        title: searchword.value
    });
})();

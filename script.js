document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const webpageListContainer = document.getElementById('webpage-list-container');
    const tabsContainer = document.getElementById('tabs-container');
    const fileInput = document.getElementById('csv-file-input');
    const manualBtn = document.getElementById('show-manual-btn');
    const resetDataBtn = document.getElementById('reset-data-btn');
    
    const titleInput = document.getElementById('title');
    const urlInput = document.getElementById('url');
    const categorySelect = document.getElementById('category');
    const memoInput = document.getElementById('memo');
    const addBtn = document.getElementById('add-btn');
    
    const editIdInput = document.getElementById('edit-id');
    const editTitleInput = document.getElementById('edit-title');
    const editUrlInput = document.getElementById('edit-url');
    const editCategorySelect = document.getElementById('edit-category');
    const editMemoInput = document.getElementById('edit-memo');
    const updateBtn = document.getElementById('update-btn');

    const controlTabsContainer = document.getElementById('control-tabs-container');
    const editModeTab = document.getElementById('edit-mode-tab');

    // --- データ管理 ---
    const defaultCategories = ["総合", "YouTube(一般)", "YouTube(趣味)", "学習" , "ツール" , "AI活用", "ブログ関連", "趣味" , "自作アプリ", "その他"];
    let webpages = [];
    let categories = [...defaultCategories];
    let activeCategory = '総合';

    // --- ローカルストレージ関連 ---
    const saveDataToLocalStorage = () => {
        localStorage.setItem('webpagesData', JSON.stringify(webpages));
        localStorage.setItem('categoriesData', JSON.stringify(categories));
    };

    const loadDataFromLocalStorage = () => {
        const savedWebpages = localStorage.getItem('webpagesData');
        const savedCategories = localStorage.getItem('categoriesData');
        
        if (savedWebpages) {
            webpages = JSON.parse(savedWebpages);
        }

        // ▼▼▼▼▼ 修正箇所 ▼▼▼▼▼
        if (savedCategories) {
            // 保存されたカテゴリとデフォルトカテゴリを統合し、正しい順序を維持する
            const parsedCategories = JSON.parse(savedCategories);
            const allUniqueCategories = [...new Set([...defaultCategories, ...parsedCategories])];
            categories = allUniqueCategories.sort((a, b) => {
                let indexA = defaultCategories.indexOf(a);
                let indexB = defaultCategories.indexOf(b);
                if (indexA === -1) indexA = Infinity;
                if (indexB === -1) indexB = Infinity;
                return indexA - indexB;
            });
        }
        // ▲▲▲▲▲ 修正箇所 ▲▲▲▲▲
    };

    // --- 描画関連の関数 ---
    const render = () => {
        renderCategories();
        renderTabs();
        renderWebpages();
    };
    const renderCategories = () => {
        const selects = [categorySelect, editCategorySelect];
        selects.forEach(sel => {
            const currentVal = sel.value;
            sel.innerHTML = '';
            const categoriesForSelect = categories.filter(cat => cat !== "総合");
            categoriesForSelect.forEach(cat => {
                sel.add(new Option(cat, cat));
            });
            sel.value = currentVal;
        });
    };
    const renderTabs = () => {
        tabsContainer.innerHTML = '';
        categories.forEach(cat => {
            const tab = document.createElement('div');
            tab.className = 'tab';
            tab.textContent = cat;
            tab.dataset.category = cat;
            if (cat === activeCategory) tab.classList.add('active');
            tab.addEventListener('click', () => {
                activeCategory = cat;
                render();
            });
            tabsContainer.appendChild(tab);
        });
    };
    const renderWebpages = () => {
        webpageListContainer.innerHTML = '';
        const filteredList = (activeCategory === '総合')
            ? webpages
            : webpages.filter(item => item.category === activeCategory);
        filteredList.forEach(item => {
            const div = document.createElement('div');
            div.className = 'webpage-item';
            div.dataset.id = item.id;
            div.innerHTML = `
                <div class="item-content">
                    <a href="${item.url}" target="_blank" title="${item.url}">${item.title}</a>
                    <p class="item-meta">カテゴリ: ${item.category}</p>
                </div>
                <div class="item-actions">
                    <button class="edit-btn">編集</button>
                    <button class="delete-btn">削除</button>
                </div>`;
            webpageListContainer.appendChild(div);
        });
    };

    // --- ヘルパー関数 ---
    const switchControlTab = (tabNameToShow) => {
        controlTabsContainer.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.control-tab-content').forEach(p => p.classList.add('hidden'));
        const tabToShow = controlTabsContainer.querySelector(`[data-tab="${tabNameToShow}"]`);
        if (tabToShow) {
            tabToShow.classList.add('active');
            document.getElementById(`${tabNameToShow}-panel`).classList.remove('hidden');
        }
        if (tabNameToShow === 'edit') {
            editModeTab.classList.remove('disabled');
        } else {
            editModeTab.classList.add('disabled');
        }
    };

    // --- イベントリスナー ---
    controlTabsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab') && !e.target.classList.contains('active')) {
            switchControlTab(e.target.dataset.tab);
        }
    });
    addBtn.addEventListener('click', () => {
        if (titleInput.value.trim() === '' || urlInput.value.trim() === '') {
            alert('タイトルとURLは必須です。'); return;
        }
        webpages.push({
            id: Date.now(), title: titleInput.value, url: urlInput.value,
            category: categorySelect.value, memo: memoInput.value,
            date: new Date().toISOString().slice(0, 10),
        });
        titleInput.value = urlInput.value = memoInput.value = '';
        render();
        saveDataToLocalStorage();
    });
    webpageListContainer.addEventListener('click', (e) => {
        const itemDiv = e.target.closest('.webpage-item');
        if (!itemDiv) return;
        const id = Number(itemDiv.dataset.id);
        const item = webpages.find(w => w.id === id);
        if (!item) { console.error("データが見つかりませんでした。ID:", id); return; }
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('この項目を削除しますか？')) {
                webpages = webpages.filter(w => w.id !== id);
                if (id === Number(editIdInput.value)) {
                    switchControlTab('register');
                }
                render();
                saveDataToLocalStorage();
            }
        } else if (e.target.classList.contains('edit-btn')) {
            editIdInput.value = item.id;
            editTitleInput.value = item.title;
            editUrlInput.value = item.url;
            editCategorySelect.value = item.category;
            editMemoInput.value = item.memo;
            switchControlTab('edit');
        }
    });
    updateBtn.addEventListener('click', () => {
        const idToUpdate = Number(editIdInput.value);
        const itemToUpdate = webpages.find(w => w.id === idToUpdate);
        if (itemToUpdate) {
            itemToUpdate.title = editTitleInput.value;
            itemToUpdate.url = editUrlInput.value;
            itemToUpdate.category = editCategorySelect.value;
            itemToUpdate.memo = editMemoInput.value;
            render();
            saveDataToLocalStorage();
            alert('更新しました。');
            switchControlTab('register');
        } else {
            alert('更新対象のデータが見つかりませんでした。');
        }
    });
    resetDataBtn.addEventListener('click', () => {
        if (confirm('本当にすべてのデータをリセットしますか？\nWebページとカテゴリの情報が初期状態に戻ります。\nこの操作は元に戻せません。')) {
            localStorage.removeItem('webpagesData');
            localStorage.removeItem('categoriesData');
            alert('データをリセットしました。');
            location.reload();
        }
    });
    
    // --- CSV処理 & 取扱説明書 ---
    // (以降のコードは変更ありません)
    const downloadCSV = (csvContent, fileName) => {
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    document.getElementById('save-data-btn').addEventListener('click', () => {
        if(webpages.length === 0) { alert("保存するデータがありません。"); return; }
        const header = Object.keys(webpages[0]).join(',');
        const rows = webpages.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
        downloadCSV([header, ...rows].join('\n'), 'webpages.csv');
    });
    const handleLoad = (callback) => {
        fileInput.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => callback(event.target.result);
            reader.readAsText(file, 'UTF-8');
            fileInput.value = '';
        };
        fileInput.click();
    };
    document.getElementById('load-data-btn').addEventListener('click', () => handleLoad(csvText => {
        try {
            const lines = csvText.trim().split(/\r\n|\n/);
            if (lines.length < 1) return;
            const header = lines.shift().split(',').map(h => h.replace(/"/g, ''));
            const newWebpages = lines.map(line => {
                if (!line) return null;
                const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
                const item = header.reduce((obj, key, i) => ({...obj, [key]: values[i] }), {});
                if (item.id) { item.id = Number(item.id); }
                return item;
            }).filter(item => item && item.id);
            const loadedUniqueCategories = [...new Set(newWebpages.map(item => item.category).filter(Boolean))];
            const allUniqueCategories = [...new Set([...categories, ...loadedUniqueCategories])];
            categories = allUniqueCategories.sort((a, b) => {
                let indexA = defaultCategories.indexOf(a);
                let indexB = defaultCategories.indexOf(b);
                if (indexA === -1) indexA = Infinity;
                if (indexB === -1) indexB = Infinity;
                return indexA - indexB;
            });
            webpages = newWebpages;
            alert('Webページを読み込みました。'); 
            render();
            saveDataToLocalStorage();
        } catch (error) { 
            console.error(error);
            alert('CSVファイルの解析に失敗しました。'); 
        }
    }));
    manualBtn.addEventListener('click', () => {
        const manualWindow = window.open('', 'manual', 'width=800,height=700,scrollbars=yes');
        const manualHTML = `
            <!DOCTYPE html><html lang="ja"><head><title>取扱説明書</title><style>body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Hiragino Sans', 'Noto Sans CJK JP', sans-serif; line-height: 1.8; padding: 10px 30px; color: #333; } h1, h2, h3 { color: #29b6f6; } h1 { font-size: 2em; text-align: center; } h2 { font-size: 1.6em; border-bottom: 3px solid #29b6f6; padding-bottom: 8px; margin-top: 40px; } h3 { font-size: 1.2em; border-left: 5px solid #ffca28; padding-left: 10px; margin-top: 30px;} code { background: #eef; color: #d63384; padding: 3px 6px; border-radius: 4px; font-family: Consolas, Monaco, monospace; } ul { padding-left: 20px; list-style-type: "✓ "; } li { margin-bottom: 12px; } p { margin-left: 5px; } .important { background-color: #fffbe6; border: 1px solid #ffe58f; border-radius: 8px; padding: 15px; } .important b { color: #d9534f; }</style></head><body><h1>Web閲覧リスト 取扱説明書</h1><h2>概要</h2><p>このアプリケーションは、お気に入りのWebページをカテゴリ別に整理・管理するためのツールです。登録したデータはブラウザに自動で保存され、次回開いたときに復元されます。手動でCSVファイルとして保存・読込することも可能です。</p><h2>自動保存機能について</h2><ul><li>Webページの追加、更新、削除を行うと、その内容は<b>自動的にご利用のブラウザに保存</b>されます。</li><li>ブラウザを閉じたり、PCを再起動してもデータは消えません。</li><li class="important"><b>【注意】</b>ブラウザの履歴やキャッシュを完全に削除すると、保存されたデータも消える可能性があります。重要なデータは定期的にCSVファイルとして保存（エクスポート）することを推奨します。</li></ul><h2>基本操作</h2><h3>1. Webページの登録</h3><ul><li>画面右側のパネルで<b>「登録」</b>タブが選択されていることを確認します。</li><li><b>タイトル</b>、<b>URL</b>、<b>カテゴリ</b>を選択します。必要に応じて<b>メモ</b>も記入できます。</li><li><code>登録する</code>ボタンを押すと一覧に追加され、自動で保存されます。</li></ul><h3>2. Webページの閲覧</h3><ul><li>画面左上のカテゴリタブをクリックすると、そのカテゴリに登録されたWebページのみが一覧に表示されます。</li><li>「総合」タブでは、登録された全てのWebページが表示されます。</li><li>一覧のタイトル（青い文字）をクリックすると、新しいタブでそのWebページが開きます。</li></ul><h3>3. Webページの編集</h3><ul><li>一覧表示されている項目の右側にある<code>編集</code>ボタンを押します。</li><li>画面右側のパネルが自動的に<b>「編集」</b>タブに切り替わり、クリックした項目の情報がフォームに表示されます。</li><li>フォームの内容を自由に修正し、<code>更新する</code>ボタンを押すと変更が保存されます。</li></ul><h3>4. Webページの削除</h3><ul><li>一覧表示されている項目の右側にある<code>削除</code>ボタンを押します。</li><li>確認メッセージが表示されるので、OKを押すとその項目が一覧から完全に削除され、その状態が保存されます。</li></ul><h2>データ管理（CSV形式）</h2><p>データのバックアップや、他のブラウザ・PCへデータを移行するために、手動での保存（エクスポート）と読込（インポート）が可能です。</p><h3>1. データの保存</h3><ul><li><b>Webページ保存(CSV):</b> 現在登録されている全てのWebページ情報を<code>webpages.csv</code>というファイル名でPCにダウンロードします。</li></ul><h3>2. データの読込</h3><ul><li><b>Webページ読込(CSV):</b> ボタンを押すとファイル選択画面が開きます。以前保存した<code>webpages.csv</code>などを選択すると、ファイルの内容が読み込まれ、一覧が更新されます。</li><li>CSVファイル内に、現在リストにない新しいカテゴリが含まれていた場合、そのカテゴリは自動的にリストに追加されます。</li><li class="important"><b>【注意】</b>CSVからデータを読み込むと、現在ブラウザに保存されているデータは<b>全て上書きされます</b>。</li></ul><h2>データリセット</h2><p>ヘッダーにある<code>データリセット</code>ボタンを押すと、ブラウザに保存されている全てのWebページとカテゴリの情報を削除し、アプリケーションを完全な初期状態に戻すことができます。カテゴリの順番がおかしくなった場合などにご利用ください。</p></body></html>
        `;
        manualWindow.document.write(manualHTML);
        manualWindow.document.close();
    });

    // --- 初期化処理 ---
    const initialize = () => {
        loadDataFromLocalStorage();
        render();
    };

    initialize();
});

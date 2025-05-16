// SUGARJOY BMS Difficulty Table
$(document).ready(function() {
    let externalTitles = [];
    let tableData = [];
    let sortDirection = 'desc'; // 初期：降順（SU99→SU-3）
    let unifyDuplicates = false; // 初期：重複統一オフ

    // Levelの優先順位（数値キー）
    const levelPriority = {};
    levelPriority['-3'] = 103;
    levelPriority['-2'] = 102;
    levelPriority['-1'] = 101;
    levelPriority['0'] = 100;
    for (let i = 1; i <= 99; i++) {
        levelPriority[i.toString()] = 103 - i;
    }

    // LevelをSU形式にフォーマット
    function formatLevel(level) {
        if (level === 0 || level === '0') return 'SU0'; // 0を明示的に処理
        if (typeof level === 'number' || !isNaN(parseInt(level))) {
            return `SU${level}`;
        }
        return level || '';
    }

    // 文字列を正規化（空白トリム、改行削除）
    function normalizeString(str) {
        return str.trim().replace(/\n/g, '');
    }

    // Titleの括弧内（[]と()）を無視したベース名を取得
    function getBaseTitle(title) {
        return title.replace(/\[.*?\]|\(.*?\)/g, '').trim();
    }

    // URLs（デプロイ後に更新）
    const spreadsheetUrl = 'https://script.google.com/macros/s/AKfycbwdp3s0KqXpSuXlmmEACvYYLwusoGcB4u0AFV8VhQWz8jEeIFbuo83itubepYlG5qyr/exec';
    const getExternalTitlesUrl = 'https://script.google.com/macros/s/AKfycbwieOCUBBfpXW6sH04sMawbF_3lDX-VbBumQ42vRv-meIuiRHDEJTL5CCsTfH1cn4Uo/exec';
    const headerUrl = './header.json'; // GitHubリポジトリのルート

    // データ取得（Sheet1、ExternalTitles、header.jsonを並列）
    Promise.all([
        $.getJSON(spreadsheetUrl).promise(),
        $.getJSON(getExternalTitlesUrl).promise(),
        $.getJSON(headerUrl).promise()
    ]).then(([sheet1Data, externalTitlesData, headerData]) => {
        tableData = sheet1Data || [];
        externalTitles = (externalTitlesData || []).map(normalizeString);
        console.log('Sheet1 data loaded:', tableData);
        console.log('External titles loaded:', externalTitles);
        
        renderTable();
    }).catch(error => {
        console.error('Failed to fetch data:', error);
        $('#table-body').html('<tr><td colspan="9">データの取得に失敗しました</td></tr>');
        $('#description').text('Failed to load description');
    });

    // テーブルを描画
    function renderTable() {
        const tableBody = $('#table-body');
        tableBody.empty();

        let displayData = [...tableData];

        // 重複楽曲の統一（チェックボックスがオンの場合）
        if (unifyDuplicates) {
            const groupedData = {};
            tableData.forEach(item => {
                if (item.Group && item.Group !== 'SU99') {
                    const baseTitle = getBaseTitle(item.Title);
                    if (!groupedData[baseTitle]) {
                        groupedData[baseTitle] = [];
                    }
                    groupedData[baseTitle].push(item);
                } else if (!item.Group || item.Group === '') {
                    const baseTitle = getBaseTitle(item.Title);
                    groupedData[baseTitle] = [item];
                }
            });

            displayData = [];
            Object.keys(groupedData).forEach(baseTitle => {
                const items = groupedData[baseTitle];
                if (items.length === 1) {
                    displayData.push(items[0]);
                } else {
                    // 最高Levelを選択（SU99除外）
                    const filteredItems = items.filter(item => formatLevel(item.Level) !== 'SU99');
                    if (filteredItems.length === 0) return; // SU99のみの場合スキップ
                    const highestItem = filteredItems.reduce((max, item) => {
                        const currentPriority = levelPriority[item.Level] || -1;
                        const maxPriority = levelPriority[max.Level] || -1;
                        return currentPriority > maxPriority ? item : max;
                    }, filteredItems[0]);
                    displayData.push(highestItem);
                }
            });
        }

        // Levelでソート
        displayData.sort((a, b) => {
            const priorityA = levelPriority[a.Level] || -1;
            const priorityB = levelPriority[b.Level] || -1;
            return sortDirection === 'desc' ? priorityB - priorityA : priorityA - priorityB;
        });

        // テーブル行を生成
        displayData.forEach(item => {
            const normalizedTitle = normalizeString(item.Title);
            const isExternal = externalTitles.includes(normalizedTitle);
            console.log('Checking title:', normalizedTitle, 'isExternal:', isExternal);

            const row = $('<tr></tr>');

            // Level（SUを付加）
            row.append($('<td></td>').text(formatLevel(item.Level)));

            // Title（外部タイトルなら青）
            const titleCell = $('<td></td>').text(item.Title || '');
            if (isExternal) {
                titleCell.css('color', '#0000FF');
            }
            row.append(titleCell);

            // Artist
            row.append($('<td></td>').text(item.Artist || ''));

            // NOTES
            row.append($('<td></td>').text(item.NOTES || ''));

            // T/N
            row.append($('<td></td>').text(item['T/N'] || ''));

            // BPM
            row.append($('<td></td>').text(item.BPM || ''));

            // DL（リンク）
            const dlCell = $('<td></td>');
            if (item.DL) {
                dlCell.append($('<a></a>').attr('href', item.DL).text('Download').attr('target', '_blank'));
            }
            row.append(dlCell);

            // 糞譜面度（0を明示的に処理）
            row.append($('<td></td>').text(item['糞譜面度'] === 0 ? '0' : (item['糞譜面度'] || '')));

            // Comment
            row.append($('<td></td>').text(item.Comment || ''));

            tableBody.append(row);
        });
    }

    // チェックボックスイベント
    $('#unify-duplicates').change(function() {
        unifyDuplicates = $(this).is(':checked');
        console.log('Unify duplicates:', unifyDuplicates);
        renderTable();
    });

    // Levelソートイベント
    $('#bms-table th.sortable').click(function() {
        sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
        console.log('Sorting Level:', sortDirection);
        renderTable();
    });
});

// テーブルスタイル
$(document).ready(function() {
    $('table').css({
        'background-color': '#f5f5f5',
        'border-collapse': 'collapse',
        'width': '100%'
    });
    $('th, td').css({
        'border': '1px solid #ddd',
        'padding': '8px',
        'text-align': 'left'
    });
    $('th').css({
        'background-color': '#4CAF50',
        'color': 'white'
    });
    $('#description').css({
        'margin': '10px 0',
        'font-style': 'italic'
    });
});

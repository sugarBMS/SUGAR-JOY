// SUGARJOY BMS Difficulty Table
$(document).ready(function() {
    // 外部タイトル（ExternalTitles）を格納
    let externalTitles = [];

    // getTitlesJsonのURL（デプロイ後に実際のURLに置き換え）
    // 例: https://script.google.com/macros/s/xxx/exec
    const getTitlesUrl = 'https://script.google.com/macros/s/AKfycbzUn2xsbgmMKgmGdVAfMJpJIfPcpUc1YayoulspBj1J9cc0SH75EOCTo0DLZMyfgOY2/exec'; // TODO: 実際のURLに置き換え

    // ExternalTitlesデータを取得
    $.getJSON(getTitlesUrl, function(titles) {
        externalTitles = titles || [];
        console.log('External titles:', externalTitles);
        loadTableData(); // テーブルデータをロード
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to fetch external titles:', textStatus, errorThrown);
        externalTitles = [];
        loadTableData(); // エラー時もテーブルをロード
    });

    // テーブルデータをロード
    function loadTableData() {
        $.getJSON('/api/data', function(data) {
            console.log('Table data:', data);
            renderTable(data);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Failed to fetch table data:', textStatus, errorThrown);
            $('#table-body').html('<tr><td colspan="6">データの取得に失敗しました</td></tr>');
        });
    }

    // テーブルを描画
    function renderTable(data) {
        const tableBody = $('#table-body');
        tableBody.empty();

        // Group統合（SU99除外）
        const groupedData = {};
        data.forEach(item => {
            if (item.Group && item.Group !== 'SU99') {
                if (!groupedData[item.Group]) {
                    groupedData[item.Group] = [];
                }
                groupedData[item.Group].push(item);
            } else if (!item.Group || item.Group === '') {
                groupedData[item.Title] = [item];
            }
        });

        // テーブル行を生成
        Object.keys(groupedData).sort().forEach(group => {
            const items = groupedData[group];
            items.forEach(item => {
                const isExternal = externalTitles.includes(item.Title);
                const row = $('<tr></tr>');
                
                // Title（外部タイトルなら青）
                const titleCell = $('<td></td>').text(item.Title);
                if (isExternal) {
                    titleCell.css('color', '#0000FF');
                }
                row.append(titleCell);

                // 他の列
                row.append($('<td></td>').text(item.Artist || ''));
                row.append($('<td></td>').text(item.Level || ''));
                row.append($('<td></td>').text(item.Group || ''));

                // 糞譜面度（数値のまま）
                row.append($('<td></td>').text(item.Kusomen || ''));

                // コメント
                row.append($('<td></td>').text(item.Comment || ''));

                tableBody.append(row);
            });
        });
    }
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
});

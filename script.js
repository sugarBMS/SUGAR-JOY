// SUGARJOY BMS Difficulty Table
$(document).ready(function() {
    let externalTitles = [];

    // getTitlesJsonのURL
    const getTitlesUrl = 'https://script.google.com/macros/s/AKfycbyzaHHi9CRsJDSpIhUOLRxOp6HbR4ADruSt_wM5j_VJZVQ0btKU1zlDVXCwazVdKLQ/exec';

    // spreadsheet_url（doGet）
    const spreadsheetUrl = 'https://script.google.com/macros/s/AKfycbx7LKbaeOoqtSEJOmHrzGj770vgjKlqCS-VMsmxeUw6W3jgom2ImamdGI_gDfyHxfbB/exec';

    // ExternalTitlesデータを取得
    $.getJSON(getTitlesUrl, function(titles) {
        externalTitles = titles || [];
        console.log('External titles:', externalTitles);
        loadTableData();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.error('Failed to fetch external titles:', textStatus, errorThrown);
        externalTitles = [];
        loadTableData();
    });

    // テーブルデータをロード
    function loadTableData() {
        $.getJSON(spreadsheetUrl, function(data) {
            console.log('Table data:', data);
            renderTable(data);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Failed to fetch table data:', textStatus, errorThrown);
            $('#table-body').html('<tr><td colspan="9">データの取得に失敗しました</td></tr>');
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

                // Level
                row.append($('<td></td>').text(item.Level || ''));

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

                // 糞譜面度（数値）
                row.append($('<td></td>').text(item['糞譜面度'] || ''));

                // Comment
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

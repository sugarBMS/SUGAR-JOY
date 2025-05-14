$(document).ready(function() {
  // Level列のカスタムソート
  $.fn.dataTable.ext.type.order['level-pre'] = function(data) {
    var value = data.replace(/^SU/, '').replace(/[★☆]/g, '');
    var match = value.match(/-?\d+/);
    return match ? parseInt(match[0], 10) : 9999;
  };

  // 重複楽曲を統合する関数
  function mergeDuplicates(data) {
    const grouped = {};
    data.forEach(row => {
      const title = row.Title || '';
      if (!grouped[title]) {
        grouped[title] = [];
      }
      grouped[title].push(row);
    });

    const merged = [];
    Object.keys(grouped).forEach(title => {
      const rows = grouped[title];
      if (rows.length === 1) {
        merged.push(rows[0]);
      } else {
        // 最高Levelを選択
        const sorted = rows.sort((a, b) => {
          const aLevel = (a.Level || '').replace(/^SU/, '').replace(/[★☆]/g, '').match(/-?\d+/)?.[0] || 0;
          const bLevel = (b.Level || '').replace(/^SU/, '').replace(/[★☆]/g, '').match(/-?\d+/)?.[0] || 0;
          return parseInt(bLevel) - parseInt(aLevel); // 降順
        });
        merged.push(sorted[0]); // 最高Levelの行を選択
      }
    });
    return merged;
  }

  let allData = []; // 全データ
  let table;

  $.getJSON('header.json', function(header) {
    document.title = header.title;
    $('h1').text(header.title);
    $('p.description').html(header.description.replace(/\n/g, '<br>'));

    $.getJSON(header.spreadsheet_url, function(data) {
      allData = data; // 全データを保存

      // 初期表示（全データ）
      table = $('#bmsTable').DataTable({
        data: allData,
        columns: header.columns.map(col => ({
          title: col.name,
          data: col.key,
          render: col.key === 'Level' ? function(data) {
            return 'SU' + (data || '');
          } : col.render === 'link' ? function(data) {
            return data ? `<a href="${data}" target="_blank">DL</a>` : '';
          } : null,
          type: col.key === 'Level' ? 'level' : null
        })),
        language: { url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json' },
        paging: false,
        order: [[0, 'asc']],
        searching: true
      });

      // チェックボックスのイベント
      $('#mergeDuplicates').on('change', function() {
        const isMerged = $(this).is(':checked');
        table.clear();
        table.rows.add(isMerged ? mergeDuplicates(allData) : allData);
        table.draw();
      });
    }).fail(function(jqXHR, textStatus, errorThrown) {
      console.error('スプレッドシートデータ取得エラー:', textStatus, errorThrown);
      alert('スプレッドシートのデータ取得に失敗しました。URLや設定を確認してください。');
    });
  }).fail(function(jqXHR, textStatus, errorThrown) {
    console.error('header.json取得エラー:', textStatus, errorThrown);
    alert('header.jsonの読み込みに失敗しました。ファイルを確認してください。');
  });
});

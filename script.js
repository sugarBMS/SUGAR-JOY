$(document).ready(function() {
  // Level列のカスタムソート
  $.fn.dataTable.ext.type.order['level-pre'] = function(data) {
    var value = data.replace(/^SU/, '').replace(/[★☆]/g, '');
    var match = value.match(/-?\d+/);
    return match ? parseInt(match[0], 10) : 9999;
  };

  // 重複楽曲を統合する関数（Group優先、SU99を除く最高Level）
  function mergeDuplicates(data) {
    const grouped = new Map();
    data.forEach(row => {
      let key = row.Group && typeof row.Group === 'string' && row.Group.trim()
        ? row.Group.trim().toLowerCase()
        : (row.Title || 'Unknown').replace(/\s*\[.*\]\s*/, '').trim().toLowerCase();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(row);
    });

    const merged = [];
    grouped.forEach(rows => {
      if (rows.length === 1) {
        merged.push(rows[0]);
      } else {
        // SU99を除外し、最高Levelを選択
        const filtered = rows.filter(row => {
          const level = (row.Level || '').replace(/^SU/, '').replace(/[★☆]/g, '');
          return level !== '99';
        });
        const targetRows = filtered.length > 0 ? filtered : rows; // SU99しかない場合
        const sorted = targetRows.sort((a, b) => {
          const aLevel = (a.Level || '').replace(/^SU/, '').replace(/[★☆]/g, '').match(/-?\d+/)?.[0] || 0;
          const bLevel = (b.Level || '').replace(/^SU/, '').replace(/[★☆]/g, '').match(/-?\d+/)?.[0] || 0;
          return parseInt(bLevel) - parseInt(aLevel); // 降順
        });
        merged.push(sorted[0]);
      }
    });
    return merged;
  }

  let allData = [];
  let table;

  $.getJSON('header.json', function(header) {
    document.title = header.title;
    $('h1').text(header.title);
    $('p.description').html(header.description.replace(/\n/g, '<br>'));

    $.getJSON(header.spreadsheet_url, function(data) {
      allData = data;

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
          type: col.key === 'Level' ? 'level' : null,
          visible: col.visible !== false
        })),
        language: { url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json' },
        paging: false,
        order: [[0, 'asc']],
        searching: true,
        deferRender: true
      });

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

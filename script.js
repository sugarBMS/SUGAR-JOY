$(document).ready(function() {
  // カスタムソートプラグイン: Level列の数値部分を抽出してソート
  $.fn.dataTable.ext.type.order['level-pre'] = function(data) {
    // "SU"を除去し、数値部分を抽出
    var value = data.replace(/^SU/, ''); // "SU"を削除
    // 記号（例：★）や非数値文字を除去し、数値を抽出
    var match = value.match(/-?\d+/); // 負数を含む数値を抽出
    return match ? parseInt(match[0], 10) : 0; // 数値に変換（ない場合は0）
  };

  $.getJSON('header.json', function(header) {
    document.title = header.title;
    $('h1').text(header.title);
    $('p.description').html(header.description.replace(/\n/g, '<br>')); // 改行を<br>に変換
    $.getJSON(header.spreadsheet_url, function(data) {
      $('#bmsTable').DataTable({
        data: data,
        columns: header.columns.map(col => ({
          title: col.name,
          data: col.key,
          render: col.key === 'Level' ? function(data) {
            return 'SU' + (data || ''); // 表示時に"SU"を付加
          } : col.render === 'link' ? function(data) {
            return data ? `<a href="${data}" target="_blank">DL</a>` : '';
          } : null,
          type: col.key === 'Level' ? 'level' : null // Level列にカスタムソートを適用
        })),
        language: { url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json' },
        paging: false, // ページネーション無効
        order: [[0, 'asc']], // Levelで初期ソート（昇順）
        searching: true // 検索機能維持
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

$(document).ready(function() {
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
          render: col.render === 'link' ? function(data) {
            return data ? `<a href="${data}" target="_blank">DL</a>` : '';
          } : null
        })),
        language: { url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/ja.json' },
        paging: false, // ページネーションを無効化
        order: [[0, 'asc']], // Levelで初期ソート
        searching: true // 検索機能は維持
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

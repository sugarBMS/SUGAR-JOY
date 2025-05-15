// （省略：Levelソート、mergeDuplicates）
let externalTitles = [];
let allData = [];
let table;

function getTitleColor(title) {
  const normalizedTitle = (title || '').trim().toLowerCase();
  return externalTitles.some(t => t.trim().toLowerCase() === normalizedTitle)
    ? '#0000FF'
    : '#000000';
}

$.getJSON('header.json', function(header) {
  document.title = header.title;
  $('h1').text(header.title);
  $('p.description').html(header.description.replace(/\n/g, '<br>'));

  $.getJSON('https://script.google.com/macros/s/xxx/exec', function(titles) {
    externalTitles = titles || [];
    $.getJSON(header.spreadsheet_url, function(data) {
      allData = data;
      table = $('#bmsTable').DataTable({
        data: allData,
        columns: header.columns.map(col => ({
          title: col.name,
          data: col.key,
          render: col.key === 'Level' ? function(data) {
            return 'SU' + (data || '');
          } : col.key === 'Title' ? function(data) {
            return `<span style="color: ${getTitleColor(data)}">${data || ''}</span>`;
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
      alert('スプレッドシートのデータ取得に失敗しました。');
    });
  }).fail(function(jqXHR, textStatus, errorThrown) {
    console.error('外部タイトル取得エラー:', textStatus, errorThrown);
    alert('外部サイトのデータ取得に失敗しました。');
  });
}).fail(function(jqXHR, textStatus, errorThrown) {
  console.error('header.json取得エラー:', textStatus, errorThrown);
  alert('header.jsonの読み込みに失敗しました。');
});

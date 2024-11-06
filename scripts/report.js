$(document).ready(function() {
    const token = localStorage.getItem("token");

    if (!token) {
        localStorage.removeItem("token");
        window.location.href = '/login';
    } else {
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/dictionary/icd10/roots`,
            method: "GET",
            success: function(data) {
                const mkbSelect = $('#mkbs');
                data.forEach(record => {
                    const option = $('<option class="text-truncate"></option>')
                        .val(record.id)
                        .text(`${record.name} (${record.code})`);
                    mkbSelect.append(option);
                });
            },
            error: function() {
                alert("Ошибка при загрузке кодов МКБ-10");
            }
        });
    }

    function formatDate(date) {
        const d = new Date(date);
        return d.toISOString();
    }

    function validateDates() {
        const startDate = $('#start').val();
        const finishDate = $('#finish').val();
        if (startDate && finishDate && new Date(startDate) < new Date(finishDate)) {
            $('#findBtn').prop('disabled', false);
        } else {
            $('#findBtn').prop('disabled', true);
        }
    }

    $('#start').on('change', validateDates);
    $('#finish').on('change', validateDates);

    $('#findBtn').click(function() {
        const startDate = $('#start').val();
        const finishDate = $('#finish').val();
        const selectedIcdRoot = $('#mkbs').val();
        if (!startDate || !finishDate) {
            alert("Пожалуйста, заполните все поля.");
            return;
        }
        const formattedStartDate = formatDate(startDate + 'T00:00:00.000Z');
        const formattedFinishDate = formatDate(finishDate + 'T23:59:59.999Z');
        let url = `https://mis-api.kreosoft.space/api/report/icdrootsreport?start=${formattedStartDate}&end=${formattedFinishDate}`;
        if (selectedIcdRoot) {
            url += `&icdRoots=${selectedIcdRoot}`;
        }
        $.ajax({
            url: url,
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            success: function(response) {
                renderTable(response);
            },
            error: function() {
                alert("Ошибка при получении отчета");
            }
        });
    });

    function renderTable(data) {
        const tableContainer = $('#tableContainer');
        tableContainer.empty();
        if (data.records.length === 0) {
            tableContainer.append('<p class="text-center text-muted">Нет данных для отображения</p>');
            return;
        }
        const table = $('<table class="table table-striped table-bordered">');
        const thead = $('<thead><tr><th>Имя пациента</th><th>Дата рождения</th><th>Пол</th></tr></thead>');
        const rootColumns = Object.keys(data.summaryByRoot);
        rootColumns.forEach(root => {
            thead.find('tr').append($(`<th>${root}</th>`));
        });
        table.append(thead);
        const tbody = $('<tbody>');
        data.records.forEach(record => {
            const row = $('<tr>');
            row.append(`<td>${record.patientName}</td>`);
            row.append(`<td>${new Date(record.patientBirthdate).toLocaleDateString()}</td>`);
            row.append(`<td>${record.gender === 'Male' ? 'Мужчина' : 'Женщина'}</td>`);
            rootColumns.forEach(root => {
                const visitCount = record.visitsByRoot[root] || 0;
                row.append(`<td>${visitCount}</td>`);
            });
            tbody.append(row);
        });
        table.append(tbody);
        tableContainer.append(table);
    }
});

$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const page = urlParams.get('page') || 1;
    const size = urlParams.get('size') || 6;

    $('#name').val(urlParams.get('name') || '');
    $('#conclusions').val(urlParams.get('conclusions') || '');
    $('#sortFilter').val(urlParams.get('sorting') || '');
    $('#patientsNum').val(size);

    $('#scheduledVisitsFilter').prop('checked', urlParams.get('scheduledVisits') === 'true');
    $('#myPatientsFilter').prop('checked', urlParams.get('onlyMine') === 'true');

    loadPatients(page, size);

    $('#findBtn').on('click', function() {
        const name = $('#name').val();
        const conclusions = $('#conclusions').val();
        const sorting = $('#sortFilter').val();
        const scheduledVisits = $('#scheduledVisitsFilter').is(':checked');
        const onlyMine = $('#myPatientsFilter').is(':checked');
        const size = $('#patientsNum').val();

        const urlParams = new URLSearchParams({
            page: 1,
            size: size
        });

        if (name) {
            urlParams.set('name', name);
        }
        if (conclusions) {
            urlParams.set('conclusions', conclusions);
        }
        if (sorting) {
            urlParams.set('sorting', sorting);
        }
        if (scheduledVisits !== undefined) {
            urlParams.set('scheduledVisits', scheduledVisits);
        }
        if (onlyMine !== undefined) {
            urlParams.set('onlyMine', onlyMine);
        }

        window.location.href = '/patients?' + urlParams.toString();
    });

    $('#registerModal').on('click', function() {
        $('#registerPatientModal').modal('show');
    });

    $('#newPatientBtn').on('click', function() {
        createPatient();
    });
});

function loadPatients(page, size) {
    const token = localStorage.getItem("token");
    const urlParams = new URLSearchParams(window.location.search);

    const queryParams = {
        page: page,
        size: size
    };

    if (urlParams.get('name')) {
        queryParams.name = urlParams.get('name');
    }
    if (urlParams.get('conclusions')) {
        queryParams.conclusions = urlParams.get('conclusions');
    }
    if (urlParams.get('sorting')) {
        queryParams.sorting = urlParams.get('sorting');
    }
    if (urlParams.get('scheduledVisits') !== null) {
        queryParams.scheduledVisits = urlParams.get('scheduledVisits') === 'true';
    }
    if (urlParams.get('onlyMine') !== null) {
        queryParams.onlyMine = urlParams.get('onlyMine') === 'true';
    }

    const url = `https://mis-api.kreosoft.space/api/patient?` + new URLSearchParams(queryParams);
    console.log(url);

    $.ajax({
        url: url,
        method: "GET",
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            console.log(response);
            displayPatients(response.patients);
            setupPagination(response.pagination);
        },
        error: function(t) {
            console.log(t);
            alert(t);
        }
    });
}

function createPatient() {
    const token = localStorage.getItem("token");

    const name = $('#newname').val().trim();
    const gender = $('#gender').val();
    const birthday = $('#date').val();

    console.log(name);
    console.log(gender);
    console.log(birthday);

    if (name && gender && birthday) {
        const birthDate = new Date(birthday);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (birthDate >= today) {
            alert('Дата рождения должна быть раньше сегодняшнего дня.');
            return;
        }

        const patientData = {
            name: name,
            birthday: new Date(birthday).toISOString(),
            gender: gender
        };

        $.ajax({
            url: 'https://mis-api.kreosoft.space/api/patient',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: 'application/json',
            data: JSON.stringify(patientData),
            success: function(response) {
                $('#registerPatientModal').modal('hide');
            },
            error: function(jqXHR) {
                alert('Ошибка: ' + jqXHR.responseText);
            }
        });
    } else {
        alert('Пожалуйста, заполните все поля.');
    }
}

function displayPatients(patients) {
    const patientsContainer = $('#patientsContainer');
    patientsContainer.empty();

    patients.forEach(patient => {
        const gender = patient.gender === 'Male' ? 'Мужской' : 'Женский';

        const patientCard = `
            <div class="col">
                <div class="card h-100 shadow-sm rounded" style="background-color: #f6f6fb" onclick="window.location.href='/patient/${patient.id}'">
                    <div class="card-body">
                        <h5 class="card-title mb-1">${patient.name}</h5>
                        <p class="card-text mb-0"><span style="color: #8d8da9;">Пол - </span><strong>${gender}</strong></p>
                        <p class="card-text"><span style="color: #8d8da9;">Дата рождения - </span><strong>${new Date(patient.birthday).toLocaleDateString()}</strong></p>
                    </div>
                </div>
            </div>
        `;
        patientsContainer.append(patientCard);
    });
}

function setupPagination(pagination) {
    const paginationContainer = $('#paginationContainer');
    paginationContainer.empty();

    const currentPage = pagination.current;
    const totalPages = pagination.count;
    const maxButtons = 5;

    if (currentPage > 1) {
        const prevPageUrl = new URLSearchParams(window.location.search);
        prevPageUrl.set('page', currentPage - 1);
        paginationContainer.append(`<a href="?${prevPageUrl.toString()}" class="btn btn-outline-primary mx-1">«</a>`);
    }

    let startPage, endPage;
    if (totalPages <= maxButtons) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const halfMaxButtons = Math.floor(maxButtons / 2);
        if (currentPage <= halfMaxButtons) {
            startPage = 1;
            endPage = maxButtons;
        } else if (currentPage + halfMaxButtons >= totalPages) {
            startPage = totalPages - maxButtons + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - halfMaxButtons;
            endPage = currentPage + halfMaxButtons;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('page', i);
        paginationContainer.append(`<a href="?${urlParams.toString()}" class="btn btn-outline-primary mx-1 ${i === currentPage ? 'active' : ''}">${i}</a>`);
    }

    if (currentPage < totalPages) {
        const nextPageUrl = new URLSearchParams(window.location.search);
        nextPageUrl.set('page', currentPage + 1);
        paginationContainer.append(`<a href="?${nextPageUrl.toString()}" class="btn btn-outline-primary mx-1">»</a>`);
    }
}
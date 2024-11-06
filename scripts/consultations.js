$(document).ready(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const icdRootValue = urlParams.get('icdRoots');
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
            if (icdRootValue) {
                mkbSelect.val(icdRootValue);
            }
        },
        error: function() {
            alert("Ошибка при загрузке кодов МКБ-10");
        }
    });
    
    const page = urlParams.get('page') || 1;
    const size = urlParams.get('size') || 6;

    $('#patientsNum').val(size);

    const filterParam = urlParams.get('grouped');
    console.log(filterParam);
    if(filterParam == null){
        $('#all').prop('checked', true);
    }
    if (filterParam == "true") {
        $('#repeated').prop('checked', true);
    } else {
        $('#all').prop('checked', true);
    }

    loadConsultations(page, size);

    $('#findBtn').on('click', function() {
        const mkbs = $('#mkbs').val();
        let repeatedwrong = $('#repeated').val();
        const repeated = repeatedwrong == all ? false : true;
        const size = $('#patientsNum').val();

        const urlParams = new URLSearchParams({
            page: 1,
            size: size
        });

        if (mkbs) {
            urlParams.set('icdRoots', mkbs);
        }
        urlParams.set('grouped', repeated);
        window.location.href = '/consultations?' + urlParams.toString();
    });
});

function loadConsultations(page, size) {
    const token = localStorage.getItem("token");
    const urlParams = new URLSearchParams(window.location.search);
    const queryParams = {
        page: page,
        size: size
    };
    if (urlParams.get('icdRoots')) {
        queryParams.icdRoots = urlParams.get('icdRoots');
    }
    if (urlParams.get('grouped')) {
        queryParams.grouped = urlParams.get('grouped');
    }
    const url = `https://mis-api.kreosoft.space/api/consultation?` + new URLSearchParams(queryParams);
    console.log(url);
    $.ajax({
        url: url,
        method: "GET",
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function(response) {
            console.log(response);
            displayConsultations(response.inspections, token);
            setupPagination(response.pagination);
        },
        error: function(t) {
            console.log(t);
            alert(t);
        }
    });
}



function displayConsultations(inspections, token) {
    const consultationsContainer = $('#consultationsContainer');
    consultationsContainer.empty();

    const urlParams = new URLSearchParams(window.location.search);
    let grouped = urlParams.get('grouped');
    if(grouped === null){
        grouped = false;
    }

    inspections.forEach(inspect => {
        let statusText = '';
        let cardStyle = 'background-color: #f6f6fb';
        switch (inspect.conclusion) {
            case 'Disease':
                statusText = 'Болезнь';
                break;
            case 'Recovery':
                statusText = 'Выздоровление';
                break;
            case 'Death':
                statusText = 'Смерть';
                cardStyle = 'background-color: #ffe6e6';
                break;
            default:
                statusText = inspect.status;
        }
        if(!grouped){
            const inspectionCard = `
            <div class="col">
                <div class="card h-100 shadow-sm rounded" style="${cardStyle}">
                    <div class="card-body">
                        <div class="row align-items-center justify-items-center">
                            <div class="col-2 text-start">
                                <div style="background-color: #8d8da9; color: white">${new Date(inspect.date).toLocaleDateString()}</div>
                            </div>
                            <div class="col-6 text-start">
                                <h5 class="card-title"> Амбулаторный осмотр</h5>
                            </div>
                            <div class="col-2 text-end">
                                <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9" onclick="router.navigate('/inspection/${inspect.id}')"><strong>Детали осмотра</strong></button>
                            </div>
                        </div>
                        <p><strong>Заключение: ${statusText}</strong></p>
                        <p><strong>Основной диагноз: ${inspect.diagnosis.name} (${inspect.diagnosis.code})</strong></p>
                        <p style="color: #8d8da9"><strong>Медицинский работник: ${inspect.doctor}</strong></p>
                    </div>
                </div>
            </div>`;
            consultationsContainer.append(inspectionCard);
        }else{
            if(inspect.hasChain == true){
                $.ajax({
                    url: `https://mis-api.kreosoft.space/api/inspection/${inspect.id}/chain`,
                    method: "GET",
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    success: function(data) {
                        let chainCard = createchainCardList(inspect, data);
                        consultationsContainer.append(chainCard);
                    },
                    error: function() {
                        alert("Ошибка при загрузке осмотров");
                    }
                });
            }else{
                const inspectionCard = `
                <div class="col">
                    <div class="card h-100 shadow-sm rounded" style="${cardStyle}">
                        <div class="card-body">
                            <div class="row align-items-center justify-items-center">
                                <div class="col-2 text-start">
                                    <div style="background-color: #8d8da9; color: white">${new Date(inspect.date).toLocaleDateString()}</div>
                                </div>
                                <div class="col-6 text-start">
                                    <h5 class="card-title"> Амбулаторный осмотр</h5>
                                </div>
                                <div class="col-2 text-end">
                                    <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9" onclick="router.navigate('/inspection/${inspect.id}')"><strong>Детали осмотра</strong></button>
                                </div>
                            </div>
                            <p><strong>Заключение: ${statusText}</strong></p>
                            <p><strong>Основной диагноз: ${inspect.diagnosis.name} (${inspect.diagnosis.code})</strong></p>
                            <p style="color: #8d8da9"><strong>Медицинский работник: ${inspect.doctor}</strong></p>
                        </div>
                    </div>
                </div>`;
                consultationsContainer.append(inspectionCard);
            }
        }
    });
}
function createchainCardList(inspect, data)
{
    let childsCard = createChildList(data);
    let statusText = '';
    let cardStyle = 'background-color: #f6f6fb';
    switch (inspect.conclusion) {
        case 'Disease':
            statusText = 'Болезнь';
            break;
        case 'Recovery':
            statusText = 'Выздоровление';
            break;
        case 'Death':
            statusText = 'Смерть';
            cardStyle = 'background-color: #ffe6e6';
            break;
        default:
            statusText = inspect.status;
    }
    if(inspect.hasNested == true){
        openButton = `
        <div class="col-1 text-start">
            <button class="btn btn-primary" type="button" style="background-color: #317cb9" onclick="OpenChild('${data[0].id}')">+</button>
        </div>`;
    }
    const inspectionCard = `
        <div class="col mt-2">
            <div class="card h-100 shadow-sm rounded" style="${cardStyle}">
                <div class="card-body">
                    <div class="row align-items-center justify-items-center">
                        ${openButton}
                        <div class="col-2 text-start">
                            <div style="background-color: #8d8da9; color: white">${new Date(inspect.date).toLocaleDateString()}</div>
                        </div>
                        <div class="col-5 text-start">
                            <h5 class="card-title"> Амбулаторный осмотр</h5>
                        </div>
                        <div class="col-2 text-end">
                            <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9" onclick="router.navigate('/inspection/${inspect.id}')"><strong>Детали осмотра</strong></button>
                        </div>
                    </div>
                    <p><strong>Заключение: ${statusText}</strong></p>
                    <p><strong>Основной диагноз: ${inspect.diagnosis.name} (${inspect.diagnosis.code})</strong></p>
                    <p style="color: #8d8da9"><strong>Медицинский работник: ${inspect.doctor}</strong></p>
                </div>
                ${childsCard}
            </div>
        </div>`;
    return inspectionCard;
}
function createChildList(childList)
{
    let childs ='';
    for (let i = childList.length - 1; i >= 0; i--) {
        let statusText = '';
        let cardStyle = 'background-color: #f6f6fb';
        let openButton = ``;
        switch (childList[i].conclusion) {
            case 'Disease':
                statusText = 'Болезнь';
                break;
            case 'Recovery':
                statusText = 'Выздоровление';
                break;
            case 'Death':
                statusText = 'Смерть';
                cardStyle = 'background-color: #ffe6e6';
                break;
            default:
                statusText = inspect.status;
        }
        if(childList[i].hasNested == true){
            openButton = `
            <div class="col-1 text-start">
                <button class="btn btn-primary" type="button" style="background-color: #317cb9" onclick="OpenChild('${childList[i+1].id}')">+</button>
            </div>`;
        }
        const inspectionCard = `
            <div class="col mt-2">
                <div class="card h-100 shadow-sm rounded" id="${childList[i].id}" style="${cardStyle}; display: none">
                    <div class="card-body">
                        <div class="row align-items-center justify-items-center">
                            ${openButton}
                            <div class="col-2 text-start">
                                <div style="background-color: #8d8da9; color: white">${new Date(childList[i].date).toLocaleDateString()}</div>
                            </div>
                            <div class="col-5 text-start">
                                <h5 class="card-title"> Амбулаторный осмотр</h5>
                            </div>
                            <div class="col-2 text-end">
                                <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9" onclick="router.navigate('/inspection/${childList[i].id}')"><strong>Детали осмотра</strong></button>
                            </div>
                        </div>
                        <p><strong>Заключение: ${statusText}</strong></p>
                        <p><strong>Основной диагноз: ${childList[i].diagnosis.name} (${childList[i].diagnosis.code})</strong></p>
                        <p style="color: #8d8da9"><strong>Медицинский работник: ${childList[i].doctor}</strong></p>
                    </div>
                    ${childs}
                </div>
            </div>`;
        childs = inspectionCard;
    }
    return childs;
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

function OpenChild(id) {
    const element = document.getElementById(id);
    if (!element) {
        return;
    }
    if (element.style.display === "none") {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}
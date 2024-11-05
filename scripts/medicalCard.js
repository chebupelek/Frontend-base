$(document).ready(function () {
    const token = localStorage.getItem("token");

    const pathname = window.location.pathname;
    const patientIdMatch = pathname.match(/\/patient\/([a-f0-9-]+)/i);
    const patientId = patientIdMatch ? patientIdMatch[1] : '39abadc7-9656-4d74-bd7e-28e927a1f81b';
    console.log("Patient ID:", patientId);

    const baseUrl = 'https://mis-api.kreosoft.space/api';

    function loadPatientInfo() {
        $.ajax({
            url: `/patient/${patientId}`,
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(data) {
                $('#pacientName').text(data.name);
                $('#pacientBirthDate').text(`Дата рождения: ${new Date(data.birthday).toLocaleDateString()}`);
            },
            error: function() {
                alert("Ошибка при загрузке информации о пациенте");
            }
        });
    }

    function loadICD10Options() {
        $.ajax({
            url: `${baseUrl}/dictionary/icd10/roots`,
            method: "GET",
            success: function(data) {
                const mkbSelect = $('#mkbs');
                data.forEach(record => {
                    const option = $('<option class="text-truncate"></option>').val(record.id).text(`${record.name} (${record.code})`);
                    mkbSelect.append(option);
                });
            },
            error: function() {
                alert("Ошибка при загрузке кодов МКБ-10");
            }
        });
    }

    function loadInspections(grouped = false, icdRoots = '', page = 1, size = 6) {
        const url = new URL(`${baseUrl}/patient/${patientId}/inspections`);
        url.searchParams.append('page', page);
        url.searchParams.append('size', size);
        
        if (grouped) url.searchParams.append('grouped', grouped);
        if (icdRoots) url.searchParams.append('icdRoots', icdRoots);

        console.log(url.toString());

        $.ajax({
            url: url.toString(),
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function(data) {
                console.log(data);
                renderInspections(data.inspections, grouped);
                setupPagination(data.pagination, grouped, icdRoots, size);
            },
            error: function() {
                alert("Ошибка при загрузке осмотров");
            }
        });
    }

    function renderInspections(inspections, grouped) {
        const container = $('#inspectionsContainer');
        container.empty();
        inspections.forEach(inspect => {
            console.log(inspect);
            let statusText = '';
            let cardStyle = 'background-color: #f6f6fb';
            let addButton = `
                <div class="col-2 text-end">
                    <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9"><strong>Добавить осмотр</strong></button>
                </div>`;
    
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
                    addButton = '';
                    break;
                default:
                    statusText = inspect.status;
            }

            if(inspect.hasNested == true) addButton = '';
    
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
                                ${addButton}
                                <div class="col-2 text-end">
                                    <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9"><strong>Детали осмотра</strong></button>
                                </div>
                            </div>
                            <p><strong>Заключение: ${statusText}</strong></p>
                            <p><strong>Основной диагноз: ${inspect.diagnosis.name} (${inspect.diagnosis.code})</strong></p>
                            <p style="color: #8d8da9"><strong>Медицинский работник: ${inspect.doctor}</strong></p>
                        </div>
                    </div>
                </div>`;
                container.append(inspectionCard);
            }else{
                if(inspect.hasChain == true){
                    $.ajax({
                        url: `https://mis-api.kreosoft.space/api/inspection/${inspect.id}/chain`,
                        method: "GET",
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        success: function(data) {
                            console.log(data);
                            let chainCard = createchainCardList(inspect, data);
                            container.append(chainCard);
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
                                    ${addButton}
                                    <div class="col-2 text-end">
                                        <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9"><strong>Детали осмотра</strong></button>
                                    </div>
                                </div>
                                <p><strong>Заключение: ${statusText}</strong></p>
                                <p><strong>Основной диагноз: ${inspect.diagnosis.name} (${inspect.diagnosis.code})</strong></p>
                                <p style="color: #8d8da9"><strong>Медицинский работник: ${inspect.doctor}</strong></p>
                            </div>
                        </div>
                    </div>`;
                    container.append(inspectionCard);
                }
            }
        });
    }

    function createchainCardList(inspect, data)
    {
        let childsCard = createChildList(data);
        let statusText = '';
        let cardStyle = 'background-color: #f6f6fb';
        let addButton = `
            <div class="col-2 text-end">
                <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9"><strong>Добавить осмотр</strong></button>
            </div>`;

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
                addButton = '';
                break;
            default:
                statusText = inspect.status;
        }

        if(inspect.hasNested == true){
            addButton = '';
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
                            ${addButton}
                            <div class="col-2 text-end">
                                <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9"><strong>Детали осмотра</strong></button>
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
            let addButton = `
                <div class="col-2 text-end">
                    <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9"><strong>Добавить осмотр</strong></button>
                </div>`;
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
                    addButton = '';
                    break;
                default:
                    statusText = inspect.status;
            }

            if(childList[i].hasNested == true){
                addButton = '';
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
                                ${addButton}
                                <div class="col-2 text-end">
                                    <button class="btn btn-outline-info btn-sm" style="background-color: transparent; border: none; color: #317cb9"><strong>Детали осмотра</strong></button>
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
    

    function setupPagination(pagination, grouped, icdRoots, size) {
        const paginationContainer = $('#paginationContainer');
        paginationContainer.empty();
        const currentPage = pagination.current;
        const totalPages = pagination.count;

        if (currentPage > 1) {
            paginationContainer.append(`<button class="btn btn-outline-primary mx-1 pagination-btn" data-page="${currentPage - 1}">«</button>`);
        }

        for (let i = 1; i <= totalPages; i++) {
            paginationContainer.append(`<button class="btn btn-outline-primary mx-1 pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);
        }

        if (currentPage < totalPages) {
            paginationContainer.append(`<button class="btn btn-outline-primary mx-1 pagination-btn" data-page="${currentPage + 1}">»</button>`);
        }

        $('.pagination-btn').on('click', function () {
            const newPage = $(this).data('page');
            loadInspections(grouped, icdRoots, newPage, size);
        });
    }

    loadPatientInfo();
    loadICD10Options();
    loadInspections();

    $('#findBtn').on('click', function () {
        const grouped = $('#repeated').is(':checked');
        const icdRoots = $('#mkbs').val();
        const size = $('#patientsNum').val() || 6;
        const page = 1;
        loadInspections(grouped, icdRoots, page, size);
    });
});

function OpenChild(id) {
    const element = document.getElementById(id);
    
    if (!element) {
        console.log(`Элемент с id ${id} не найден`);
        return;
    }

    if (element.style.display === "none") {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}
const conclusionMap = {
    "Disease": "Болезнь",
    "Recovery": "Выздоровление",
    "Death": "Смерть"
};

const genderMap = {
    "male": "Мужской",
    "female": "Женский"
};

$(document).ready(function () {
    const token = localStorage.getItem("token");
    const pathname = window.location.pathname;
    const inspectionIdMatch = pathname.match(/\/inspection\/([a-f0-9-]+)/i);
    const inspectionId = inspectionIdMatch ? inspectionIdMatch[1] : null;

    let profileId = getProfileId(token, inspectionId);

    function getProfileId(token, inspectionId){
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/doctor/profile`,
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            success: function(data){
                getInspectionData(inspectionId, token, data.id);
            },
            error: function(){
                localStorage.removeItem("token");
                window.location.href = '/login';
            }
        });
    }

    let inspecData;

    function getInspectionData(inspectionId, token, profileId){
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/inspection/${inspectionId}`,
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            success: function(data){
                inspecData = data;
                displayInspectionData(data, profileId, token);
                modalDataFill(data);
            },
            error: function(){
                localStorage.removeItem("token");
                window.location.href = '/login';
            }
        });
    }

    function displayInspectionData(data, profileId, token) {
        const date = new Date(data.date);
        $("#date").text(`Амбулаторный осмотр от ${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`);
        if (data.doctor.id !== profileId) {
            $("#reduct").hide();
        }
        $("#patientName").html(`<strong>Пациент: ${data.patient.name}</strong>`);
        const patientGender = genderMap[data.patient.gender.toLowerCase()] || data.patient.gender;
        $("#patientGender").text(`Пол: ${patientGender}`);
        $("#patientBirthDate").text(`Дата рождения: ${new Date(data.patient.birthday).toLocaleDateString()}`);
        $("#doctorName").text(`Медицинский работник: ${data.doctor.name}`);
        $("#complaints").text(data.complaints);
        $("#anamnesis").text(data.anamnesis);
        $("#treatment").text(data.treatment);
        const conclusionType = conclusionMap[data.conclusion] || data.conclusion;
        $("#conclusionType").text(`Тип заключения: ${conclusionType}`);
        if (data.conclusion === "Disease" && data.nextVisitDate) {
            $("#nextVisitDate").text(`Дата следующего визита: ${new Date(data.nextVisitDate).toLocaleDateString()} ${new Date(data.nextVisitDate).toLocaleTimeString()}`);
            $("#nextVisitDate").show();
            $("#deathDate").hide();
        } else if (data.conclusion === "Death" && data.deathDate) {
            $("#deathDate").text(`Дата смерти: ${new Date(data.deathDate).toLocaleDateString()} ${new Date(data.deathDate).toLocaleTimeString()}`);
            $("#deathDate").show();
            $("#nextVisitDate").hide();
        } else {
            $("#nextVisitDate").hide();
            $("#deathDate").hide();
        }
        data.diagnoses.forEach(diagnos => {
            $("#diagnoses").append(`
                <div class="row align-items-center justify-items-center mb-3">
                    <div class="me-2"><strong>(${diagnos.code}) ${diagnos.name}</strong></div>
                    <div style="color: #8d8da9"><strong>Тип: ${diagnos.type}</strong></div>
                    <div style="color: #8d8da9"><strong>Расшифровка: ${diagnos.description}</strong></div>
                </div>
            `);
        });
        data.consultations.forEach(consultation => {
            const consultationDiv = $(`
                <div class="border p-4 shadow-sm rounded mb-3" style="background-color: #f6f6fb">
                    <div class="row align-items-center justify-items-center mb-3">
                        <div class="col-6 text-start">
                            <div class="h4" style="color: #153b73">Консультация</div>
                        </div>
                    </div>
                    <div class="row align-items-center mb-3">
                        <div><strong>Консультант: ${consultation.rootComment.author.name}</strong></div>
                    </div>
                    <div class="row align-items-center mb-3">
                        <div style="color: #8d8da9"><strong>Специализация консультанта: ${consultation.speciality.name}</strong></div>
                    </div>
                    <div id="commentaries">
                        ${consultation.commentsNumber > 0 ? `<div class="row align-items-center mb-3"><div><strong>Комментарии</strong></div></div>` : ""}
                        <div id="comentList"></div>
                    </div>
                </div>`
            );
            if (consultation.commentsNumber > 0) {
                const commentDiv = createCommentElement(consultation.rootComment, consultation, token, profileId);
                consultationDiv.find("#comentList").append(commentDiv);
            }
            $("#consultationsList").append(consultationDiv);
        });    
    } 
    
    $('#reduct').on('click', function() {
        $('#editInspectionModal').modal('show');
    });

    const diagnozisesContainer = document.getElementById('diagnozisesListForm');
    const mkbsSelect = document.getElementById('mkbsForm');
    const diagnozComment = document.getElementById('diagnozCommentForm');
    const addDiagnozisButton = document.getElementById('addDiagnozisButton');
    const typeInputs = document.querySelectorAll('input[name="type"]');
    function checkFormCompletion() {
        const isDiseaseSelected = mkbsSelect.value !== '';
        const isTypeSelected = Array.from(typeInputs).some(input => input.checked);
        addDiagnozisButton.disabled = !(isDiseaseSelected && isTypeSelected);
    }
    mkbsSelect.addEventListener('change', checkFormCompletion);
    typeInputs.forEach(input => input.addEventListener('change', checkFormCompletion));
    addDiagnozisButton.addEventListener('click', function () {
        const selectedDisease = mkbsSelect.options[mkbsSelect.selectedIndex];
        const selectedDiseaseId = selectedDisease.value;
        const selectedDiseaseName = selectedDisease.text;
        const selectedType = document.querySelector('input[name="type"]:checked').id;
        const comment = diagnozComment.value.trim();
        const newCard = document.createElement('div');
        newCard.className = "border p-4 shadow-sm rounded mb-3";
        newCard.style.backgroundColor = "#f6f6fb";
        newCard.setAttribute('data-disease-id', selectedDiseaseId);
        newCard.setAttribute('data-diagnosis-type', selectedType);
        newCard.innerHTML = `
            <div class="row align-items-center justify-items-center">
                <div class="col-12 text-start">
                    <div class="h5">${selectedDiseaseName}</div>
                    <div style="color: #8d8da9;"><strong>Тип в осмотре:</strong> ${selectedType === "Main" ? "Основной" : selectedType === "Concomitant" ? "Сопутствующий" : "Осложнение"}</div>
                    <div style="color: #8d8da9;"><strong>Расшифровка:</strong> ${comment}</div>
                </div>
            </div>
        `;
        diagnozisesContainer.appendChild(newCard);
        mkbsSelect.selectedIndex = 0;
        diagnozComment.value = '';
        checkFormCompletion();
    });

    const conclusionSelect = document.getElementById('conclusionForm');
    const nextDateDiv = document.getElementById('nextDateForm');
    const deathDateDiv = document.getElementById('deathDateForm');
    conclusionSelect.addEventListener('change', function () {
        const selectedValue = conclusionSelect.value;
        if (selectedValue === 'Disease') {
            nextDateDiv.style.display = 'block';
            deathDateDiv.style.display = 'none';
        } else if (selectedValue === 'Death') {
            nextDateDiv.style.display = 'none';
            deathDateDiv.style.display = 'block';
        } else if (selectedValue === 'Recovery') {
            nextDateDiv.style.display = 'none';
            deathDateDiv.style.display = 'none';
        }
    });

    document.getElementById('createInspectionButtonForm').addEventListener('click', function () {
        let checkResult = checkData(inspecData);
        if(checkResult){
            saveInspection(token, inspecData.id);
        }
    });
});

function saveInspection(token, id) {
    const anamnesis = document.getElementById('anamnesisForm').value;
    const complaints = document.getElementById('complaintsForm').value;
    const treatments = document.getElementById('treatmentsForm').value;
    const conclusionSelect = document.getElementById('conclusionForm').value;
    let nextVisitDateRes = null;
    let deathDateRes = null;
    if (conclusionSelect === "Disease") {
        nextVisitDateRes = document.getElementById('conclusionNextDateForm').value;
        console.log(nextVisitDateRes);
        nextVisitDateRes = new Date(nextVisitDateRes).toISOString();
        console.log(nextVisitDateRes);
    } else if (conclusionSelect === "Death") {
        deathDateRes = document.getElementById('conclusionDeathDateForm').value;
        console.log(deathDateRes);
        deathDateRes = new Date(deathDateRes).toISOString();
        console.log(deathDateRes);
    }
    const inspectionData = {
        anamnesis: anamnesis,
        complaints: complaints,
        treatment: treatments,
        conclusion: conclusionSelect,
        diagnoses: getDiagnosisList()
    };
    if (conclusionSelect === "Disease") {
        inspectionData.nextVisitDate = nextVisitDateRes;
    } else if (conclusionSelect === "Death") {
        inspectionData.deathDate = deathDateRes;
    }

    console.log(inspectionData);

    $.ajax({
        url: `https://mis-api.kreosoft.space/api/inspection/${id}`,
        method: "PUT",
        headers: {
            'Authorization': `Bearer ${token}`
        },
        contentType: "application/json",
        data: JSON.stringify(inspectionData),
        success: function(data){
            localStorage.removeItem("patientId");
            localStorage.removeItem("inspectionId");
            window.location.href = `/patients`;
        },
        error: function(){
            alert("Проблема обновления инспекции");
        }
    });
}


function checkData(inspecData){
    const complaintsInput = document.getElementById('complaintsForm');
    if (!complaintsInput.value.trim()) {
        alert("Заполните жалобы.");
        return false;
    }

    const anamnesisInput = document.getElementById('anamnesisForm');
    if (!anamnesisInput.value.trim()) {
        alert("Заполните анамнез.");
        return false;
    }

    const treatmentsInput = document.getElementById('treatmentsForm');
    if (!treatmentsInput.value.trim()) {
        alert("Заполните рекомендации");
        return false;
    }

    const conclusionSelect = document.getElementById('conclusionForm').value;
    const nextDatetime = document.getElementById('conclusionNextDateForm').value;
    const deathDatetime = document.getElementById('conclusionDeathDateForm').value;
    if(conclusionSelect == "Disease" && nextDatetime == ''){
        alert("Заполните дату следующего осмотра");
        return false;
    }else{
        if(conclusionSelect == "Disease" && nextDatetime <= inspecData.date){
            alert("Дата следующего осмотра должна быть позже нынешнего");
            return false;
        }
    }
    if(conclusionSelect == "Death" && deathDatetime == ''){
        alert("Заполните дату смерти");
        return false;
    }else{
        if(conclusionSelect == "Death" && deathDatetime >= inspecData.date){
            alert("Дата смерти не должна быть позже осмотра");
            return false;
        }
    }

    return true;
}

function getDiagnosisList() {
    const diagnosesContainer = document.getElementById('diagnozisesListForm');
    const diagnosisList = [];
    const diagnosisCards = diagnosesContainer.querySelectorAll('[data-disease-id]');
    diagnosisCards.forEach(card => {
        const diseaseId = card.getAttribute('data-disease-id');
        const descriptionText = card.querySelector('div div:last-child').textContent.trim();
        const match = descriptionText.match(/Расшифровка:\s*(.*)/);
        const description = match ? match[1].trim() : '';
        const diagnosisType = card.getAttribute('data-diagnosis-type');
        diagnosisList.push({
            icdDiagnosisId: diseaseId,
            description: description,
            type: diagnosisType
        });
    });
    console.log(diagnosisList);
    return diagnosisList;
}




function createCommentElement(comment, consultation, token, profileId) {
    let authorId;
    if(comment.author.id !== undefined){
        authorId = comment.author.id;
    }else{
        authorId = comment.authorId;
    }
    const commentDiv = $(`
        <div class="row align-items-center justify-items-center border p-4 rounded mb-2">
            <div class="d-flex flex-wrap align-items-center mb-3">
                <div class="me-2"><strong>${comment.author.name ? comment.author.name : comment.author}</strong></div>
                <div style="color: #8d8da9;" class="me-2"><strong>(${consultation.speciality.name})</strong></div>
                <div style="color: #8d8da9;"><strong>${new Date(comment.modifiedDate ? comment.modifiedDate : comment.modifyTime).toLocaleString()}</strong></div>
            </div>
            <div class="row align-items-center mb-3">
                <div class="comment-content">${comment.content}</div>
            </div>
            <div class="d-flex flex-wrap align-items-center gap-2">
                <div>${new Date(comment.createTime).toLocaleString()}</div>
                ${authorId === profileId ? `<button class="btn btn-link p-0 edit-button ms-2" type="button" style="color: #317cb9;">Редактировать</button>` : ""}
                <button class="btn btn-link p-0 toggle-replies-button ms-2" type="button" style="color: #317cb9;">Показать ответы</button>
                <button class="btn btn-link p-0 reply-button ms-2" type="button" style="color: #317cb9;">Ответить</button>
            </div>
            <div class="row align-items-center reply-section" style="display:none;">
                <div class="col-9 text-start">
                    <textarea class="form-control reply-textarea" rows="1" placeholder="Введите ваш ответ"></textarea>
                </div>
                <div class="col-3 text-end">
                    <button class="btn btn-primary w-100 reply-submit-button" type="button" style="background-color: #317cb9">Оставить комментарий</button>
                </div>
            </div>
            <div id="answers" class="col mb-3"></div>
        </div>`
    );
    commentDiv.find('.toggle-replies-button').click(function() {
        const answersContainer = commentDiv.find('#answers');
        const isShowingReplies = answersContainer.is(':visible');
        if (!isShowingReplies) {
            $.ajax({
                url: `https://mis-api.kreosoft.space/api/consultation/${consultation.id}`,
                method: "GET",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                success: function(response) {
                    answersContainer.empty();
                    response.comments
                        .filter(reply => reply.parentId === comment.id)
                        .forEach(reply => {
                            const replyDiv = createCommentElement(reply, consultation, token, profileId);
                            answersContainer.append(replyDiv);
                        });                    
                    answersContainer.show();
                    $(this).text('Скрыть ответы');
                },
                error: function() {
                    console.error("Ошибка при загрузке ответов");
                }
            });
        } else {
            answersContainer.toggle();
            $(this).text(isShowingReplies ? 'Показать ответы' : 'Скрыть ответы');
        }
    });
    commentDiv.find('.reply-button').click(function() {
        commentDiv.find('.reply-section').toggle();
    });
    commentDiv.find('.reply-submit-button').click(function() {
        const replyText = commentDiv.find('.reply-textarea').val();
        const newData = {
            "content": replyText,
            "parentId": comment.id.toString()
        }
        if (replyText) {
            $.ajax({
                url: `https://mis-api.kreosoft.space/api/consultation/${consultation.id}/comment`,
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                contentType: "application/json",
                data: JSON.stringify(newData),
                success: function(response) {},
                error: function(t) {
                    alert(t);
                    console.error("Ошибка при ответе");
                }
            });
        }
    });
    if (authorId === profileId) {
        commentDiv.find('.edit-button').click(function() {
            const isEditing = commentDiv.find('.comment-content').is(':hidden');
            const editSection = $(`
                <div class="edit-comment-section mb-3">
                    <textarea class="form-control" rows="1">${comment.content}</textarea>
                    <button class="btn btn-primary mt-2 save-edit-button" type="button" style="background-color: #ff9900">Сохранить</button>
                </div>
            `);
            if (!isEditing) {
                commentDiv.find('.comment-content').hide();
                commentDiv.append(editSection);
                editSection.find('.save-edit-button').click(function() {
                    const editedText = editSection.find('textarea').val();
                    const editedData = {
                        "content": editedText,
                    }
                    if (editedText) {
                        $.ajax({
                            url: `https://mis-api.kreosoft.space/api/consultation/comment/${comment.id}`,
                            method: "PUT",
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            contentType: "application/json",
                            data: JSON.stringify(editedData),
                            success: function(response) {},
                            error: function(t) {
                                alert(t);
                                console.error("Ошибка при изменении");
                            }
                        });
                    }
                });
            } else {
                commentDiv.find('.comment-content').show();
                commentDiv.find('.edit-comment-section').remove();
            }
        });
    }
    return commentDiv;
}

function modalDataFill(inspecData){
    $('#complaintsForm').val(inspecData.complaints);
    $('#anamnesisForm').val(inspecData.anamnesis);
    $('#treatmentsForm').val(inspecData.treatment);
    getDiseases();
    installDiagnoses(inspecData);
    $('#conclusionForm').val(inspecData.conclusion);
    if(inspecData.conclusion == "Disease"){
        $('#conclusionNextDateForm').val(new Date(inspecData.nextVisitDate).toISOString().slice(0, 16));
    }
    if(inspecData.conclusion == "Death"){
        $('#conclusionDeathDateForm').val(new Date(inspecData.deathDate).toISOString().slice(0, 16));
    }
}

function getDiseases(){
    $.ajax({
        url: `https://mis-api.kreosoft.space/api/dictionary/icd10?page=1&size=100`,
        method: "GET",
        contentType: "application/json",
        success: function(data) {
            const records = data.records;
            const recordsSelect = $('#mkbsForm');
            records.forEach(rec => {
                const option = $('<option></option>').val(rec.id).text(`${rec.name} - (${rec.code})`);
                recordsSelect.append(option);
            });
        },
        error: function() {
            alert("Ошибка при загрузке специальностей");
        }
    });
}

function installDiagnoses(inspecData){
    inspecData.diagnoses.forEach(diag => {
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/dictionary/icd10?request=${diag.name}&page=1&size=5`,
            method: "GET",
            contentType: "application/json",
            success: function(mkbs) {
                let mkbId = mkbs.records[0].id;
                const diagnosisCard = `
                    <div class="border p-4 shadow-sm rounded mb-3" style="background-color: #f6f6fb" 
                    data-disease-id="${mkbId}" 
                    data-diagnosis-type="${diag.type}">
                    <div class="row align-items-center justify-items-center">
                        <div class="col-12 text-start">
                            <div class="h5">(${diag.code}) ${diag.name}</div>
                            <div style="color: #8d8da9;"><strong>Тип в осмотре:</strong> ${diag.type === "Main" ? "Основной" : diag.type === "Concomitant" ? "Сопутствующий" : "Осложнение"}</div>
                            <div style="color: #8d8da9;"><strong>Расшифровка:</strong> ${diag.description}</div>
                        </div>
                    </div>
                </div>
                `;
                $('#diagnozisesListForm').append(diagnosisCard);
            },
            error: function() {
                alert("Ошибка при загрузке МКБ");
                return;
            }
        });
    });
}
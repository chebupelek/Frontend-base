$(document).ready(function () {
    const token = localStorage.getItem("token");

    const patientId = localStorage.getItem("patientId");
    if (!patientId) {
        window.location.href = "/pacients";
        return;
    }

    function loadPatientInfo() {
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/patient/${patientId}`,
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
    loadPatientInfo();

    function getSpecs(){
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/dictionary/speciality?page=1&size=100`,
            method: "GET",
            contentType: "application/json",
            success: function(data) {
                const specialties = data.specialties;
                const specialitySelect = $('#speciality');
                specialties.forEach(spec => {
                    const option = $('<option></option>').val(spec.id).text(spec.name);
                    specialitySelect.append(option);
                });
            },
            error: function() {
                alert("Ошибка при загрузке специальностей");
            }
        });
    }
    getSpecs();

    function getDiseases(){
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/dictionary/icd10?page=1&size=100`,
            method: "GET",
            contentType: "application/json",
            success: function(data) {
                console.log(data);
                const records = data.records;
                const recordsSelect = $('#mkbs');
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
    getDiseases();



    function getLastInspections(){
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/patient/${patientId}/inspections/search`,
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            success: function(data) {
                console.log(data);
                const inspections = data;
                const inspectionsSelect = $('#previous');
                let completedRequests = 0;
                inspections.forEach(inspec => {
                    $.ajax({
                        url: `https://mis-api.kreosoft.space/api/dictionary/icd10?request=${inspec.diagnosis.name}&page=1&size=5`,
                        method: "GET",
                        contentType: "application/json",
                        success: function(mkbs) {
                            console.log(mkbs);
                            const inspectionDate = new Date(inspec.date);
                            const formattedDate = inspectionDate.toLocaleDateString();
                            const formattedTime = inspectionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const optionText = `${formattedDate} ${formattedTime} ${inspec.diagnosis.code} - ${inspec.diagnosis.name}`;
                            const option = $('<option></option>')
                                .val(inspec.id)
                                .text(optionText)
                                .data('diagnosis', inspec.diagnosis)
                                .data('inspectionDate', inspec.date)
                                .data('diagnosisCode', mkbs.records[0].id);
                            inspectionsSelect.append(option);
                            completedRequests++;
                            if (completedRequests === inspections.length) {
                                getPrevInspecByLS();
                            }
                        },
                        error: function() {
                            alert("Ошибка при загрузке МКБ");
                            completedRequests++;
                            if (completedRequests === inspections.length) {
                                getPrevInspecByLS();
                            }
                        }
                    });
                });
            },
            error: function() {
                alert("Ошибка при загрузке осмотров");
            }
        });
    }
    getLastInspections();
    



    const inspectionTypeSwitch = document.getElementById('inspectionType');
    const previousInspectionSection = document.getElementById('previousInspectionSection');
    const previousSelect = document.getElementById('previous');
    const diagnozisesContainer = document.getElementById('diagnozises');
    inspectionTypeSwitch.addEventListener('change', function () {
        if (inspectionTypeSwitch.checked) {
            previousInspectionSection.style.display = 'block';
        } else {
            previousInspectionSection.style.display = 'none';
            previousSelect.selectedIndex = 0;
            diagnozisesContainer.innerHTML = '';
        }
    });
    previousInspectionSection.style.display = 'none';



    const consultationSwitch = document.getElementById('consultation');
    const specialitySelection = document.getElementById('specialitySelection');
    const commentSection = document.getElementById('comment');
    const addConsultationButtonCard = document.getElementById('addConsultationButtonCard');
    const consultationsContainer = document.getElementById('consultations');
    const specialitySelect = document.getElementById('speciality');
    const commentData = document.getElementById('commentData');
    const addConsultationButton = document.getElementById('addConsultationButton');
    function updateAddButtonState() {
        addConsultationButton.disabled = !(specialitySelect.value && commentData.value.trim());
    }
    consultationSwitch.addEventListener('change', function () {
        if (consultationSwitch.checked) {
            specialitySelection.style.display = 'block';
            commentSection.style.display = 'block';
            addConsultationButtonCard.style.display = 'block';
            specialitySelect.addEventListener('input', updateAddButtonState);
            commentData.addEventListener('input', updateAddButtonState);
        } else {
            specialitySelection.style.display = 'none';
            commentSection.style.display = 'none';
            addConsultationButtonCard.style.display = 'none';
            specialitySelect.value = "";
            commentData.value = "";
            addConsultationButton.disabled = true;
            consultationsContainer.innerHTML = '';
        }
    });
    addConsultationButton.addEventListener('click', function () {
        const selectedSpecialityId = specialitySelect.value;
        const selectedSpecialityName = specialitySelect.options[specialitySelect.selectedIndex].text;
        const commentText = commentData.value.trim();
        const consultationCard = document.createElement('div');
        consultationCard.className = 'border p-4 shadow-sm rounded mb-3';
        consultationCard.style.backgroundColor = '#f6f6fb';
        consultationCard.setAttribute('data-speciality-id', selectedSpecialityId);
        consultationCard.innerHTML = `
            <div class="row align-items-center justify-items-center">
                <div class="col-12 text-start">
                    <div style="color: #8d8da9"><strong>Комментарий: </strong>${commentText}</div>
                    <div style="color: #8d8da9"><strong>Специальность: </strong>${selectedSpecialityName}</div>
                </div>
            </div>
        `;
        consultationsContainer.appendChild(consultationCard);
        specialitySelect.value = "";
        commentData.value = "";
        addConsultationButton.disabled = true;
    });
    consultationSwitch.checked = false;
    specialitySelection.style.display = 'none';
    commentSection.style.display = 'none';
    addConsultationButtonCard.style.display = 'none';



    const mkbsSelect = document.getElementById('mkbs');
    const diagnozComment = document.getElementById('diagnozComment');
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
                    <div class="h5"><strong>Название болезни:</strong> ${selectedDiseaseName}</div>
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
    $('#previous').on('change', function() {
        const selectedOption = $(this).find('option:selected');
        const diagnosis = selectedOption.data('diagnosis');
        const diagnosisCode = selectedOption.data('diagnosisCode');
        diagnozisesContainer.innerHTML = '';
        if (diagnosis) {
            const diagnosisCard = `
                <div class="border p-4 shadow-sm rounded mb-3" style="background-color: #f6f6fb" 
                    data-disease-id="${diagnosisCode}" 
                    data-diagnosis-type="${diagnosis.type}">
                    <div class="row align-items-center justify-items-center">
                        <div class="col-12 text-start">
                            <div class="h5"><strong>Название болезни:</strong> ${diagnosis.name}</div>
                            <div style="color: #8d8da9;"><strong>Тип в осмотре:</strong> ${diagnosis.type === "Main" ? "Основной" : diagnosis.type === "Concomitant" ? "Сопутствующий" : "Осложнение"}</div>
                            <div style="color: #8d8da9;"><strong>Расшифровка:</strong> ${diagnosis.description}</div>
                        </div>
                    </div>
                </div>
            `;
            $('#diagnozises').append(diagnosisCard);
        }
    });



    const conclusionSelect = document.getElementById('conclusion');
    const nextDateDiv = document.getElementById('nextDate');
    const deathDateDiv = document.getElementById('deathDate');
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



    document.getElementById('createInspectionButton').addEventListener('click', function () {
        let checkResult = checkData();
        if(checkResult){
            saveInspection();
        }
    });

    document.getElementById('cancelButton').addEventListener('click', function () {
        localStorage.removeItem("patientId");
        localStorage.removeItem("inspectionId");
        window.location.href = `/patients`;
    });
    
    function saveInspection() {
        let result = getInspectionData();
        console.log(result);
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/patient/${patientId}/inspections`,
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            data: JSON.stringify(result),
            success: function() {
                console.log("yeeeee");
                alert("Успешно");
                window.location.href = '/patients';
            },
            error: function() {
                alert("Ошибка при загрузке специальностей");
            }
        });
    }
});

function getPrevInspecByLS(){
    const inspectionId = localStorage.getItem("inspectionId");
    const inspectionTypeSwitch = document.getElementById('inspectionType');
    const previousInspectionSection = document.getElementById('previousInspectionSection');
    const previousSelect = document.getElementById('previous');
    console.log("saved");
    console.log(inspectionId);
    if (inspectionId) {
        inspectionTypeSwitch.checked = true;
        previousInspectionSection.style.display = 'block';
        Array.from(previousSelect.options).forEach(option => {
            if (option.value === inspectionId) {
                option.selected = true;
                previousSelect.dispatchEvent(new Event('change'));
            }
        });
    }
}

function checkData(){
    const currentDatetime = document.getElementById('datetime').value;
    if(currentDatetime == ''){
        alert("Выберете дату осмотра");
        return false;
    }

     const inspectionDate = new Date(currentDatetime);
     const now = new Date();
     if (inspectionDate > now) {
         alert("Дата осмотра не может быть в будущем");
         return false;
     }

    const inspectionTypeSwitch = document.getElementById('inspectionType').checked;

    const selectedOption = $('#previous').find(':selected');
    if(inspectionTypeSwitch && selectedOption.val() == ""){
        alert("Выберете предыдущий осмотр");
        return false;
    }

    if(inspectionTypeSwitch && selectedOption.data('inspectionDate') >= currentDatetime){
        alert("Дата осмотра до предыдущего осмотра");
        return false;
    }

    const complaintsInput = document.getElementById('complaints');
    if (!complaintsInput.value.trim()) {
        alert("Заполните жалобы.");
        return false;
    }

    const anamnesisInput = document.getElementById('anamnesis');
    if (!anamnesisInput.value.trim()) {
        alert("Заполните анамнез.");
        return false;
    }

    if (!checkConsultationsUnique()) {
        return false;
    }

    if (!checkUniqueMainDiagnosis()) {
        return false;
    }

    const treatmentsInput = document.getElementById('treatments');
    if (!treatmentsInput.value.trim()) {
        alert("Заполните рекомендации");
        return false;
    }

    const conclusionSelect = document.getElementById('conclusion').value;
    const nextDatetime = document.getElementById('conclusionNextDate').value;
    const deathDatetime = document.getElementById('conclusionDeathDate').value;
    if(conclusionSelect == "Disease" && nextDatetime == ''){
        alert("Заполните дату следующего осмотра");
        return false;
    }else{
        if(conclusionSelect == "Disease" && nextDatetime <= currentDatetime){
            alert("Дата следующего осмотра должна быть позже нынешнего");
            return false;
        }
    }
    if(conclusionSelect == "Death" && deathDatetime == ''){
        alert("Заполните дату смерти");
        return false;
    }else{
        if(conclusionSelect == "Death" && deathDatetime >= currentDatetime){
            alert("Дата смерти не должна быть позже осмотра");
            return false;
        }else{
            if(inspectionTypeSwitch && conclusionSelect == "Death" && deathDatetime <= selectedOption.data('inspectionDate')){
                alert("Дата смерти не должна быть раньше предыдущего осмотра");
                return false;
            }
        }
    }

    return true;
}

function getConsultationsList() {
    const consultationsContainer = document.getElementById('consultations');
    const consultationsList = [];
    const consultationCards = consultationsContainer.querySelectorAll('[data-speciality-id]');
    consultationCards.forEach(card => {
        const specialityId = card.getAttribute('data-speciality-id');
        const commentText = card.querySelector('div div').textContent.trim();
        const match = commentText.match(/Комментарий:\s*(.*)/);
        const comment = match ? match[1].trim() : '';
        consultationsList.push({
            specialityId: specialityId,
            comment: {
                content: comment
            }
        });
    });
    
    return consultationsList;
}

function checkConsultationsUnique() {
    const consultationsList = getConsultationsList();
    const specialityIds = new Set();
    for (const consultation of consultationsList) {
        if (specialityIds.has(consultation.specialityId)) {
            alert(`Консультация с ID ${consultation.specialityId} уже есть`);
            return false;
        }
        specialityIds.add(consultation.specialityId);
    }
    return true;
}

function getDiagnosisList() {
    const diagnosesContainer = document.getElementById('diagnozises');
    const diagnosisList = [];
    const diagnosisCards = diagnosesContainer.querySelectorAll('[data-disease-id]');
    diagnosisCards.forEach(card => {
        const diseaseId = card.getAttribute('data-disease-id');
        const descriptionText = card.querySelector('div div:last-child').textContent.trim();
        const match = descriptionText.match(/Расшифровка:\s*(.*)/);
        const description = match ? match[1].trim() : '';
        const diagnosisType = card.getAttribute('data-diagnosis-type');
        diagnosisList.push({
            id: diseaseId,
            description: description,
            type: diagnosisType
        });
    });
    return diagnosisList;
}

function checkUniqueMainDiagnosis() {
    const diagnosisCards = getDiagnosisList();
    if(diagnosisCards.length <= 0){
        alert("Нужны диагнозы");
        return;
    }
    let mainDiagnosisCount = 0;
    diagnosisCards.forEach(diagnosis => {
        if (diagnosis.type === "Main") {
            mainDiagnosisCount++;
        }
    });
    if (mainDiagnosisCount !== 1) {
        alert("Должен быть ровно один основной диагноз");
        return false;
    }
    return true;
}

function getInspectionData() {
    const currentDatetime = document.getElementById('datetime').value;
    const inspectionDate = new Date(currentDatetime).toISOString();
    const anamnesis = document.getElementById('anamnesis').value.trim();
    const complaints = document.getElementById('complaints').value.trim();
    const treatments = document.getElementById('treatments').value.trim();
    const conclusionSelect = document.getElementById('conclusion').value;
    let nextVisitDate = null;
    let deathDate = null;
    if (conclusionSelect === "Disease") {
        nextVisitDate = document.getElementById('conclusionNextDate').value;
        nextVisitDate = new Date(nextVisitDate).toISOString();
    } else if (conclusionSelect === "Death") {
        deathDate = document.getElementById('conclusionDeathDate').value;
        deathDate = new Date(deathDate).toISOString();
    }
    const previousInspectionId = document.getElementById('previous').value || null;
    const diagnoses = getDiagnosisList().map(diagnosis => ({
        icdDiagnosisId: diagnosis.id,
        description: diagnosis.description, 
        type: diagnosis.type
    }));
    const consultations = getConsultationsList();
    const inspectionData = {
        date: inspectionDate,
        anamnesis: anamnesis,
        complaints: complaints,
        treatment: treatments,
        conclusion: conclusionSelect,
        diagnoses: diagnoses,
        consultations: consultations
    };
    if (conclusionSelect === "Disease") {
        inspectionData.nextVisitDate = nextVisitDate;
    } else if (conclusionSelect === "Death") {
        inspectionData.deathDate = deathDate;
    }
    if (previousInspectionId) {
        inspectionData.previousInspectionId = previousInspectionId;
    }
    return inspectionData;
}

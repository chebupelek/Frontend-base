$(document).ready(function() {
    const token = localStorage.getItem("token");
    if(!token){
        localStorage.removeItem("token");
        window.location.href = '/login';
    }else{
        console.log(token);
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/doctor/profile`,
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            success: function(data){
                console.log(data);
                showProfileData(data)
            },
            error: function(t){
                localStorage.removeItem("token");
                window.location.href = '/login';
            }
        })
    }

    const form = $('#profileForm');
    const saveProfileBtn = $('#saveProfileBtn');

    form.on('input', () => {
        saveProfileBtn.prop('disabled', !form[0].checkValidity());
    });

    saveProfileBtn.on('click', handleSaveProfileData);
});

function showProfileData(data) {
    $('#name').val(data.name);
    $('#gender').val(data.gender);
    $('#date').val(data.birthday.split('T')[0]);
    $('#phone').val(data.phone);
    $('#email').val(data.email);
}

function handleSaveProfileData() {
    const name = $('#name').val().trim();
    const gender = $('#gender').val();
    const birthdate = $('#date').val();
    const phone = $('#phone').val();
    const email = $('#email').val().trim();

    const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(phone)) {
        alert('Телефон должен быть в формате +7 (xxx) xxx-xx-xx');
        return;
    }

    if (!emailRegex.test(email)) {
        alert('Введите корректный email');
        return;
    }

    const profileData = {
        name: name,
        email: email,
        birthday: new Date(birthdate).toISOString(),
        gender: gender,
        phone: phone,
    };

    const token = localStorage.getItem("token");
    if(!token){
        localStorage.removeItem("token");
        window.location.href = '/login';
    }else{
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/doctor/profile`,
            method: "PUT",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            data: JSON.stringify(profileData),
            success: function(){
                window.location.href = '/profile';
            },
            error: function(t){
                localStorage.removeItem("token");
                window.location.href = '/login';
            }
        })
    }
}

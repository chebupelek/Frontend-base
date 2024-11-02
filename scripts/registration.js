$(document).ready(function() {
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

    const form = $('#registrationForm');
    const registerBtn = $('#registerBtn');

    form.on('input', () => {
        registerBtn.prop('disabled', !form[0].checkValidity());
    });

    registerBtn.on('click', handleRegistration);
});

function handleRegistration() {
    const name = $('#name').val().trim();
    const gender = $('#gender').val();
    const birthdate = $('#date').val();
    const phone = $('#phone').val();
    const speciality = $('#speciality').val();
    const email = $('#email').val().trim();
    const password = $('#password').val();

    const phoneRegex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(phone)) {
        alert('Телефон должен быть в формате +7 (xxx) xxx-xx-xx');
        return;
    }

    if (password.length < 6) {
        alert('Пароль должен быть не менее 6 символов');
        return;
    }

    if (!emailRegex.test(email)) {
        alert('Введите корректный email');
        return;
    }

    const registrationData = {
        name: name,
        password: password,
        email: email,
        birthday: new Date(birthdate).toISOString(),
        gender: gender,
        phone: phone,
        speciality: speciality
    };
    console.log(registrationData);

    $.ajax({
        url: `https://mis-api.kreosoft.space/api/doctor/register`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(registrationData),
        success: function(data) {
            if (data.token) {
                localStorage.setItem("token", data.token);
                window.location.href = '/patients';
            } else {
                alert('Ошибка при регистрации');
            }
        },
        error: function() {
            alert("Ошибка при регистрации");
        }
    });
}

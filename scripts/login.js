const password_pattern = RegExp("[a-zA-Z0-9]{6,}");
const email_pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z0-9]{2,}$/;

document.querySelector("#loginBut").addEventListener("click", () => {
    const mail = document.querySelector("#mail");
    const password = document.querySelector("#password");

    mail.classList.remove("is-invalid");
    password.classList.remove("is-invalid");

    if (!email_pattern.test(mail.value)) {
        mail.classList.add("is-invalid");
        mail.parentElement.querySelector(".invalid-feedback").textContent = "Введите корректный адрес электронной почты";
        return;
    }

    if (!password_pattern.test(password.value)) {
        password.classList.add("is-invalid");
        password.parentElement.querySelector(".invalid-feedback").textContent = "Пароль должен быть не менее 6 символов";
        return;
    }

    const loginData = {
        "email": mail.value,
        "password": password.value
    };

    console.log(loginData);

    $.ajax({
        method: "POST",
        url: "https://mis-api.kreosoft.space/api/doctor/login",
        contentType: "application/json",
        data: JSON.stringify(loginData),
        success: function(data) {
            localStorage.setItem("token", data.token);
            console.log(data.token);
            window.location.href = '/patients';
        },
        error: function(error) {
            let errorMessage = 'Ошибка входа.';
            if (error.status === 400) {
                errorMessage = 'Неверный запрос. Пожалуйста, проверьте введенные данные.';
            }
            alert(errorMessage);
        }
    });
});

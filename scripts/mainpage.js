window.addEventListener("load", ()=>{
    const token = localStorage.getItem("token");
    if(!token){
        showLoggedOutView();
    }else{
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/doctor/profile`,
            method: "GET",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            success: function(data){
                showLoggedInView(data.name)
            },
            error: function(t){
                localStorage.removeItem("token");
                showLoggedOutView();
            }
        })
    }
});

document.querySelector("#logout").addEventListener("click", ()=>{
    const token = localStorage.getItem("token");

    if(!token){
        showLoggedOutView();
        window.location.href = '/login';
    }else{
        $.ajax({
            url: `https://mis-api.kreosoft.space/api/doctor/logout`,
            method: "POST",
            headers: {
                'Authorization': `Bearer ${token}`
            },
            contentType: "application/json",
            success: function(){
                localStorage.removeItem("token");
                showLoggedOutView();
                window.location.href = '/login';
            },
            error: function(t){
                alert(t);
                localStorage.removeItem("token");
                showLoggedOutView();
                window.location.href = '/login';
            }
        })
    }
});

function showLoggedOutView() {
    document.querySelector("#profilemenu").style.display = "none";
    document.querySelector("#login").style.display = "block";
    document.querySelector("#patientsRef").style.display = "none";
    document.querySelector("#consultationsRef").style.display = "none";
    document.querySelector("#reportRef").style.display = "none";
    if (window.location.pathname !== "/login" && window.location.pathname !== "/registration") {
        window.location.href = "/login";
    }
}

function showLoggedInView(username) {
    document.querySelector("#dropdownMenu").textContent = username;
    document.querySelector("#profilemenu").style.display = "block";
    document.querySelector("#login").style.display = "none";
    document.querySelector("#patientsRef").style.display = "block";
    document.querySelector("#consultationsRef").style.display = "block";
    document.querySelector("#reportRef").style.display = "block";
}
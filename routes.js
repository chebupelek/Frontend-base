document.querySelector("head").innerHTML = `<meta charset="UTF-8">`;

let route = window.location.pathname;
console.log(route);
switch (route) {
    case "/login":
        $.get("pages/login/login.html", (data)=>{
            updatepage(data);
            document.querySelector("head").innerHTML+=`<title>login</title>`;
        });
        break;
    case "/registration":
        $.get("pages/registration/registration.html", (data)=>{
            updatepage(data);
            document.querySelector("head").innerHTML+=`<title>registration</title>`;
        });
        break;
    case "/profile":
        $.get("pages/profile/profile.html", (data)=>{
            updatepage(data);
            document.querySelector("head").innerHTML+=`<title>profile</title>`;
        });
        break;
}

function updatepage(page){
    $("main").html(page);
}
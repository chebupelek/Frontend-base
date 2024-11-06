const router = new Navigo("/");

function updatePage(page) {
    $("main").html(page);
}

function setPageTitle(title) {
    document.querySelector("head").innerHTML += `<title>${title}</title>`;
}

router
    .on("/login", () => {
        $.get("/pages/login/login.html", (data) => {
            updatePage(data);
            setPageTitle("login");
        });
    })
    .on("/registration", () => {
        $.get("/pages/registration/registration.html", (data) => {
            updatePage(data);
            setPageTitle("registration");
        });
    })
    .on("/profile", () => {
        $.get("/pages/profile/profile.html", (data) => {
            updatePage(data);
            setPageTitle("profile");
        });
    })
    .on("/patients", () => {
        $.get("/pages/patients/patients.html", (data) => {
            updatePage(data);
            setPageTitle("patients");
        });
    })
    .on("/patient/:id", (params, query) => {
        const patientId = params.id;
        $.get("/pages/medicalcard/medicalCard.html", (data) => {
            updatePage(data);
            setPageTitle(`Patient`);
        });
    })
    .on("/inspectionCreate", () => {
        $.get("/pages/inspectioncreate/inspectionCreate.html", (data) => {
            updatePage(data);
            setPageTitle(`Create`);
        });
    })
    .on("/inspection/:id", (params, query) => {
        $.get("/pages/inspectiondata/inspectionData.html", (data) => {
            updatePage(data);
            setPageTitle(`Create`);
        });
    })
    .notFound(() => {
        updatePage("<h1>404 - Page Not Found</h1>");
    });

router.resolve();

router.updatePageLinks();

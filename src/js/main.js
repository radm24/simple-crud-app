//Fetch and promise polyfills for IE11
import { fetch } from 'whatwg-fetch';
import 'promise-polyfill/src/polyfill';

import '../css/style.css';

if (!localStorage["hospitalTable"]) {
    //Получаем данные из json файла
    fetch("./src/data/lpu.json")
        .then(response => response.json())
        .then(data => setDataToLocalStorage(data))
        .catch(error => console.log(error));
} else {
    //Извлекаем данные из localStorage
    fetchDataFromLocalStorage();
}

function setDataToLocalStorage(data) {
    const hospitals = {};
    data.LPU.forEach(element => {
        element = validateRecord(element);
        hospitals[element.id] = { ...element };
    })
    localStorage["hospitalTable"] = JSON.stringify(hospitals);
    createTableFromJSON(hospitals);
}

function fetchDataFromLocalStorage() {
    const hospitals = JSON.parse(localStorage["hospitalTable"]);
    createTableFromJSON(hospitals);
}

function createTableFromJSON(data) {
    const category = ["Наименование учреждения", "Адрес", "Телефон", ""];

    //Создаем таблицу и ее шапку
    const table = document.createElement("table");
    table.setAttribute("id", "hospitals");
    let tr = table.insertRow(-1);
    tr.classList.add("table-head");
    for (let i = 0; i < category.length; i++) {
        const th = document.createElement("th");
        th.classList.add("column" + i);
        th.innerHTML = category[i];
        tr.appendChild(th);
    }

    //Заполняем таблицу данными
    const arrayOfHospitals = Object.keys(data).map(key => data[key]);
    arrayOfHospitals.forEach(hospital => {
        tr = table.insertRow(-1);
        tr.id = hospital.id;
        //TOFIX: Resolve hid key
        // hospital.hid ? tr.classList.add("part", hospital.hid) : null;
        for (let key in hospital) {
            if (key === 'id' || key === 'hid') {
                continue;
            }
            const cell = tr.insertCell(-1);
            cell.classList.add(key);
            cell.innerHTML = hospital[key] ? hospital[key] : "";
        }
        const cell = tr.insertCell(-1);
        cell.classList.add("control-panel");
        tr.appendChild(cell);
        //Создаем кнопки для возможности редактирования
        cell.appendChild(createButton("cancel", "Отмена", hospital.id, cancel));
        cell.appendChild(createButton("save", "Сохранить", hospital.id, save));
        cell.appendChild(createButton("edit", "Изменить", hospital.id, edit));
        cell.appendChild(createButton("delete", "Удалить", hospital.id, remove));
    })

    //Функция "Добавить"
    tr = table.insertRow(-1);
    for (let i = 0; i < category.length - 1; i++) {
        const newCell = tr.insertCell(-1);
        newCell.classList.add("column-add" + i);
        const tableBox = document.createElement("input");
        tableBox.setAttribute("type", "text");
        tableBox.setAttribute("value", "");
        newCell.appendChild(tableBox);
    }
    const cell = tr.insertCell(-1);
    cell.classList.add("add-panel");
    cell.appendChild(createButton("add", "Добавить", "", add));
   
    //Прикрепляем таблицу к body
    const divContainer = document.getElementsByClassName("wrapper");
    divContainer[0].innerHTML = "";
    divContainer[0].appendChild(table);
}

//Функция для создания кнопок
function createButton(name, label, elementId, callback) {
    // const td = document.createElement("td");
    // td.classList.add(name);
    const button = document.createElement('input');
    button.classList.add(name);
    button.setAttribute("type", "button");
    button.setAttribute("value", label);
    button.setAttribute("id", name + elementId);
    button.addEventListener("click", callback);
    // td.appendChild(button);
    (name === "save" || name === "cancel") ? button.classList.add("hidden") : null;
    return button;
}

//Кнопка "Отмена"
function cancel(event) {
    //Скрываем и показываем кнопки
    const activeRow = event.target.parentElement.parentElement.rowIndex;
    const tab = document.querySelector("#hospitals").rows[activeRow];
    //Проверяем через какую кнопку вызвана "Отмена"
    let adjBtn = event.target.classList.contains("cancel") ? "save" : "cancel";
    event.target.classList.add("hidden");
    document.querySelector(`#${adjBtn}` + tab.id).classList.add("hidden");
    document.querySelector("#edit" + tab.id).classList.remove("hidden");
    //Возвращаем исходные данные
    const recordObj = JSON.parse(localStorage["hospitalTable"])[tab.id];
    const record = Object.keys(recordObj).map(key => recordObj[key]);
    for (let i = 0; i < 3; i++) {
        const td = tab.getElementsByTagName("td")[i];
        td.innerHTML = record[i + 2] ? record[i + 2] : "";
    }
}

//Кнопка "Сохранить"
function save(event) {
    const activeRow = event.target.parentElement.parentElement.rowIndex;
    const tab = document.querySelector("#hospitals").rows[activeRow];
    //Сохраняем новые данные
    const newData = [];
    for (let i = 0; i < 3; i++) {
        const td = tab.getElementsByTagName("td")[i];
        newData.push(td.childNodes[0].value);
    }
    //Проверяем наличие данных
    const isEmpty = newData.join('');
    if (!isEmpty.length) {
        remove(event);
    } else if (!newData[0]) {
        alert("Введите наименование учреждения!");
    } else {
        //Валидация значений
        validateRecord(newData);
        //В случае некорректных данных
        if (!newData[0] || !(newData[0] + newData[1] + newData[2])) {
            alert("Повторите попытку!");
            return cancel(event);
        }
        //Вносим новые данные в localStorage
        const hospital = JSON.parse(localStorage["hospitalTable"]);
        const record = hospital[tab.id];
        for (let i = 2; i < 5; i++) {
            record[Object.keys(record)[i]] = newData[i - 2];
        }
        hospital[tab.id] = record;
        localStorage["hospitalTable"] = JSON.stringify(hospital);
        //Отображаем в таблице новые данные
        for (let i = 0; i < 3; i++) {
            const td = tab.getElementsByTagName("td")[i];
            td.innerHTML = newData[i] ? newData[i] : "";
        }
        //Скрываем и открываем кнопки
        event.target.classList.add("hidden");
        document.querySelector("#cancel" + tab.id).classList.add("hidden");
        document.querySelector("#edit" + tab.id).classList.remove("hidden");
    }
}

//Кнопка "Изменить"
function edit(event) {
    //Меняем td на input
    const activeRow = event.target.parentElement.parentElement.rowIndex;
    const tab = document.querySelector("#hospitals").rows[activeRow];
    const ctrlPanel = tab.childNodes[3];
    for (let i = 0; i < 3; i++) {
        const td = tab.getElementsByTagName("td")[i];
        const textBox = document.createElement("input");
        textBox.setAttribute("type", "text");
        textBox.setAttribute("value", td.innerText);
        td.innerText = "";
        td.appendChild(textBox);
    }
    //Скрываем и открываем кнопки
    for (let i = 0; i < ctrlPanel.childNodes.length - 1; i++) {
        if (ctrlPanel.childNodes[i].classList.contains("hidden")) {
            ctrlPanel.childNodes[i].classList.remove("hidden");
        }
    }
    event.target.classList.add("hidden");
}

//Кнопка "Удалить"
function remove(event) {
    const activeRow = event.target.parentElement.parentElement.rowIndex;
    const tab = document.querySelector("#hospitals").rows[activeRow];
    let hospitals = JSON.parse(localStorage["hospitalTable"]);
    delete hospitals[tab.id];
    localStorage["hospitalTable"] = JSON.stringify(hospitals);
    tab.parentElement.removeChild(tab);
}

//Кнопка "Добавить"
function add(event) {
    const activeRow = event.target.parentElement.parentElement.rowIndex;
    const tab = document.querySelector("#hospitals").rows[activeRow];
    const newData = [];
    for (let i = 0; i < 3; i++) {
        const td = tab.getElementsByTagName("td")[i];
        newData.push(td.childNodes[0].value);
    }
    if (!newData[0]) {
        alert("Введите наименование учреждения!")
    } else {
        //Валидация значений
        validateRecord(newData);
        //В случае некорректных данных
        if (!newData[0] || newData[0] === newData[1] === newData[2] === null) {
            alert("Повторите попытку!");
            return;
        }
        //Вносим новую запись в таблицу в localStorage
        const lastRecord = document.querySelector("#hospitals").lastChild.childNodes[document.querySelector("#hospitals").rows.length - 2];
        const hospitals = JSON.parse(localStorage["hospitalTable"]);
        const newRecord = { ...hospitals[lastRecord.id] };
        const newRecordId = lastRecord.id++ + 1;
        newData.unshift(newRecordId, null);
        const keys = Object.keys(newRecord);
        for (let i = 0; i < keys.length; i++) {
            newRecord[keys[i]] = newData[i];
        }
        hospitals[newRecordId] = newRecord;
        localStorage["hospitalTable"] = JSON.stringify(hospitals);
        createTableFromJSON(hospitals);
    }
}

//Валидация значений
function validateRecord(record, status = "post") {
    if (Array.isArray(record)) {
        record[0] = validateName(record[0], status);
        record[1] = validateAddress(record[1], status);
        record[2] = validatePhone(record[2], status);
    } else {
        record["full_name"] = validateName(record["full_name"]);
        record["address"] = validateAddress(record["address"]);
        record["phone"] = validatePhone(record["phone"]);
    }
    return record;
}

function validateName(fullName, status) {
    const regEx = /[\<\>]/g;
    //Проверка на номер телефона
    status = "check";
    if (validatePhone(fullName, status)) {
        fullName = "";
    } else {
        fullName = regEx.test(fullName) ? fullName.replace(regEx, "") : /^[^a-zA-Zа-яА-Я]+$/.test(fullName) ? null : fullName;
    }
    return fullName;
}

function validateAddress(address, status) {
    const regEx = /[\<\>]/g;
    //Проверка на номер телефона
    status = "check";
    if (validatePhone(address, status)) {
        address = "";
    } else {
        address = regEx.test(address) ? address.replace(regEx, "") : /^[^a-zA-Zа-яА-Я]+$/.test(address) ? null : address;
    }
    return address;
}

function validatePhone(phone, status = "check") {
    //TOFIX: Include comma symbol to rePhone regex
    const rePhone = /^(\s*)?(\+)?([- _():=+]?\d[- _():=+]?){5,12}(\s*)?$/;
    const reComma = /,/g;
    const validatedPhones = [];
    if (phone) {
        const arrOfPhones = phone.split(",");
        let invalidPhoneNumber = [];
        arrOfPhones.forEach(phone => {
            if (status === 'post') {
                (rePhone.test(phone) || null || (reComma.test(phone) && !rePhone.test(phone))) ? validatedPhones.push(phone) : invalidPhoneNumber.push("error");
            } else {
                (rePhone.test(phone) || null || (reComma.test(phone) && !rePhone.test(phone))) ? validatedPhones.push(phone) : "";
            }
        })
        invalidPhoneNumber.length ? alert("Некорректный номер телефона!") : null;
        invalidPhoneNumber = [];
        phone = validatedPhones.join(", ");
    }
    return phone;
}
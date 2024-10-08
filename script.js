document.addEventListener('DOMContentLoaded', async () => {
    await fetchNotionData(); // 데이터를 가져오고 필터 적용
    setInitialFilters(); // 페이지 로드 시 초기 필터 설정
});

// 새로운 함수를 추가합니다.
function selectExistingFilter(departmentFilters, department) {
    const existingOption = Array.from(departmentFilters.options).find(option => option.value === department);
    if (existingOption) {
        existingOption.selected = true;
        console.log(`Existing filter automatically selected: ${department}`);
        departmentFilters.dispatchEvent(new Event('change')); // 필터 변경 이벤트를 트리거
    }
}

function setInitialFilters() {
    const currentUrl = window.location.href;
    const departmentFilters = document.getElementById('departmentFilters');

    if (currentUrl.includes('/culture')) {
        addAndSelectFilter(departmentFilters, 'culture', '문화', ['창작예술', '문화']);
    } else if (currentUrl.includes('/academic')) {
        addAndSelectFilter(departmentFilters, 'academic', '학술', ['학술교양', '정보과학']);
    } else if (currentUrl.includes('/physical')) {
        addAndSelectFilter(departmentFilters, 'physical', '체육', ['생활체육', '무술체육', '구기체육']);
    } else if (currentUrl.includes('/performance')) {
        addAndSelectFilter(departmentFilters, 'performance', '공연', ['공연예술', '음악연주']);
    } else if (currentUrl.includes('/religion')) {
        selectExistingFilter(departmentFilters, '종교');
    } else if (currentUrl.includes('/volunteer')) {
        selectExistingFilter(departmentFilters, '봉사');
    }
}

function addAndSelectFilter(departmentFilters, filterValue, filterText, associatedDepartments) {
    const existingOption = Array.from(departmentFilters.options).find(option => option.value === filterValue);
    if (!existingOption) {
        const filterOption = document.createElement('option');
        filterOption.value = filterValue;
        filterOption.textContent = filterText;
        filterOption.selected = true; // 자동 선택
        departmentFilters.appendChild(filterOption);
        departmentFilters.dataset.selectedDepartments = JSON.stringify(associatedDepartments);

        console.log(`${filterText} filter automatically selected`);

        // 해당 필터를 숨김 처리
        filterOption.style.display = 'none';
    } else {
        existingOption.selected = true; // 이미 있는 필터라면 선택만 함
        departmentFilters.dataset.selectedDepartments = JSON.stringify(associatedDepartments);
        console.log(`${filterText} filter already exists and is selected`);
    }
    departmentFilters.dispatchEvent(new Event('change')); // 필터 변경 이벤트를 트리거
}

function calculateDaysLeft(startDate) {
    const today = new Date();
    const start = new Date(startDate);
    const difference = start.getTime() - today.getTime();
    const daysLeft = Math.ceil(difference / (1000 * 3600 * 24));
    return daysLeft;
}

function isTodayBetweenDates(startDate, endDate) {
    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return today >= start && today <= end;
}

function showPopup(message, clubName, startDate, endDate) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';

    // X 아이콘 추가
    const closeIcon = document.createElement('span');
    closeIcon.className = 'close-icon';
    closeIcon.innerHTML = '&times;';
    closeIcon.onclick = () => document.body.removeChild(popup);
    popupContent.appendChild(closeIcon);

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    popupContent.appendChild(messageElement);

    // 추가된 작은 글씨 (줄 바꿈 반영)
    const infoElement = document.createElement('p');
    infoElement.innerHTML = '전화번호를 입력해주시면 모집 시작일에 알림을 드릴게요!';
    infoElement.className = 'info-text';
    popupContent.appendChild(infoElement);

    // 전화번호 입력 칸 추가
    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel';
    phoneInput.placeholder = '010-0000-0000';
    phoneInput.className = 'phone-input';
    phoneInput.style.color = '#d3d3d3';  // 더 옅은 회색으로 텍스트 색상 설정
    popupContent.appendChild(phoneInput);

    const closeButton = document.createElement('button');
    closeButton.textContent = '확인';
    closeButton.className = 'popup-button';
    closeButton.onclick = async () => {
        const phoneNumber = phoneInput.value;
        console.log('Entered phone number:', phoneNumber); // 로그 추가
        if (phoneNumber) {
            const pageUrl = window.location.href; // 현재 페이지 URL
            const timestamp = new Date().toISOString(); // 현재 타임스탬프
            const isSaved = await savePhoneNumber(clubName, phoneNumber, startDate, endDate, timestamp, pageUrl);
            if (isSaved) {
                window.location.href = 'http://pf.kakao.com/_xjsxmXG';
            } else {
                alert('전화번호 저장에 실패했습니다.');
            }
        }
        document.body.removeChild(popup);
    };
    popupContent.appendChild(closeButton);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);
}

async function savePhoneNumber(clubName, phoneNumber, startDate, endDate, timestamp, pageUrl) {
    console.log('savePhoneNumber function called');
    try {
        const response = await fetch('/api/savePhoneNumber', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ clubName, phoneNumber, startDate, endDate, timestamp, pageUrl })
        });
        if (response.ok) {
            console.log('Phone number saved successfully');
            return true;
        } else {
            const errorText = await response.text();
            console.error('Failed to save phone number:', errorText);
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

async function fetchNotionData() {
    try {
        const response = await fetch('/api/fetchNotionData');

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch data:', response.status, response.statusText, errorText);
            return;
        }

        const data = await response.json();
        console.log('Notion Data:', data);

        const notionList = document.querySelector('#notionList');
        notionList.innerHTML = '';

        const departments = new Set();
        data.results.forEach(page => {
            const department = page.properties['세부 분과']?.rich_text?.[0]?.plain_text || 'No Department';
            departments.add(department);
        });

        const departmentFilters = document.getElementById('departmentFilters');

        // 기존의 필터들은 그대로 유지
        departments.forEach(department => {
            if (!Array.from(departmentFilters.options).find(option => option.value === department)) {
                const option = document.createElement('option');
                option.value = department;
                option.textContent = department;
                departmentFilters.appendChild(option);
            }
        });

        const applicationFilterButton = document.getElementById('applicationFilterButton');

        departmentFilters.addEventListener('change', () => {
            filterAndDisplayResults(data); // 필터가 변경되면 결과를 갱신
        });

        applicationFilterButton.addEventListener('click', () => {
            applicationFilterButton.classList.toggle('active');
            filterAndDisplayResults(data);
        });

        filterAndDisplayResults(data); // 초기 필터 설정 후 필터링 결과 표시

    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function filterAndDisplayResults(data) {
    const onlyApplication = document.getElementById('applicationFilterButton').classList.contains('active');
    const departmentFilters = document.getElementById('departmentFilters');
    const selectedDepartments = Array.from(departmentFilters.selectedOptions)
        .map(option => option.value)
        .filter(value => value);

    let finalSelectedDepartments = selectedDepartments;
    if (selectedDepartments.includes('culture')) {
        finalSelectedDepartments = ['창작예술', '문화'];
    } else if (selectedDepartments.includes('academic')) {
        finalSelectedDepartments = ['학술교양', '정보과학'];
    } else if (selectedDepartments.includes('physical')) {
        finalSelectedDepartments = ['생활체육', '무술체육', '구기체육'];
    } else if (selectedDepartments.includes('performance')) {
        finalSelectedDepartments = ['공연예술', '음악연주'];
    } else if (selectedDepartments.includes('religion')) {
        finalSelectedDepartments = ['종교'];
    } else if (selectedDepartments.includes('volunteer')) {
        finalSelectedDepartments = ['봉사'];
    }

    const notionList = document.querySelector('#notionList');
    notionList.innerHTML = '';

    // '모집마감' 항목을 하단에 배치하기 위해 리스트를 분리
    const activeItems = [];
    const closedItems = [];

    data.results.forEach(page => {
        const department = page.properties['세부 분과']?.rich_text?.[0]?.plain_text || 'No Department';

        const matchesApplicationFilter = !onlyApplication || isTodayBetweenDates(page.properties['모집 시작일']?.date?.start, page.properties['모집 마감일']?.date?.start);
        const matchesDepartmentFilter = finalSelectedDepartments.length === 0 || finalSelectedDepartments.includes(department);

        if (matchesApplicationFilter && matchesDepartmentFilter) {
            const listItem = createListItem(page);

            const daysLeft = calculateDaysLeft(page.properties['모집 시작일']?.date?.start);
            if (daysLeft < 0) {
                closedItems.push(listItem); // '모집마감' 항목은 별도로 저장
            } else {
                activeItems.push(listItem); // 다른 항목은 일반 리스트에 저장
            }
        }
    });

    // 리스트에 항목 추가 (모집 중인 동아리 먼저, 모집마감 항목 나중에)
    activeItems.forEach(item => notionList.appendChild(item));
    closedItems.forEach(item => notionList.appendChild(item));
}

function createListItem(page) {
    const listItem = document.createElement('div');
    listItem.className = 'list-item';

    const logoImg = document.createElement('img');
    const logoUrl = page.properties['로고']?.files?.[0]?.external?.url || '';
    if (logoUrl) {
        logoImg.src = logoUrl;
    } else {
        logoImg.alt = 'No logo';
    }

    const listItemContent = document.createElement('div');
    listItemContent.className = 'list-item-content';

    const clubName = document.createElement('h2');
    clubName.textContent = page.properties['동아리명']?.title?.[0]?.plain_text || 'No Name';

    const departmentBox = document.createElement('div');
    departmentBox.className = 'department-box';
    departmentBox.textContent = page.properties['세부 분과']?.rich_text?.[0]?.plain_text || 'No Department';

    const description = document.createElement('p');
    description.textContent = page.properties['한줄소개']?.rich_text?.[0]?.plain_text || 'No Description';

    const representative = document.createElement('p');
    representative.textContent = `대표자 성함: ${page.properties['대표자 성함']?.rich_text?.[0]?.plain_text || 'N/A'}`;

    const address = document.createElement('p');
    address.textContent = `동아리방 주소: ${page.properties['동아리방 주소']?.rich_text?.[0]?.plain_text || 'N/A'}`;

    const startDate = page.properties['모집 시작일']?.date?.start || 'N/A';
    const endDate = page.properties['모집 마감일']?.date?.start || 'N/A';
    const period = document.createElement('p');
    period.textContent = `모집 기간: ${startDate} ~ ${endDate}`;

    const applicationButton = document.createElement('button');
    const applicationUrl = page.properties['신청방법']?.url || '#';

    const daysLeft = calculateDaysLeft(startDate);
    if (isTodayBetweenDates(startDate, endDate)) {
        applicationButton.textContent = '지원하기 !';
        applicationButton.style.backgroundColor = '#F2A0B0';
        applicationButton.style.color = 'white';
        applicationButton.onclick = () => window.open(applicationUrl, '_blank');
    } else if (daysLeft < 0) {
        applicationButton.textContent = '모집마감';
        applicationButton.style.backgroundColor = '#f2f2f2';
        applicationButton.style.color = '#999';
        applicationButton.disabled = true;
    } else {
        applicationButton.textContent = `D-${daysLeft}`;
        applicationButton.style.backgroundColor = 'white';
        applicationButton.style.color = '#F2A0B0';
        applicationButton.style.border = '1px solid #F2A0B0';
        applicationButton.onclick = () => showPopup(`${daysLeft}일 뒤에 지원 가능합니다!`, clubName.textContent, startDate, endDate);
    }

    const curriculum = document.createElement('div');
    curriculum.className = 'curriculum-bar-container';
    const curriculumBar = document.createElement('div');
    curriculumBar.className = 'curriculum-bar';

    const curriculumText = page.properties['커리큘럼']?.rich_text?.[0]?.plain_text || 'N/A';
    const curriculumItems = curriculumText.split('\n');
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    let monthDetails = {};

    curriculumItems.forEach(item => {
        const month = months.find(m => item.startsWith(m));
        if (month) {
            if (!monthDetails[month]) {
                monthDetails[month] = [];
            }
            monthDetails[month].push(item.trim());
        }
    });

    const activeMonths = months.filter(month => monthDetails[month]);

    activeMonths.forEach((month, index) => {
        const monthPoint = document.createElement('div');
        monthPoint.className = 'month-point';
        monthPoint.textContent = month.slice(0, -1);

        let leftPosition = (index / (activeMonths.length - 1)) * 100;
        if (index === activeMonths.length - 1) {
            leftPosition -= 2;
        }
        monthPoint.style.left = `${leftPosition}%`;

        const detailDiv = document.createElement('div');
        detailDiv.className = 'month-detail';
        detailDiv.innerHTML = monthDetails[month].join('<br>');

        monthPoint.appendChild(detailDiv);
        curriculumBar.appendChild(monthPoint);

        if (window.innerWidth <= 600) {
            monthPoint.addEventListener('click', () => {
                detailDiv.style.display = 'block';
                setTimeout(() => {
                    detailDiv.classList.add('fade-out');
                    setTimeout(() => {
                        detailDiv.style.display = 'none';
                        detailDiv.classList.remove('fade-out');
                    }, 500);
                }, 1300);
            });
        }
    });

    curriculum.appendChild(curriculumBar);

    listItemContent.appendChild(clubName);
    listItemContent.appendChild(departmentBox);
    listItemContent.appendChild(description);
    listItemContent.appendChild(representative);
    listItemContent.appendChild(address);
    listItemContent.appendChild(period);

    const actionContainer = document.createElement('div');
    actionContainer.className = 'action-container';
    actionContainer.appendChild(applicationButton);
    actionContainer.appendChild(curriculum);

    listItemContent.appendChild(actionContainer);

    listItem.appendChild(logoImg);
    listItem.appendChild(listItemContent);

    return listItem;
}

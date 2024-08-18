document.addEventListener('DOMContentLoaded', () => {
    setInitialFilters(); // 페이지 로드 시 초기 필터 설정
    fetchNotionData();
});

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

function showPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'popup';
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    popupContent.appendChild(messageElement);

    // 이메일 입력 칸 추가
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = '총동아리연합회 카톡 채널을 추가하고 전화번호를 입력해주시면 카톡을 드릴게요!';
    emailInput.className = 'email-input';
    popupContent.appendChild(emailInput);

    // Kakao 링크 버튼 추가
    const kakaoLinkButton = document.createElement('button');
    kakaoLinkButton.textContent = '카톡 채널 추가';
    kakaoLinkButton.className = 'popup-button';
    kakaoLinkButton.onclick = () => window.open('http://pf.kakao.com/_xjsxmXG', '_blank');
    popupContent.appendChild(kakaoLinkButton);

    const closeButton = document.createElement('button');
    closeButton.textContent = '확인';
    closeButton.className = 'popup-button';
    closeButton.onclick = () => document.body.removeChild(popup);
    popupContent.appendChild(closeButton);

    popup.appendChild(popupContent);
    document.body.appendChild(popup);
}

function setInitialFilters() {
    const currentUrl = window.location.href;
    const departmentFilters = document.getElementById('departmentFilters');

    if (currentUrl.includes('/volunteer')) {
        selectDepartments(['봉사']);
    } else if (currentUrl.includes('/performance')) {
        selectDepartments(['음악연주', '공연예술']);
    } else if (currentUrl.includes('/culture')) {
        selectDepartments(['문화', '창작예술']);
    } else if (currentUrl.includes('/religion')) {
        selectDepartments(['종교']);
    } else if (currentUrl.includes('/academic')) {
        selectDepartments(['학술교양', '정보과학']);
    } else if (currentUrl.includes('/physical')) {
        selectDepartments(['생활체육', '무술체육', '구기체육']);
    } else {
        // "모든 동아리 보기" 필터를 선택하기 위한 로직 추가
        selectDepartments([]); // 아무것도 선택하지 않음으로써 모든 동아리가 표시되게 설정
    }
}


function selectDepartments(departments) {
    const departmentFilters = document.getElementById('departmentFilters');
    for (let i = 0; i < departmentFilters.options.length; i++) {
        if (departments.includes(departmentFilters.options[i].value)) {
            departmentFilters.options[i].selected = true;
        }
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

        // Render department filters
        const departmentFilters = document.getElementById('departmentFilters');
        departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentFilters.appendChild(option);
        });

        const applicationFilterButton = document.getElementById('applicationFilterButton');

        function filterAndDisplayResults() {
            const onlyApplication = applicationFilterButton.classList.contains('active');
            const selectedDepartments = Array.from(departmentFilters.selectedOptions).map(option => option.value);

            notionList.innerHTML = '';

            data.results.forEach(page => {
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
                const department = page.properties['세부 분과']?.rich_text?.[0]?.plain_text || 'No Department';
                departmentBox.textContent = department;

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

                if (isTodayBetweenDates(startDate, endDate)) {
                    applicationButton.textContent = '지원하기 !';
                    applicationButton.style.backgroundColor = '#F2A0B0';
                    applicationButton.style.color = 'white';
                    applicationButton.onclick = () => window.open(applicationUrl, '_blank');
                } else {
                    const daysLeft = calculateDaysLeft(startDate);
                    applicationButton.textContent = `D-${daysLeft}`;
                    applicationButton.style.backgroundColor = 'white';
                    applicationButton.style.color = '#F2A0B0';
                    applicationButton.style.border = '1px solid #F2A0B0';
                    applicationButton.onclick = () => showPopup(`${daysLeft}일 뒤에 지원 가능합니다!`);
                }

                const curriculum = document.createElement('div');
                curriculum.className = 'curriculum-bar-container';
                const curriculumBar = document.createElement('div');
                curriculumBar.className = 'curriculum-bar';

                const curriculumText = page.properties['커리큘럼']?.rich_text?.[0]?.plain_text || 'N/A';

                // 커리큘럼 텍스트를 월별로 분리
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
                    monthPoint.textContent = month.slice(0, -1); // "월" 제거하여 숫자만 표시
                    
                    // Adjust left position to ensure the last point is correctly aligned
                    let leftPosition = (index / (activeMonths.length - 1)) * 100;

                    // Shift the last point slightly to the left
                    if (index === activeMonths.length - 1) {
                        leftPosition -= 2; // Adjust this value as needed
                    }

                    monthPoint.style.left = `${leftPosition}%`;

                    const detailDiv = document.createElement('div');
                    detailDiv.className = 'month-detail';
                    detailDiv.innerHTML = monthDetails[month].join('<br>');

                    monthPoint.appendChild(detailDiv);
                    curriculumBar.appendChild(monthPoint);

                    // 모바일에서는 클릭 시 디테일 표시 후 1.5초 뒤에 사라지게 설정,1.3초로 변경
                    if (window.innerWidth <= 600) {
                        monthPoint.addEventListener('click', () => {
                            detailDiv.style.display = 'block';
                            setTimeout(() => {
                                detailDiv.classList.add('fade-out');
                                setTimeout(() => {
                                    detailDiv.style.display = 'none';
                                    detailDiv.classList.remove('fade-out');
                                }, 500); // duration of fade-out animation
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

                // 버튼과 커리큘럼 바를 가로로 배치
                const actionContainer = document.createElement('div');
                actionContainer.className = 'action-container';
                actionContainer.appendChild(applicationButton);
                actionContainer.appendChild(curriculum);

                listItemContent.appendChild(actionContainer);

                listItem.appendChild(logoImg);
                listItem.appendChild(listItemContent);

                // 필터 조건 확인
                const matchesApplicationFilter = !onlyApplication || applicationButton.textContent === '지원하기 !';
                const matchesDepartmentFilter = selectedDepartments.length === 0 || selectedDepartments.includes(department);

                if (matchesApplicationFilter && matchesDepartmentFilter) {
                    notionList.appendChild(listItem);
                }
            });
        }

        applicationFilterButton.addEventListener('click', () => {
            applicationFilterButton.classList.toggle('active');
            filterAndDisplayResults();
        });

        departmentFilters.addEventListener('change', () => {
            filterAndDisplayResults();
        });

        filterAndDisplayResults(); // 초기 표시
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

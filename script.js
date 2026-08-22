const defaultHabits = [
    { name: "Study", icon: "📚", target: 25, unit: "minutes" },
    { name: "Exercise", icon: "🏃", target: 10, unit: "minutes" },
    { name: "Social Media", icon: "📱", target: 2, unit: "hours", type: "maximum" }
];

let habits = JSON.parse(localStorage.getItem("backOnTrackHabits")) || defaultHabits;
let savedData = JSON.parse(localStorage.getItem("backOnTrackData")) || {};
const today = new Date().toISOString().split("T")[0];

const motivationMessages = [
    "You don't need to be perfect. Just keep moving.",
    "Small progress is still progress.",
    "One good day can become a good habit.",
    "Focus on what you can do today.",
    "Consistency beats motivation.",
    "You are building a better version of yourself.",
    "Don't break the promise you made to yourself.",
    "Start small. Stay consistent. Keep going.",
    "Your future self will thank you.",
    "A little effort today makes tomorrow easier."
];

const dayNumber = Math.floor(
    new Date(today).getTime() / (1000 * 60 * 60 * 24)
);

document.getElementById("motivationText").textContent =
    motivationMessages[dayNumber % motivationMessages.length];

if (!savedData[today]) {
    savedData[today] = [null, null, null];
}

const todayProgress = savedData[today];

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

function showMessage(message) {
    let messageBox = document.getElementById("saveMessage");

    if (!messageBox) {
        messageBox = document.createElement("div");
        messageBox.id = "saveMessage";

        messageBox.style.position = "fixed";
        messageBox.style.bottom = "25px";
        messageBox.style.left = "50%";
        messageBox.style.transform = "translateX(-50%)";
        messageBox.style.background = "#1f2937";
        messageBox.style.color = "white";
        messageBox.style.padding = "12px 20px";
        messageBox.style.borderRadius = "10px";
        messageBox.style.fontSize = "14px";
        messageBox.style.fontWeight = "bold";
        messageBox.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)";
        messageBox.style.zIndex = "1000";
        messageBox.style.opacity = "0";
        messageBox.style.transition = "opacity 0.3s ease";

        document.body.appendChild(messageBox);
    }

    messageBox.textContent = message;
    messageBox.style.opacity = "1";

    clearTimeout(window.messageTimer);

    window.messageTimer = setTimeout(function() {
        messageBox.style.opacity = "0";
    }, 2000);
}

function isHabitComplete(index, progress = todayProgress) {
    const value = progress[index];

    if (value === null || value === undefined) {
        return false;
    }

    const habit = habits[index];

    if (habit.type === "maximum") {
        return value <= habit.target;
    }

    return value >= habit.target;
}

function isSuccessfulDay(progress) {
    let completed = 0;

    habits.forEach(function(habit, index) {
        if (isHabitComplete(index, progress)) {
            completed++;
        }
    });

    return completed >= 2;
}

function calculateStreak() {
    let streak = 0;
    let date = new Date();

    while (true) {
        const dateKey = date.toISOString().split("T")[0];

        if (!savedData[dateKey] || !isSuccessfulDay(savedData[dateKey])) {
            break;
        }

        streak++;
        date.setDate(date.getDate() - 1);
    }

    return streak;
}

function renderHabits() {
    const container = document.getElementById("habitsContainer");
    container.innerHTML = "";

    habits.forEach(function(habit, index) {
        const card = document.createElement("div");
        card.className = "habit-card";

        const value = todayProgress[index];
        const completed = isHabitComplete(index);

        const targetText = habit.type === "maximum"
            ? `Stay below ${habit.target} ${habit.unit}`
            : `Target: ${habit.target} ${habit.unit}`;

        card.innerHTML = `
            <div class="habit-icon">${habit.icon}</div>
            <h3>${habit.name}</h3>
            <p>${targetText}</p>

            <input
                type="number"
                min="0"
                class="goal-input"
                placeholder="Enter actual ${habit.unit}"
                value="${value ?? ""}"
            >

            <div class="goal-result">
                ${completed ? "Goal achieved ✓" : "Enter today's result"}
            </div>

            <button class="complete-btn ${completed ? "completed" : ""}">
                ${completed ? "Edit Result" : "Save Result"}
            </button>
        `;

        const input = card.querySelector(".goal-input");
        const button = card.querySelector(".complete-btn");

        if (completed) {
            input.disabled = true;
        }

        button.addEventListener("click", function() {

            if (completed && input.disabled) {
                input.disabled = false;
                input.focus();

                button.textContent = "Save Changes";
                button.classList.remove("completed");

                return;
            }

            if (input.value === "") {
                todayProgress[index] = null;

                savedData[today] = todayProgress;

                localStorage.setItem(
                    "backOnTrackData",
                    JSON.stringify(savedData)
                );

                renderHabits();
                updateDashboard();

                showMessage("✓ Result removed");

                return;
            }

            const actualValue = Number(input.value);

            if (actualValue < 0) {
                alert("Please enter a valid value.");
                return;
            }

            todayProgress[index] = actualValue;

            savedData[today] = todayProgress;

            localStorage.setItem(
                "backOnTrackData",
                JSON.stringify(savedData)
            );

            renderHabits();
            updateDashboard();

            showMessage(
                completed
                    ? "✓ Result updated successfully"
                    : "✓ Result saved successfully"
            );
        });

        container.appendChild(card);
    });
}

function updateDashboard() {
    let completed = 0;

    habits.forEach(function(habit, index) {
        if (isHabitComplete(index)) {
            completed++;
        }
    });

    const percent = Math.round(
        (completed / habits.length) * 100
    );

    document.getElementById("progressText").textContent =
        `${completed} of ${habits.length} habits completed`;

    document.getElementById("progressPercent").textContent =
        `${percent}%`;

    document.getElementById("progressFill").style.width =
        `${percent}%`;

    document.getElementById("streakCount").textContent =
        calculateStreak();

    updateHistory();
    updateWeeklyOverview();
    updateWeeklyStats();
}

function updateHistory() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    const dates = Object.keys(savedData).sort().reverse();

    dates.slice(0, 30).forEach(function(dateKey) {
        const progress = savedData[dateKey];
        const successful = isSuccessfulDay(progress);

        let completed = 0;

        habits.forEach(function(habit, index) {
            if (isHabitComplete(index, progress)) {
                completed++;
            }
        });

        const historyDay = document.createElement("div");
        historyDay.className = "history-day";

        const dateText = new Date(
            dateKey + "T00:00:00"
        ).toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short"
        });

        historyDay.innerHTML = `
            <span class="history-date">${dateText}</span>

            <span class="history-status ${
                successful
                    ? "history-success"
                    : "history-incomplete"
            }">
                ${
                    successful
                        ? "✓ Successful"
                        : "Incomplete"
                }
                (${completed}/${habits.length})
            </span>
        `;

        historyList.appendChild(historyDay);
    });
}

function updateWeeklyOverview() {
    const weeklyOverview =
        document.getElementById("weeklyOverview");

    weeklyOverview.innerHTML = "";

    for (let i = 6; i >= 0; i--) {
        const date = new Date();

        date.setDate(
            date.getDate() - i
        );

        const dateKey =
            date.toISOString().split("T")[0];

        const progress =
            savedData[dateKey];

        const weekDay =
            document.createElement("div");

        weekDay.className = "week-day";

        const dayName =
            document.createElement("div");

        dayName.className = "day-name";

        dayName.textContent =
            date.toLocaleDateString("en-IN", {
                weekday: "short"
            });

        const circle =
            document.createElement("div");

        circle.className = "day-circle";

        if (progress) {

            if (isSuccessfulDay(progress)) {
                circle.classList.add("day-success");
                circle.textContent = "✓";
            } else {
                circle.classList.add("day-failed");
                circle.textContent = "×";
            }

        } else {
            circle.textContent = "–";
        }

        if (dateKey === today) {
            circle.classList.add("day-today");
        }

        weekDay.appendChild(dayName);
        weekDay.appendChild(circle);

        weeklyOverview.appendChild(weekDay);
    }
}

function updateWeeklyStats() {
    const container =
        document.getElementById("weeklyStats");

    container.innerHTML = "";

    let totalCompleted = 0;
    let totalPossible = habits.length * 7;

    habits.forEach(function(habit, index) {

        let completedDays = 0;

        for (let i = 0; i < 7; i++) {

            const date = new Date();

            date.setDate(
                date.getDate() - i
            );

            const dateKey =
                date.toISOString().split("T")[0];

            const progress =
                savedData[dateKey];

            if (
                progress &&
                isHabitComplete(index, progress)
            ) {
                completedDays++;
            }
        }

        totalCompleted += completedDays;

        const percent =
            Math.round(
                (completedDays / 7) * 100
            );

        const card =
            document.createElement("div");

        card.className = "stat-card";

        card.innerHTML = `
            <h3>${habit.icon} ${habit.name}</h3>

            <p>
                Completed ${completedDays} of 7 days
            </p>

            <div class="stat-number">
                ${percent}%
            </div>

            <div class="stat-progress">
                <div
                    class="stat-progress-fill"
                    style="width:${percent}%">
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    const overallPercent =
        Math.round(
            (totalCompleted / totalPossible) * 100
        );

    const overall =
        document.createElement("div");

    overall.className =
        "stat-card overall-stat";

    overall.innerHTML = `
        <h3>🎯 Overall Consistency</h3>

        <p>
            Your average habit completion this week
        </p>

        <div class="stat-number">
            ${overallPercent}%
        </div>

        <div class="stat-progress">
            <div
                class="stat-progress-fill"
                style="width:${overallPercent}%">
            </div>
        </div>
    `;

    container.appendChild(overall);
}

function renderSettings() {
    const container =
        document.getElementById("settingsContainer");

    container.innerHTML = "";

    habits.forEach(function(habit) {

        const row =
            document.createElement("div");

        row.className =
            "setting-row";

        row.innerHTML = `
            <input
                type="text"
                value="${habit.icon}"
                class="icon-input"
            >

            <input
                type="text"
                value="${habit.name}"
                class="name-input"
            >

            <input
                type="number"
                min="0"
                value="${habit.target}"
                class="target-input"
            >
        `;

        container.appendChild(row);
    });
}

document.getElementById("saveSettings")
    .addEventListener("click", function() {

        const rows =
            document.querySelectorAll(
                ".setting-row"
            );

        rows.forEach(function(row, index) {

            habits[index].icon =
                row.querySelector(
                    ".icon-input"
                ).value || "⭐";

            habits[index].name =
                row.querySelector(
                    ".name-input"
                ).value || "Habit";

            habits[index].target =
                Number(
                    row.querySelector(
                        ".target-input"
                    ).value
                ) || 1;
        });

        localStorage.setItem(
            "backOnTrackHabits",
            JSON.stringify(habits)
        );

        renderHabits();
        renderSettings();
        updateDashboard();

        showMessage("✓ Settings saved successfully");
    });

document.querySelectorAll(".nav-btn")
    .forEach(function(button) {

        button.addEventListener("click", function() {

            const pageName =
                button.dataset.page;

            document.querySelectorAll(".nav-btn")
                .forEach(function(btn) {
                    btn.classList.remove("active");
                });

            document.querySelectorAll(".page")
                .forEach(function(page) {
                    page.classList.remove(
                        "active-page"
                    );
                });

            button.classList.add("active");

            document.getElementById(pageName)
                .classList.add("active-page");
        });
    });

savedData[today] = todayProgress;

localStorage.setItem(
    "backOnTrackData",
    JSON.stringify(savedData)
);

renderHabits();
renderSettings();
updateDashboard();
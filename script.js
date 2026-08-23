const defaultHabits=[
{name:"Study",icon:"📚",target:25,unit:"minutes"},
{name:"Meditation",icon:"🧘",target:10,unit:"minutes"},
{name:"Social Media",icon:"📱",target:2,unit:"hours",type:"maximum"}
];

let habits=JSON.parse(localStorage.getItem("backOnTrackHabits"))||defaultHabits;
let savedData=JSON.parse(localStorage.getItem("backOnTrackData"))||{};
let savedNotes=JSON.parse(localStorage.getItem("backOnTrackNotes"))||{};

habits=habits.map(function(habit,index){
if(index===0)return{name:habit.name||"Study",icon:habit.icon||"📚",target:25,unit:"minutes"};
if(index===1)return{name:habit.name||"Meditation",icon:habit.icon||"🧘",target:10,unit:"minutes"};
if(index===2)return{name:habit.name||"Social Media",icon:habit.icon||"📱",target:2,unit:"hours",type:"maximum"};
return habit;
});

localStorage.setItem("backOnTrackHabits",JSON.stringify(habits));

function getLocalDate(){
const now=new Date();
return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}

function getDateKey(date){
return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

const today=getLocalDate();

if(!savedData[today])savedData[today]=[null,null,null];

const todayProgress=savedData[today];

const motivationMessages=[
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

const dayNumber=Math.floor(new Date(today+"T00:00:00").getTime()/86400000);

document.getElementById("motivationText").textContent=motivationMessages[dayNumber%motivationMessages.length];

document.getElementById("todayDate").textContent=new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

const notesBox=document.getElementById("dailyNotes");

if(notesBox)notesBox.value=savedNotes[today]||"";

function showMessage(message){
let box=document.getElementById("saveMessage");

if(!box){
box=document.createElement("div");
box.id="saveMessage";
box.style.position="fixed";
box.style.bottom="25px";
box.style.left="50%";
box.style.transform="translateX(-50%)";
box.style.background="#1f2937";
box.style.color="white";
box.style.padding="12px 20px";
box.style.borderRadius="10px";
box.style.fontSize="14px";
box.style.fontWeight="bold";
box.style.zIndex="1000";
box.style.opacity="0";
box.style.transition="opacity .3s";
document.body.appendChild(box);
}

box.textContent=message;
box.style.opacity="1";

clearTimeout(window.messageTimer);

window.messageTimer=setTimeout(function(){
box.style.opacity="0";
},2000);
}

function isHabitComplete(index,progress=todayProgress){
const value=progress[index];

if(value===null||value===undefined)return false;

const habit=habits[index];

if(habit.type==="maximum")return value<=habit.target;

return value>=habit.target;
}

function getHabitPercentage(index,progress=todayProgress){
const value=progress[index];

if(value===null||value===undefined)return 0;

const habit=habits[index];

if(habit.type==="maximum"){
if(value<=habit.target)return 100;
return Math.max(0,Math.round((habit.target/value)*100));
}

return Math.min(100,Math.round((value/habit.target)*100));
}

function getHabitScore(index,progress=todayProgress){
return getHabitPercentage(index,progress);
}

function calculateDailyScore(progress=todayProgress){
let total=0;

habits.forEach(function(habit,index){
total+=getHabitScore(index,progress);
});

return habits.length?Math.round(total/habits.length):0;
}

function updateScoreMessage(score){
const message=document.getElementById("scoreMessage");

if(!message)return;

if(score>=80)message.textContent="🌟 Excellent!";
else if(score>=60)message.textContent="👍 Good!";
else if(score>=40)message.textContent="💪 Keep Going!";
else message.textContent="🌱 Let's Start!";
}

function isSuccessfulDay(progress){
let completed=0;

habits.forEach(function(habit,index){
if(isHabitComplete(index,progress))completed++;
});

return completed>=2;
}

function calculateStreak(){
let streak=0;
let date=new Date();

while(true){
const dateKey=getDateKey(date);

if(!savedData[dateKey]||!isSuccessfulDay(savedData[dateKey]))break;

streak++;
date.setDate(date.getDate()-1);
}

return streak;
}

function renderHabits(){
const container=document.getElementById("habitsContainer");

container.innerHTML="";

habits.forEach(function(habit,index){
const card=document.createElement("div");
card.className="habit-card";

const value=todayProgress[index];
const completed=isHabitComplete(index);
const percentage=getHabitPercentage(index);

const targetText=habit.type==="maximum"
?`Stay below ${habit.target} ${habit.unit}`
:`Target: ${habit.target} ${habit.unit}`;

let progressText="No result yet";

if(value!==null&&value!==undefined){
if(habit.type==="maximum"){
progressText=completed
?`${value} ${habit.unit} used • Within target`
:`${value} ${habit.unit} used • Above target`;
}else{
progressText=`${value} / ${habit.target} ${habit.unit}`;
}
}

card.innerHTML=`
<div class="habit-icon">${habit.icon}</div>
<h3>${habit.name}</h3>
<p>${targetText}</p>
<input type="number" min="0" class="goal-input" placeholder="Enter actual ${habit.unit}" value="${value??""}">
<div class="goal-result">${completed?"Goal achieved ✓":progressText}</div>
<div class="habit-progress">
<div class="habit-progress-fill" style="width:${percentage}%"></div>
</div>
<div class="habit-percentage">${percentage}%</div>
<button class="complete-btn ${completed?"completed":""}">${completed?"Edit Result":"Save Result"}</button>
`;

const input=card.querySelector(".goal-input");
const button=card.querySelector(".complete-btn");

if(completed)input.disabled=true;

button.addEventListener("click",function(){

if(completed&&input.disabled){
input.disabled=false;
input.focus();
button.textContent="Save Changes";
button.classList.remove("completed");
return;
}

if(input.value===""){
todayProgress[index]=null;
savedData[today]=todayProgress;

localStorage.setItem("backOnTrackData",JSON.stringify(savedData));

renderHabits();
updateDashboard();

showMessage("✓ Result removed");

return;
}

const actualValue=Number(input.value);

if(actualValue<0){
alert("Please enter a valid value.");
return;
}

todayProgress[index]=actualValue;
savedData[today]=todayProgress;

localStorage.setItem("backOnTrackData",JSON.stringify(savedData));

renderHabits();
updateDashboard();

showMessage(completed?"✓ Result updated successfully":"✓ Result saved successfully");
});

container.appendChild(card);
});
}

function updateDashboard(){
let completed=0;

habits.forEach(function(habit,index){
if(isHabitComplete(index))completed++;
});

const percent=Math.round((completed/habits.length)*100);
const score=calculateDailyScore();

document.getElementById("progressText").textContent=`${completed} of ${habits.length} habits completed`;
document.getElementById("progressPercent").textContent=`${percent}%`;
document.getElementById("dailyScore").textContent=`Score: ${score}/100`;

updateScoreMessage(score);

document.getElementById("progressFill").style.width=`${percent}%`;
document.getElementById("streakCount").textContent=calculateStreak();

updateHistory();
updateWeeklyOverview();
updateWeeklyStats();
updateAchievements();
updateSummary();
}

function updateHistory(){
const historyList=document.getElementById("historyList");

historyList.innerHTML="";

const dates=Object.keys(savedData).sort().reverse();

if(dates.length===0){
historyList.innerHTML=`<div class="history-empty">📭 No history yet. Start completing your habits today!</div>`;
return;
}

dates.slice(0,30).forEach(function(dateKey){
const progress=savedData[dateKey];

let completed=0;

habits.forEach(function(habit,index){
if(isHabitComplete(index,progress))completed++;
});

const score=calculateDailyScore(progress);
const successful=isSuccessfulDay(progress);
const note=savedNotes[dateKey];

const dateText=new Date(dateKey+"T00:00:00").toLocaleDateString("en-IN",{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
});

const historyDay=document.createElement("div");
historyDay.className="history-day";

historyDay.innerHTML=`
<div class="history-main">
<div class="history-header">
<strong>📅 ${dateText}</strong>
<span class="${successful?"history-success":"history-incomplete"}">${successful?"✓ Successful":"○ Incomplete"}</span>
</div>
<div class="history-details">
<span>✅ ${completed}/${habits.length} habits</span>
<span>🎯 Score: ${score}/100</span>
</div>
<div class="history-score-bar">
<div style="width:${score}%"></div>
</div>
${note?`<div class="history-note">📝 ${note}</div>`:`<div class="history-note no-note">📝 No note added</div>`}
</div>
`;

historyList.appendChild(historyDay);
});
}

function updateWeeklyOverview(){
const weeklyOverview=document.getElementById("weeklyOverview");

weeklyOverview.innerHTML="";

for(let i=6;i>=0;i--){
const date=new Date();
date.setDate(date.getDate()-i);

const dateKey=getDateKey(date);
const progress=savedData[dateKey];

const weekDay=document.createElement("div");
weekDay.className="week-day";

const dayName=document.createElement("div");
dayName.className="day-name";
dayName.textContent=date.toLocaleDateString("en-IN",{weekday:"short"});

const circle=document.createElement("div");
circle.className="day-circle";

if(progress){
if(isSuccessfulDay(progress)){
circle.classList.add("day-success");
circle.textContent="✓";
}else{
circle.classList.add("day-failed");
circle.textContent="×";
}
}else{
circle.textContent="–";
}

if(dateKey===today)circle.classList.add("day-today");

weekDay.appendChild(dayName);
weekDay.appendChild(circle);
weeklyOverview.appendChild(weekDay);
}
}

function updateWeeklyStats(){
const container=document.getElementById("weeklyStats");

container.innerHTML="";

let totalCompleted=0;
const totalPossible=habits.length*7;

habits.forEach(function(habit,index){
let completedDays=0;

for(let i=0;i<7;i++){
const date=new Date();
date.setDate(date.getDate()-i);

const dateKey=getDateKey(date);
const progress=savedData[dateKey];

if(progress&&isHabitComplete(index,progress))completedDays++;
}

totalCompleted+=completedDays;

const percent=Math.round((completedDays/7)*100);

const card=document.createElement("div");
card.className="stat-card";

card.innerHTML=`
<h3>${habit.icon} ${habit.name}</h3>
<p>Completed ${completedDays} of 7 days</p>
<div class="stat-number">${percent}%</div>
<div class="stat-progress">
<div class="stat-progress-fill" style="width:${percent}%"></div>
</div>
`;

container.appendChild(card);
});

const overallPercent=Math.round((totalCompleted/totalPossible)*100);

const overall=document.createElement("div");
overall.className="stat-card overall-stat";

overall.innerHTML=`
<h3>🎯 Overall Consistency</h3>
<p>Your average habit completion this week</p>
<div class="stat-number">${overallPercent}%</div>
<div class="stat-progress">
<div class="stat-progress-fill" style="width:${overallPercent}%"></div>
</div>
`;

container.appendChild(overall);
}

function updateAchievements(){
const container=document.getElementById("achievementsContainer");

if(!container)return;

container.innerHTML="";

const dates=Object.keys(savedData);

let firstHabit=false;
let perfectDay=false;
let streak3=calculateStreak()>=3;
let streak7=calculateStreak()>=7;

dates.forEach(function(dateKey){
const progress=savedData[dateKey];

if(progress&&progress.some(function(value){
return value!==null&&value!==undefined;
}))firstHabit=true;

if(progress&&calculateDailyScore(progress)===100)perfectDay=true;
});

const achievements=[
{icon:"🌱",name:"First Step",text:"Complete your first habit",unlocked:firstHabit},
{icon:"🔥",name:"3-Day Streak",text:"Reach a 3-day streak",unlocked:streak3},
{icon:"🏆",name:"7-Day Streak",text:"Reach a 7-day streak",unlocked:streak7},
{icon:"💯",name:"Perfect Day",text:"Score 100/100",unlocked:perfectDay}
];

achievements.forEach(function(achievement){
const card=document.createElement("div");
card.className="achievement-card"+(achievement.unlocked?"":" achievement-locked");

card.innerHTML=`
<div class="achievement-icon">${achievement.icon}</div>
<h3>${achievement.name}</h3>
<p>${achievement.unlocked?"Unlocked!":achievement.text}</p>
`;

container.appendChild(card);
});
}

function updateSummary(){
const container=document.getElementById("summaryContainer");

if(!container)return;

const dates=Object.keys(savedData);

let successfulDays=0;
let totalScore=0;
let scoredDays=0;

dates.forEach(function(dateKey){
const progress=savedData[dateKey];

if(isSuccessfulDay(progress))successfulDays++;

const hasData=progress.some(function(value){
return value!==null&&value!==undefined;
});

if(hasData){
totalScore+=calculateDailyScore(progress);
scoredDays++;
}
});

const averageScore=scoredDays?Math.round(totalScore/scoredDays):0;

const achievements=document.querySelectorAll(".achievement-card:not(.achievement-locked)").length;

const summaryItems=[
{icon:"🔥",value:calculateStreak(),label:"Current Streak"},
{icon:"🎯",value:averageScore+"/100",label:"Average Score"},
{icon:"✅",value:successfulDays,label:"Successful Days"},
{icon:"🏅",value:achievements+"/4",label:"Achievements"}
];

container.innerHTML="";

summaryItems.forEach(function(item){
const card=document.createElement("div");
card.className="summary-card";

card.innerHTML=`
<div class="summary-icon">${item.icon}</div>
<strong>${item.value}</strong>
<span>${item.label}</span>
`;

container.appendChild(card);
});
}
function renderSettings(){
const container=document.getElementById("settingsContainer");
container.innerHTML="";
habits.forEach(function(habit,index){
const row=document.createElement("div");
row.className="habit-setting-row";
row.innerHTML=`<input type="text" value="${habit.icon}" class="icon-input"><input type="text" value="${habit.name}" class="name-input"><input type="number" min="0" value="${habit.target}" class="target-input"><input type="text" value="${habit.unit}" class="unit-input"><button class="delete-habit-btn" title="Delete">🗑️</button>`;
row.querySelector(".delete-habit-btn").addEventListener("click",function(){
if(habits.length<=1){showMessage("⚠️ Keep at least one habit");return;}
habits.splice(index,1);
localStorage.setItem("backOnTrackHabits",JSON.stringify(habits));
renderSettings();
showMessage("🗑️ Habit deleted");
});
container.appendChild(row);
});
}
const saveNotesButton=document.getElementById("saveNotes");

if(saveNotesButton){
saveNotesButton.addEventListener("click",function(){
const note=notesBox.value.trim();

if(note==="")delete savedNotes[today];
else savedNotes[today]=note;

localStorage.setItem("backOnTrackNotes",JSON.stringify(savedNotes));

updateHistory();

showMessage(note===""?"✓ Note removed":"✓ Note saved successfully");
});
}

document.getElementById("saveSettings").addEventListener("click",function(){
const rows=document.querySelectorAll(".setting-row");

rows.forEach(function(row,index){
habits[index].icon=row.querySelector(".icon-input").value||habits[index].icon;
habits[index].name=row.querySelector(".name-input").value||habits[index].name;
habits[index].target=Number(row.querySelector(".target-input").value)||habits[index].target;
});

localStorage.setItem("backOnTrackHabits",JSON.stringify(habits));

renderHabits();
renderSettings();
updateDashboard();

showMessage("✓ Settings saved successfully");
});

document.querySelectorAll(".nav-btn").forEach(function(button){
button.addEventListener("click",function(){
const pageName=button.dataset.page;

document.querySelectorAll(".nav-btn").forEach(function(btn){
btn.classList.remove("active");
});

document.querySelectorAll(".page").forEach(function(page){
page.classList.remove("active-page");
});

button.classList.add("active");
document.getElementById(pageName).classList.add("active-page");
});
});

savedData[today]=todayProgress;

localStorage.setItem("backOnTrackData",JSON.stringify(savedData));

renderHabits();
renderSettings();
updateDashboard();
const themeToggle=document.getElementById("themeToggle");
const savedTheme=localStorage.getItem("backOnTrackTheme");

if(savedTheme==="dark"){
document.body.classList.add("dark-mode");
if(themeToggle)themeToggle.textContent="☀️ Light Mode";
}

if(themeToggle){
themeToggle.addEventListener("click",function(){
document.body.classList.toggle("dark-mode");

const darkMode=document.body.classList.contains("dark-mode");

if(darkMode){
localStorage.setItem("backOnTrackTheme","dark");
themeToggle.textContent="☀️ Light Mode";
showMessage("🌙 Dark mode enabled");
}else{
localStorage.setItem("backOnTrackTheme","light");
themeToggle.textContent="🌙 Dark Mode";
showMessage("☀️ Light mode enabled");
}
});
}
const reminderTime=document.getElementById("reminderTime");
const saveReminder=document.getElementById("saveReminder");
const reminderStatus=document.getElementById("reminderStatus");

const savedReminder=localStorage.getItem("backOnTrackReminder");

if(reminderTime&&savedReminder){
reminderTime.value=savedReminder;
reminderStatus.textContent="🔔 Reminder set for "+savedReminder;
}

if(saveReminder){
saveReminder.addEventListener("click",function(){
if(!reminderTime.value){
reminderStatus.textContent="Please select a time.";
return;
}

localStorage.setItem("backOnTrackReminder",reminderTime.value);

if("Notification" in window){
Notification.requestPermission();
}

reminderStatus.textContent="🔔 Reminder saved for "+reminderTime.value;
showMessage("✓ Daily reminder saved");
});
}

setInterval(function(){
const savedTime=localStorage.getItem("backOnTrackReminder");

if(!savedTime)return;

const now=new Date();
const currentTime=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");

if(currentTime===savedTime&&now.getSeconds()<10){
if("Notification" in window&&Notification.permission==="granted"){
new Notification("BackOnTrack 🔔",{
body:"Time to work on your daily habits!"
});
}
}
},10000);
let calendarDate=new Date();

function renderMonthlyCalendar(){
const calendar=document.getElementById("monthlyCalendar");
const monthTitle=document.getElementById("calendarMonth");

if(!calendar||!monthTitle)return;

calendar.innerHTML="";

const year=calendarDate.getFullYear();
const month=calendarDate.getMonth();

const monthName=calendarDate.toLocaleDateString("en-IN",{month:"long",year:"numeric"});
monthTitle.textContent=monthName;

const firstDay=new Date(year,month,1).getDay();
const daysInMonth=new Date(year,month+1,0).getDate();

for(let i=0;i<firstDay;i++){
const empty=document.createElement("div");
empty.className="calendar-day empty-day";
calendar.appendChild(empty);
}

for(let day=1;day<=daysInMonth;day++){
const date=new Date(year,month,day);
const dateKey=getDateKey(date);
const progress=savedData[dateKey];

const cell=document.createElement("div");
cell.className="calendar-day";

const number=document.createElement("strong");
number.textContent=day;

const status=document.createElement("span");

if(progress){
if(isSuccessfulDay(progress)){
cell.classList.add("calendar-success");
status.textContent="✓";
}else if(progress.some(function(value){
return value!==null&&value!==undefined;
})){
cell.classList.add("calendar-progress");
status.textContent="•";
}else{
status.textContent="–";
}
}else{
cell.classList.add("calendar-empty");
status.textContent="–";
}

if(dateKey===today){
cell.classList.add("calendar-today");
}

cell.appendChild(number);
cell.appendChild(status);
calendar.appendChild(cell);
}
}

const previousMonth=document.getElementById("previousMonth");
const nextMonth=document.getElementById("nextMonth");

if(previousMonth){
previousMonth.addEventListener("click",function(){
calendarDate.setMonth(calendarDate.getMonth()-1);
renderMonthlyCalendar();
});
}

if(nextMonth){
nextMonth.addEventListener("click",function(){
calendarDate.setMonth(calendarDate.getMonth()+1);
renderMonthlyCalendar();
});
}

renderMonthlyCalendar();
function updateXPSystem(){
let xp=0;
Object.keys(savedData).forEach(function(dateKey){
const progress=savedData[dateKey];
habits.forEach(function(habit,index){
if(isHabitComplete(index,progress))xp+=25;
});
});
const level=Math.floor(xp/100)+1;
const currentXP=xp%100;
const titles=[
"🌱 Beginner",
"🔥 Getting Started",
"💪 Consistent",
"🚀 Dedicated",
"🏆 Strong Performer",
"👑 BackOnTrack Master"
];
const title=titles[Math.min(level-1,titles.length-1)];
const levelNumber=document.getElementById("levelNumber");
const levelTitle=document.getElementById("levelTitle");
const xpNumber=document.getElementById("xpNumber");
const xpFill=document.getElementById("xpFill");
const xpProgress=document.getElementById("xpProgress");
if(levelNumber)levelNumber.textContent="Level "+level;
if(levelTitle)levelTitle.textContent=title;
if(xpNumber)xpNumber.textContent=xp+" XP";
if(xpFill)xpFill.style.width=currentXP+"%";
if(xpProgress)xpProgress.textContent=currentXP+" / 100 XP to next level";
}
updateXPSystem();
const xpHabitContainer=document.getElementById("habitsContainer");
if(xpHabitContainer){
xpHabitContainer.addEventListener("click",function(){
setTimeout(updateXPSystem,100);
});
}
const exportDataButton=document.getElementById("exportData");
const exportStatus=document.getElementById("exportStatus");

if(exportDataButton){
exportDataButton.addEventListener("click",function(){
const exportData={
app:"BackOnTrack",
version:"1.0",
exportedAt:new Date().toISOString(),
habits:habits,
progress:savedData,
notes:savedNotes,
theme:localStorage.getItem("backOnTrackTheme")||"light",
reminder:localStorage.getItem("backOnTrackReminder")||""
};

const dataString=JSON.stringify(exportData,null,2);
const blob=new Blob([dataString],{type:"application/json"});
const url=URL.createObjectURL(blob);

const link=document.createElement("a");
link.href=url;
link.download="BackOnTrack-Progress.json";
document.body.appendChild(link);
link.click();
document.body.removeChild(link);

URL.revokeObjectURL(url);

if(exportStatus){
exportStatus.textContent="✓ Your data has been exported successfully.";
}

showMessage("📤 Progress exported successfully");
});
}
const restoreFile=document.getElementById("restoreFile");
const restoreData=document.getElementById("restoreData");
const restoreStatus=document.getElementById("restoreStatus");

if(restoreData){
restoreData.addEventListener("click",function(){
if(!restoreFile.files.length){
restoreStatus.textContent="Please select a backup file first.";
return;
}

const file=restoreFile.files[0];
const reader=new FileReader();

reader.onload=function(event){
try{
const backup=JSON.parse(event.target.result);

if(!backup.app||backup.app!=="BackOnTrack"){
restoreStatus.textContent="❌ Invalid BackOnTrack backup file.";
return;
}

if(backup.habits){
localStorage.setItem("backOnTrackHabits",JSON.stringify(backup.habits));
}

if(backup.progress){
localStorage.setItem("backOnTrackData",JSON.stringify(backup.progress));
}

if(backup.notes){
localStorage.setItem("backOnTrackNotes",JSON.stringify(backup.notes));
}

if(backup.theme){
localStorage.setItem("backOnTrackTheme",backup.theme);
}

if(backup.reminder){
localStorage.setItem("backOnTrackReminder",backup.reminder);
}

restoreStatus.textContent="✓ Backup restored successfully. Reloading...";

setTimeout(function(){
location.reload();
},1000);

}catch(error){
restoreStatus.textContent="❌ Could not read this backup file.";
}
};

reader.readAsText(file);
});
}
const addHabit=document.getElementById("addHabit");
if(addHabit){
addHabit.addEventListener("click",function(){
habits.push({name:"New Habit",icon:"⭐",target:10,unit:"minutes"});
localStorage.setItem("backOnTrackHabits",JSON.stringify(habits));
renderSettings();
showMessage("➕ New habit added");
});
}
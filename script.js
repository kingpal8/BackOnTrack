"use strict";

const defaultHabits=[
{name:"Study",icon:"📚",target:25,unit:"minutes"},
{name:"Meditation",icon:"🧘",target:10,unit:"minutes"},
{name:"Social Media",icon:"📱",target:2,unit:"hours",type:"maximum"}
];

let habits=load("backOnTrackHabits",defaultHabits);
let savedData=load("backOnTrackData",{});
let savedNotes=load("backOnTrackNotes",{});
let calendarDate=new Date();
let messageTimer=null;

function load(key,fallback){
try{
const data=localStorage.getItem(key);
return data!==null?JSON.parse(data):JSON.parse(JSON.stringify(fallback));
}catch(error){
console.error("Load error:",key,error);
return JSON.parse(JSON.stringify(fallback));
}
}

function save(key,value){
try{
localStorage.setItem(key,JSON.stringify(value));
return true;
}catch(error){
console.error("Save error:",key,error);
return false;
}
}

function getDateKey(date){
return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
}

function getLocalDate(){
return getDateKey(new Date());
}

function escapeHTML(value){
return String(value??"").replace(/[&<>"']/g,char=>({
"&":"&amp;",
"<":"&lt;",
">":"&gt;",
'"':"&quot;",
"'":"&#039;"
}[char]));
}

function escapeAttr(value){
return escapeHTML(value);
}

function showMessage(message){
const box=document.getElementById("saveMessage");
if(!box)return;
box.textContent=message;
box.classList.add("show");
clearTimeout(messageTimer);
messageTimer=setTimeout(()=>{
box.classList.remove("show");
},2200);
}

function getTodayProgress(){
const today=getLocalDate();
if(!Array.isArray(savedData[today])){
savedData[today]=Array(habits.length).fill(null);
}
while(savedData[today].length<habits.length){
savedData[today].push(null);
}
if(savedData[today].length>habits.length){
savedData[today]=savedData[today].slice(0,habits.length);
}
return savedData[today];
}

function isHabitComplete(index,progress){
progress=progress||getTodayProgress();
const habit=habits[index];
const value=progress[index];

if(!habit||value===null||value===undefined)return false;

if(habit.type==="maximum"){
return Number(value)<=Number(habit.target);
}

return Number(value)>=Number(habit.target);
}

function getHabitPercentage(index,progress){
progress=progress||getTodayProgress();

const habit=habits[index];
const value=progress[index];

if(!habit||value===null||value===undefined)return 0;

if(habit.type==="maximum"){
if(Number(value)<=Number(habit.target))return 100;
if(Number(value)<=0)return 100;
return Math.max(0,Math.round(Number(habit.target)/Number(value)*100));
}

if(Number(habit.target)<=0)return 0;

return Math.min(100,Math.round(Number(value)/Number(habit.target)*100));
}

function calculateDailyScore(progress){
progress=progress||[];

if(!habits.length)return 0;

let total=0;

habits.forEach((habit,index)=>{
total+=getHabitPercentage(index,progress);
});

return Math.round(total/habits.length);
}

function isSuccessfulDay(progress){
if(!Array.isArray(progress)||!habits.length)return false;

let completed=0;

habits.forEach((habit,index)=>{
if(isHabitComplete(index,progress))completed++;
});

return completed>=Math.min(2,habits.length);
}

function calculateStreak(){
let streak=0;
let date=new Date();

while(true){
const key=getDateKey(date);
const progress=savedData[key];

if(!progress||!isSuccessfulDay(progress))break;

streak++;
date.setDate(date.getDate()-1);
}

return streak;
}

function updateScoreMessage(score){
const element=document.getElementById("scoreMessage");
if(!element)return;

if(score>=80){
element.textContent="🌟 Excellent!";
}else if(score>=60){
element.textContent="👍 Good!";
}else if(score>=40){
element.textContent="💪 Keep Going!";
}else{
element.textContent="🌱 Let's Start!";
}
}

function updateTodayDate(){
const element=document.getElementById("todayDate");
if(!element)return;

element.textContent=new Date().toLocaleDateString("en-IN",{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
});
}

function updateMotivation(){
const element=document.getElementById("motivationText");
if(!element)return;

const messages=[
"Every small step counts. 🌱",
"Consistency is more important than perfection.",
"Keep going. You're building a better routine.",
"One habit at a time. You've got this! 💪",
"Your future self will thank you.",
"Progress doesn't have to be perfect.",
"Show up today. That's already a win. 🏆"
];

const day=new Date().getDate();
element.textContent=messages[day%messages.length];
}

function renderHabits(){
const container=document.getElementById("habitsContainer");
if(!container)return;

container.innerHTML="";

const progress=getTodayProgress();

habits.forEach((habit,index)=>{
const card=document.createElement("div");
card.className="habit-card";

const value=progress[index];
const completed=isHabitComplete(index,progress);
const percentage=getHabitPercentage(index,progress);

const targetText=habit.type==="maximum"
?`Stay below ${habit.target} ${escapeHTML(habit.unit)}`
:`Target: ${habit.target} ${escapeHTML(habit.unit)}`;

let result="No result yet";

if(value!==null&&value!==undefined){
if(habit.type==="maximum"){
result=completed
?`${value} ${escapeHTML(habit.unit)} used • Within target`
:`${value} ${escapeHTML(habit.unit)} used • Above target`;
}else{
result=`${value} / ${habit.target} ${escapeHTML(habit.unit)}`;
}
}

card.innerHTML=`
<div class="habit-icon">${escapeHTML(habit.icon)}</div>
<h3>${escapeHTML(habit.name)}</h3>
<p>${targetText}</p>
<input type="number" min="0" step="any" class="goal-input" placeholder="Enter actual ${escapeAttr(habit.unit)}" value="${value??""}">
<div class="goal-result">${completed?"Goal achieved ✓":result}</div>
<div class="habit-progress">
<div class="habit-progress-fill" style="width:${percentage}%"></div>
</div>
<div class="habit-percentage">${percentage}%</div>
<button class="complete-btn ${completed?"completed":""}">
${completed?"Edit Result":"Save Result"}
</button>
`;

const input=card.querySelector(".goal-input");
const button=card.querySelector(".complete-btn");

button.addEventListener("click",()=>{
const currentValue=input.value.trim();

if(currentValue===""){
progress[index]=null;
save("backOnTrackData",savedData);
renderHabits();
updateAll();
showMessage("✓ Result removed");
return;
}

const number=Number(currentValue);

if(!Number.isFinite(number)||number<0){
showMessage("⚠️ Enter a valid value");
return;
}

const wasCompleted=isHabitComplete(index,progress);

progress[index]=number;

save("backOnTrackData",savedData);

renderHabits();
updateAll();

showMessage(wasCompleted?"✓ Result updated":"✓ Result saved");
});

input.addEventListener("keydown",event=>{
if(event.key==="Enter"){
button.click();
}
});

container.appendChild(card);
});
}

function updateDashboard(){
const progress=getTodayProgress();

let completed=0;

habits.forEach((habit,index)=>{
if(isHabitComplete(index,progress))completed++;
});

const percent=habits.length
?Math.round(completed/habits.length*100)
:0;

const score=calculateDailyScore(progress);

const progressText=document.getElementById("progressText");
const progressPercent=document.getElementById("progressPercent");
const dailyScore=document.getElementById("dailyScore");
const progressFill=document.getElementById("progressFill");
const streakCount=document.getElementById("streakCount");

if(progressText){
progressText.textContent=`${completed} of ${habits.length} habits completed`;
}

if(progressPercent){
progressPercent.textContent=percent+"%";
}

if(dailyScore){
dailyScore.textContent=`Score: ${score}/100`;
}

if(progressFill){
progressFill.style.width=percent+"%";
}

if(streakCount){
streakCount.textContent=calculateStreak();
}

updateScoreMessage(score);
}

function updateNotes(){
const box=document.getElementById("dailyNotes");
if(!box)return;

const today=getLocalDate();
box.value=savedNotes[today]||"";
}

function updateAll(){
updateTodayDate();
updateMotivation();
renderHabits();
updateDashboard();
updateWeeklyOverview();
updateWeeklyStats();
updateAchievements();
updateSummary();
updateHistory();
updateXPSystem();
renderMonthlyCalendar();
}
function updateWeeklyOverview(){
const container=document.getElementById("weeklyOverview");
if(!container)return;

container.innerHTML="";

for(let i=6;i>=0;i--){
const date=new Date();
date.setDate(date.getDate()-i);

const key=getDateKey(date);
const progress=savedData[key];

const wrap=document.createElement("div");
wrap.className="week-day";

const name=document.createElement("div");
name.className="day-name";
name.textContent=date.toLocaleDateString("en-IN",{weekday:"short"});

const circle=document.createElement("div");
circle.className="day-circle";

if(progress&&isSuccessfulDay(progress)){
circle.classList.add("day-success");
circle.textContent="✓";
}else if(progress&&progress.some(v=>v!==null&&v!==undefined)){
circle.classList.add("day-failed");
circle.textContent="•";
}else{
circle.textContent="–";
}

if(key===getLocalDate()){
circle.classList.add("day-today");
}

wrap.append(name,circle);
container.appendChild(wrap);
}
}

function updateWeeklyStats(){
const container=document.getElementById("weeklyStats");
if(!container)return;

container.innerHTML="";

let totalCompleted=0;
const possible=habits.length*7;

habits.forEach((habit,index)=>{
let days=0;

for(let i=0;i<7;i++){
const date=new Date();
date.setDate(date.getDate()-i);

const key=getDateKey(date);
const progress=savedData[key];

if(progress&&isHabitComplete(index,progress)){
days++;
}
}

totalCompleted+=days;

const percent=Math.round(days/7*100);

const card=document.createElement("div");
card.className="stat-card";

card.innerHTML=`
<h3>${escapeHTML(habit.icon)} ${escapeHTML(habit.name)}</h3>
<p>Completed ${days} of 7 days</p>
<div class="stat-number">${percent}%</div>
<div class="stat-progress">
<div class="stat-progress-fill" style="width:${percent}%"></div>
</div>
`;

container.appendChild(card);
});

const overallPercent=possible
?Math.round(totalCompleted/possible*100)
:0;

const overall=document.createElement("div");
overall.className="stat-card";

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

let firstStep=false;
let perfectDay=false;

Object.values(savedData).forEach(progress=>{
if(progress&&progress.some(v=>v!==null&&v!==undefined)){
firstStep=true;
}

if(progress&&calculateDailyScore(progress)===100){
perfectDay=true;
}
});

const streak=calculateStreak();

const achievements=[
{
icon:"🌱",
name:"First Step",
text:"Complete your first habit",
unlocked:firstStep
},
{
icon:"🔥",
name:"3-Day Streak",
text:"Reach a 3-day streak",
unlocked:streak>=3
},
{
icon:"🏆",
name:"7-Day Streak",
text:"Reach a 7-day streak",
unlocked:streak>=7
},
{
icon:"💯",
name:"Perfect Day",
text:"Score 100/100",
unlocked:perfectDay
}
];

achievements.forEach(achievement=>{
const card=document.createElement("div");

card.className=
"achievement-card"+
(achievement.unlocked?"":" achievement-locked");

card.innerHTML=`
<div class="achievement-icon">${achievement.icon}</div>
<h3>${escapeHTML(achievement.name)}</h3>
<p>${achievement.unlocked?"Unlocked!":escapeHTML(achievement.text)}</p>
`;

container.appendChild(card);
});
}

function updateSummary(){
const container=document.getElementById("summaryContainer");
if(!container)return;

let successful=0;
let totalScore=0;
let recordedDays=0;

Object.values(savedData).forEach(progress=>{
if(!Array.isArray(progress))return;

if(isSuccessfulDay(progress)){
successful++;
}

if(progress.some(v=>v!==null&&v!==undefined)){
totalScore+=calculateDailyScore(progress);
recordedDays++;
}
});

const average=recordedDays
?Math.round(totalScore/recordedDays)
:0;

const unlocked=document.querySelectorAll(
".achievement-card:not(.achievement-locked)"
).length;

const items=[
["🔥",calculateStreak(),"Current Streak"],
["🎯",average+"/100","Average Score"],
["✅",successful,"Successful Days"],
["🏅",unlocked+"/4","Achievements"]
];

container.innerHTML="";

items.forEach(item=>{
const card=document.createElement("div");
card.className="summary-card";

card.innerHTML=`
<div class="summary-icon">${item[0]}</div>
<strong>${escapeHTML(item[1])}</strong>
<span>${escapeHTML(item[2])}</span>
`;

container.appendChild(card);
});
}

function updateHistory(){
const list=document.getElementById("historyList");
if(!list)return;

list.innerHTML="";

const dates=Object.keys(savedData)
.filter(key=>Array.isArray(savedData[key]))
.sort()
.reverse();

if(!dates.length){
list.innerHTML=`
<div class="history-day">
📭 No history yet. Start completing your habits today!
</div>
`;
return;
}

dates.slice(0,30).forEach(key=>{
const progress=savedData[key];

let completed=0;

habits.forEach((habit,index)=>{
if(isHabitComplete(index,progress)){
completed++;
}
});

const score=calculateDailyScore(progress);
const successful=isSuccessfulDay(progress);
const note=savedNotes[key];

const dateText=new Date(key+"T00:00:00").toLocaleDateString(
"en-IN",
{
weekday:"long",
day:"numeric",
month:"long",
year:"numeric"
}
);

const day=document.createElement("div");
day.className="history-day";

day.innerHTML=`
<div class="history-header">
<strong>📅 ${escapeHTML(dateText)}</strong>
<span class="${successful?"history-success":"history-incomplete"}">
${successful?"✓ Successful":"○ Incomplete"}
</span>
</div>

<div class="history-details">
<span>✅ ${completed}/${habits.length} habits</span>
<span>🎯 Score: ${score}/100</span>
</div>

<div class="history-score-bar">
<div style="width:${score}%"></div>
</div>

<div class="history-note">
${note
?"📝 "+escapeHTML(note)
:"📝 No note added"}
</div>
`;

list.appendChild(day);
});
}

function renderMonthlyCalendar(){
const calendar=document.getElementById("monthlyCalendar");
const title=document.getElementById("calendarMonth");

if(!calendar||!title)return;

calendar.innerHTML="";

const year=calendarDate.getFullYear();
const month=calendarDate.getMonth();

title.textContent=calendarDate.toLocaleDateString(
"en-IN",
{
month:"long",
year:"numeric"
}
);

const firstDay=new Date(year,month,1).getDay();
const daysInMonth=new Date(year,month+1,0).getDate();

for(let i=0;i<firstDay;i++){
const empty=document.createElement("div");
empty.className="calendar-day empty-day";
calendar.appendChild(empty);
}

for(let day=1;day<=daysInMonth;day++){
const date=new Date(year,month,day);
const key=getDateKey(date);
const progress=savedData[key];

const cell=document.createElement("div");
cell.className="calendar-day";

const number=document.createElement("strong");
number.textContent=day;

const status=document.createElement("span");

if(progress&&isSuccessfulDay(progress)){
cell.classList.add("calendar-success");
status.textContent="✓";
}else if(progress&&progress.some(v=>v!==null&&v!==undefined)){
cell.classList.add("calendar-progress");
status.textContent="•";
}else{
cell.classList.add("calendar-empty");
status.textContent="–";
}

if(key===getLocalDate()){
cell.classList.add("calendar-today");
}

cell.title=progress
?`Score: ${calculateDailyScore(progress)}/100`
:"No record";

cell.append(number,status);
calendar.appendChild(cell);
}
}

function updateXPSystem(){
let xp=0;

Object.values(savedData).forEach(progress=>{
if(!Array.isArray(progress))return;

habits.forEach((habit,index)=>{
if(isHabitComplete(index,progress)){
xp+=25;
}
});
});

const level=Math.floor(xp/100)+1;
const current=xp%100;

const titles=[
"🌱 Beginner",
"🔥 Getting Started",
"💪 Consistent",
"🚀 Dedicated",
"🏆 Strong Performer",
"👑 BackOnTrack Master"
];

const levelNumber=document.getElementById("levelNumber");
const levelTitle=document.getElementById("levelTitle");
const xpNumber=document.getElementById("xpNumber");
const xpFill=document.getElementById("xpFill");
const xpProgress=document.getElementById("xpProgress");

if(levelNumber){
levelNumber.textContent="Level "+level;
}

if(levelTitle){
levelTitle.textContent=titles[Math.min(level-1,titles.length-1)];
}

if(xpNumber){
xpNumber.textContent=xp+" XP";
}

if(xpFill){
xpFill.style.width=current+"%";
}

if(xpProgress){
xpProgress.textContent=
`${current} / 100 XP to next level`;
}
}
function renderSettings(){
const container=document.getElementById("settingsContainer");
if(!container)return;

container.innerHTML="";

habits.forEach((habit,index)=>{
const row=document.createElement("div");
row.className="habit-setting-row";

row.innerHTML=`
<input type="text" value="${escapeAttr(habit.icon)}" class="icon-input" title="Icon">
<input type="text" value="${escapeAttr(habit.name)}" class="name-input" placeholder="Habit name">
<input type="number" min="1" step="any" value="${habit.target}" class="target-input">
<input type="text" value="${escapeAttr(habit.unit)}" class="unit-input">
<button class="delete-habit-btn" title="Delete habit">🗑️</button>
`;

row.querySelector(".delete-habit-btn").addEventListener("click",()=>{
if(habits.length<=1){
showMessage("⚠️ Keep at least one habit");
return;
}

if(!confirm(`Delete "${habit.name}"?`))return;

habits.splice(index,1);

Object.keys(savedData).forEach(key=>{
if(Array.isArray(savedData[key])){
savedData[key].splice(index,1);
}
});

save("backOnTrackHabits",habits);
save("backOnTrackData",savedData);

renderSettings();
updateAll();

showMessage("🗑️ Habit deleted");
});

container.appendChild(row);
});
}

function addNewHabit(){
const nameInput=document.getElementById("newHabitName");
const iconInput=document.getElementById("newHabitIcon");
const targetInput=document.getElementById("newHabitTarget");
const unitInput=document.getElementById("newHabitUnit");
const maximumInput=document.getElementById("newHabitMaximum");
const status=document.getElementById("addHabitStatus");

if(!nameInput||!iconInput||!targetInput||!unitInput||!maximumInput)return;

const name=nameInput.value.trim();
const icon=iconInput.value.trim()||"⭐";
const target=Number(targetInput.value);
const unit=unitInput.value;
const maximum=maximumInput.checked;

if(!name){
status.textContent="⚠️ Enter a habit name.";
return;
}

if(!Number.isFinite(target)||target<=0){
status.textContent="⚠️ Enter a valid target.";
return;
}

const habit={
name,
icon,
target,
unit
};

if(maximum){
habit.type="maximum";
}

habits.push(habit);

Object.keys(savedData).forEach(key=>{
if(Array.isArray(savedData[key])){
savedData[key].push(null);
}
});

save("backOnTrackHabits",habits);
save("backOnTrackData",savedData);

nameInput.value="";
iconInput.value="";
targetInput.value="";
maximumInput.checked=false;

status.textContent="✓ Habit added successfully.";

renderSettings();
updateAll();

showMessage("➕ New habit added");
}

function saveHabitSettings(){
const rows=document.querySelectorAll(".habit-setting-row");
let changed=false;

rows.forEach((row,index)=>{
if(!habits[index])return;

const icon=row.querySelector(".icon-input").value.trim();
const name=row.querySelector(".name-input").value.trim();
const target=Number(row.querySelector(".target-input").value);
const unit=row.querySelector(".unit-input").value.trim();

if(icon){
habits[index].icon=icon;
}

if(name){
habits[index].name=name;
}

if(Number.isFinite(target)&&target>0){
habits[index].target=target;
}else{
changed=true;
}

if(unit){
habits[index].unit=unit;
}
});

save("backOnTrackHabits",habits);

renderSettings();
updateAll();

const status=document.getElementById("habitSettingsStatus");

if(status){
status.textContent="✓ Settings saved successfully.";
}

showMessage("✓ Settings saved");

if(changed){
showMessage("⚠️ Check invalid habit targets");
}
}

function saveDailyNotes(){
const box=document.getElementById("dailyNotes");
const status=document.getElementById("noteStatus");

if(!box)return;

const today=getLocalDate();
const note=box.value.trim();

if(note){
savedNotes[today]=note;
}else{
delete savedNotes[today];
}

save("backOnTrackNotes",savedNotes);

if(status){
status.textContent=note
?"✓ Note saved successfully."
:"✓ Note removed.";
}

updateHistory();

showMessage(note?"📝 Note saved":"📝 Note removed");
}

function setupNavigation(){
const buttons=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");

buttons.forEach(button=>{
button.addEventListener("click",()=>{
const target=button.dataset.page;

buttons.forEach(item=>{
item.classList.remove("active");
});

pages.forEach(page=>{
page.classList.remove("active-page");
});

button.classList.add("active");

const targetPage=document.getElementById(target);

if(targetPage){
targetPage.classList.add("active-page");
}

if(target==="history"){
renderMonthlyCalendar();
updateWeeklyStats();
updateHistory();
}

if(target==="settings"){
renderSettings();
}

window.scrollTo({
top:0,
behavior:"smooth"
});
});
});
}

function applyTheme(){
const theme=localStorage.getItem("backOnTrackTheme")||"light";

document.body.classList.toggle(
"dark-mode",
theme==="dark"
);

const button=document.getElementById("themeToggle");

if(button){
button.textContent=
theme==="dark"
?"☀️ Light Mode"
:"🌙 Dark Mode";
}
}

function toggleTheme(){
const isDark=document.body.classList.contains("dark-mode");

localStorage.setItem(
"backOnTrackTheme",
isDark?"light":"dark"
);

applyTheme();

showMessage(
isDark
?"☀️ Light mode enabled"
:"🌙 Dark mode enabled"
);
}

function loadReminder(){
const input=document.getElementById("reminderTime");
const status=document.getElementById("reminderStatus");

if(!input)return;

const savedReminder=localStorage.getItem("backOnTrackReminder");

if(savedReminder){
input.value=savedReminder;

if(status){
status.textContent="🔔 Reminder set for "+savedReminder;
}
}
}

async function saveReminder(){
const input=document.getElementById("reminderTime");
const status=document.getElementById("reminderStatus");

if(!input)return;

if(!input.value){
if(status){
status.textContent="⚠️ Please select a time.";
}
return;
}

localStorage.setItem(
"backOnTrackReminder",
input.value
);

if("Notification" in window){
try{
if(Notification.permission==="default"){
await Notification.requestPermission();
}
}catch(error){
console.log("Notification permission error:",error);
}
}

if(status){
status.textContent=
"🔔 Reminder saved for "+input.value;
}

showMessage("✓ Daily reminder saved");
}

function checkReminder(){
const savedTime=
localStorage.getItem("backOnTrackReminder");

if(!savedTime)return;

const now=new Date();

const current=
String(now.getHours()).padStart(2,"0")+":"+
String(now.getMinutes()).padStart(2,"0");

const reminderKey=
getLocalDate()+"_"+savedTime;

if(
current===savedTime&&
now.getSeconds()<10&&
localStorage.getItem("lastReminder")!==reminderKey
){
localStorage.setItem(
"lastReminder",
reminderKey
);

if(
"Notification" in window&&
Notification.permission==="granted"
){
new Notification(
"BackOnTrack 🔔",
{
body:"Time to work on your daily habits!"
}
);
}

showMessage("🔔 Time for your habits!");
}
}

function setupCalendarControls(){
const previous=document.getElementById("previousMonth");
const next=document.getElementById("nextMonth");

if(previous){
previous.addEventListener("click",()=>{
calendarDate.setMonth(
calendarDate.getMonth()-1
);
renderMonthlyCalendar();
});
}

if(next){
next.addEventListener("click",()=>{
calendarDate.setMonth(
calendarDate.getMonth()+1
);
renderMonthlyCalendar();
});
}
}

function setupButtons(){
const saveSettingsButton=
document.getElementById("saveSettings");

const addHabitButton=
document.getElementById("addHabitButton");

const saveNotesButton=
document.getElementById("saveNotes");

const themeButton=
document.getElementById("themeToggle");

const reminderButton=
document.getElementById("saveReminder");

if(saveSettingsButton){
saveSettingsButton.addEventListener(
"click",
saveHabitSettings
);
}

if(addHabitButton){
addHabitButton.addEventListener(
"click",
addNewHabit
);
}

if(saveNotesButton){
saveNotesButton.addEventListener(
"click",
saveDailyNotes
);
}

if(themeButton){
themeButton.addEventListener(
"click",
toggleTheme
);
}

if(reminderButton){
reminderButton.addEventListener(
"click",
saveReminder
);
}
}
function exportProgress(){
const data={
app:"BackOnTrack",
version:"3.0",
exportedAt:new Date().toISOString(),
habits:habits,
progress:savedData,
notes:savedNotes,
theme:localStorage.getItem("backOnTrackTheme")||"light",
reminder:localStorage.getItem("backOnTrackReminder")||""
};

try{
const blob=new Blob(
[JSON.stringify(data,null,2)],
{type:"application/json"}
);

const url=URL.createObjectURL(blob);
const link=document.createElement("a");

link.href=url;
link.download="BackOnTrack-Progress.json";

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

setTimeout(()=>{
URL.revokeObjectURL(url);
},1000);

const status=document.getElementById("exportStatus");

if(status){
status.textContent="✓ Your data has been exported successfully.";
}

showMessage("📤 Backup exported");
}catch(error){
console.error("Export error:",error);

const status=document.getElementById("exportStatus");

if(status){
status.textContent="⚠️ Export failed.";
}

showMessage("⚠️ Export failed");
}
}

function restoreProgress(){
const fileInput=document.getElementById("restoreFile");
const status=document.getElementById("restoreStatus");

if(!fileInput)return;

const file=fileInput.files[0];

if(!file){
if(status){
status.textContent="⚠️ Please select a backup file.";
}
return;
}

const reader=new FileReader();

reader.onload=function(event){
try{
const data=JSON.parse(event.target.result);

if(!data||data.app!=="BackOnTrack"){
throw new Error("Invalid BackOnTrack backup");
}

if(Array.isArray(data.habits)){
habits=data.habits;
save("backOnTrackHabits",habits);
}

if(data.progress&&typeof data.progress==="object"){
savedData=data.progress;
save("backOnTrackData",savedData);
}

if(data.notes&&typeof data.notes==="object"){
savedNotes=data.notes;
save("backOnTrackNotes",savedNotes);
}

if(data.theme==="dark"||data.theme==="light"){
localStorage.setItem(
"backOnTrackTheme",
data.theme
);
}

if(typeof data.reminder==="string"){
if(data.reminder){
localStorage.setItem(
"backOnTrackReminder",
data.reminder
);
}else{
localStorage.removeItem("backOnTrackReminder");
}
}

applyTheme();
loadReminder();
updateNotes();
renderSettings();
updateAll();

fileInput.value="";

if(status){
status.textContent="✓ Backup restored successfully.";
}

showMessage("🔄 Backup restored");
}catch(error){
console.error("Restore error:",error);

if(status){
status.textContent="⚠️ Invalid or corrupted backup file.";
}

showMessage("⚠️ Could not restore backup");
}
};

reader.onerror=function(){
if(status){
status.textContent="⚠️ Could not read the backup file.";
}
showMessage("⚠️ File reading failed");
};

reader.readAsText(file);
}

function resetEverything(){
const confirmed=confirm(
"Are you sure you want to delete all BackOnTrack data?\n\nThis cannot be undone."
);

if(!confirmed)return;

const keys=[
"backOnTrackHabits",
"backOnTrackData",
"backOnTrackNotes",
"backOnTrackTheme",
"backOnTrackReminder",
"lastReminder"
];

keys.forEach(key=>{
localStorage.removeItem(key);
});

habits=JSON.parse(
JSON.stringify(defaultHabits)
);

savedData={};
savedNotes={};
calendarDate=new Date();

applyTheme();
loadReminder();
updateNotes();
renderSettings();
updateAll();

const restoreStatus=
document.getElementById("restoreStatus");

if(restoreStatus){
restoreStatus.textContent="";
}

const exportStatus=
document.getElementById("exportStatus");

if(exportStatus){
exportStatus.textContent="";
}

const habitStatus=
document.getElementById("habitSettingsStatus");

if(habitStatus){
habitStatus.textContent="";
}

const addStatus=
document.getElementById("addHabitStatus");

if(addStatus){
addStatus.textContent="";
}

showMessage("🗑️ All data has been reset");
}

function setupExtraButtons(){
const exportButton=
document.getElementById("exportData");

const restoreButton=
document.getElementById("restoreData");

const resetButton=
document.getElementById("resetData");

if(exportButton){
exportButton.addEventListener(
"click",
exportProgress
);
}

if(restoreButton){
restoreButton.addEventListener(
"click",
restoreProgress
);
}

if(resetButton){
resetButton.addEventListener(
"click",
resetEverything
);
}
}

function initializeApp(){
try{
if(!Array.isArray(habits)||habits.length===0){
habits=JSON.parse(
JSON.stringify(defaultHabits)
);
save("backOnTrackHabits",habits);
}

if(!savedData||typeof savedData!=="object"){
savedData={};
save("backOnTrackData",savedData);
}

if(!savedNotes||typeof savedNotes!=="object"){
savedNotes={};
save("backOnTrackNotes",savedNotes);
}

applyTheme();
loadReminder();
updateNotes();

setupNavigation();
setupButtons();
setupCalendarControls();
setupExtraButtons();

renderSettings();
updateAll();

setInterval(checkReminder,5000);

console.log("BackOnTrack initialized successfully.");
}catch(error){
console.error(
"BackOnTrack initialization error:",
error
);

showMessage(
"⚠️ Something went wrong. Check Console."
);
}
}

if(document.readyState==="loading"){
document.addEventListener(
"DOMContentLoaded",
initializeApp
);
}else{
initializeApp();
}
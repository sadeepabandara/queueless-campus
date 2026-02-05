let queue = JSON.parse(localStorage.getItem("virtualQueue")) || [];

// XSS Protection
function sanitize(input) {
  return input.replace(/[<>]/g, "");
}

function joinQueue() {
  const nameInput = document.getElementById("studentName");
  const msg = document.getElementById("joinMsg");

  let name = sanitize(nameInput.value.trim());

  if (!name) {
    showMessage("Name is required!", "error");
    return;
  }

  if (queue.includes(name)) {
    showMessage("You are already in the queue!", "error");
    return;
  }

  queue.push(name);
  localStorage.setItem("virtualQueue", JSON.stringify(queue));

  showMessage("Joined successfully!", "success");
  nameInput.value = "";
  renderQueue();
}

function renderQueue() {
  const list = document.getElementById("queueList");
  list.innerHTML = "";

  queue.forEach((user, index) => {
    const li = document.createElement("li");
    li.style.padding = "0.5rem";
    li.style.marginBottom = "0.5rem";
    li.style.background = "#e9f2ff";
    li.style.borderRadius = "5px";
    li.textContent = `${index + 1}. ${user}`;
    list.appendChild(li);
  });
}

function clearQueue() {
  if (!confirm("Are you sure you want to clear the queue?")) return;
  queue = [];
  localStorage.removeItem("virtualQueue");
  renderQueue();
}

function showMessage(text, type) {
  const msg = document.getElementById("joinMsg");
  msg.textContent = text;
  msg.className = "message " + type;
  msg.style.display = "block";

  setTimeout(() => {
    msg.style.display = "none";
  }, 5000);
}

renderQueue();
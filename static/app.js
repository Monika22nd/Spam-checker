const $ = (selector) => document.querySelector(selector);

const messageInput = $("#messageInput");
const thresholdInput = $("#thresholdInput");
const predictButton = $("#predictButton");
const errorMessage = $("#errorMessage");

const formatPercent = (value, digits = 2) => `${(value * 100).toFixed(digits)}%`;
const formatInteger = (value) => new Intl.NumberFormat("vi-VN").format(value);

function updateTextMeta() {
  $("#charCount").textContent = `${messageInput.value.length} ký tự`;
}

function updateThreshold() {
  $("#thresholdValue").textContent = Number(thresholdInput.value).toFixed(2);
}

async function loadDashboard() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) throw new Error("Không tải được thông tin mô hình.");
  const data = await response.json();

  $("#heroAccuracy").textContent = formatPercent(data.metrics.Accuracy, 1);
  $("#heroAuc").textContent = formatPercent(data.metrics["ROC-AUC"], 1);
  $("#heroRows").textContent = formatInteger(data.dataset.total);

  const metricDescriptions = {
    Accuracy: "Tổng thể",
    Precision: "Độ tin cậy cảnh báo",
    Recall: "Khả năng phát hiện",
    "F1-score": "Cân bằng P/R",
    "ROC-AUC": "Khả năng phân tách"
  };

  $("#metricGrid").innerHTML = Object.entries(data.metrics).map(([name, value], index) => `
    <article class="metric-card">
      <header><span>${String(index + 1).padStart(2, "0")}</span><span>${metricDescriptions[name] || "Metric"}</span></header>
      <strong>${formatPercent(value)}</strong>
      <div class="metric-track"><i style="width:${Math.min(value * 100, 100)}%"></i></div>
    </article>
  `).join("");

  $("#datasetTotal").textContent = formatInteger(data.dataset.total);
  $("#normalCount").textContent = formatInteger(data.dataset.normal);
  $("#spamCount").textContent = formatInteger(data.dataset.spam);
  $("#normalPercent").textContent = `${data.dataset.normal_percent}% dữ liệu`;
  $("#spamPercent").textContent = `${data.dataset.spam_percent}% dữ liệu`;
  $("#averageLength").textContent = `${data.dataset.average_length} ký tự`;
  $("#medianLength").textContent = `${data.dataset.median_length} ký tự`;
  $("#maxLength").textContent = `${data.dataset.max_length} ký tự`;
  $("#classDonut").style.background = `conic-gradient(var(--red) 0 ${data.dataset.spam_percent}%, var(--blue) ${data.dataset.spam_percent}% 100%)`;

  $("#modelSummary").textContent = `${data.model.name} nhận chuỗi văn bản và trả về xác suất Spam từ 0 đến 1.`;
  $("#framework").textContent = data.model.framework;
  $("#parameterCount").textContent = formatInteger(data.model.parameters);
  $("#modelSize").textContent = `${data.model.model_file_mb} MB`;
  $("#modelPipeline").innerHTML = data.model.layers.map((layer, index) => `
    ${index ? '<span class="layer-arrow">→</span>' : ''}
    <div class="layer-card">
      <small>Layer ${String(index + 1).padStart(2, "0")}</small>
      <strong>${layer.type}</strong>
      <span>${formatInteger(layer.parameters)} tham số</span>
    </div>
  `).join("");
}

function showPrediction(result) {
  $("#emptyState").classList.add("hidden");
  const content = $("#resultContent");
  content.classList.remove("hidden", "spam", "normal");
  content.classList.add(result.is_spam ? "spam" : "normal");

  $("#predictionLabel").textContent = result.prediction;
  $("#riskBadge").textContent = `Rủi ro ${result.risk_level}`;
  $("#spamProbability").textContent = formatPercent(result.spam_probability);
  $("#spamScore").textContent = formatPercent(result.spam_probability);
  $("#normalScore").textContent = formatPercent(result.normal_probability);
  $("#probabilityBar").style.width = `${result.spam_probability * 100}%`;
  $("#thresholdMarker").style.left = `${result.threshold * 100}%`;
  $("#thresholdLabel").textContent = formatPercent(result.threshold, 0);
  $("#processingTime").textContent = `${result.processing_ms} ms`;
  $("#wordCount").textContent = result.text_statistics.words;
  $("#digitCount").textContent = result.text_statistics.digits;
  $("#linkCount").textContent = result.text_statistics.links;
}

async function predict() {
  const message = messageInput.value.trim();
  errorMessage.textContent = "";
  if (!message) {
    errorMessage.textContent = "Vui lòng nhập nội dung tin nhắn.";
    messageInput.focus();
    return;
  }

  predictButton.disabled = true;
  predictButton.querySelector("span").textContent = "Đang phân tích…";
  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, threshold: Number(thresholdInput.value) })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.detail || "Không thể dự đoán.");
    showPrediction(result);
  } catch (error) {
    errorMessage.textContent = error.message;
  } finally {
    predictButton.disabled = false;
    predictButton.querySelector("span").textContent = "Phân tích tin nhắn";
  }
}

messageInput.addEventListener("input", updateTextMeta);
thresholdInput.addEventListener("input", updateThreshold);
predictButton.addEventListener("click", predict);
messageInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") predict();
});

$("#clearButton").addEventListener("click", () => {
  messageInput.value = "";
  updateTextMeta();
  messageInput.focus();
});

document.querySelectorAll(".sample-button").forEach((button) => {
  button.addEventListener("click", () => {
    messageInput.value = button.dataset.sample;
    updateTextMeta();
    messageInput.focus();
  });
});

loadDashboard().catch((error) => {
  errorMessage.textContent = error.message;
});


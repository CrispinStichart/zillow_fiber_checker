// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");
let reset = document.getElementById("reset");

chrome.storage.local.get("color", ({ color }) => {
    changeColor.style.backgroundColor = color;
});



// When the button is clicked, inject setPageBackgroundColor into current page
changeColor.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setPageBackgroundColor,
        args: [false]
    });
});

reset.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setPageBackgroundColor,
        args: [true, tab.id]
    });
});

// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor(reset, tabId) {
    if (reset) {
        chrome.storage.local.get(["originalColor"], ({ originalColor }) => {
            colors = JSON.parse(originalColor);
            let color = colors[tabId];
            document.body.style.backgroundColor = color;
        });
    } else {
        chrome.storage.local.get("color", ({ color }) => {
            document.body.style.backgroundColor = color;
        });
    }
}
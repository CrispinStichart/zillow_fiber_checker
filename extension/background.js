let color = "#3aa757";

let originalColor = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ color });
  console.log("Default background color set to %cgreen", `color: ${color}`);
  chrome.storage.local.set({ originalColor });

  fetch(
    "http://localhost:3000/?address=1815%20W%2036th%20St%20%23B%2C%20Austin%2C%20TX%2078731"
  )
    .then(function (response) {
      if (response.status !== 200) {
        console.log(
          "Looks like there was a problem. Status Code: " + response.status
        );
        return;
      }

      // Examine the text in the response
      response.text().then(function (data) {
        console.log(data);
      });
    })
    .catch(function (err) {
      console.log("Fetch Error :-S", err);
    });
});

chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log(tab.id);
    chrome.scripting.executeScript(
      {
        target: { tabId: tab.id },
        function: getBackgroundColor,
      },
      (injectionResults) => {
        for (const frameResult of injectionResults)
          originalColor[tab.id] = frameResult.result;

        let json = JSON.stringify(originalColor);
        chrome.storage.local.set({ originalColor: json });
      }
    );

    // fetch('https://www.google.com')
    //     .then(
    //         function (response) {
    //             if (response.status !== 200) {
    //                 console.log('Looks like there was a problem. Status Code: ' +
    //                     response.status);
    //                 return;
    //             }

    //             console.log("Type: " + response.type);

    //             // Examine the text in the response
    //             response.text().then(function (data) {
    //                 console.log(data);
    //             });
    //         }
    //     )
    //     .catch(function (err) {
    //         console.log('Fetch Error :-S', err);
    //     });
  }
});

// Will be run in the tab's context
function getBackgroundColor(callback) {
  const style = getComputedStyle(document.querySelector("body"));
  return style.backgroundColor;
}
